import { getPublishedPosts, ORIGIN } from '../../../lib/content.mjs';
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
export function GET() {
  const items = getPublishedPosts().map(p => `<item><title>${escape(p.title)}</title><link>${escape(p.canonical)}</link><guid isPermaLink="true">${escape(p.canonical)}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate><description>${escape(p.description)}</description>${p.categories.map(c => `<category>${escape(c)}</category>`).join('')}</item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Spindles United FC News</title><link>${ORIGIN}/news</link><description>The latest club stories and match recaps.</description><language>en-US</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
