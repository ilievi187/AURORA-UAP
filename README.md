# AURORA — UAP Bulgaria

Static multilingual prototype for https://aurorauap.org.

## Features
- Bulgarian, English, German, Russian, simplified Chinese (language selector stored locally).
- Responsive sci-fi homepage, demo map, sample cases, offline report drafts.
- Dedicated public-facing support/donation explanation with **prominent red DONATE button**.
- **Donations are disabled until a verified payment processor is configured.** No personal banking details are stored in public source.

## Cloudflare Pages (GitHub integration)
- Repository: `ilievi187/AURORA-UAP`
- Framework preset: None
- Production branch: `main`
- Build command: `exit 0` (or leave blank)
- Build output directory: `.` (site files are in the repository root)
- Custom domain: `aurorauap.org`, using Pages > Custom domains after successful deploy.

## Secure donations setup
1. Register an eligible recipient and verify the account with a supported payment provider. Stripe supports Bulgaria but its donations policy requires a specific charitable purpose and compliance with local rules; approval is not automatic.
2. In the provider dashboard, connect the recipient's payout bank account privately and enable payouts. Do **not** put IBAN, personal identification, API secrets, or card details into GitHub.
3. Create a hosted **Payment Link** allowing donors to choose an amount in EUR; verify the provider account and live link work.
4. Set `window.AURORA_PAYMENT_LINK` in `payment-config.js` to the approved `https://buy.stripe.com/...` URL (public checkout link, not a secret key). The red donate button will then enable automatically and redirect securely.
5. Test a genuine low-value transaction and refund flow in an approved test environment, then document donation receipts, reporting and refunds policies.

Until step 4 the button is visually present but disabled, with a clear message. No fake checkout or promises of automatic debits.

## Privacy and transparency
- The user-provided bank statement is NOT included in this repository. Never publish its personal fields.
- Example sightings on this prototype are fictional and labelled DEMO.
- No report submission server, live case database, card storage, or live donation processing is implemented.
- AURORA is not represented as an officially registered charity until its status is verified.
