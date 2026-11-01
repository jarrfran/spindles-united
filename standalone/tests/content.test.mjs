import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { getPublishedPosts, getPost, metadataFor, articleSchema, dateLabel, jsonLd } from '../lib/content.mjs';
import { feedItem } from '../lib/feed.mjs';
const files = readdirSync('../content/news').filter(f => f.endsWith('.json'));
const original = files.map(f => JSON.parse(readFileSync('../content/news/' + f)));
const saved = JSON.parse(readFileSync('../data/news-archive.json'));
const posts = getPublishedPosts();
test('every saved published URL survives; original body hashes match', () => {
  assert.equal(original.length, 77);
  assert.equal(posts.length, 76);
  assert.deepEqual(posts.map(p => p.path).sort(), saved.map(p => p.fullUrl).sort());
  assert.equal(new Set(posts.map(p => p.path)).size, 76);
  for (const p of original) assert.equal(createHash('sha256').update(p.source.bodyHtml).digest('hex'), p.source.bodySha256);
});
test('draft content is absent from deployment, lookup and feed', () => {
  const draft = original.find(p => p.status === 'draft');
  assert.ok(draft);
  assert.equal(getPost(draft.slug), undefined);
  assert.ok(!JSON.stringify(posts).includes(draft.slug));
  assert.ok(!JSON.stringify(posts.map(feedItem)).includes(draft.title));
});
test('publication timestamps and metadata retain source values', () => {
  for (const p of posts) {
    const source = original.find(o => o.path === p.path);
    const old = saved.find(o => o.fullUrl === p.path);
    assert.equal(p.publishOn, old.publishOn);
    assert.equal(p.title, source.title);
    assert.equal(p.author, 'Jarron Frangie');
    assert.deepEqual(p.categories, source.categories);
    assert.equal(metadataFor(p).alternates.canonical, source.source.liveMetadata.canonical);
    assert.equal(metadataFor(p).title.absolute, source.source.liveMetadata.title);
    assert.equal(metadataFor(p).openGraph.description, source.source.liveMetadata.meta['og:description']);
    assert.equal(metadataFor(p).twitter.card, source.source.liveMetadata.meta['twitter:card']);
    assert.equal(articleSchema(p).datePublished, p.publishedAt);
    assert.ok(!('dateModified' in articleSchema(p)));
  }
  assert.equal(dateLabel(posts[0].publishedAt), 'August 9, 2026');
});
test('public bodies contain no executable export markup or insecure assets', () => {
  for (const p of posts) {
    assert.ok(!/<script|\son\w+=|(?:src|href)="javascript:/i.test(p.bodyHtml), p.path);
    assert.ok(!/src="http:\/\/(?:images|static\d*)\.squarespace/.test(p.bodyHtml), p.path);
    assert.ok(!p.source.bodyHtml);
  }
  assert.ok(!jsonLd({ text: '</script><script>alert(1)</script>' }).includes('<'));
});
