import { getPublishedPosts, feedItem } from '../../../lib/content.mjs';
export function GET() { return Response.json({ items: getPublishedPosts().map(feedItem), pagination: {} }); }
