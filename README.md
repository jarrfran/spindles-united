# Spindles United FC: hosted site code

The site's code lives here and is served by GitHub Pages at
`https://jarrfran.github.io/spindles-united/`. Squarespace loads it, so code changes
are made here and never pasted into Squarespace again.

## Files
| File | What it is |
|---|---|
| `site.css` | All styles: brand tokens (Alverata headings, Arboria body) and every page’s layout |
| `spindles.js` | Loader: fills each `<div data-su="…">` with its page and runs page behavior |
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
| Schedule | `<div data-su="schedule"></div>` | not built |
| Roster | `<div data-su="roster"></div>` | not built |
| Sponsors | `<div data-su="sponsors"></div>` | not built |
| Stats | `<div data-su="stats"></div>` | not built |
| Inside Spindles | `<div data-su="inside-spindles"></div>` | not built |
| Seasons | `<div data-su="seasons"></div>` | not built |
| Volunteer | `<div data-su="volunteer"></div>` | not built |
| Contact | `<div data-su="contact"></div>` | not built |

Header, footer, cart, forms and the News blog stay native Squarespace.

## Updating
Change the file in this repo and commit. Pages pick it up within about 2 minutes
(GitHub Pages can occasionally take up to 10).

## Changelog
- v5, home: editorial season feature, compact season numbers, expandable standings/results, lead-story news layout, and community/volunteer/store sections. Hero, ticker, and lower sections retained.
- v2: moved to GitHub Pages hosting (site.css + spindles.js + pages/home.html).
- v1.1, home: club fonts (Alverata headings, Arboria body).
- v1, home: refreshed homepage.
