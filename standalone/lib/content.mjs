import posts from '../generated/posts.json' with { type: 'json' };
export { feedItem } from './feed.mjs';
export const ORIGIN = 'https://www.spindlesunited.com';
export const getPublishedPosts = () => posts.filter(p => p.status === 'publish').sort((a, b) => b.publishOn - a.publishOn);
export const getPost = slug => getPublishedPosts().find(p => p.slug === slug);
export const getCategories = () => [...new Set(getPublishedPosts().flatMap(p => p.categories))].sort();
export const indexable = () => process.env.SITE_INDEXABLE === 'true' && process.env.VERCEL_ENV !== 'preview';
export const dateLabel = value => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }).format(new Date(value));
export function metadataFor(p) {
  return {
    title: { absolute: p.seo.title }, description: p.description,
    alternates: { canonical: p.canonical },
    openGraph: { type: 'article', title: p.seo.openGraphTitle, description: p.seo.openGraphDescription, url: p.canonical,
      publishedTime: p.publishedAt, authors: [p.author], section: p.categories[0], tags: p.tags,
      images: p.seo.openGraphImage ? [p.seo.openGraphImage] : [] },
    twitter: { card: p.seo.twitterCard, title: p.seo.twitterTitle, description: p.seo.twitterDescription,
      images: p.seo.twitterImage ? [p.seo.twitterImage] : [] },
  };
}
export const jsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c');
export function articleSchema(p) {
  return { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: p.title,
    datePublished: p.publishedAt, author: { '@type': 'Person', name: p.author },
    publisher: { '@type': 'Organization', name: 'Spindles United FC' },
    mainEntityOfPage: p.canonical, url: p.canonical, description: p.description,
    image: p.featuredImage ? [p.featuredImage] : [], articleSection: p.categories };
}
