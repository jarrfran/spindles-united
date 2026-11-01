import { readFileSync } from 'node:fs';
const pageRoutes = JSON.parse(readFileSync(new URL('../migration/inventory/page-routes.json', import.meta.url)));
const jsonQuery = [{ type: 'query', key: 'format', value: 'json' }];
export default {
  poweredByHeader: false,
  async redirects() {
    return pageRoutes.routes.filter(r => r.type === 'redirect').map(r => ({ source: r.path, destination: r.destination, permanent: true }));
  },
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
