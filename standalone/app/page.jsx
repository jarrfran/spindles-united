import legacy from '../generated/legacy.json';
export const metadata = { alternates: { canonical: '/' } };
export default function Home() { return <div data-su="home" dangerouslySetInnerHTML={{ __html: legacy.pages.home }} />; }
