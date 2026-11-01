import { notFound } from 'next/navigation';
import legacy from '../../../generated/legacy.json';
import { getPublishedPosts, getPost, metadataFor, dateLabel, articleSchema, jsonLd } from '../../../lib/content.mjs';
const club = legacy.club;
export const dynamicParams = false;
export function generateStaticParams() { return getPublishedPosts().map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }) {
  const post = getPost((await params).slug);
  return post ? metadataFor(post) : {};
}
export default async function Page({ params }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const match = Object.entries(club.schedules).flatMap(([year, data]) => data.matches.map(m => ({ ...m, year }))).find(m => m.recapUrl && new URL(m.recapUrl, post.canonical).pathname === post.path);
  return <div className="su-site su-article-page standalone-article su-public-ready">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema(post)) }} />
    <div className="su-club-hero"><div className="su-club-wrap su-club-heading"><div><p className="su-club-eyebrow">{post.categories.join(' / ') || 'News'}</p><h1>{post.title}</h1></div></div></div>
    <div className="su-club-wrap su-article-main"><div className="su-article-layout"><article className="su-article-story">
      <p className="su-article-meta"><time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)}</time><span>By {post.author}</span></p>
      {post.featuredImage && <figure className="su-article-feature"><img src={post.featuredImage + '?format=1500w'} alt="" fetchPriority="high" /></figure>}
      {match && <a className="standalone-match-link" href={`/schedule?season=${match.year}#match-${match.date}`}><strong>{match.home} {match.homeScore} – {match.awayScore} {match.away}</strong><span>View match details · {match.date}</span></a>}
      <div className="su-article-copy" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      <a className="su-club-btn su-recap-btn su-article-back" href="/news">Back to club news</a>
    </article><aside className="su-article-sidebar" aria-label="More from the club"><section data-su-news="sidebar" /></aside></div></div>
  </div>;
}
