const imageHosts = ['images.squarespace-cdn.com', 'static1.squarespace.com', 'video.squarespace-cdn.com'];
export function localMediaUrl(value) {
  if (typeof value !== 'string') return value;
  try {
    const url = new URL(value);
    if (!imageHosts.includes(url.hostname) || !(/\.(?:jpe?g|png|gif|webp|svg)$/i.test(url.pathname) || url.pathname.endsWith('/thumbnail'))) return value;
    return '/media/squarespace/' + url.hostname + url.pathname.replace(/\+/g, '%2B') + url.search + url.hash;
  } catch { return value; }
}
// Only generated standalone assets are rewritten. The historical source remains immutable.
export function rewriteMedia(value) {
  if (Array.isArray(value)) return value.map(rewriteMedia);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewriteMedia(v)]));
  if (typeof value !== 'string') return value;
  const rewritten = value.replace(/https?:\/\/(?:images\.squarespace-cdn\.com|static1\.squarespace\.com|video\.squarespace-cdn\.com)(?=\/)/g,
    host => '/media/squarespace/' + new URL(host).hostname);
  // Encode literal plus signs in full URLs and the CDN-relative strings used by
  // existing crest/player/season modules. Keep filenames and original sources intact.
  const fullUrls = rewritten.replace(/\/media\/squarespace\/[^\s"'<>\\)?#]+/g, url => url.replace(/\+/g, '%2B'));
  return fullUrls.replace(/(?:[a-f0-9-]{36}|\d{13}-[A-Z0-9]+)\/[^"'<>\\\n]*?\.(?:jpe?g|png|webp)/gi,
    assetPath => assetPath.replace(/\+/g, '%2B'));
}
