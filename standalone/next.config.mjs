const jsonQuery = [{ type: 'query', key: 'format', value: 'json' }];
export default {
  poweredByHeader: false,
  async rewrites() {
    return { beforeFiles: [
      { source: '/news', has: jsonQuery, destination: '/api/news' },
      { source: '/news', has: [{ type: 'query', key: 'format', value: 'rss' }], destination: '/news/rss.xml' },
      { source: '/news/:slug', has: jsonQuery, destination: '/api/news/:slug' },
    ] };
  },
  async headers() {
    return process.env.SITE_INDEXABLE === 'true' && process.env.VERCEL_ENV !== 'preview' ? [] : [
      { source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};
