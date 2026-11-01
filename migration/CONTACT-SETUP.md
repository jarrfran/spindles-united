# Single contact form — delivery setup

Owner instruction: all inquiries use `/contact`. Deliver to
`jarron@spindlesunited.com` and reply directly to the visitor from email.
`jordan@spindlesunited.com` is optional, pending confirmation; it is not configured.
No separate recruitment, sponsor, volunteer or newsletter forms are migrated.

## Prepared behavior

The standalone form retains the current contact page’s name, email, optional
phone, multiple inquiry reasons, required message and optional player details.
Player/sponsor/volunteer shortcuts select a reason in this same form. It never
subscribes a visitor to a mailing list. Raw Squarespace form code is not executed.

The selected delivery adapter is Formspree’s native HTML form endpoint. This
keeps CAPTCHA, delivery errors and confirmation with the provider, rather than
claiming success locally. Formspree’s `email` field sets the notification’s
Reply-To to the visitor. Recipients belong to verified provider configuration,
not visitor input. No email API key is embedded in the site.

The preview remains disabled and offers a direct email link. No account, plan,
recipient verification, message delivery or email reply test has been completed.

## Connect before enabling

1. In an owner-controlled [Formspree account](https://formspree.io/), create one
   form called “Spindles Contact” and verify `jarron@spindlesunited.com` as its
   target email. Review current plan limits and data retention before choosing a
   plan; no purchase is included in this migration.
2. Copy the public form endpoint from its Integration page. If it is
   `https://formspree.io/f/abcdefgh`, the form ID is `abcdefgh`.
3. Review provider spam protection, CAPTCHA, permitted site domains and field
   validation. Keep protection enabled. Native POST can show the provider’s CAPTCHA
   page; custom inline CAPTCHA can be considered after the initial delivery test.
4. In the separate Vercel preview project, set `CONTACT_FORM_ID` to that public ID
   and `CONTACT_FORM_ENABLED=true`, then rebuild. Use preview settings only. The
   default blank ID/false flag intentionally cannot submit to an external service.
5. Keep the notification email’s Reply-To tied to the submitted `email` field.
   Do not configure a user-supplied recipient, newsletter integration or automatic
   subscription. Add Jordan only after the owner confirms.

## Acceptance checks before launch

- With permission to send test messages, submit a clearly labelled inquiry from
  an address the owner controls. Check inbox and spam folder at Jarron’s address.
- Confirm all fields/reasons arrive, and that pressing Reply addresses the visitor.
  Send a test reply and confirm receipt. A provider success screen alone does not
  establish inbox delivery.
- Check all four reasons and optional player details. Confirm there is exactly
  one form on the site and old inquiry links lead to it.
- Verify missing/invalid inputs, provider rejection and spam protection. Confirm
  errors do not display a misleading success message. Validate configured provider
  field rules; browser validation alone is not a security control.
- Check mobile, keyboard access, provider CAPTCHA and return navigation. Complete
  privacy content review for the chosen provider before accepting real inquiries.
- Keep website/DNS cutover as a separate approval. Changing the contact delivery
  adapter does not authorize changing email DNS or the live Squarespace form.

Official references:

- [HTML form setup and target email](https://help.formspree.io/articles/building-your-form/building-an-html-form)
- [Reply-To behavior](https://help.formspree.io/articles/building-your-form/email-reply-to-address)
- [Honeypot field](https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering)
- [CAPTCHA settings](https://help.formspree.io/articles/form-and-project-settings/recaptcha-settings)
