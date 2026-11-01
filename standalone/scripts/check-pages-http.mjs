import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const base = process.argv[2] || 'http://127.0.0.1:3000';
if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(base)) throw new Error('Use the local preview only');
const { routes } = JSON.parse(readFileSync('../migration/inventory/page-routes.json'));
for (const route of routes) {
  const response = await fetch(base + route.path, { redirect: 'manual' });
  assert.equal(response.status, route.type === 'redirect' ? 308 : 200, route.path);
  if (route.type === 'redirect') {
    assert.equal(new URL(response.headers.get('location'), base).href, base + route.destination, route.path);
    assert.equal((await fetch(base + route.path)).status, 200, route.path + ' destination');
  } else {
    const html = await response.text();
    assert.match(response.headers.get('x-robots-tag'), /noindex/, route.path);
    if (route.historical) assert.ok(html.includes('Historical club page'), route.path);
    if (route.path !== '/contact') assert.ok(!/<form\b/.test(html), route.path + ' separate form');
  }
}
const contact = await (await fetch(base + '/contact?reason=player')).text();
assert.equal((contact.match(/<form\b/g) || []).length, 1);
assert.ok(contact.includes('name="email"'));
assert.ok(contact.includes('name="_gotcha"'));
assert.ok(contact.includes('mailto:jarron@spindlesunited.com'));
assert.ok(contact.includes('isn’t accepting messages yet'));
assert.ok(!contact.includes('action="https://formspree.io'));
assert.equal((await fetch(base + '/not-a-real-page')).status, 404);
const file = '/s/fall-showcase-waiver-2025.pdf';
const pdf = await fetch(base + file);
assert.equal(pdf.status, 200);
assert.equal(createHash('sha256').update(Buffer.from(await pdf.arrayBuffer())).digest('hex'), createHash('sha256').update(readFileSync('./public' + file)).digest('hex'));
console.log(`Verified ${routes.length} page routes, redirects, archive notices and unified contact preview.`);
