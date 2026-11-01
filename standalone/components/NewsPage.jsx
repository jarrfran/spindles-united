import { getPublishedPosts, dateLabel } from '../lib/content.mjs';
import NewsIndex from './NewsIndex.jsx';
export default function NewsPage({ category = '', year = '' }) {
  const posts = getPublishedPosts().map(p => ({ path: p.path, title: p.title, featuredImage: p.featuredImage,
    categories: p.categories, publishedAt: p.publishedAt, dateLabel: dateLabel(p.publishedAt) }));
  return <div className="su-site su-news-page standalone-news su-public-ready"><div className="su-club-hero"><div className="su-club-wrap su-club-heading"><div><p className="su-club-eyebrow">Spindles United FC</p><h1>{category || 'Club News.'}</h1><p>The matches, people and stories behind the Spins.</p></div></div></div><NewsIndex posts={posts} initialCategory={category} initialYear={year} /></div>;
}
