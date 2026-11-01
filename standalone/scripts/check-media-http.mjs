import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const base = process.argv[2] || 'http://127.0.0.1:3000';
if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('Media checks are local only');
const images = JSON.parse(readFileSync('../migration/inventory/asset-mirror.json'));
const videos = JSON.parse(readFileSync('../migration/inventory/video-mirror.json'));
const assets = [...images.images.filter(p => !p.draftOnly), ...videos.assets];
const failures = [];
for (let i = 0; i < assets.length; i += 8) {
  await Promise.all(assets.slice(i, i + 8).map(async asset => {
    const response = await fetch(base + asset.localUrl, { method: 'HEAD' });
    if (response.status !== 200 || Number(response.headers.get('content-length')) !== asset.bytes) failures.push({url:asset.localUrl,status:response.status,length:response.headers.get('content-length'),expected:asset.bytes});
  }));
}
if (failures.length) {
  writeFileSync('../migration/source/media-http-failures.json', JSON.stringify(failures, null, 2));
  throw new Error(failures.length + ' media URLs failed; first: ' + JSON.stringify(failures[0]));
}
const video = videos.assets.find(e => e.bytes > 1000000);
const range = await fetch(base + video.localUrl, { headers: { Range: 'bytes=0-15' } });
assert.equal(range.status, 206);
assert.equal((await range.arrayBuffer()).byteLength, 16);
for (const route of ['/news/8-9-2026-match', '/news', '/', '/about', '/history']) {
  const html = await (await fetch(base + route)).text();
  assert.ok(!/<(?:img|video|source)[^>]+(?:src|poster)="https?:\/\/(?:images\.squarespace-cdn|video\.squarespace-cdn|static1\.squarespace)/.test(html), route);
  const renderedImages = [...html.matchAll(/<(?:img|video|source)\b[^>]*(?:src|poster)="(\/media\/[^"<>]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
  for (const url of new Set(renderedImages)) {
    const response = await fetch(base + url, { method: 'HEAD' });
    assert.equal(response.status, 200, route + ' rendered ' + url);
  }
}
console.log('Verified ' + assets.length + ' local media URLs, byte-range video delivery and same-origin article/page images.');
