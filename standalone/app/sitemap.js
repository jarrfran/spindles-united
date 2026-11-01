import { getPublishedPosts, ORIGIN } from '../lib/content.mjs';
import editorial from '../generated/pages.json';
export default function sitemap() {
  return ['', '/news', '/about', '/history', '/schedule', '/roster', '/stats', '/sponsors', '/store', '/contact'].map(p => ({ url: ORIGIN + p }))
    .concat(editorial.filter(p => !p.emptySource).map(p => ({ url: p.canonical })), getPublishedPosts().map(p => ({ url: p.canonical })));
}
