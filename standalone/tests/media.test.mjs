import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { rewriteMedia, localMediaUrl } from '../lib/media.mjs';
import { getPublishedPosts, articleSchema, ORIGIN } from '../lib/content.mjs';
const manifest = JSON.parse(readFileSync('../migration/inventory/asset-mirror.json'));
const videos = JSON.parse(readFileSync('../migration/inventory/video-mirror.json'));
const filename = url => 'public' + decodeURIComponent(url.split(/[?#]/)[0]);
const sha = data => createHash('sha256').update(data).digest('hex');
test('every public image and video dependency matches its copied bytes', () => {
  assert.equal(manifest.summary.failed, 0);
  for (const entry of [...manifest.images.filter(e => !e.draftOnly), ...videos.assets]) {
    const data = readFileSync(filename(entry.localUrl));
    assert.equal(data.length, entry.bytes, entry.localUrl);
    assert.equal(sha(data), entry.sha256, entry.localUrl);
  }
});
test('published news uses existing same-origin images and unchanged article URLs', () => {
  for (const p of getPublishedPosts()) {
    for (const url of [p.featuredImage, p.seo.openGraphImage, p.seo.twitterImage, ...p.media.map(m => m.url)]) {
      assert.ok(url.startsWith('/media/'), p.path + ': ' + url);
      assert.ok(existsSync(filename(url)), url);
    }
    assert.ok(!/https?:\/\/(?:images\.squarespace-cdn|static1\.squarespace)/.test(p.bodyHtml));
    assert.equal(p.canonical, ORIGIN + p.path);
    assert.ok(articleSchema(p).image[0].startsWith(ORIGIN + '/media/'));
  }
});
test('HLS playlists only reference existing local dependencies and contain no signed URLs', () => {
  assert.equal(videos.streams.length, 2);
  for (const entry of videos.assets.filter(e => e.sourceUrl.endsWith('.m3u8'))) {
    const content = readFileSync(filename(entry.localUrl), 'utf8');
    assert.ok(content.startsWith('#EXTM3U'));
    assert.ok(!/https?:|Expires=|Signature=/.test(content));
    const refs = content.split('\n').filter(l => l && !l.startsWith('#'))
      .concat([...content.matchAll(/URI="([^"]+)"/g)].map(m => m[1]));
    for (const ref of refs) assert.ok(existsSync(filename(ref)), ref);
  }
});
test('draft-only media is excluded from the served directory', () => {
  const draftOnly = manifest.images.filter(e => e.draftOnly);
  assert.ok(draftOnly.length);
  for (const entry of draftOnly) assert.ok(!existsSync(filename(entry.localUrl)));
});
test('generated legacy modules retain dynamic crest and player image paths locally', () => {
  const media = JSON.parse(readFileSync('public/legacy/data/player-media.json'));
  const base = '/media/squarespace/images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/';
  for (const head of Object.values(media.heads || {})) {
    if (!head.path.startsWith('data:')) assert.ok(existsSync(filename(base + head.path)), head.path);
  }
  for (const file of ['spindles.js', 'record-book.js', 'seasons.js', 'pages/home.html']) {
    const content = readFileSync('public/legacy/' + file, 'utf8');
    assert.ok(!/https?:\/\/(?:images\.squarespace-cdn|video\.squarespace-cdn|static1\.squarespace)/.test(content), file);
  }
});
test('mapping keeps encodings, formats, fragments, embeds and canonical links intact', () => {
  const remote = 'http://images.squarespace-cdn.com/content/v1/site/Primeau%27s+Logo.png?format=300w#photo';
  assert.equal(localMediaUrl(remote), '/media/squarespace/images.squarespace-cdn.com/content/v1/site/Primeau%27s%2BLogo.png?format=300w#photo');
  assert.equal(rewriteMedia(remote), localMediaUrl(remote));
  assert.equal(rewriteMedia({ a: remote, b: ['https://www.spindlesunited.com/news/test'] }).b[0], 'https://www.spindlesunited.com/news/test');
  assert.equal(localMediaUrl('https://www.youtube.com/embed/example'), 'https://www.youtube.com/embed/example');
});
