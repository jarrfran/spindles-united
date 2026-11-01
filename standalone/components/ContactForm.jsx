'use client';
import { useEffect, useRef, useState } from 'react';
import { CONTACT_EMAIL, CONTACT_REASONS, reasonFromQuery } from '../lib/contact.mjs';

export default function ContactForm({ endpoint }) {
  const [reasons, setReasons] = useState([]);
  const [error, setError] = useState('');
  const reasonGroup = useRef(null);
  useEffect(() => {
    const initial = reasonFromQuery(window.location.search);
    if (initial) setReasons([initial]);
    function selectReason(event) {
      const link = event.target.closest('a[data-contact-reason]');
      const reason = link?.dataset.contactReason;
      if (Object.hasOwn(CONTACT_REASONS, reason)) {
        setReasons(previous => previous.includes(reason) ? previous : [...previous, reason]);
        setError('');
      }
    }
    document.addEventListener('click', selectReason);
    return () => document.removeEventListener('click', selectReason);
  }, []);
  function submit(event) {
    if (!endpoint || !reasons.length) {
      event.preventDefault();
      setError(endpoint ? 'Choose at least one reason for contacting the club.' : 'Please email the club while this form is being connected.');
      if (endpoint) reasonGroup.current?.querySelector('input')?.focus();
    }
    // A native POST lets Formspree handle its CAPTCHA, errors and confirmation.
    // Never show a local success message before the provider accepts the message.
  }
  return <section className="su-site standalone-contact" id="su-contact-form" aria-labelledby="contact-form-heading">
    <div className="su-club-wrap standalone-contact-layout">
      <aside><p className="su-club-eyebrow">One club. One inbox.</p><h2 id="contact-form-heading">Let’s Talk.</h2>
        <p>Players, sponsors, volunteers and everyone with a club question: contact us here.</p>
        <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>
        <p>We’ll reply to the email address you provide.</p>
      </aside>
      <form action={endpoint || undefined} method="post" onSubmit={submit} aria-describedby={!endpoint ? 'contact-unavailable' : undefined}>
        {!endpoint && <p className="standalone-contact-notice" id="contact-unavailable">This preview form isn’t accepting messages yet. Please <a href={'mailto:' + CONTACT_EMAIL}>email the club</a>.</p>}
        <input type="hidden" name="_subject" value="Spindles United FC — Contact inquiry" />
        <div className="standalone-honeypot" aria-hidden="true"><label>Leave this field empty<input name="_gotcha" tabIndex={-1} autoComplete="off" /></label></div>
        <div className="standalone-contact-row"><Field label="First name" name="first_name" autoComplete="given-name" required /><Field label="Last name" name="last_name" autoComplete="family-name" required /></div>
        <Field label="Email" name="email" type="email" autoComplete="email" required maxLength={254} />
        <Field label="Phone (optional)" name="phone" type="tel" autoComplete="tel" maxLength={40} />
        <fieldset ref={reasonGroup} aria-describedby={error ? 'contact-error' : undefined}><legend>Reason for contact <span>(choose all that apply)</span></legend>
          {Object.entries(CONTACT_REASONS).map(([key, label]) => <label className="standalone-contact-choice" key={key}><input type="checkbox" name="reason" value={label} checked={reasons.includes(key)} onChange={e => { setError(''); setReasons(previous => e.target.checked ? [...previous, key] : previous.filter(r => r !== key)); }} />{label}</label>)}
        </fieldset>
        <label className="standalone-contact-field">Message <span>(required)</span><textarea name="message" required rows={6} maxLength={10000} /></label>
        <details className="standalone-player-details" open={reasons.includes('player')}><summary>For interested players</summary><p>Please include the details below if you’re interested in joining the Spins.</p>
          <Field label="Player position(s)" name="player_positions" /><Field label="Age" name="player_age" inputMode="numeric" maxLength={3} />
          <p className="standalone-contact-help">UPL players must be 18 or older at the start of the season.</p>
          <Field label="Current club(s)" name="current_clubs" /><Field label="City of residence during summer" name="summer_city" />
          <label className="standalone-contact-field">Why do you want to join Spindles?<textarea name="player_interest" rows={4} maxLength={5000} /></label>
        </details>
        {error && <p id="contact-error" role="alert">{error}</p>}
        <p className="standalone-contact-help">{endpoint ? 'This form uses Formspree to deliver your inquiry.' : 'When enabled, this form sends your inquiry through Formspree.'} Your email is used so we can reply; this form does not subscribe you to a mailing list.</p>
        <button className="standalone-contact-send" type="submit" disabled={!endpoint}>Send message</button>
        <noscript><p>Select a reason and include it in your message. You can also email <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>.</p></noscript>
      </form>
    </div>
  </section>;
}
function Field({ label, name, required = false, ...props }) {
  return <label className="standalone-contact-field">{label}{required && <span>(required)</span>}<input name={name} required={required} maxLength={200} {...props} /></label>;
}
