# AURORA — offline reporter-to-moderator end-to-end rehearsal

4 November 2026. **SYNTHETIC LOCAL ONLY. Public intake remains disabled in production.**

## What was exercised

The new tests/report-to-moderation-journey.test.mjs runs the actual AURORA Pages Functions in one process against an isolated in-memory SQLite D1-compatible schema. External dependencies are simulated with strictly intercepted fetch calls: fictional Supabase Auth verified reporter UUIDs and tokens, Cloudflare Turnstile Siteverify action/hostname verification, and an ephemeral locally signed Cloudflare Access RS256 JWT with an ephemeral JWKS. The test makes no outgoing requests to Supabase, Cloudflare, AURORA production, or any human mailbox.

1. Verify that missing owner-approved readiness flags cause the report status to remain closed and /api/intake/submit to reject a request before Auth, Turnstile or storage.
2. In isolated test-only environment flags, use the actual /api/intake/submit POST handler with a fictional verified reporter and a locally mocked one-time Turnstile response. Verify 202 pending, published:false, private D1 ownership link, initial moderation audit and no public case.
3. Use the actual /api/account/privacy GET handler: only the original verified reporter sees the private receipt metadata; a different synthetic reporter sees an empty list and never sees the report body.
4. Reject both an anonymous moderator and a DIFFERENT-email but correctly signed JWT, and reject a cross-origin moderation POST.
5. A locally signed authorized owner JWT reaches /api/moderation/ and /api/moderation/?receipt=..., revealing the private description only inside the authenticated moderator API, including the original audit entry. The response never exposes the reporter Auth UUID.
6. The actual /api/moderation/ POST applies an owner-approved review (approved), writes a single review audit, and keeps publication_status=quarantined. A repeated decision is refused with 409; no duplicate audit.
7. Reporter receipts reflect the updated approved status, but the public /api/cases listing remains empty and contains neither the receipt nor description. The local D1 foreign key integrity check remains clean.
8. Negative scenarios reject cross-origin/anonymous/unverified reporter requests and Turnstile incorrect hostname/action. The emergency-off flag refuses new submissions before calling external providers.

## Limits of this evidence

- The approval switches in the test are only JavaScript variables in the isolated test fixture. No Cloudflare Pages configuration, production D1, public intake flags, WAF policy, DNS, database records, or external identity provider is changed.
- These tests demonstrate the application's endpoint logic, NOT real Cloudflare Access edge policy or WAF enforcement. A distinct non-allowlisted real email login is still an open release gate.
- Fake Supabase verified email and fake Turnstile results are not an actual live reporter submission. A real controlled reporter login/challenge/submission/moderation walkthrough requires separate explicit owner approval after qualified privacy/retention review.
- No files are uploaded, no report is publicly published, and no real witness report is stored or shared.
- The synthetic 18+ consent is a self-declaration only and must not be represented as real age verification.
- Encrypted backup independence, historical erasure reconciliation, live Auth admin deletion, and legal GDPR compliance remain separate requirements.

## Repeat the isolated end-to-end test

    node --test tests/report-to-moderation-journey.test.mjs

The privacy CI workflow runs the rehearsal alongside the existing intake/rights/moderation regression suites. For live production, restrict checks to the anonymous GET preflight:

    node scripts/check-private-release-readiness.mjs --live

Never enable production AURORA_INTAKE_ENABLED, LEGAL_APPROVED or WAF_REVIEWED flags to satisfy a test.

## Remaining human approval for launch

Qualified Bulgarian/EU GDPR review of the actual controller identity, legal basis, processors, third-party/child report handling, retention and backup erasure; a real other-account Cloudflare Access denial; a separately approved disposable Supabase user deletion/revocation test; a policy-backed backup restore/erasure procedure; a fresh owner-approved private reporter/moderator walk-through, and an explicit go/no-go decision.
