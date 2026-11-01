# News migration inventory — November 1, 2026

Scope: `jarrfran/spindles-united`, `migration/vercel-standalone` only.
No changes to Squarespace, DNS, main, GitHub Pages production assets or UPL Sideline.

## Imported archive

| Item | Count |
| --- | ---: |
| Published articles | 76 |
| Draft articles, kept unpublished | 1 |
| Exported pages | 35 |
| Exported attachment records | 76 |
| Distinct featured/body image URL references, including draft | 402 |
| Published article URLs matched against saved archive | 76 / 76 |
| Live article head audits with HTTP 200 | 76 / 76 |
| Canonical discrepancies | 0 |
| Missing published bodies or featured images | 0 |

Published archive: 2022 (3), 2023 (19), 2024 (22), 2025 (18), 2026 (14).
Categories: 50 Match Recaps, 27 Stories and 4 News memberships; some stories have
multiple categories. No tags are exported. All exported authors resolve to
Jarron Frangie through the WXR author table; private author emails are not used
in public metadata.

The unpublished draft is `/news/from-02-to-champs-spindles-upl-inaugural-season-recap`.
Its body is retained in repository content but excluded from deployment data.

## Preservation and evidence

- `inventory/news.csv`: spreadsheet-friendly route, title, date, author, category,
  canonical, hero, media counts and body checksums for every article, including draft.
- `inventory/news.json`: the same structured article inventory.
- `inventory/pages.json`: all 35 exported pages and their preparation status.
- `inventory/attachments.json`: original attachment IDs/URLs and HTTPS equivalents.
- `inventory/media.json`: article image references and affected article paths;
  download status is explicitly `not mirrored`.
- `inventory/live-news-metadata.json`: read-only audit of all 76 live article heads,
  including resolved URLs, original page titles, canonical and OG/Twitter values.
- `inventory/report.json`: source SHA-256, counts, URL reconciliation and anomalies.
- `../content/news/*.json`: raw original HTML plus sanitized renderable HTML,
  original date strings, exact saved timestamps, author display name, categories,
  excerpts, comments setting, attachment mapping, SEO and source metadata.

The `/mnt/data/...` path in the prior chat was not mounted on this desktop. The
attachment returned by that chat's attachment inventory was copied into ignored
`migration/source/Squarespace-Wordpress-Export-11-01-2026.xml` and parsed directly.
SHA-256: `9429a69b297c68abae82a9ac30b4dee89d1f2db5ddee2d3939b236972b51476d`.
The raw XML contains private author contact data and page/form markup; it is kept
locally, outside the served app and Git commits.

## Dates and metadata

WXR `pubDate`, `post_date` and `post_date_gmt` are retained as supplied. Saved feed
timestamps agree to within one second; the only differences are feed milliseconds.
No publication date is reset to the migration date. America/New_York display avoids
shifting evening match recaps to the following UTC calendar day.

Only one WXR excerpt is populated. The public head audit found one nonempty SEO
description and 76 OG descriptions. Effective descriptions use the original SEO
description when present, otherwise the original social description. Page titles,
canonical links, OG/Twitter titles/descriptions/card types are retained. HTTP
Squarespace social image references are upgraded to HTTPS while originals remain
in the source audit. No modification dates are invented. Published timestamps
also populate NewsArticle structured data, OG metadata and RSS.

HTML keeps original prose, links, headings, emphasis, authored line breaks,
underlines, images, galleries and eight supported video iframe references. The
rendering copy removes scripts, forms, event attributes, arbitrary styles and
unsafe URL protocols. Raw source HTML remains available for comparison.

## Prepared application

`../standalone/` contains Next.js pages, local news JSON/RSS endpoints, sitemap,
preview noindex controls, responsive navigation and reused club page templates.
Every published news URL has its original path; no news redirects are needed.
Core pages are wrapped using existing templates, with existing Google Sheet data
integrations and saved fallbacks. Contact is an explicit temporary preview notice
linking to the current live contact page; it does not pretend to submit messages.

## Remaining before cutover

1. Mirror and verify article, social, club and gallery assets away from Squarespace.
   Attachment records are references, not binary backups. The 402 article URLs
   include variants/aliases; social images add other CDN URL forms. Videos, crest,
   sponsor art and fonts also require a complete dependency audit.
2. Finish reviewing all 35 exported pages. `/inside-spindles`, older season/team
   routes, youth/community/event pages and privacy require content/route decisions.
   They are inventoried, not silently redirected to unrelated content. This preview
   will return 404 for unimplemented routes, including some links inside articles.
3. Match the current header/navigation, fonts, article match widgets, player links,
   standings/recent-results sidebars and all desktop/mobile interactions. The new
   header is a functional starting point; visual parity is not signed off.
4. Replace and test contact, sponsor, recruitment and newsletter submissions with
   verified recipients/provider configuration. No subscriber data is imported yet.
5. Create a separate Vercel preview project and verify its deployment, assets,
   performance, accessibility, query links, store checkout and data refresh/fallback.
6. Obtain explicit cutover approval before main merge, production domains, indexing,
   DNS changes or cancellation of Squarespace hosting.

The original dirty checkout on main was left unchanged; migration uses a separate
clone. Automatic Vercel deployment is disabled. No Vercel deployment exists for
this work yet.

## Verification completed

- Next.js production build passed, including all 76 published article pages.
- HTTP checks passed for all 76 original article URLs and JSON detail feeds,
  original SEO titles/descriptions/canonical links/dates, category paths, RSS
  (including `?format=rss`), sitemap, core routes and preview noindex headers.
- The draft and unknown article URLs returned 404; draft content was absent from
  deployment data, RSS and sitemap.
- Four content/metadata tests, three importer HTML tests and nine existing
  repository tests passed. A repeated import produced byte-identical content and
  inventories. All 77 raw article bodies, titles, paths and statuses were compared
  directly with the XML and matched exactly.
- The mobile-width news index and article layout were inspected, and typing a
  championship-title search reduced the index to one story. Desktop screenshot
  inspection was limited by the preview browser; full visual parity remains open.
  The final category fix was verified through the production HTTP checks.

All verification ran locally; Vercel deployment and production service delivery
have not been tested.
