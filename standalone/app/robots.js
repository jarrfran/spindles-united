import { indexable, ORIGIN } from '../lib/content.mjs';
export default function robots() {
  return indexable() ? { rules: { userAgent: '*', allow: '/' }, sitemap: ORIGIN + '/sitemap.xml' }
    : { rules: { userAgent: '*', disallow: '/' } };
}
