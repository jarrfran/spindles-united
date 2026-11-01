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
  401 URL references are copied publicly and one draft-only reference is backed
  up privately. Original references are retained alongside local paths/checksums.
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
integrations and saved fallbacks. Contact now has one standalone form for every inquiry. It preserves the contact
page’s name, email, phone, multiple reasons, message and optional player details.
Delivery stays disabled until the provider is configured and tested.

## Remaining before cutover

1. Media copying and verification are complete for the current inventory (see
   below). Alverata and Arboria now load through the user-supplied Adobe Fonts
   project, independently of Squarespace. Audit any newly added content before
   cutover for additional media references, and finish visual parity review.
2. All 35 exported page routes are implemented or explicitly redirected (see
   `inventory/page-routes.json`). Review the ten editorial pages visually. The
   privacy page contains no policy text in the source and needs owner-supplied
   content before launch. Three historical links already return 404 on the
   live site; see `inventory/additional-link-audit.json` for review.
3. Match the current header/navigation, fonts, article match widgets, player links,
   standings/recent-results sidebars and all desktop/mobile interactions. The new
   header is a functional starting point; visual parity is not signed off.
4. Connect and test the single contact form, delivered to
   `jarron@spindlesunited.com`, with replies addressed to the sender. Jordan is
   optional and has not been added. Separate sponsor/player/volunteer forms and
   newsletter subscriptions are excluded by the owner’s instruction. See
   `CONTACT-SETUP.md` for provider configuration and delivery acceptance checks.
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

## Media implementation completed

- Inventoried and verified 734 image URL assets across articles, current templates,
  dynamic player/crest/season data and older exported pages. Of these, 733 are
  public and one draft-only image stays in ignored private backup storage.
- Copied both Squarespace-hosted background videos, retaining 360p and full-HD
  options, audio and original standard HLS encryption. All 16 video dependency
  files are local; no expiring signed URLs remain in the playlists.
- Added a deterministic repository media bundle: 749 public files, 258,141,516
  unpacked bytes, packaged into 41 archive parts totaling 252,823,001 bytes.
  This baseline is restored offline during the build; no Squarespace request is
  needed to build or serve these assets. New uploads can be added separately.
- Only standalone generated output rewrites image/video URLs. Original article
  bodies, source metadata and shared production templates/modules remain unchanged.
- Downloaded image variants request `1500w`; the CDN retains native dimensions for
  some images. These are web-serving copies, not a full-resolution originals claim.
- Evidence: `inventory/asset-mirror.json`, `video-mirror.json`, `media-bundle.json`
  and `external-dependencies.json`. All image rasters decoded successfully and all
  media files passed SHA-256 checks. A clean-directory offline restoration passed.
- All 749 local media URLs returned the expected byte lengths; video byte ranges
  worked. Both local HLS streams exposed their AAC audio and H.264 video tracks
  at 360p and 1080p, and a one-second 1080p video/audio sample decoded successfully
  from each. Original video durations were approximately 58.79 and 34.10 seconds.
- The final production build, all 76 original article URLs, draft exclusions,
  metadata/feeds, ten standalone tests, three importer tests and nine existing
  repository tests passed after the media changes.

Visual parity, privacy content, contact delivery and Vercel deployment remain launch gates.

## Adobe Fonts connected

The user supplied `https://use.typekit.net/fpo1yqb.css`. The root layout includes
that Adobe stylesheet directly. Its response contains Alverata and Arboria at
400 and 700 in normal and italic styles. Large headings use Alverata 700; all
other typography uses Arboria. The supplied project also defines optional
Alverata Informal/Irregular variants, which this site does not select. The font
files remain hosted by Adobe, and no Squarespace font script is required.
The production build passed. Browser verification confirmed the Adobe stylesheet
was present, font loading completed, Alverata 700 and Arboria 400/700 were ready,
and the computed heading/body/navigation families matched their assigned roles.

## Page routes and single contact form prepared

- All 35 exported page URLs are accounted for: nine core routes, ten editorial
  pages and sixteen redirects. Four additional aliases make 39 tested routes.
- Old schedules/rosters redirect to the corresponding season query. Club/history
  aliases resolve to their equivalent core pages. `/2026-player-interest` leads
  to `/contact?reason=player`; `/2026-sponsors` leads to the current sponsors page.
- Earlier sponsor, showcase, youth and community pages retain their original
  URLs and exported editorial content. Historical pages display an archive notice.
  Native forms, exported scripts and payment forms are omitted. Original source
  body checksums and partner links remain available for comparison.
- The historical waiver PDF is copied at its original `/s/` path and checksum
  verified. Two opaque article links on the old sponsors page and a missing 2024 event
  landing page return 404 on the live source. These are recorded in the internal
  link audit; no replacement landing-page content is invented. The old white-kit
  post path redirects to the matching imported story, and a former winter signup
  path leads to the unified contact form. One malformed Bear Digital link is
  corrected only in generated output.
- `/privacy-policy` has no exported policy text. It currently shows a privacy
  contact, remains noindex and is omitted from the sitemap. This is a launch gate.
- Only `/contact` contains a form. Reason shortcuts preselect player, sponsor or
  volunteer without creating separate forms. The exported mailing-list option
  is deliberately excluded; no newsletter subscription is submitted.
- Formspree native POST delivery is prepared behind explicit configuration.
  No delivery account was created, no inquiry was sent, and end-to-end inbox/reply
  testing remains pending. The disabled preview offers a direct email fallback.
- Production build, thirteen standalone tests, six Python importer tests and nine
  existing repository tests passed. Local HTTP checks passed for all 39 page
  routes and the existing 76 article URLs, metadata, feeds and draft exclusions.
  Browser QA confirmed one form, correct query/card selections, disabled delivery,
  brand font roles and no horizontal overflow at 319px or 1280px width.
