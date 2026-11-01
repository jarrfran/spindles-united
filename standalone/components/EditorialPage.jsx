export default function EditorialPage({ page }) {
  return <div className="su-site su-public-ready standalone-editorial">
    <section className="su-club-hero"><div className="su-club-wrap su-club-heading"><div><p className="su-club-eyebrow">Spindles United FC{page.historical ? ' · Archive' : ''}</p><h1>{page.title}</h1></div></div></section>
    <div className="su-club-wrap standalone-editorial-body">
      {page.historical && <p className="standalone-archive-notice">Historical club page. Dates, partners and event details below refer to that season. Forms from this page are closed. For current opportunities, <a href={'/contact?reason=' + page.contactReason}>contact the club</a>.</p>}
      {page.emptySource ? <p>For questions about privacy, email <a href="mailto:jarron@spindlesunited.com">jarron@spindlesunited.com</a>.</p> : <div className="standalone-editorial-copy" dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />}
      <p className="standalone-editorial-contact"><a href={'/contact?reason=' + page.contactReason}>Contact Spindles United FC →</a></p>
    </div>
  </div>;
}
