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
- `our-story.html`: Our Story (why ABLE exists, what we believe)
- `our-team.html`: Our Team. Executive officers, then branch officers grouped
  under a `.team-subhead` per branch. Every group uses the same `.team-grid` /
  `.team-card` markup, so all four sections match.

  Two heading levels, and they must stay distinct. `.team-section-title` is the
  large accent-barred heading used only for "Executive officers" and "Branch
  officers"; `.team-subhead` is the small grey uppercase label used for the
  three branch names nested under the second one. When both levels used
  `.team-subhead` the page read as five sibling sections rather than two.

  Cards carry name and role only. They used to list "Pine Creek HS" on every
  card, which was the same string eighteen times.

  Officers without a headshot use `.avatar.avatar-initials.BRANCH` — a plain
  div holding their initials, no `<img>`. It is tinted with the branch colour
  rather than the default `.avatar` gradient, because a grid of dark slabs
  reads as failed image loads. To add a photo later, swap that div for the
  `<img>` + `data-fallback` pair the presidents use; nothing else changes.

  The initials use `--sat-ink` / `--health-ink` / `--business-ink`, not the
  branch colours themselves, which fail badly on their own tints. The `-ink`
  values land at 5.1:1, 5.1:1 and 5.3:1. Use them for any text on a branch
  tint, and as the ground under any white text.
- `programs.html`: All three branches on one page
- `impact.html`: Timeline and Impact. The event timeline lived on the homepage
  until this page existed; it was moved here whole, so `index.html` now runs
  carousel → guest speakers → CTA with no timeline in between.

  The Impact section carries a US map as **inline SVG** — no library, no image
  file. The outline is a coarse set of real lat/lon border waypoints projected
  equirectangularly about 39°N, which is why Colorado can be a plain `<rect>`:
  it is a true lat/lon rectangle (37–41°N, 102–109°W) and lands as an exact
  rectangle under that projection. Both pins are the cities' real coordinates.

  Denver and Colorado Springs are only about 20px apart at national scale, so
  their labels sit outside the state on leader lines instead of beside the pins.
  If you add a chapter, project its coordinates the same way rather than
  eyeballing a position — the generator is in the git history for this commit.
- `preps.html` / `health.html` / `business.html`: One page per branch
- `get-involved.html`: Students, members, and chapter leads
- `events.html`: Photo gallery (grouped by event)
- `donate.html`: Donate
- `404.html`: Not-found page

Shared styles live in `assets/css/style.css`, shared behavior in `assets/js/main.js`.
There is no templating, so **the header and footer are duplicated in every page** —
a nav change is a twelve-file edit. Adding the Impact link caught this the hard
way: `preps.html`, `health.html` and `business.html` carry
`aria-current="page"` on their Programs link, so a find-and-replace written
against the plain markup silently skipped all three. Check with `grep` across
every page afterwards, not just a sample.

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

The **About** nav item is a dropdown (`.has-submenu`) holding Our Story and Our Team.
Its parent is a `<button>`, not a link, because it navigates nowhere on its own.
CSS opens it on hover and focus-within; the JS adds click/tap toggling, Escape to
close, and keeps `aria-expanded` honest. On mobile it flattens into an indented
list inside the nav panel rather than a floating card. The submenu's `id` must
stay unique per page — a scripted nav edit once duplicated the whole block into
the footer, which silently produced two elements sharing `id="about-submenu"`. Use find-and-replace across all `*.html`, and check
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
              logo-preps.png, logo-health.png, logo-business.png
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

**Event timeline** (`impact.html`). Add a new `<li class="timeline-item BRANCH">`
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
of the frame will render as a room, not a portrait.

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

## Still to do

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
- [ ] **Ameya Yelne's title and employer.** Her speaker card is live on the
      homepage with a headshot, but it has no `.speaker-org` line — the other
      two cards both name a title and employer, and the site shouldn't invent
      one. Add the line when you have it.

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
- [ ] **Keep the event count current.** The timeline intro on `impact.html` reads
      "Five events across all three branches" — update that wording whenever you
      add a `.timeline-item`, so the two never drift apart.

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
