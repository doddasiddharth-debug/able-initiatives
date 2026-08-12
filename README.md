# ABLE Initiatives website

Static site, no build step. Open `index.html` directly or serve the folder with any static server.

## Pages
- `index.html`: Home
- `about.html`: About
- `programs.html`: Programs (ABLE Preps / Health / Business)
- `get-involved.html`: How to get involved
- `events.html`: Photo gallery (grouped by event)
- `donate.html`: Donate

## Adding your logo
- **Big logo banner** at the very top of the homepage: drop a file at `assets/images/logos/logo-main.png` (any aspect ratio; it's scaled to fit, not cropped).
- **Small nav mark**: the square next to "ABLE Initiatives" in the header/footer is already an image slot (it falls back to a neutral picture icon until a file is added). Drop a file at `assets/images/logos/logo-mark.png` and it'll appear there automatically, no HTML edits needed.

## Adding branch logos
Drop image files into `assets/images/logos/` using these exact names and they'll appear automatically (they currently fall back to colored initials):
- `logo-preps.png`
- `logo-health.png`
- `logo-business.png`

## Adding photos
- **Homepage hero photo**: `assets/images/photos/hero.jpg`
- **About page "why we exist" photo**: `assets/images/photos/why-we-exist.jpg`
- **Team headshots** (about.html): `assets/images/team/siddharth-dodda.jpg`, `eric-huang.jpg`, `helen-wan.jpg`, `rhythm-kasat.jpg`, `monsf-tibin.jpg`
## Photo gallery (events.html)
The gallery on `events.html` is grouped into 4 real events. The homepage carousel and the scattered photos on `get-involved.html` / `donate.html` pull from the same set of photos.

| Event | Date | Photos | Status |
|---|---|---|---|
| ABLE Health Workshop | July 16 | 1 (panel, woman speaking + 2 students seated) | ✅ in place (hosted) |
| ABLE Preps Webinar | July 21 | 1 (video-call "Live Q&A" screenshot) | ✅ in place (hosted) |
| ABLE Business Workshop | July 22 | 8 (Mark Bittle + Titan Robotics talk, full room, candids) | ✅ in place (hosted) |
| ABLE Preps Workshop | August 3 | 0 of 2 (students at podium + QR code slide) | ⬜ still needed |

**Adding a photo (site owner, by editing the HTML):** there is intentionally **no on-page upload button** — photos are added only by editing the code, so the public can't add anything. To add one, drop a new `<div class="event-photo">…</div>` block into the relevant event's `.gallery-grid` in `events.html`, with an `<img src="…">` pointing at either:

1. **A hosted image link (recommended, no local storage needed).** Upload the photo to any free image host, e.g. [postimages.org](https://postimages.org) (no account needed), grab the **direct image link** (ends in `.jpg`/`.png`, not a page URL), and use it as the `src`. This is what all the current gallery photos use.
2. **A local file.** Save it into `assets/images/gallery/<event>/` and reference it as `assets/images/gallery/<event>/N.jpg`.

All of the above (logos, hero photos, team headshots, gallery photos) fall back to a clean placeholder (initials or an icon) until a real file is added, so nothing ever looks broken in the meantime.

## Connecting real donations
`donate.html` currently points the "Donate now" button at a `mailto:` link since no payment processor is connected yet. Once you set up a processor (Stripe, PayPal, Zeffy, Givebutter, etc.), swap that `href` for your checkout link.

## Editing content
There's no templating: the header/footer are duplicated in each HTML file. Shared styles live in `assets/css/style.css`, shared behavior in `assets/js/main.js`.
