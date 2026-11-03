# AURORA — isolated intake security QA (3 November 2026)

**Release status: public intake must remain CLOSED.** No production report can be submitted by these checks.

## What was verified

- The isolated integration harness uses an in-memory SQLite database with the real D1 SQL migrations and fully synthetic data. All approvals exist **only** in the test process, never as deployment settings.
- The request handler enforces verified email, separate Turnstile verification, correct hostname and action, same-origin constraints, consent and schema readiness. A valid fake report is quarantined in the private test table, without publication.
- Duplicate requests return the same receipt without creating duplicate audit events.
- Anonymous requests, cross-origin requests, stale/replayed tokens, wrong Turnstile hostname and wrong action are rejected before any data is saved.
- Cloudflare's official public testing sitekeys and secrets are explicitly denied by the production activation gate. Only real production credentials should ever be used in Cloudflare Pages.
- The optional online smoke script makes exactly three requests to Cloudflare Siteverify using ONLY Cloudflare's publicly documented dummy credentials. Its dummy success response does not have a valid production hostname/action and is therefore correctly rejected by the AURORA verifier.

## How to reproduce

Offline deterministic checks:
    node --test tests/isolated-intake-security.test.mjs tests/intake.test.mjs tests/intake-auth-gate.test.mjs

Optional real Siteverify smoke (requires outbound Internet, **no** production credentials):
    node scripts/turnstile-dummy-smoke.mjs

Public release lock, safe GET request only:
    curl -fsSL https://aurorauap.org/api/intake/status

Expected production status today:
    accepting=false, mode=local_draft_only

## WAF verification boundary

The actual active Cloudflare zone-level WAF rule was reviewed in its dashboard:
- hostname: aurorauap.org
- method: POST
- path: /api/intake/submit
- source IP aggregation, 10 requests per 10 seconds, block duration 10 seconds
- status: Active

**The isolated test harness cannot assert that Cloudflare edge rate limiting really fires.** It does not send traffic bursts, and no WAF readiness flag is set. Confirm real edge behavior only in an owner-approved bounded test window using a separate test IP and Cloudflare Security Events analytics, avoiding disruption to other visitors. Do not simulate WAF success through an in-memory mock.

## Remaining launch blockers

- Independently reviewed GDPR notice, lawful bases and processors, handling of children's/third-party data and rights requests.
- Approved and verified backup retention, Supabase account deletion and owner-operated D1 erasure/retention procedures.
- Independently controlled WAF rate-rule observation and live verification.
- Successful real managed Turnstile on the production hostname with a verified reporter and private moderator review, **only after** the other controls are cleared.
- Keep AURORA_INTAKE_ENABLED unset/disabled, and leave AURORA_INTAKE_LEGAL_APPROVED / AURORA_INTAKE_WAF_REVIEWED unset until owner verification.

Cloudflare official dummy credentials:
https://developers.cloudflare.com/turnstile/troubleshooting/testing/
