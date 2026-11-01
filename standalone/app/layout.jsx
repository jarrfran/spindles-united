import Script from 'next/script';
import legacy from '../generated/legacy.json';
import { ORIGIN, indexable } from '../lib/content.mjs';
import { localMediaUrl } from '../lib/media.mjs';
import './standalone.css';

export const metadata = {
  metadataBase: new URL(ORIGIN),
  title: { default: 'Spindles United Football Club', template: '%s | Spindles United FC' },
  description: 'The matches, people and stories behind Spindles United Football Club in Cohoes, New York.',
  robots: indexable() ? { index: true, follow: true } : { index: false, follow: false },
  alternates: { types: { 'application/rss+xml': '/news/rss.xml' } },
};
const footer = legacy.footer;
export default function Layout({ children }) {
  return <html lang="en"><head><link rel="stylesheet" href="/legacy/site.css" /></head><body>
    <a className="standalone-skip" href="#main-content">Skip to content</a>
    <header id="header" className="standalone-header"><div className="header-inner">
      <a className="standalone-brand" href="/" aria-label="Spindles United FC home"><img src={localMediaUrl('https://images.squarespace-cdn.com/content/v1/6702f19a9e93b178e9d17b01/cbc79c09-185c-45df-b925-f429573953b9/Full-logo-new.png?format=100w')} alt="" /><span>Spindles<br /><small>United FC</small></span></a>
      <nav className="standalone-desktop" aria-label="Main navigation"><NavLinks /></nav>
      <details className="standalone-mobile"><summary>Menu</summary><nav aria-label="Mobile navigation"><NavLinks /></nav></details>
    </div></header>
    <main id="main-content">{children}</main>
    <footer dangerouslySetInnerHTML={{ __html: footer }} />
    <Script src="/legacy/spindles.js" strategy="afterInteractive" />
  </body></html>;
}
function NavLinks() {
  return <><a href="/about">About</a><a href="/history">History</a><a href="/schedule">Schedule</a><a href="/roster">Roster</a><a href="/stats">Stats</a><a href="/news">News</a><a href="/sponsors">Sponsors</a><a href="/contact">Contact</a><a className="standalone-store" href="/store">Store</a></>;
}
