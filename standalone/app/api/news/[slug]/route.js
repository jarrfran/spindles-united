import { getPost, feedItem } from '../../../../lib/content.mjs';
export async function GET(request, { params }) {
  const post = getPost((await params).slug);
  return post ? Response.json({ item: feedItem(post) }) : Response.json({ error: 'Not found' }, { status: 404 });
}
