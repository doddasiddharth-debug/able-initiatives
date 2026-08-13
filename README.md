# ABLE Initiatives website

## What ABLE does (read before editing copy)

ABLE Initiatives makes **educational resources free and open to every student**.
It delivers that through workshops, webinars, and guest speaker sessions across
three branches: ABLE Preps (college and test prep), ABLE Health, and ABLE Business.

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
- `about.html`: About + team
- `programs.html`: All three branches on one page
- `preps.html` / `health.html` / `business.html`: One page per branch
- `get-involved.html`: Students, members, and chapter leads
- `events.html`: Photo gallery (grouped by event)
- `donate.html`: Donate
- `404.html`: Not-found page

Shared styles live in `assets/css/style.css`, shared behavior in `assets/js/main.js`.
There is no templating, so **the header and footer are duplicated in every page** —
a nav change is a ten-file edit. Use find-and-replace across all `*.html`, and check
the result with `grep` before committing.

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
              logo-health.png, logo-business.png
                               branch marks, also transparent
  photos/     hero.jpg — the homepage hero banner background
  gallery/    health-workshop/, preps-webinar/, business-workshop/, preps-workshop/
  team/       one headshot per director
```

Every `<img>` that can be missing carries `data-fallback`, paired with a
`[data-fallback-el]` sibling. If the file 404s, the image hides and the fallback
(initials, or a neutral "Photo coming soon") shows instead, so nothing ever renders
broken. Add new images with `width`, `height`, `loading="lazy"` and `decoding="async"`
— the dimensions prevent the page from jumping as photos load.

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

**Event timeline** (`index.html`, "Our first season"). Add a new `<li class="timeline-item BRANCH">`
in date order, where `BRANCH` is `sat`, `health`, or `business` — that class colours
the marker and must match the `event-branch` span inside. Keep the `datetime`
attribute in `YYYY-MM-DD` form; it's the machine-readable version search engines read.
Also update the "Four events" count in the section intro.

**Guest speakers** (`index.html`). Copy a `.speaker-card` block. With one speaker the
card lays out horizontally on purpose; adding a second automatically switches the
section to a normal grid, no CSS changes needed.

**Animated stat counters.** Any `.stat-num` on the site counts up when scrolled into
view. It reads the final value straight out of the markup and restores that exact
string when the animation ends, so the number in the HTML is always the source of
truth. Values with no sensible midpoint are skipped automatically: ratios containing
a colon (`1:1`) and zero targets (`$0`). Formats that do animate include `3`, `100%`,
`~2 days`, `4.5 hrs`, and `1,200 students`.

This is deliberately defensive, and worth preserving if you edit it. A well-known
nonprofit site this design borrowed from currently displays **"0 patients aided
since 2020"** because its counter animation breaks before reaching the real figure.
Every failure path here — no `IntersectionObserver`, reduced-motion preference,
backgrounded tab, JS not loading at all — leaves the true number on screen instead.
The progress bars work the same way: their real widths are inline, and CSS only
blanks them while the section is off-screen and only when `html.js` is present.

## Still to do

- [ ] **Confirm the contact address.** Every contact link points at
      `ableinitiativespchs@gmail.com`. Make sure that mailbox exists and is monitored
      before sharing the site — it is the only way anyone can reach you.
- [ ] **Correct ABLE Preps logo.** The current one is wrong, so the Preps references
      point at `assets/images/logos/logo-preps.png`, which doesn't exist yet and falls
      back to "PR" initials. Drop the real file in at that exact path and it appears
      everywhere automatically, no HTML edits.
- [x] ~~Team headshots~~ — all eight are in `assets/images/team/`.
- [x] ~~Transparent branch logos~~ — Health and Business are transparent PNGs now.
- [ ] **Branch colours no longer match the branch logos.** The ABLE Health logo is
      red but `--health` is green; the ABLE Business logo is green but `--business`
      is gold. That shows up on the card top-borders, the timeline markers, and the
      event badges. Either restyle the logos or re-point those two variables.
- [ ] **Preps Workshop photos** (Aug 3): `assets/images/gallery/preps-workshop/1.jpg` and `2.png`.
- [ ] **Payment processor.** The "Donate now" button is a `mailto:`. Once a processor is
      set up (Zeffy is 0% for nonprofits; Givebutter and Stripe also work), swap the
      `href` in `donate.html` and delete the "online giving is being set up" footnote.
- [ ] **EIN and tax-deductibility notice** on `donate.html`. Donors look for it, and the
      site claims 501(c)(3) status on every page.
- [ ] **Canonical URLs, `og:image`, and `sitemap.xml`.** These all need the production
      domain, which isn't decided yet. The other social tags are already in place; add
      the sitemap line to `robots.txt` at the same time.
- [ ] **Replace the `mailto:` intake links** on `get-involved.html` with a real form
      (Google Forms, Tally). `mailto:` often does nothing on school Chromebooks, and a
      form gives you an actual roster.
- [ ] **Check the rewritten member roles** on `get-involved.html`. The old roles
      ("Subject mentor", "College consultant") described one-on-one work ABLE
      doesn't do. They now read Workshop leader / Resource creator / Speaker
      coordinator / Operations & outreach — a best guess at what volunteers
      actually do. Correct them if that's off; the same four names also appear
      inside the "Become a member" mailto body.
- [ ] **Confirm "4 free events run"** on the homepage stat strip stays current as
      you run more events. It should match the number of entries in the timeline.

## Gallery

Photos are added only by editing the HTML — there is intentionally no upload button,
so the public can't add anything. To add one, copy an existing
`<div class="event-photo">…</div>` block into the relevant event's `.gallery-grid`
in `events.html` and point its `<img src>` at a file under
`assets/images/gallery/<event>/`.

| Event | Date | Photos |
|---|---|---|
| ABLE Health Workshop | July 16 | 1 |
| ABLE Preps Webinar | July 21 | 1 |
| ABLE Business Workshop | July 22 | 8 |
| ABLE Preps Workshop | August 3 | 0 of 2 — still needed |
