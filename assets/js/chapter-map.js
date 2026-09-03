// ABLE Initiatives: interactive chapter map (impact.html)
//
// Builds a pan-and-zoom map of every chapter from the `.chapter-card` elements
// beside it, so the cards stay the single source of truth: add a card with
// data-lat / data-lng and it gets a marker, no script change needed.
//
// The static SVG map in the markup is the fallback. It stays visible until this
// file has actually built the live map and set `.is-live` on the container, so
// no JS, a failed Leaflet load, or a cached older copy of this file all leave a
// finished map on the page rather than an empty box. Same reasoning as the
// timeline spine in main.js.
//
// Tiles come from OpenStreetMap, which needs no API key. Leaflet itself is
// vendored under assets/vendor/ so the map doesn't depend on a third-party CDN
// staying up.
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector("[data-chapter-map]");
  if (!container || typeof window.L === "undefined") return;

  const canvas = container.querySelector(".chapter-map-canvas");
  const cards = Array.from(document.querySelectorAll(".chapter-card[data-lat][data-lng]"));
  if (!canvas || !cards.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const L = window.L;

  // The canvas is display:none until .is-live, and Leaflet sizes itself from
  // the container when it is created, so the class goes on first. If anything
  // below throws, it comes off again and the static map is back.
  container.classList.add("is-live");
  try {
    build();
  } catch (err) {
    container.classList.remove("is-live");
    throw err;
  }

  function build() {
  const map = L.map(canvas, {
    // Scroll-wheel zoom is switched on once the map is clicked or focused, and
    // off again when the pointer leaves. Left permanently on, a wheel that
    // happens to pass over the map hijacks the page scroll, which is the one
    // thing everyone hates about embedded maps. The +/- buttons always work.
    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: true,
    worldCopyJump: true,
  });
  map.getContainer().setAttribute("aria-label", "Interactive map of ABLE chapters");

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Group chapters that share a location, so two chapters with only a city on
  // file sit under one marker with both names in the popup rather than one pin
  // hiding the other. Once each card carries its own address and coordinates
  // they separate on their own.
  const groups = new Map();
  cards.forEach((card) => {
    const lat = parseFloat(card.dataset.lat);
    const lng = parseFloat(card.dataset.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    const key = lat.toFixed(4) + "," + lng.toFixed(4);
    if (!groups.has(key)) groups.set(key, { lat, lng, cards: [] });
    groups.get(key).cards.push(card);
  });
  if (!groups.size) {
    map.remove();
    container.classList.remove("is-live");
    return;
  }

  const branchOf = (card) =>
    ["sat", "health", "business", "eng"].find((b) => card.classList.contains(b)) || "";

  const escape = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // One entry per place in the popup: a school running two branches shows its
  // name and address once, with a badge for each branch.
  const popupFor = (group) => {
    const places = [];
    group.cards.forEach((card) => {
      const name = card.querySelector(".chapter-name")?.textContent.trim() || "Chapter";
      const cityText = card.querySelector(".chapter-city")?.textContent.trim() || "";
      const address = card.dataset.address || "";
      // The address line is only worth showing once it says more than the city.
      const where = address && address !== cityText ? address : cityText;
      const badge = card.querySelector(".event-branch");
      const badgeHtml = badge ? '<span class="event-branch ' + escape(branchOf(card)) + '">' + escape(badge.textContent.trim()) + "</span>" : "";
      let place = places.find((p) => p.name === name && p.where === where);
      if (!place) places.push((place = { name, where, badges: [] }));
      if (badgeHtml && !place.badges.includes(badgeHtml)) place.badges.push(badgeHtml);
    });
    return places
      .map(
        (p) =>
          '<div class="chapter-popup">' +
          '<div class="chapter-popup-badges">' + p.badges.join("") + "</div>" +
          '<div class="chapter-popup-name">' + escape(p.name) + "</div>" +
          '<div class="chapter-popup-where">' + escape(p.where) + "</div>" +
          "</div>"
      )
      .join('<hr class="chapter-popup-rule">');
  };

  // Branch order and labels for the legend and for the segments of a split pin.
  const BRANCHES = [
    ["sat", "ABLE Preps"],
    ["health", "ABLE Health"],
    ["business", "ABLE Business"],
    ["eng", "ABLE Engineering"],
  ];
  const branchesOf = (cards) => BRANCHES.map(([b]) => b).filter((b) => cards.some((c) => branchOf(c) === b));

  // One colour for a single branch; a location with several branches gets a pin
  // divided into equal wedges, one per branch, so two branches read as a
  // half-and-half pin. Colours come from the same CSS variables the badges use.
  const pinHtml = (branches, extraClass) => {
    if (branches.length <= 1) {
      return '<span class="chapter-pin ' + (branches[0] || "") + ' ' + (extraClass || "") + '"><span class="chapter-pin-core"></span></span>';
    }
    const step = 100 / branches.length;
    const stops = branches.map((b, i) => "var(--" + b + ") " + (i * step) + "% " + ((i + 1) * step) + "%").join(", ");
    return '<span class="chapter-pin ' + (extraClass || "") + '" style="background: conic-gradient(' + stops + ')"><span class="chapter-pin-core"></span></span>';
  };

  const markers = [];
  const markerFor = new Map();
  let anySplit = false;
  groups.forEach((group) => {
    const branches = branchesOf(group.cards);
    if (branches.length > 1) anySplit = true;
    const label = group.cards.map((c) => c.querySelector(".chapter-name")?.textContent.trim()).filter(Boolean).join(" and ");
    const icon = L.divIcon({
      className: "chapter-pin-wrap",
      html: pinHtml(branches),
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
    const marker = L.marker([group.lat, group.lng], { icon, alt: label, keyboard: true }).addTo(map);
    marker.bindPopup(popupFor(group), { maxWidth: 260, closeButton: true });
    group.cards.forEach((card) => markerFor.set(card, marker));
    markers.push(marker);
  });

  const bounds = L.latLngBounds(markers.map((m) => m.getLatLng()));
  const showAll = (animate) => {
    // Padding keeps the outermost pins off the edge; maxZoom stops a single
    // chapter from being shown at street level, where nothing says "Colorado".
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11, animate });
  };
  showAll(false);

  // "All chapters" button: brings the whole set back into view after zooming in.
  const ResetControl = L.Control.extend({
    onAdd() {
      const btn = L.DomUtil.create("button", "leaflet-bar chapter-map-reset");
      btn.type = "button";
      btn.textContent = "All chapters";
      btn.setAttribute("aria-label", "Zoom out to show every chapter");
      L.DomEvent.disableClickPropagation(btn);
      L.DomEvent.on(btn, "click", () => {
        map.closePopup();
        showAll(!reduceMotion.matches);
      });
      return btn;
    },
  });
  new ResetControl({ position: "topright" }).addTo(map);

  // Legend: only the branches actually on the map, plus the split pin if any
  // location runs more than one.
  const present = branchesOf(cards);
  const LegendControl = L.Control.extend({
    onAdd() {
      const box = L.DomUtil.create("div", "chapter-legend");
      box.setAttribute("aria-label", "Map legend");
      let rows = present
        .map((b) => {
          const name = BRANCHES.find(([key]) => key === b)[1];
          return '<div class="chapter-legend-row">' + pinHtml([b], "chapter-legend-pin") + "<span>" + name + "</span></div>";
        })
        .join("");
      if (anySplit) {
        rows += '<div class="chapter-legend-row">' + pinHtml(present.slice(0, 2), "chapter-legend-pin") + "<span>More than one branch</span></div>";
      }
      box.innerHTML = rows;
      L.DomEvent.disableClickPropagation(box);
      return box;
    },
  });
  new LegendControl({ position: "bottomleft" }).addTo(map);

  // Wheel zoom only while the map is deliberately in use.
  const wheelOn = () => map.scrollWheelZoom.enable();
  const wheelOff = () => map.scrollWheelZoom.disable();
  canvas.addEventListener("click", wheelOn);
  canvas.addEventListener("focusin", wheelOn);
  canvas.addEventListener("mouseleave", wheelOff);
  canvas.addEventListener("focusout", (e) => {
    if (!canvas.contains(e.relatedTarget)) wheelOff();
  });

  // Each card gets a "Show on map" button that flies to its marker. Built here
  // so it can never appear without the map it drives.
  cards.forEach((card) => {
    const marker = markerFor.get(card);
    if (!marker) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapter-locate";
    btn.textContent = "Show on map";
    btn.addEventListener("click", () => {
      const target = marker.getLatLng();
      // Street level: close enough to see the school and the roads around it.
      const zoom = Math.max(map.getZoom(), 15);
      if (reduceMotion.matches) {
        map.setView(target, zoom);
        marker.openPopup();
      } else {
        map.once("moveend", () => marker.openPopup());
        map.flyTo(target, zoom, { duration: 0.9 });
      }
      // The list sits below the map, so bring the map back into view.
      container.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
    });
    card.appendChild(btn);
  });

  }
});
