import { getPublishedPosts, ORIGIN } from '../lib/content.mjs';
export default function sitemap() {
  return ['', '/news', '/about', '/history', '/schedule', '/roster', '/stats', '/sponsors', '/store', '/contact'].map(p => ({ url: ORIGIN + p }))
    .concat(getPublishedPosts().map(p => ({ url: p.canonical })));
}
