// ABLE Initiatives: shared behavior

// Marks that scripting is available, so CSS can safely hide things it intends
// to animate in later. Anything gated behind `html.js` degrades to its plain
// state when this file fails to load. Nothing uses the hook at the moment (the
// progress bars that did were removed with the "by the numbers" section), but
// it is the correct place to gate any future animate-in styling.
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Mobile nav toggle
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    header.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => header.classList.remove("nav-open"));
    });
  }

  // About submenu. CSS already opens it on hover and on focus-within, so this
  // only adds what CSS can't: click/tap toggling, Escape to close, and closing
  // when focus or the pointer moves elsewhere.
  document.querySelectorAll(".has-submenu").forEach((item) => {
    const parent = item.querySelector(".nav-parent");
    if (!parent) return;
    const setOpen = (open) => {
      item.classList.toggle("is-open", open);
      parent.setAttribute("aria-expanded", open ? "true" : "false");
    };
    parent.addEventListener("click", (e) => {
      e.stopPropagation();
      setOpen(!item.classList.contains("is-open"));
    });
    item.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && item.classList.contains("is-open")) {
        setOpen(false);
        parent.focus();
      }
    });
    // Hovering opens it via CSS, so aria-expanded would otherwise go stale for
    // anyone using a pointer and a screen reader together.
    item.addEventListener("mouseenter", () => parent.setAttribute("aria-expanded", "true"));
    item.addEventListener("mouseleave", () => {
      if (!item.classList.contains("is-open")) parent.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("click", (e) => {
      if (!item.contains(e.target)) setOpen(false);
    });
    item.addEventListener("focusout", (e) => {
      if (!item.contains(e.relatedTarget)) setOpen(false);
    });
  });

  // Mark the current page inside the submenu, and light up its parent, so the
  // nav still shows where you are on a child page.
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".submenu a").forEach((a) => {
    if (a.getAttribute("href") === here) {
      a.setAttribute("aria-current", "page");
      const parent = a.closest(".has-submenu");
      if (parent) parent.classList.add("is-current");
    }
  });

  // Fallback initials for missing logo/photo images.
  // On a fast connection a 404 can resolve (and fire "error") before this
  // deferred script runs, so an addEventListener-only approach misses it,
  // check the already-settled state first, then listen for future failures.
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    const showFallback = () => {
      img.style.display = "none";
      const fallback = img.parentElement.querySelector("[data-fallback-el]");
      if (fallback) fallback.style.display = "flex";
    };
    if (img.complete && img.naturalWidth === 0) {
      showFallback();
    } else {
      img.addEventListener("error", showFallback, { once: true });
    }
  });

  // Scroll reveal
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -5% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));

    // Safety net: a fast scroll (trackpad flick, End key, jump-to-hash) can
    // move an element from below the viewport to above it between two
    // observer callbacks, so it's never reported as intersecting and stays
    // permanently invisible. Sweep on scroll/resize and reveal anything
    // already on-screen or passed.
    let sweepQueued = false;
    const sweep = () => {
      sweepQueued = false;
      document.querySelectorAll(".reveal:not(.in-view)").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add("in-view");
          io.unobserve(el);
        }
      });
    };
    const queueSweep = () => {
      if (!sweepQueued) {
        sweepQueued = true;
        requestAnimationFrame(sweep);
      }
    };
    window.addEventListener("scroll", queueSweep, { passive: true });
    window.addEventListener("resize", queueSweep);
    queueSweep();

    // Hard fallback: a backgrounded/prerendered tab (or a bfcache restore)
    // can pause IntersectionObserver and rAF entirely, so nothing above
    // ever fires. Never let content stay invisible for more than a moment.
    setTimeout(() => {
      revealEls.forEach((el) => el.classList.add("in-view"));
    }, 1200);
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  // Donate amount chips. The selected amount is written into the mailto so the
  // team receives it, rather than only being recorded in a dataset nothing reads.
  const chips = document.querySelectorAll(".amount-chip[data-amount]");
  const donateBtn = document.querySelector("[data-donate-link]");
  if (chips.length && donateBtn) {
    const email = donateBtn.dataset.donateEmail || "";
    const applyAmount = (amount) => {
      const subject = `Donation of $${amount} to ABLE Initiatives`;
      const body =
        `Hi ABLE team,\n\nI'd like to donate $${amount}.\n\n` +
        `Please send me a secure way to give.\n\nName: \nThanks!`;
      donateBtn.href =
        `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => {
          c.classList.remove("selected");
          c.setAttribute("aria-pressed", "false");
        });
        chip.classList.add("selected");
        chip.setAttribute("aria-pressed", "true");
        applyAmount(chip.dataset.amount);
      });
    });

    const preselected = document.querySelector(".amount-chip.selected[data-amount]");
    if (preselected) applyAmount(preselected.dataset.amount);
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Timeline spine.
  //
  // Fills the vertical line as you scroll and lights each marker as the fill
  // reaches it. The CSS default is a fully-drawn line, and this only shortens
  // it once `html.js` is present — so no-JS, reduced-motion and a stalled
  // script all leave a complete spine rather than an empty channel.
  document.querySelectorAll("[data-timeline]").forEach((timeline) => {
    const fill = timeline.querySelector(".timeline-fill");
    const entries = Array.from(timeline.querySelectorAll(".timeline-entry"));
    if (!fill) return;

    if (reduceMotion.matches) {
      fill.style.height = "100%";
      entries.forEach((el) => el.classList.add("is-reached"));
      return;
    }

    let queued = false;
    const update = () => {
      queued = false;
      const rect = timeline.getBoundingClientRect();
      // Fill up to a line just above the middle of the viewport, so the spine
      // stays ahead of whatever you are actually reading.
      const anchor = window.innerHeight * 0.55;
      const ratio = (anchor - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(1, ratio));
      fill.style.height = clamped * 100 + "%";

      const filledTo = rect.top + rect.height * clamped;
      entries.forEach((el) => {
        const marker = el.querySelector(".entry-marker");
        const target = marker || el;
        const mid = target.getBoundingClientRect().top + target.offsetHeight / 2;
        el.classList.toggle("is-reached", filledTo >= mid);
      });
    };
    const queue = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();

    // Same reasoning as the reveal observer: if rAF never runs (backgrounded or
    // prerendered tab), don't leave the line stuck at zero.
    setTimeout(() => {
      if (!fill.style.height || fill.style.height === "0%") update();
    }, 1200);

    reduceMotion.addEventListener("change", (e) => {
      if (e.matches) {
        fill.style.height = "100%";
        entries.forEach((el) => el.classList.add("is-reached"));
      } else {
        update();
      }
    });
  });

  // Speaker marquee.
  //
  // The cards drift continuously and loop. The duplicate sets are built here
  // rather than written into index.html so that one card per speaker stays the
  // source of truth, and — more importantly — so the copies can be marked
  // aria-hidden. Duplicated in the markup, every speaker would be announced
  // three times to a screen reader.
  document.querySelectorAll("[data-speaker-marquee]").forEach((marquee) => {
    const track = marquee.querySelector(".speaker-track");
    if (!track) return;
    const originals = Array.from(track.children);
    if (!originals.length) return;

    // Three copies: the CSS shifts the track by exactly one set, and the seam
    // only stays hidden while the remaining two sets still cover the viewport.
    const COPIES = 3;
    for (let copy = 1; copy < COPIES; copy++) {
      originals.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        // Decorative duplicates shouldn't be tab stops.
        clone.querySelectorAll("a, button").forEach((el) => el.setAttribute("tabindex", "-1"));
        track.appendChild(clone);
      });
    }

    // Pace the loop by width rather than by a fixed duration, so adding a
    // speaker makes the loop longer instead of making everything move faster.
    const PX_PER_SECOND = 42;
    const setSpeed = () => {
      const setWidth = track.scrollWidth / COPIES;
      if (setWidth > 0) track.style.animationDuration = setWidth / PX_PER_SECOND + "s";
    };
    setSpeed();
    window.addEventListener("resize", setSpeed);

    let userPaused = reduceMotion.matches;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "marquee-pause";
    const syncToggle = () => {
      toggle.textContent = userPaused ? "▶" : "❚❚";
      toggle.setAttribute(
        "aria-label",
        userPaused ? "Play the guest speaker strip" : "Pause the guest speaker strip"
      );
      marquee.classList.toggle("is-paused", userPaused);
    };
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      syncToggle();
    });
    syncToggle();
    marquee.appendChild(toggle);

    // Respect the setting if it is changed after load.
    reduceMotion.addEventListener("change", (e) => {
      userPaused = e.matches;
      syncToggle();
    });
  });

  // Sliding photo carousel
  document.querySelectorAll(".carousel").forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
    const dots = Array.from(carousel.querySelectorAll(".carousel-dots .dot"));
    const prevBtn = carousel.querySelector(".carousel-arrow.prev");
    const nextBtn = carousel.querySelector(".carousel-arrow.next");
    if (slides.length < 2) return;

    let index = slides.findIndex((s) => s.classList.contains("is-active"));
    if (index < 0) index = 0;
    let timer = null;
    // Paused by the user (via the toggle) as opposed to paused transiently
    // because the pointer is over the carousel: only the latter auto-resumes.
    let userPaused = reduceMotion.matches;
    const interval = parseInt(carousel.dataset.interval, 10) || 4500;

    carousel.setAttribute("role", "group");
    carousel.setAttribute("aria-roledescription", "carousel");
    if (!carousel.hasAttribute("aria-label")) {
      carousel.setAttribute("aria-label", "Event photos");
    }

    // Off-screen slides are still in the accessibility tree, so a screen reader
    // would otherwise read all three captions as one run-on block.
    const syncHidden = () => {
      slides.forEach((slide, i) => {
        slide.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      dots.forEach((dot, i) => {
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    };

    const show = (next) => {
      slides[index].classList.remove("is-active");
      dots[index] && dots[index].classList.remove("is-active");
      index = (next + slides.length) % slides.length;
      slides[index].classList.add("is-active");
      dots[index] && dots[index].classList.add("is-active");
      syncHidden();
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      if (userPaused) return;
      timer = setInterval(() => show(index + 1), interval);
    };

    // Autoplay with no way to stop it is a WCAG failure, so give it a control.
    // It is built here rather than in the markup so it never appears without
    // the script that makes it work.
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "carousel-pause";
    const syncToggle = () => {
      toggle.textContent = userPaused ? "▶" : "❚❚";
      toggle.setAttribute("aria-label", userPaused ? "Play photo slideshow" : "Pause photo slideshow");
    };
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      syncToggle();
      if (userPaused) stop();
      else start();
    });
    syncToggle();
    carousel.appendChild(toggle);

    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        show(i);
        start();
      });
    });
    if (nextBtn) nextBtn.addEventListener("click", () => { show(index + 1); start(); });
    if (prevBtn) prevBtn.addEventListener("click", () => { show(index - 1); start(); });

    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { show(index - 1); start(); }
      else if (e.key === "ArrowRight") { show(index + 1); start(); }
      else return;
      e.preventDefault();
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);

    // Respect the setting if it is changed after load.
    reduceMotion.addEventListener("change", (e) => {
      userPaused = e.matches;
      syncToggle();
      if (userPaused) stop();
      else start();
    });

    syncHidden();
    start();
  });

});
