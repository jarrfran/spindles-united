import NewsPage from '../../components/NewsPage.jsx';
export const metadata = { title: 'Club News', alternates: { canonical: '/news' } };
export default async function Page({ searchParams }) {
  const query = await searchParams;
  return <NewsPage category={typeof query.category === 'string' ? query.category : ''} year={typeof query.season === 'string' ? query.season : ''} />;
}
