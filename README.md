# ABLE Initiatives website

## What ABLE does (read before editing copy)

ABLE Initiatives makes **educational resources free and open to every student**.
It delivers that through workshops, webinars, and guest speaker sessions across
four branches: ABLE Preps (college and test prep), ABLE Health, ABLE Business, and ABLE Engineering.

**ABLE does not match students one-on-one with mentors.** The site's original copy
described a mentor-matching service in detail across all ten pages — "we match you
with a mentor", "1:1 mentor matching", "avg. mentor response time" — and none of it
was accurate. It has all been rewritten. When editing copy, don't reintroduce
mentorship-pairing or tutoring-matching framing; the correct framing is access to
free resources and open sessions.

Static site, no build step. Open `index.html` directly or serve the folder with any static server:

```
python3 -m http.server 8000
```

## Pages
- `index.html`: Home
- `our-story.html`: Our Story. What ABLE does and why, the values, and a link
  to the team.

  **The founder's story was removed** — the trip to India, the cousins with as
  much potential and none of the resources, and the portrait that ran beside
  it. It is recoverable in full from git history if it is ever wanted back.

  Taking it out was five edits, not one, because the story was threaded through
  the page: the section itself, the `<h1>` and lede that set it up, `<meta
  name="description">` and `og:description`, and the sentence "Everything ABLE
  runs comes back to that trip". Removing only the section would have left four
  references to a story the page no longer tells, two of them in the text search
  engines and social cards show. The replacement copy is drawn from wording
  already used elsewhere on the site rather than newly written, so nothing about
  ABLE is claimed here that isn't claimed on the homepage.

  The portrait (`photos/founder.png`) and the `.founder-*` rules that laid it
  out have since been deleted too; both are in git history alongside the copy.
- `our-team.html`: Our Team. Executive officers, then branch officers grouped
  under a `.team-subhead` per branch. Every group uses the same `.team-grid` /
  `.team-card` markup, so all four sections match.

  Two heading levels, and they must stay distinct. `.team-section-title` is the
  large accent-barred heading used only for "Executive officers" and "Branch
  officers"; `.team-subhead` is the small grey uppercase label used for the
  three branch names nested under the second one. When both levels used
  `.team-subhead` the page read as five sibling sections rather than two.

  Cards carry name and role, plus an optional bio. They used to list "Pine
  Creek HS" on every card, which was the same string eighteen times.

  **Bios.** A card may hold a `.team-bio` div of one or more paragraphs. The
  five executive officers and most branch officers have one now; the rest
  don't, and a card without one behaves exactly as it always did. Where one exists, `main.js` wraps that card's
  avatar in a button and the photo opens a dialog showing the bio over an
  enlarged, dimmed copy of the picture. Adding another bio is a markup edit
  alone — paste a `.team-bio` into the card and it is wired on load.

  The text lives in the card, not in the script, so the state this degrades to
  is the bio printed under the role: no JS, a browser without `<dialog>`, and a
  cached older `main.js` all land there. The card is hidden only once it has
  been wired, via `.bio-live` **on the card itself** — the `.is-live` rule from
  the timeline spine, for the same reason. The trigger button is likewise built
  in JS so it can never appear without the code that opens it.

  A member with no headshot gets their initials in the photo's slot instead, so
  the panel looks deliberate rather than half-loaded; it swaps to the photo
  automatically once one is added, with no change here. A card with neither
  takes `.no-art`, which drops the overlap and the gradient together.

  **The photo is shown whole and undimmed** — full width, natural height, capped
  at `62vh` so a tall portrait can't run off a short screen. It is the reason
  someone opened the dialog, not a texture behind the text. The bio sits in
  `.bio-content`, pulled up over the foot of the picture by a negative margin,
  where a gradient turns it black.

  Two things there are load-bearing. The gradient's stops are in **px, not %**,
  so the ramp always finishes inside the padding above the first line, whatever
  height the bio runs to; and its final stop is the same `#05050D` as the
  panel's own background, so a bio long enough to outgrow the photo continues
  onto flat black with no seam. Text starts at 150px, where the ground is
  solid — which is what makes the contrast independent of the photo: the gold
  name reads 12.9:1 and the `#E6E8F5` body copy 16.7:1 over any image at all.
  Shorten the ramp or move the text up into it and that guarantee is gone.

  The name is `--gold`, the only place on the site that colour carries a
  heading. The close button carries its own dark ground because it sits on the
  undimmed photo, where a translucent white pill disappeared.

  One dialog serves the whole page, so the `bio-dialog-name` id it is labelled
  by stays unique however many bios exist. Don't build one per card.

  Officers without a headshot use `.avatar.avatar-initials.BRANCH` — a plain
  div holding their initials, no `<img>`. It is tinted with the branch colour
  rather than the default `.avatar` gradient, because a grid of dark slabs
  reads as failed image loads. To add a photo later, swap that div for the
  `<img>` + `data-fallback` pair the presidents use; nothing else changes.

  The initials use `--sat-ink` / `--health-ink` / `--business-ink`, not the
  branch colours themselves, which fail badly on their own tints. The `-ink`
  values land at 5.1:1, 5.1:1 and 5.3:1. Use them for any text on a branch
  tint, and as the ground under any white text.
- `programs.html`: All four branches on one page
- `timeline.html`: Timeline. Every event as an alternating card either side of
  a central spine, each with a photo. The spine's filled portion tracks scroll
  position and lights each marker as it passes.

  The spine is a **sibling** of the `<ol>`, not a child — only `<li>` may be a
  direct child of a list, and an earlier version nested the positioning div
  inside it.

  The CSS default is a **fully drawn** spine, shortened only once `main.js` sets
  `.is-live` on the container. No-JS, reduced motion, and a stalled script all
  leave a complete line rather than an empty channel — the same reasoning as the
  count-up stats: the failure mode must not look like "nothing happened here".

  **Gate animate-in styling on `.is-live`, not on `html.js`.** `html.js` only
  means "a main.js loaded", which is not the same as "the code driving this
  ran". GitHub Pages serves the CSS and JS with `max-age=600` while a brand-new
  HTML page is fetched fresh, so for ten minutes after any deploy a visitor can
  hold new HTML alongside a cached older `main.js`. That older file still sets
  `html.js` — so a rule like `.js .timeline-fill { height: 0 }` collapsed the
  spine with nothing left to fill it. The speaker marquee had the identical bug:
  it would animate a track sized for nine cards with only three in it, because
  the cached script never made the clones. Both now set `.is-live` from inside
  the block that does the work.

  The Aug 3 entry has no photo and carries a dashed placeholder tile. Give it a
  real one when the photos arrive.

- `impact.html`: Impact. Chapters, the students reached, and a map.

  **The map is interactive**: pan, pinch, +/- or scroll to zoom, a pin per
  location with a popup, and a legend (bottom-left) listing the branches on
  the map. A location running more than one branch gets a pin split into equal
  wedges, one per branch, so two branches read as a half-and-half pin; the
  legend shows that too. The chapter list is folded under the map in a
  `<details>` ("All chapters as a list"), with a "Show on map" button on each
  card that flies to its pin. It is built by `assets/js/chapter-map.js` on top of
  [Leaflet](https://leafletjs.com), vendored under
  `assets/vendor/leaflet-1.9.3/` so it doesn't depend on a CDN staying up, with
  tiles from OpenStreetMap, which needs no API key or billing account. (Google
  Maps would need both; the Leaflet code is the same shape if you ever switch.)

  **The chapter cards are the source of truth, and only the address is edited
  by hand.** Each `.chapter-card` carries `data-address`, `data-lat`,
  `data-lng` and `data-geocoded`. To add a chapter, copy a card, set its name,
  city and `data-address`, and leave the coordinates alone. To move one, change
  `data-address`. The **Geocode chapter addresses** workflow
  (`.github/workflows/geocode.yml`, running `scripts/geocode-chapters.py`)
  looks up every card whose address differs from its `data-geocoded`, writes
  the exact coordinates in, commits the result, and re-runs the Pages deploy.

  It runs by itself on any push to `main` that touches `impact.html`, so the
  usual flow is: edit the address, commit, wait a minute, and the pin lands on
  the building. It can also be run by hand on any branch from the Actions tab
  ("Run workflow"). Lookups go to OpenStreetMap's Nominatim, which knows
  building outlines so a school lands on the school, with the US Census
  geocoder as a fallback; neither needs a key. If an address can't be found the
  run fails and names the card — usually a spelling or a missing ZIP.

  Nothing on the site fetches coordinates at page-load time. The workflow
  bakes them into the HTML, so visitors never wait on a geocoder and the page
  works with no third-party calls beyond the map tiles. Cards that share a
  location share a single pin whose popup lists them all.

  Four chapters are at named schools in the Colorado Springs area: Discovery
  Canyon Campus, The Classical Academy, Rampart, and Air Academy. Their
  `data-address` is the school's name plus town, which the geocoder resolves to
  the school itself, so no street address needs to be typed in. The Denver,
  Cupertino and Vancouver chapters have only a city on file, so their pins are
  the city centre until they get one. A school with chapters in more than one
  branch (Discovery Canyon and Rampart run Business and Health) gets one split
  pin, and its popup shows the school once with a badge per branch. Lookups cover the US and Canada; widen
  `countrycodes` in the script if a chapter opens elsewhere.

  The static SVG fallback only draws the United States and only carries the
  Colorado pins. It is the no-JS view, so that is acceptable, but its `<desc>`
  points readers at the chapter list for the rest.

  Scroll-wheel zoom is off until the map is clicked or focused, and off again
  when the pointer leaves, so a wheel passing over the map never hijacks the page
  scroll. The +/- buttons always work, as do pinch and keyboard arrows.

  **The inline SVG map is still there, as the fallback.** It is what shows
  before the script runs and what stays if Leaflet fails to load or an older
  `chapter-map.js` is cached: the script sets `.is-live` on the container only
  once it has built the live map, the same gate the timeline spine and the
  speaker marquee use. The outline is a coarse set of real lat/lon border
  waypoints projected equirectangularly about 39°N, which is why Colorado can be
  a plain `<rect>`; its pins are the cities' real coordinates. It doesn't need
  updating for new chapters unless you want the no-JS view to match.

  Tile usage: OpenStreetMap's public tile servers are fine for a site this
  size, and the attribution Leaflet shows in the corner is required by their
  licence — leave it in. If traffic ever grows a lot, switch the tile URL in
  `chapter-map.js` to a hosted provider.

- `preps.html` / `health.html` / `business.html` / `engineering.html`: One page per branch
- `get-involved.html`: Students, members, and chapter leads
- `events.html`: Photo gallery (grouped by event)
- `donate.html`: Donate
- `404.html`: Not-found page

Shared styles live in `assets/css/style.css`, shared behavior in `assets/js/main.js`.
Every page pins them (and `chapter-map.js` on the Impact page) with a `?v=N`
query string. GitHub Pages caches these files for ten minutes, so **after
changing any of them, run `./bump-asset-version.sh`** — it increments the
number on every first-party CSS and JS reference in all fourteen pages and
prints a count so you can see it hit every file. Vendored libraries carry their
version in the directory name instead and don't need it.

There is no templating, so **the header and footer are duplicated in every page** —
a nav change is a fourteen-file edit, and scripted find-and-replace across them
has now gone wrong twice in ways that looked fine at a glance:

- `preps.html`, `health.html` and `business.html` carry `aria-current="page"`
  on their Programs link, so a replacement written against the plain markup
  silently skipped all three.
- A pattern anchored on six spaces of indent also matched inside the footer's
  ten-space indent, so a nav block was injected into the footer on every page.

**Anchor on enough context to be unambiguous, and audit every page with `grep`
afterwards** — the nav and footer both contain the same link markup at
different depths.

The nav switches to the mobile panel at **1130px**, which is wider than it looks
like it should be. The full row — brand, six links, and two buttons — needs about
that much before those three groups stop colliding, so the original 860px
breakpoint left a wide band where the desktop nav overlapped itself.

It was 1040px until the Impact link was added; a sixth item is worth roughly
another 90px of row, so the breakpoint moved with it. **Adding or renaming a nav
item means revisiting this number.** Measure rather than guess: brand-right to
links-left must stay positive at the breakpoint width. The current 1130px is an
estimate from the item widths, not a measured value — if you see the row collide
just above it, raise it.

Two nav items are dropdowns (`.has-submenu`): **About** holds Our Story and Our
Team, **Impact** holds Timeline and Impact. Each parent is a `<button>`, not a
link, because it navigates nowhere on its own. CSS opens them on hover and
focus-within; the JS adds click/tap toggling, Escape to close, and keeps
`aria-expanded` honest. On mobile they flatten into an indented list inside the
nav panel rather than a floating card. The JS handles any number of them, so a
third dropdown needs no script change.

**Don't remove `.submenu::before`.** The panel sits 10px below its parent, and
that strip belongs to neither element — so moving the pointer down from "About"
to its links crossed a dead zone, un-hovered the item and closed the menu just
as you reached it, which made clicking the parent feel mandatory. That pseudo-
element is an invisible 14px bridge over the gap, and it is the only reason
hover-then-click works. If you change `top: calc(100% + 10px)`, change the
bridge to match. Closing is also delayed ~0.2s to forgive a wobble; opening is
instant. On a device with a real pointer, `mouseleave` closes the menu even if
it was opened by clicking, so a click-opened panel can't get stuck open.

Each submenu's `id` must stay unique **per page** — `about-submenu` and
`impact-submenu`. A scripted nav edit once duplicated a whole block into the
footer, silently producing two elements sharing one `id`; the same class of bug
recurred when the Impact dropdown was added. Audit with `grep` across every page
before committing, checking that each page has exactly two submenu ids and that
they match their `aria-controls`.

## Images

All photos and logos are committed under `assets/images/` and served from this repo.
They used to be hotlinked from a free image host, which meant the site lost every
photo if that host went down; don't reintroduce remote image URLs.

```
assets/images/
  logos/      logo-main.png    the "A" monogram, transparent background — used
                               everywhere (header, footer, homepage banner,
                               apple-touch-icon)
              logo-lockup.jpg  the older monogram + ".B.L.E. Initiatives"
                               wordmark, on an opaque white background. Not
                               referenced by any page; kept because it is the
                               only asset carrying the wordmark, which is
                               useful for a social preview image later.
              logo-preps.png, logo-health.png, logo-business.png,
              logo-engineering.png
                               branch marks, also transparent
  photos/     hero.jpg — the homepage hero banner background
  speakers/   cropped headshots for the guest-speaker cards
  gallery/    health-workshop/, preps-webinar/, business-workshop/, preps-workshop/
  team/       one headshot per director
```

Every `<img>` that can be missing carries `data-fallback`, paired with a
`[data-fallback-el]` sibling. If the file 404s, the image hides and the fallback
(initials, or a neutral "Photo coming soon") shows instead, so nothing ever renders
broken. Add new images with `width`, `height`, `loading="lazy"` and `decoding="async"`
— the dimensions prevent the page from jumping as photos load.

### The icons
`assets/favicon.png` (128×128) and `assets/apple-touch-icon.png` (180×180) are
the monogram composited onto a **solid white square**, generated from
`logos/logo-main.png` rather than drawn separately.

The white ground is deliberate and worth keeping. The mark is dark indigo on a
transparent background, which all but disappears in a dark browser tab strip;
and iOS renders transparency in an apple-touch-icon as black, so the transparent
logo was the wrong file for that slot regardless.

To regenerate after a logo change: scale `logo-main.png` to ~80% of the target
square, then alpha-composite it centred over white. `sips` cannot composite, so
that step needs a real image tool or a few lines of Python. Don't just point
these at `logo-main.png` again — that reintroduces both problems.

### The logo
`logos/logo-main.png` is the "A" monogram on a transparent background, and it is
used at every size: the 34px header/footer mark, the homepage banner, and the
apple-touch-icon.

Transparency is what makes this simple, and it is worth preserving. The previous
logo was an opaque JPG, which forced two workarounds that have now been deleted:
the header mark scaled the image to 272% and pinned it top-left to crop the
monogram out of a wide lockup, and the homepage banner wrapped the logo in a white
card purely so its white background looked deliberate. Both are gone — the mark
is a plain `object-fit: contain`, and the banner logo sits directly on the page.

If you replace the logo, keep it transparent and roughly square. A different
aspect ratio means updating the `width`/`height` attributes on the banner `<img>`
in `index.html` (currently 784×725), which is what reserves the right space while
the image loads.

### Palette
The site runs a **light indigo palette** with gold as the branch accent, and the
whole thing lives in CSS variables at the top of `style.css` — changing the scheme
means editing that one block. A dark navy variant was built and tested against the
same markup, so inverting it is a palette edit rather than a rewrite.

Several variables exist specifically so that inversion stays possible:

- `--ink` means "highest contrast against the page", so here it is the *light*
  end of the scale. Anything needing "a dark block with light text on it" uses
  `--panel` / `--on-panel` instead. Don't put `color: #fff` on a `var(--ink)`
  background; on this palette that is white on near-white.
- `--accent-dark` is used for small text on the page background, so on a dark
  palette it is *lighter* than `--accent`, not darker.
- `--on-brand` is the text colour on a branch colour (`--sat`/`--health`/
  `--business`), which flips with the theme the same way `--accent-ink` does.
  It is close to vestigial now: since the branch colours were re-pointed at the
  logos, nothing puts text directly on one — the places that used to (the
  logo-slot fallbacks) sit on the darker `-ink` value instead, so white always
  works. Keep it if you invert the palette, or drop it and the three base rules
  that still reference it.
- Shadows need to be far denser on a dark ground; light-theme shadow values are
  invisible there.

Inverting the palette is only possible because every logo is transparent — opaque
logos render as white slabs on a dark page.

### The hero banner
The homepage opens with a full-bleed photo (`photos/hero.jpg`) under a gradient
scrim, with the headline over it. Two things to preserve if you swap the photo:

- The scrim is a **gradient, not a flat overlay** — heaviest bottom-left behind
  the text, lifting toward the top-right so the photo is still legible. A flat
  overlay either washes out the image or leaves text unreadable over bright areas.
- **Re-check contrast after changing the photo.** Contrast here depends on the
  photo's pixels, not on CSS values, so it has to be measured against the render.
  Current worst-case behind the text: headline 9.7:1, gold eyebrow 6.1:1, lede
  10.0:1. The eyebrow is the tightest — when the separate logo banner was removed
  and the hero moved up under the nav, that line landed over the ceiling lights
  and dropped to 3.7:1, which is why the scrim's top stop is 0.72 rather than the
  0.55 it started at. Swap in a brighter photo and it needs raising again.

The section also carries its own dark `background`, so if the photo ever fails to
load the white text still lands on something dark instead of the light page.

The banner sits directly under the nav — there is deliberately no logo block
between them. The header carries the logo instead, at 52px.

`.hero-acronym` spells out A.B.L.E. (Advancing Better Learning Empowerment) with
the initials picked out in gold. It is plain text, so screen readers read the
phrase normally rather than announcing four separate letters.

## Homepage sections that need updating as ABLE grows

**Event timeline** (`timeline.html`). Add a new `<li class="timeline-entry BRANCH reveal">`
in date order, where `BRANCH` is `sat`, `health`, or `business` — that class colours
the marker and must match the `event-branch` span inside. Keep the `datetime`
attribute in `YYYY-MM-DD` form; it's the machine-readable version search engines read.
Also update the event count in the section intro.

**Guest speakers** (`index.html`). Copy a `.speaker-card` block. With one speaker the
card lays out horizontally on purpose; from two onward it becomes a normal grid,
with no CSS change needed.

Speaker photos live in `assets/images/speakers/` and should be cropped to roughly
4:3 around the person. Don't point a card straight at a wide event photo: the tile
is 4:3 with `object-fit: cover`, so a wide shot where the speaker occupies a third
of the frame will render as a room, not a portrait. Mark Bittle's card did exactly
that for a while; `speakers/mark-bittle.jpg` is now a 620×465 crop taken from
`gallery/business-workshop/3.jpg`, the same treatment as the others.

**Animated stat counters** — *removed.* The homepage stat strip, the "by the
numbers" donut/progress section, and the cost-comparison chart were all deleted
earlier; the `.stat-num` count-up code that drove the first of them outlived them
by a while as dead JS and has now been removed too. All of it is recoverable from
git history.

If you ever bring a counter back, take the old implementation from history rather
than writing a fresh one — it encodes a non-obvious safety property. The real
figure lives in the markup and every exit path restores that exact string, so a
stalled frame loop, an unsupported browser, a backgrounded tab, a reduced-motion
preference, or JS failing to load at all each leave the true number on screen. A
well-known nonprofit site this design borrowed from currently displays **"0
patients aided since 2020"** because its counter animation breaks before reaching
the real figure. The progress bars worked the same way: their real widths were
inline, and CSS only blanked them while the section was off-screen and only when
`html.js` was present.

## Search and social tags

The production domain is **`ableinitiatives.com`**, set in `CNAME`. Everything
below is absolute against it, because canonical URLs, `og:url` and `og:image`
are all resolved by machines that don't share the page's base URL.

Every indexable page carries, in `<head>`:

- `<link rel="canonical">` — its own absolute URL. `index.html` canonicalises to
  the bare root `https://ableinitiatives.com/`, not `/index.html`, since GitHub
  Pages serves the same file at both and the root is the form to consolidate on.
- `og:url` — the same string as the canonical. If you change one, change both;
  a page that names two different addresses for itself is worse than one that
  names none.
- `og:image` and its `width` / `height` / `alt` — `logos/logo-lockup.jpg`
  (1280×685), the only asset carrying the wordmark. That is what it was kept
  for. The dimensions let a crawler lay out the card on first scrape instead of
  waiting to fetch the file. If you swap the image, update those two numbers —
  they're an assertion about the file, not a request to resize it.
- `twitter:card` is `summary_large_image`, which is what the 1.87:1 lockup wants;
  it was `summary` back when there was no image to show.

**`404.html` is deliberately different.** It carries `robots: noindex` and gets
the shared `og:image` but *no* canonical and *no* `og:url` — both would be
claims about a page that should never be indexed. GitHub Pages serves it for
every missing path, so a self-canonical there points thousands of dead URLs at
one address.

`sitemap.xml` lists the same thirteen pages in nav order, `robots.txt` points at
it, and each `<loc>` is character-for-character the page's canonical. **Adding a
page means three edits: its own canonical/`og:url` pair, and a `<url>` block in
the sitemap.** The `lastmod` dates are honest ones from git — leave a page's
date alone if you didn't change the page.

These tags were inserted by script, which the nav history above says to be
careful with. The anchors used were the favicon `<link>` and the `twitter:card`
`<meta>`, both of which appear exactly once per file and only inside `<head>`;
the script asserted that count before writing anything. Audit the same way if
you repeat it — `grep -c` per page, then check that each page's canonical names
that page and not its neighbour.

## Still to do

- [x] ~~A headshot for Angelina Wan~~ — in place.
- [ ] **Replace Neerav Shrestha's headshot when a better file turns up.** His
      came as a 650×817 screenshot of a photo, with him small in the frame, so
      the tightest usable square crop is **330×330** — the only team photo below
      the card's own retina size, and noticeably soft in the bio dialog, which
      shows it at roughly 2.8× upscale. This was shipped knowingly rather than
      by accident. The original off his camera roll would fix it with no markup
      change: same filename, same crop treatment as the others.
- [ ] **"Apex" appeared in two submitted bios**, Chelsea Ogden's ("acting as
      Apex Health's VP", "give back to the community through Apex") and Neerav
      Shrestha's ("Apex Health's VP of Outreach", "what Apex has to offer").
      Every instance was changed to ABLE, since both serve ABLE Health and this
      is ABLE's site. Nothing else in either paragraph was invented or altered
      beyond punctuation — but if "Apex" is a name the team actually uses, all
      four instances should go back.
- [ ] **Angelina Wan's branch name** read "ABLE Prep's VP of Public Relations"
      and "helping ABLE Prep grow"; both became "ABLE Preps", the branch's
      actual name.
- [ ] **Advait Jadhav's bio names his school and year.** That is his own
      wording and was kept as written — but the team cards deliberately stopped
      listing "Pine Creek HS", so it is worth deciding whether a student's
      school belongs on a public page at all.
- [x] ~~A headshot for Chelsea Ogden~~ — in place, and her bio dialog now uses
      the photo rather than her initials. It needs no `object-position`: the
      source is only 12% taller than square, so the default centre crop already
      lands her face where the other cards put theirs.
- [ ] **Confirm the contact address.** Every contact link points at
      `ableinitiativespchs@gmail.com`. Make sure that mailbox exists and is monitored
      before sharing the site — it is the only way anyone can reach you.
- [x] ~~ABLE Preps logo~~ — in place; every logo on the site is now a real
      transparent PNG.
- [x] ~~Team headshots~~ — all eight are in `assets/images/team/`.
- [x] ~~Transparent branch logos~~ — Health and Business are transparent PNGs now.
- [x] ~~**Branch colours don't match the branch logos**~~ — fixed. All three now
      take their hue from the logo they sit next to:

      | Branch | Logo | was | now |
      |---|---|---|---|
      | Preps | orange | indigo `#2B2BC4` | `#BD7305` |
      | Health | red | green `#10B76E` | `#F20808` |
      | Business | green | gold `#F0C048` | `#28991F` |

      The `*-tint` and `*-ink` values were re-derived from the same hues, and
      `.event-branch` was switched from the raw branch colour to `-ink` — it had
      been putting 11.5px bold text on its own tint at as little as 1.5:1. The
      logo-slot fallbacks now use `-ink` as the ground so white always works on
      them. Every pairing was measured; see the comments in `style.css`.

      Note the class names still read `.sat` — that predates the Preps rename and
      changing it is an eleven-file edit, so it was left alone.
- [x] ~~**Ameya Yelne's title and employer**~~ — her card now carries a
      `.speaker-org` line ("Business student, UT Austin"), so all five speaker
      cards name a title and employer.

- [ ] **College Admissions Journey Panel photos** (Aug 3). The event's `.gallery-grid` in
      `events.html` currently holds a single "Photos coming soon" tile. It used to
      hold two `<img>` tags pointing at `preps-workshop/1.jpg` and `2.png`, neither
      of which was ever added, so every visit fired two 404s. Drop the real files
      into `assets/images/gallery/preps-workshop/` and replace the placeholder with
      `event-photo` blocks copied from the $tartup Workshop above.
- [ ] **Payment processor.** The "Donate now" button is a `mailto:`. Once a processor is
      set up (Zeffy is 0% for nonprofits; Givebutter and Stripe also work), swap the
      `href` in `donate.html` and delete the "online giving is being set up" footnote.
- [ ] **EIN and tax-deductibility notice** on `donate.html`. Donors look for it, and the
      site claims 501(c)(3) status on every page.
- [x] ~~**Canonical URLs, `og:image`, and `sitemap.xml`**~~ — all in place; see
      "Search and social tags" below. `CNAME` already pointed at
      `ableinitiatives.com`, so the domain these were waiting on was in fact
      settled.
- [x] ~~**Replace the `mailto:` intake links** on `get-involved.html` with a real form~~
      — done. The three pathway buttons open Google Forms: students
      `forms.gle/3mq1C2gRZqZVioHN6` (access to resources, webinars and
      workshops), members `forms.gle/KPtiCPXArUukL6tm6` (Global Youth
      Ambassador), chapter leads `forms.gle/JyyCF639f93D8igc7` (Global
      Nonprofit Founder). They open in a new tab. If a form is replaced, the
      link lives only in that one button.
- [ ] **Check the rewritten member roles** on `get-involved.html`. The old roles
      ("Subject mentor", "College consultant") described one-on-one work ABLE
      doesn't do. They now read Workshop leader / Resource creator / Speaker
      coordinator / Operations & outreach — a best guess at what volunteers
      actually do. Correct them if that's off.
- [ ] **Keep the event count current.** The timeline intro on `timeline.html` reads
      "Five sessions and a brand-new branch since July" — update that wording
      whenever you add a `.timeline-entry`, so the two never drift apart.

## Gallery

Photos are added only by editing the HTML — there is intentionally no upload button,
so the public can't add anything. To add one, copy an existing
`<div class="event-photo">…</div>` block into the relevant event's `.gallery-grid`
in `events.html` and point its `<img src>` at a file under
`assets/images/gallery/<event>/`.

| Event | Branch | Date | Photos |
|---|---|---|---|
| Health Literacy Workshop | ABLE Health | July 16 | 1 |
| College Admissions Journey Webinar | ABLE Preps | July 21 | 1 |
| How to Build a $tartup Workshop | ABLE Business | July 22 | 8 |
| College Admissions Journey Panel | ABLE Preps | August 3 | 0 — placeholder tile, photos still needed |
| Exploring Business Majors Webinar | ABLE Business | August 15 | 2 |

Exploring Business Majors Webinar ran on Google Meet, so its photos are screenshots of the
call, showing the attendees as well as the presentation. **Trim the title bar
off any further ones.** Google Meet puts the joining code there, and published
on a public page that code lets anyone drop into a later session on it — it is
the one piece of these captures that is a security question rather than a
judgement call. Roughly the top 9-10% of a full-screen capture does it; check
the result rather than trusting the fraction.

Note `sips --cropOffset` silently does nothing if either offset is `0`, leaving
the image uncropped at its original size. Pass `1` instead and lose a pixel.

The two webinar events use `object-fit: contain` so their wide captures aren't
cropped to the middle of the frame.
