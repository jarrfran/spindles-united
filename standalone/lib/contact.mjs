export const CONTACT_EMAIL = 'jarron@spindlesunited.com';
export const CONTACT_REASONS = {
  player: 'Interested in Joining as a Player',
  sponsor: 'I am Looking to Sponsor',
  volunteer: 'I Want to Volunteer',
  other: 'Other',
};
// A form ID is public configuration, never an email-delivery API key.
// Recipients are verified in Formspree, and cannot be supplied by a visitor.
export function contactEndpoint(env = process.env) {
  const id = env.CONTACT_FORM_ID || '';
  return env.CONTACT_FORM_ENABLED === 'true' && /^[a-zA-Z0-9]{6,40}$/.test(id)
    ? 'https://formspree.io/f/' + id : '';
}
export function reasonFromQuery(search) {
  const reason = new URLSearchParams(search).get('reason');
  return Object.hasOwn(CONTACT_REASONS, reason) ? reason : '';
}
