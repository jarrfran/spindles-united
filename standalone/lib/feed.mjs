export const feedItem = p => ({
  id: p.source.savedFeed?.id || p.id, title: p.title, fullUrl: p.path, urlId: p.slug,
  assetUrl: p.featuredImage, publishOn: p.publishOn, addedOn: p.publishOn,
  categories: p.categories, tags: p.tags, author: { displayName: p.author }, excerpt: p.description,
});
