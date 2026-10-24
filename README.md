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

- `club-pages.js` renders expandable schedule archives, two-sided match-event timelines, roster archives and search.
- `data/club.json` holds the current season (`currentSeason`, currently 2026), published fixture results, reports, photos, scoring events and roster entries. Update this file when adding seasons or matches.
- Schedule defaults to the current season; archives cover 2023–2026. Each fixture expands in place on the schedule, for example `/schedule?season=2026#match-2026-08-09`. Old `?match=` links open the matching accordion; there are no individual match views. The initial card includes the weekday, kickoff and venue. Expanded content contains events, recap/stream links where available, and a photo gallery.
- Roster defaults to the current season; archives cover 2022–2026, with search and position filters where published.
- Only published data is included. Missing reports, events or photos show an unavailable notice.
- Previews: `preview-schedule.html`, `preview-roster.html`, `preview-footer.html`.
- Install the schedule and roster blocks at `/schedule` and `/roster`, in full-width sections with zero section padding. Keep the existing global header loader. Install the footer block in the global footer, not on individual pages.

## Match-event data

The schedule reads the public [club archive spreadsheet](https://docs.google.com/spreadsheets/d/1DAeHMhkPNmIEMFssGc29kkfBgPj4POKOChNVtUO-tJg/edit) through `sheet-archive.js` when opened and checks every five minutes while visible. It reads **Match Log**, **Goal & Assist Log**, and **Discipline Log**, with headers on row 4. Add rows below the headers; keep the tab and header names intact. No website code changes are needed for new fixtures, scores, goals, assists or cards. The home results carousel also reads the live archive on load.

Match events join on season, date and opponent. Keep the same opponent spelling across the three logs. Missing minutes remain unknown (—), and forfeit wins have no invented scorers. The sheet supplies Spindles events for every season. The supplied 2026 league PDF supplies opponent goals and cards; those remain a saved source because the spreadsheet only tracks Spindles players. Neither freeform Notes columns nor referee/submission contact details are published.

Existing kickoff times, venues, recaps, streams and galleries remain attached to their fixtures. Optional columns on Match Log named `Kickoff`, `Venue`, `Recap URL`, `Stream URL`, `Pens For`, and `Pens Against` override those saved values when populated. New fixtures without those details say that the time/venue is unrecorded. Current season follows the latest season in Match Log. The 2025 June 10 no-contest stays visible as an archive fixture but is excluded from recorded match totals.

`data/club.json` is a checked fallback snapshot, used if Google is unavailable. A last successful response also remains available for the current visit. Live reads use Google's public Visualization endpoint, so the sheet must remain publicly readable. Roster data is independent of the match logs and remains in `data/club.json`.

## Updating
Change the file in this repo and commit. Pages pick it up within about 2 minutes
(GitHub Pages can occasionally take up to 10).

## Contact page

Place `<div data-su="contact"></div>` in a full-width Code Block, then place a native Squarespace Form Block below it (in the same section or the next section). Keep the existing header loader. `contact.js` finds the first following form within the page and applies scoped styles without moving/recreating it, intercepting submissions, or changing its settings. Supports forms rendered after the page loads. Footer forms and newsletters are excluded. Keep the Form Block full width in the editor; remove old contact headings if replacing the current page.

## Header button

The existing global loader now applies header CTA styles through `site.css` on every page. No extra snippet is needed. The standalone `header-button.css` remains available, but its separate link is redundant when the global loader is installed. The button URL and label stay in Squarespace settings.

## Color direction

Use white and neutral grays for contrast surfaces, borders, muted text, score boxes and shadows. Do not introduce cream, beige, brown, taupe or gold UI tones. Preserve the club red gradient, semantic result colors and football yellow/red card indicators.

## Changelog
- v21: connected schedule and home results to the live club spreadsheet; reconciled 64 recorded matches, 129 goals and 70 cards, added the 2022 archive, assists and older discipline, and retained opponent report events plus an offline fallback.
- v20: replaced individual match views with schedule accordions, added weekdays/venues and two-sided 2026 league-report event timelines, kept older archives to Spindles scorers, repaired old concatenated goal lists and replaced thin action arrows with filled chevrons and square plus/minus controls.
- v19: replaced warm cream/beige/brown UI surfaces, text, borders, shadows and translucent overlays with neutral grays and white across all pages.
- v16: increased mobile homepage hero height by 96px and added an optional shared header-button stylesheet.
- v14: removed the contact intro/direct-contact row; placed the form left and video right, retaining the landscape mobile video.
- v13: contact reason cards scroll to and select the matching native form choice; tall video playlist beside the form, landscape on mobile; larger labels and options.
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
