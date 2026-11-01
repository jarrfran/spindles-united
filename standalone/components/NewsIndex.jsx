'use client';
import { useState } from 'react';
export default function NewsIndex({ posts, initialCategory = '', initialYear = '' }) {
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState(initialYear);
  const categories = [...new Set(posts.flatMap(p => p.categories))].sort();
  const years = [...new Set(posts.map(p => p.publishedAt.slice(0, 4)))].sort().reverse();
  const found = posts.filter(p => (!category || p.categories.includes(category)) && (!year || p.publishedAt.startsWith(year)) && (!search || p.title.toLowerCase().includes(search.toLowerCase())));
  return <div className="su-club-wrap"><div className="su-news-filters">
    <label>Find a story<input type="search" placeholder="Search club news" value={search} onChange={e => setSearch(e.target.value)} /></label>
    <label>Category<select data-su-select="true" value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label>Year<select data-su-select="true" value={year} onChange={e => setYear(e.target.value)}><option value="">All years</option>{years.map(y => <option key={y}>{y}</option>)}</select></label>
  </div><p className="standalone-story-count" role="status">{found.length} {found.length === 1 ? 'story' : 'stories'}</p>
    <div className="su-news-feed su-news-feed-index">{found.map(p => <a className="su-story-card" href={p.path} key={p.path}>
      {p.featuredImage && <div className="su-story-image"><img src={p.featuredImage + '?format=750w'} alt="" loading="lazy" /></div>}
      <div className="su-story-copy"><p><span>{p.categories[0] || 'News'}</span><time dateTime={p.publishedAt}>{p.dateLabel}</time></p><h3>{p.title}</h3><span className="su-story-read">Read story <b aria-hidden="true">›</b></span></div>
    </a>)}</div>{!found.length && <p>No stories match these filters.</p>}
  </div>;
}
