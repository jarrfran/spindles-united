import { notFound } from 'next/navigation';
import legacy from '../../generated/legacy.json';
import editorial from '../../generated/pages.json';
import ContactForm from '../../components/ContactForm.jsx';
import EditorialPage from '../../components/EditorialPage.jsx';
import { contactEndpoint } from '../../lib/contact.mjs';
const routes = { home: 'Home', about: 'About', history: 'History', schedule: 'Schedule', roster: 'Roster', stats: 'Club Record Book', sponsors: 'Sponsors', store: 'Club Store', contact: 'Contact' };
export const dynamicParams = false;
export function generateStaticParams() { return [...Object.keys(routes), ...editorial.map(p => p.path.slice(1))].map(page => ({ page })); }
export async function generateMetadata({ params }) {
  const { page } = await params;
  const record = editorial.find(p => p.path === '/' + page);
  return { title: routes[page] || record?.title, description: record?.description || undefined,
    ...(record?.emptySource ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: page === 'home' ? '/' : '/' + page } };
}
export default async function Page({ params }) {
  const { page } = await params;
  const record = editorial.find(p => p.path === '/' + page);
  if (record) return <EditorialPage page={record} />;
  if (!routes[page]) notFound();
  if (page === 'contact') return <><div dangerouslySetInnerHTML={{ __html: legacy.pages.contact }} /><ContactForm endpoint={contactEndpoint()} /></>;
  return <div data-su={page} dangerouslySetInnerHTML={{ __html: legacy.pages[page] }} />;
}
