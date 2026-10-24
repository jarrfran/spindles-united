# Spindles United FC: hosted site code

The site's code lives here and is served by GitHub Pages at
`https://jarrfran.github.io/spindles-united/`. Squarespace loads it, so code changes
are made here and never pasted into Squarespace again.

## Files
| File | What it is |
|---|---|
| `site.css` | All styles: brand tokens (Alverata headings, Arboria body) and every page’s layout |
| `spindles.js` | Loader: fills each `<div data-su="…">` with its page and runs page behavior |
| `matches.json` | Verified results across seasons; sorted newest-first by the swipeable ticker |
| `pages/*.html` | One file per page section (markup only) |
| `index.html` | Preview page on GitHub Pages |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## One-time Squarespace setup
**Header code:** Settings → Developer Tools → Code Injection → Header
```html
<meta name="theme-color" content="#0d0d0e">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<script>(function(){var v=Math.floor(Date.now()/12e4),b="https://jarrfran.github.io/spindles-united/",l=document.createElement("link");l.rel="stylesheet";l.href=b+"site.css?v="+v;document.head.appendChild(l);var s=document.createElement("script");s.src=b+"spindles.js?v="+v;document.head.appendChild(s)})();</script>
```

**Code Blocks:** put one Code Block in a zero-padding section and paste its line.
| Page | Code Block | Status |
|---|---|---|
| Home | `<div data-su="home"></div>` | live |
| Schedule | `<div data-su="schedule"></div>` | built, ready to install |
| Roster | `<div data-su="roster"></div>` | built, ready to install |
| Sponsors | `<div data-su="sponsors"></div>` | not built |
| Stats | `<div data-su="stats"></div>` | not built |
| Inside Spindles | `<div data-su="inside-spindles"></div>` | not built |
| Seasons | `<div data-su="seasons"></div>` | not built |
| Volunteer | `<div data-su="volunteer"></div>` | not built |
| Contact | `<div data-su="contact"></div>` | built, place above a native Squarespace Form Block |

Add `<div data-su="footer"></div>` to a Code Block in the global Squarespace footer. The sponsor band and dark navigation footer are one reusable block. When it is installed, the duplicate homepage sponsor band hides automatically. Header, cart, forms and the News blog stay native Squarespace.

## Schedule, roster and footer

- `club-pages.js` renders schedule archives, match centers, roster archives and search.
- `data/club.json` holds the current season (`currentSeason`, currently 2026), published fixture results, reports, photos, scoring events and roster entries. Update this file when adding seasons or matches.
- Schedule defaults to the current season; archives cover 2023–2026. Each fixture has a shareable center, for example `/schedule?season=2026&match=2026-08-09`. No additional Squarespace pages are needed for individual matches.
- Roster defaults to the current season; archives cover 2022–2026, with search and position filters where published.
- Only published data is included. Missing reports, events or photos show an unavailable notice.
- Previews: `preview-schedule.html`, `preview-roster.html`, `preview-footer.html`.
- Install the schedule and roster blocks at `/schedule` and `/roster`, in full-width sections with zero section padding. Keep the existing global header loader. Install the footer block in the global footer, not on individual pages.

## Updating
Change the file in this repo and commit. Pages pick it up within about 2 minutes
(GitHub Pages can occasionally take up to 10).

## Contact page

Place `<div data-su="contact"></div>` in a full-width Code Block, then place a native Squarespace Form Block below it (in the same section or the next section). Keep the existing header loader. `contact.js` finds the first following form within the page and applies scoped styles without moving/recreating it, intercepting submissions, or changing its settings. Supports forms rendered after the page loads. Footer forms and newsletters are excluded. Keep the Form Block full width in the editor; remove old contact headings if replacing the current page.

## Changelog
- v12: contact page with automatic styling of the following native Squarespace form.
- v11: reusable sponsor/footer block, schedule and roster season archives, searchable player cards, and individual match centers with published recaps, scoring timelines and galleries.
- v10, home: combined promo/news section, bottom-up interest photo gradient, unlabeled results strip, losing-side dimming including shootout winners, and clickable duplicate ticker cards.
- v9, home: swipeable auto-resuming all-season results strip (matches.json), edge fades, hover-independent hero, staggered season tile videos alternating website-2026.mp4 and hh.mov, removed champions banner, light promo band, official YouTube thumbnail and larger sponsor logos.
- v8, home: straight section edges, taller home/away ticker at a slower pace, dark hero scores, centered crests and match metadata, muted square result badges, Arboria news titles, and 2026 photos.
- v7, home: soft section fades and red glows, neutral scores with vertical dividers, compact full-width mobile match widget, refreshed photos, player interest CTA, clear Button 20 variants, and editorial news cards.
- v6, home: restored original content in full-width section bands, consistent card corners, Alverata Black headings, and Button 20 styling in club red.
- v5, home: editorial season feature, compact season numbers, expandable standings/results, lead-story news layout, and community/volunteer/store sections. Hero, ticker, and lower sections retained.
- v2: moved to GitHub Pages hosting (site.css + spindles.js + pages/home.html).
- v1.1, home: club fonts (Alverata headings, Arboria body).
- v1, home: refreshed homepage.
