# Standalone migration preview

Work only on `migration/vercel-standalone` in `jarrfran/spindles-united`.
This app is preparation, not a production replacement yet. No deployment was created.
The repository's original Squarespace/GitHub Pages assets remain unchanged.

## Run locally

Use Node 22 or newer and the pinned pnpm version:

```sh
cd standalone
pnpm install --frozen-lockfile
pnpm dev
```

`predev` and `prebuild` generate local assets from the existing repository templates
and imported news. Run `pnpm prepare-assets` before running tests independently.
Generated files, dependencies, local environment files and raw XML are ignored.

```sh
pnpm prepare-assets
pnpm test
pnpm build
pnpm start
# In another terminal, from standalone/:
node scripts/check-http.mjs
```

From the repository root, importer checks use:

```sh
python3 -m unittest discover -s tests -p 'test_squarespace_import.py'
node --test tests/*.test.cjs
```

## Content and editing

`../content/news/*.json` is the editable article source. Each record retains the
original title, URL, author, categories, publication instant and raw source body,
plus sanitized editorial HTML and captured SEO/social metadata. Preserve `path`,
`slug` and `publishedAt` when editing existing stories. `bodyHtml` is rendered;
`source.bodyHtml` is the historical backup. New article bodies must use the same
safe editorial HTML conventions as the importer.

`status: "draft"` records are excluded before generating the deployment bundle.
Draft URLs, JSON endpoints, RSS, sitemap and the news index cannot publish them.
The one imported draft remains in the repository for editorial review.

Existing articles render as HTML on the server and work without client JavaScript.
News search/category/year filters enhance the server-rendered index. Dates display
in America/New_York, preserving the original publication instants (including feed
milliseconds). Known opaque slugs remain exactly as exported.

## Reproduce the import

Place the original XML in ignored `../migration/source/` and run from the root:

```sh
python3 scripts/import-squarespace.py migration/source/Squarespace-Wordpress-Export-11-01-2026.xml
```

The import reads the checked-in saved feed for timestamp precision/featured images
and `migration/inventory/live-news-metadata.json` for audited page titles, canonical
links and social metadata. It performs no network requests. It fails on duplicate
or unexpected news paths, DTD/entity declarations, or removal of existing article
records. It deliberately rewrites generated article files, so commit editorial
changes before re-importing and review the diff.

`python3 scripts/audit-news-metadata.py` explicitly refreshes the read-only public
head audit. Do not refresh it after cutover if historical Squarespace values are
still needed. The original XML checksum and body checksums are in the inventory.

## Compatibility

- Every original published `/news/<slug>` is served directly, without a redirect.
- `/news/category/Match+Recaps`, `/news/category/Stories` and `/news/category/News`
  retain category links; encoded spaces are also supported.
- `/news?format=json` and `/news/<slug>?format=json` are local compatibility feeds
  for the existing homepage, schedule, sidebar and footer widgets.
- `/news?format=rss` and `/news/rss.xml` serve the same local RSS feed.
- `?category=...&season=...` initializes the news filters.
- Existing schedule query strings/fragments and player-profile query strings pass
  through to the unchanged legacy modules. Live Google Sheets and JSON fallbacks
  remain in those modules. Their full data refresh/interaction parity still needs QA.
- The Squarespace blog decorator is omitted only from the generated preview loader;
  shared production files are unchanged. Original page templates and assets are
  copied into ignored `public/legacy/` for same-origin serving.

## Vercel preparation

Use a separate preview project and this branch only. Set Root Directory to
`standalone`, enable including source files outside that root (the build reuses
repository templates/content), select Next.js, Node 22+, and use the pinned pnpm
lockfile. Do not attach the production domains or set this branch as a production
branch. No `.vercel` project link, credentials, environment secrets or DNS changes
are included.

`vercel.json` sets `git.deploymentEnabled` to `false` to prevent automatic builds
while this branch is under preparation. A future preview can be deployed manually
without changing the live site's domain. Do not enable automatic deployments or
production indexing until the release gate is satisfied. Indexing is disabled by
default through HTML metadata, `X-Robots-Tag` and robots.txt. Vercel Preview builds
remain noindex even if `SITE_INDEXABLE=true`; that flag is intended only for an
approved production cutover.

The [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration)
documents automatic-deployment controls. The app follows the bundled Next.js 16.4.3
documentation for async route parameters and metadata.

## Remaining launch gates

See `../migration/NEWS-MIGRATION.md` and `../MIGRATION-VERCEL.md`.
Images still load from Squarespace CDNs. Contact forms still direct inquiries to
the live site. Several exported legacy pages have no standalone route yet.
Do not cancel Squarespace hosting on the basis of this preview.
