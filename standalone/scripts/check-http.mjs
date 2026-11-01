import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { getPublishedPosts } from '../lib/content.mjs';
const base = process.argv[2] || 'http://127.0.0.1:3000';
if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('HTTP verification is restricted to the local preview');
const posts = getPublishedPosts();
const esc = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[c]);
async function get(path, status = 200) {
  const response = await fetch(base + path);
  if (response.status !== status) {
    const body = await response.text();
    assert.equal(response.status, status, path + ' ' + (body.match(/<title>[^<]*/)?.[0] || '') + ' ' + (body.match(/<h1>[^<]*/)?.[0] || ''));
  }
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/, path);
  return response;
}
for (let i = 0; i < posts.length; i += 4) {
  await Promise.all(posts.slice(i, i + 4).map(async p => {
    const html = await (await get(p.path)).text();
    assert.ok(html.includes(`<h1>${esc(p.title)}</h1>`), p.path + ' title');
    assert.ok(html.includes(`<title>${esc(p.seo.title)}</title>`), p.path + ' SEO title');
    assert.ok(html.includes(`rel="canonical" href="${p.canonical}"`), p.path + ' canonical');
    assert.ok(html.toLowerCase().includes(`datetime="${p.publishedAt.toLowerCase()}"`), p.path + ' original date');
    assert.ok(html.includes('application/ld+json'), p.path + ' structured data');
    assert.ok(html.includes(esc(p.description)), p.path + ' description');
  }));
}
const feed = await (await get('/news?format=json')).json();
assert.deepEqual(feed.items.map(p => p.fullUrl), posts.map(p => p.path));
for (const p of posts) {
  const detail = await (await get(p.path + '?format=json')).json();
  assert.equal(detail.item.fullUrl, p.path);
}
const draft = readdirSync('../content/news').map(f => JSON.parse(readFileSync('../content/news/' + f))).find(p => p.status === 'draft');
await get(draft.path, 404);
await get(draft.path + '?format=json', 404);
await get('/news/does-not-exist', 404);
const sitemap = await (await get('/sitemap.xml')).text();
const rss = await (await get('/news/rss.xml')).text();
assert.equal(await (await get('/news?format=rss')).text(), rss);
for (const p of posts) {
  assert.ok(sitemap.includes(p.canonical));
  assert.ok(rss.includes(p.canonical));
}
assert.ok(!sitemap.includes(draft.slug));
assert.ok(!rss.includes(draft.slug));
assert.equal((rss.match(/<item>/g) || []).length, 76);
assert.match(await (await get('/robots.txt')).text(), /Disallow: \//);
for (const route of ['/', '/home', '/schedule?season=2025', '/roster?player=dan-crook', '/stats', '/about', '/history', '/sponsors', '/store', '/contact', '/news/category/Match+Recaps', '/news/category/Stories', '/news/category/News', '/news?season=2026&category=Match%20Recaps']) await get(route);
const filtered = await (await get('/news?season=2026&category=Match%20Recaps')).text();
assert.ok(!filtered.includes('<h3>A Year to Remember; The 2023 Recap</h3>'));
console.log('Verified all 76 original article URLs, metadata, JSON feeds, draft 404s, RSS, sitemap, preview noindex and core routes.');
