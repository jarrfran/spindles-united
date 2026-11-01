# Standalone Vercel migration — working plan

Status: preparation only. Do not change production DNS, Squarespace settings, or main branch until approved.

## Source of truth
- Existing repository: jarrfran/spindles-united (not jarrfran/sideline).
- Current public site: https://www.spindlesunited.com/
- Squarespace origin: https://eagle-sailfish-9jt7.squarespace.com/
- Existing site components: site.css, spindles.js, pages/*.html, club-pages.js, record-book.js, sheet-archive.js, data/*.json.
- Existing GitHub Pages loader is injected into Squarespace; preserve its rendering and data behavior while migrating.
- Current fonts: Alverata headings and Arboria body (verify licensing and available web assets).
- External store: spindlesunited.store, do not migrate or alter.
- Public Google Sheet match/archive feeds must continue to work, including fallback JSON.

## Migration strategy
1. Capture complete route/SEO/media inventory and screenshots (desktop/mobile) of current site. Export Squarespace blog posts and assets, and preserve canonical URL slugs.
2. Add a Next.js App Router application in an isolated directory or migration branch; initially wrap/reuse existing HTML/CSS/JS as needed to maintain parity, then refactor into reusable components.
3. Implement shared header/nav/footer, accessible responsive menu, and retain red/neutral branding.
4. Recreate news listing and /news/[slug] pages with article frontmatter (title, date, author, categories, description, hero, OG image, canonical), sitemap.xml, robots.txt, RSS if appropriate, and 301 redirects only where unavoidable.
5. Migrate only the unified contact-page form. Prepare Formspree delivery to jarron@spindlesunited.com with sender Reply-To, spam protection and provider validation review. Enable only after inbox/reply testing. Jordan remains optional.
6. Exclude old separate sponsor/player/volunteer forms and newsletter subscription flows, following the owner’s consolidation instruction.
7. Test match schedules, stats, roster profiles, deep links, Google Sheets refresh/fallback, and all image dependencies.
8. Deploy to a Vercel preview domain, run functional/visual/SEO checks, then obtain approval before domain DNS cutover.
9. Keep domain registration with Squarespace. Confirm email DNS (MX, SPF, DKIM, DMARC) is preserved. Cancel Squarespace website hosting only after successful cutover and content backups.

## Known audit inventory (non-exhaustive)
- /home/ or homepage, /schedule, /roster, /stats, /inside-spindles, /2026-sponsors, /2026-player-interest, /news/[slug], /privacy.
- Homepage includes championship hero, match recap/news sections, sponsor area, newsletter and contact sections.
- Existing README explicitly notes Squarespace-native header, cart, forms and blog.
- Existing README notes contact.js only styles a native Squarespace form; it is not a submission backend.
- Existing README notes Google Sheets public Visualization endpoint for match and stats data.

## Release gate
- No main-branch merge or DNS edits before route parity, visual QA, form delivery tests, article content verification, SEO redirects and user approval.
- Hosting plan: verify Vercel plan eligibility; Hobby is not for commercial use.
- Domain and email renewal remain separate costs.

## November 1 implementation update

- Imported the supplied WXR XML: 76 published articles, one unpublished draft,
  35 pages and 76 attachment records. All published news URLs match the existing
  saved feed; all 76 live article heads were audited read-only for SEO metadata.
- Added `content/news/` with raw source backups, sanitized HTML, original URLs,
  publication timestamps, author/category data, image references and SEO/social
  metadata. The raw XML stays in ignored local storage.
- Added `standalone/`, a separate Next.js application with server-rendered news,
  categories, local JSON/RSS feeds, sitemap, responsive navigation, preview noindex
  controls and wrappers for existing page templates. Shared production files are
  unchanged. Automatic Vercel deployments are disabled; no preview is deployed.
- Detailed findings and remaining launch gates: [news migration](migration/NEWS-MIGRATION.md).
  Local build, content workflow and Vercel preparation: [standalone README](standalone/README.md).

## Next implementation tasks
- Image/video copying is complete for the current inventory: 734 image assets
  (one draft-only copy kept private), both background video streams, offline media
  restoration and same-origin delivery. See `migration/NEWS-MIGRATION.md` for
  checksums, scope, validation and the full-resolution-originals limitation.
- Alverata and Arboria are connected through the user-supplied Adobe Fonts web
  project (`fpo1yqb`). All 35 exported page routes are prepared; finish visual parity review.
- Connect the prepared unified contact form to Formspree and verify inbox delivery
  and direct email replies. Only jarron@spindlesunited.com is the confirmed recipient;
  Jordan remains optional. See `migration/CONTACT-SETUP.md`.
- Supply/review privacy content (the original page is blank), and review three
  already-broken historical links recorded in the additional-link audit.
- Create and validate a separate Vercel preview without production domains.
- Complete the release gate above before any live cutover.
