import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { feedItem } from '../lib/feed.mjs';
import { rewriteMedia } from '../lib/media.mjs';
import { rewriteEditorialLinks } from '../lib/links.mjs';
import { restoreMedia } from './restore-media.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const target = path.join(root, 'standalone/public/legacy');
await restoreMedia();
const mirror = JSON.parse(await readFile(path.join(root, 'migration/inventory/asset-mirror.json'), 'utf8'));
for (const asset of mirror.images.filter(p => !p.draftOnly)) {
  if (asset.status !== 'copied') throw new Error('Image backup incomplete: ' + asset.sourceUrl);
  const data = await readFile(path.join(root, 'standalone/public', decodeURIComponent(asset.localUrl)));
  if (createHash('sha256').update(data).digest('hex') !== asset.sha256) throw new Error('Image checksum mismatch: ' + asset.localUrl);
}
const videoMirror = JSON.parse(await readFile(path.join(root, 'migration/inventory/video-mirror.json'), 'utf8'));
for (const asset of videoMirror.assets) {
  const data = await readFile(path.join(root, 'standalone/public', decodeURIComponent(asset.localUrl)));
  if (createHash('sha256').update(data).digest('hex') !== asset.sha256) throw new Error('Video checksum mismatch: ' + asset.localUrl);
}
await mkdir(target, { recursive: true });
for (const file of await readdir(root)) {
  if (/\.(?:css|js)$/.test(file) || file === 'matches.json') {
    const content = await readFile(path.join(root, file), 'utf8');
    await writeFile(path.join(target, file), rewriteMedia(content));
  }
}
for (const dir of ['pages', 'data', 'assets']) {
  await cp(path.join(root, dir), path.join(target, dir), { recursive: true });
}
for (const dir of ['pages', 'data']) {
  for (const file of await readdir(path.join(target, dir))) {
    const filename = path.join(target, dir, file);
    await writeFile(filename, rewriteMedia(await readFile(filename, 'utf8')));
  }
}
// The native standalone templates own news presentation; never mount the Squarespace decorator.
const loader = path.join(target, 'spindles.js');
let source = await readFile(loader, 'utf8');
const blogLine = /  var blogScript=.*?document\.head\.appendChild\(blogScript\);\n/;
if (!blogLine.test(source)) throw new Error('Legacy loader changed; review blog adapter');
source = source.replace(blogLine, '  /* News is server-rendered by the standalone application. */\n');
await writeFile(loader, source);
// Keep original shared assets untouched; only this build's generated feed changes.
const newsDir = path.join(root, 'content/news');
const posts = await Promise.all((await readdir(newsDir)).filter(f => f.endsWith('.json')).map(async f => JSON.parse(await readFile(path.join(newsDir, f), 'utf8'))));
const published = posts.filter(p => p.status === 'publish').sort((a, b) => b.publishOn - a.publishOn)
  .map(p => rewriteMedia({ ...p, bodyHtml: rewriteEditorialLinks(p.bodyHtml) }));
await writeFile(path.join(target, 'data/news-archive.json'), JSON.stringify(published.map(feedItem)));
const generated = path.join(root, 'standalone/generated');
await mkdir(generated, { recursive: true });
// Drafts and original source bodies never enter the deployment bundle.
await writeFile(path.join(generated, 'posts.json'), JSON.stringify(published.map(({ source, ...p }) => ({ ...p, source: { savedFeed: { id: source.savedFeed?.id } } }))));
const pageDir = path.join(root, 'content/pages');
const editorialPages = await Promise.all((await readdir(pageDir)).filter(f => f.endsWith('.json')).map(async f => JSON.parse(await readFile(path.join(pageDir, f), 'utf8'))));
await writeFile(path.join(generated, 'pages.json'), JSON.stringify(rewriteMedia(editorialPages)));
await writeFile(path.join(generated, 'legacy.json'), JSON.stringify(rewriteMedia({
  footer: await readFile(path.join(root, 'pages/footer.html'), 'utf8'),
  club: JSON.parse(await readFile(path.join(root, 'data/club.json'), 'utf8')),
  pages: Object.fromEntries(await Promise.all(['home', 'about', 'history', 'schedule', 'roster', 'stats', 'sponsors', 'store', 'contact'].map(async page => [page, await readFile(path.join(root, 'pages', page + '.html'), 'utf8')]))),
})));
console.log('Prepared local legacy assets and news fallback; no live files changed.');
