import { notFound } from 'next/navigation';
import NewsPage from '../../../../components/NewsPage.jsx';
import { getCategories } from '../../../../lib/content.mjs';
const decode = value => {
  try { return decodeURIComponent(value).replace(/\+/g, ' '); }
  catch { return ''; }
};
export function generateStaticParams() {
  return getCategories().flatMap(category => [{ category: category.replace(/ /g, '+') }, { category }]);
}
export async function generateMetadata({ params }) {
  const category = decode((await params).category);
  return { title: category, alternates: { canonical: '/news/category/' + encodeURIComponent(category).replace(/%20/g, '+') } };
}
export default async function Page({ params }) {
  const category = decode((await params).category);
  if (!getCategories().includes(category)) notFound();
  return <NewsPage category={category} />;
}
