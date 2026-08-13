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
  logos/      logo-main.jpg, logo-health.jpg, logo-business.jpg
  gallery/    health-workshop/, preps-webinar/, business-workshop/, preps-workshop/
  team/       one headshot per director
```

Every `<img>` that can be missing carries `data-fallback`, paired with a
`[data-fallback-el]` sibling. If the file 404s, the image hides and the fallback
(initials, or a neutral "Photo coming soon") shows instead, so nothing ever renders
broken. Add new images with `width`, `height`, `loading="lazy"` and `decoding="async"`
— the dimensions prevent the page from jumping as photos load.

### The header/footer logo mark
The small square mark in the header and footer reuses `logos/logo-main.jpg`. Because
that logo is a wide lockup ("A" monogram + wordmark) that turns to mush at 34px, the
CSS scales it up and pins it top-left so only the monogram shows — see `.brand-mark img`
in `style.css`. If the logo file is ever replaced with different proportions, that
`width: 272.34%` needs recalculating (it is `logo width ÷ monogram width`).

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
- [ ] **Team headshots.** `assets/images/team/{siddharth-dodda,eric-huang,helen-wan,rhythm-kasat,monsf-tibin}.jpg`
      — currently all showing initials.
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
