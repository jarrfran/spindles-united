import { notFound } from 'next/navigation';
import legacy from '../../generated/legacy.json';
const routes = { home: 'Home', about: 'About', history: 'History', schedule: 'Schedule', roster: 'Roster', stats: 'Club Record Book', sponsors: 'Sponsors', store: 'Club Store', contact: 'Contact' };
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(routes).map(page => ({ page })); }
export async function generateMetadata({ params }) {
  const { page } = await params;
  return { title: routes[page], alternates: { canonical: page === 'home' ? '/' : '/' + page } };
}
export default async function Page({ params }) {
  const { page } = await params;
  if (!routes[page]) notFound();
  if (page === 'contact') return <section className="standalone-notice"><h1>Contact Spindles United FC</h1><p>Contact forms are being prepared for this preview. Please use the <a href="https://www.spindlesunited.com/contact">current club contact page</a> for inquiries.</p></section>;
  return <div data-su={page} dangerouslySetInnerHTML={{ __html: legacy.pages[page] }} />;
}
