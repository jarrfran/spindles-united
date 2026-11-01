import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { rewriteMedia } from '../lib/media.mjs';
import { CONTACT_EMAIL, CONTACT_REASONS, contactEndpoint, reasonFromQuery } from '../lib/contact.mjs';
import { rewriteEditorialLinks } from '../lib/links.mjs';
const inventory = JSON.parse(readFileSync('../migration/inventory/pages.json'));
const decisions = JSON.parse(readFileSync('../migration/inventory/page-routes.json'));
const pages = JSON.parse(readFileSync('./generated/pages.json'));
test('every exported page has one explicit route; archives contain no native forms or scripts', () => {
  assert.equal(inventory.length, 35);
  assert.equal(pages.length, 10);
  assert.equal(new Set(decisions.routes.map(r => r.path)).size, decisions.routes.length);
  for (const source of inventory) {
    const route = decisions.routes.find(r => r.path === source.path);
    assert.ok(route, source.path);
    assert.ok(['core', 'page', 'redirect'].includes(route.type));
    if (route.type === 'redirect') assert.ok(decisions.routes.some(r => r.path === route.destination.split('?')[0]) || route.destination === '/' || JSON.parse(readFileSync('./generated/posts.json')).some(p => p.path === route.destination));
  }
  for (const page of pages) {
    assert.ok(!/<(?:form|script|input|button)\b|\son\w+=|javascript:/i.test(page.bodyHtml), page.path);
    for (const { url } of page.media) assert.ok(existsSync('./public' + decodeURIComponent(new URL(rewriteMedia(url), 'https://example.test').pathname)), url);
  }
  assert.equal(decisions.summary.separateNativeFormsMigrated, 0);
  assert.equal(pages.find(p => p.path === '/privacy-policy').emptySource, true);
});
test('malformed sponsor link is corrected only in generated editorial output', () => {
  assert.equal(rewriteEditorialLinks('<a href="beardigital.io">Bear</a>'), '<a href="https://beardigital.io">Bear</a>');
  assert.equal(rewriteEditorialLinks('<a href="/news/story">Story</a>'), '<a href="/news/story">Story</a>');
});
test('contact delivery is disabled unless explicitly configured to a valid provider endpoint', () => {
  assert.equal(CONTACT_EMAIL, 'jarron@spindlesunited.com');
  assert.equal(Object.keys(CONTACT_REASONS).length, 4);
  for (const env of [{}, { CONTACT_FORM_ENABLED: 'true' }, { CONTACT_FORM_ID: 'abcdefgh' }, { CONTACT_FORM_ENABLED: 'true', CONTACT_FORM_ID: 'https://evil.test/' }]) assert.equal(contactEndpoint(env), '');
  assert.equal(contactEndpoint({ CONTACT_FORM_ENABLED: 'true', CONTACT_FORM_ID: 'abcdefgh' }), 'https://formspree.io/f/abcdefgh');
  assert.equal(reasonFromQuery('?reason=player'), 'player');
  assert.equal(reasonFromQuery('?reason=__proto__'), '');
  assert.equal(reasonFromQuery('?reason=sponsor&recipient=someone@example.test'), 'sponsor');
});
