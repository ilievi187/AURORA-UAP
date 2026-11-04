CURRENT UPDATE 4 NOV 2026: The bounded live WAF test has been confirmed via Cloudflare Security Events; historical statements below that the WAF was not tested refer to the earlier audit. Intake remains disabled. Full latest evidence is in docs/WAF-TURNSTILE-EMERGENCY-RUNBOOK-2026-11-04.md.

# AURORA — prelaunch read-only security verification

Date: 3 November 2026. Evidence only, NOT legal approval or permission to enable public intake.

## Current live production evidence

- GET /api/intake/status: HTTP 200, Cache-Control: no-store, accepting:false, mode:local_draft_only, auth_required:true, automatic_publication:false, attachments_enabled:false. Turnstile site key not disclosed while intake off.
- GET /privacy: HTTP 200; both Bulgarian and English pages disclose Supabase Auth and Brevo.
- Unauthenticated GET /moderation, /moderation.html, /api/moderation/ and /api/moderation/?view=overview: 302 to Cloudflare Access (no-store redirects).
- Unauthenticated GET /news-editor and /news-editor.html: HTTP 403.
- Live D1 read-only PRAGMA foreign_keys: 1; private report, review event, ownership link row counts all 0; no private report bodies inspected.
- Real age-encrypted D1 snapshot uploaded to owner-only Google Drive, downloaded and restored in isolated SQLite. Integrity + foreign-key checks passed. Daily systemd timer active on NightKnightPC, depends on machine/user manager availability.
- WAF rate limit configured and visually verified for POST /api/intake/submit with 10 requests/10 seconds per IP and temporary 10-second block. Actual edge burst mitigation has NOT been tested.
- Turnstile Siteverify public test credential behavior and production key configuration verified, but NOT a real production-host challenge while intake off.

## Reproducible anonymous-only prelaunch check

Run manually from network-connected machine:

    node scripts/check-private-release-readiness.mjs --live

The checker makes exactly eleven bounded, anonymous GET requests. It never submits reports, authenticates as a user, accesses private report data, bursts traffic or changes D1, Cloudflare, Supabase or backups. It fails if a protected page is HTTP 200, a redirect is not to Cloudflare Access, public intake becomes enabled, status caching violates no-store, or the bilingual privacy/processor notice disappears.

Offline deterministic tests:

    node --test tests/private-release-readiness.test.mjs

This is deliberately a PRELAUNCH checker. If a public launch is authorized, replace its disabled-intake expectation with a proper postlaunch probe. Never treat a simulated successful submit as production readiness.

## Supabase advisory from a read-only inspection

One warning: auth_leaked_password_protection — Leaked Password Protection Disabled. AURORA currently exposes verified email login. Independently verify whether Supabase password login or enrollment is available at the server level, not just UI. If password sign-in is enabled, consider leaked-password protection where supported or disable password-based authentication if it is unnecessary. No password policy was modified automatically.

## Genuine launch blockers

1. Independent Bulgarian/EU privacy review and owner approval: legal basis, controller correspondence information, Cloudflare/Supabase/Brevo agreements, cross-border transfers, minors and third-party data.
2. Working rights request and Supabase account deletion process, deletion reconciliation after restoration, privacy-approved backup retention and processor logging retention.
3. Controlled WAF rule exercise from a dedicated test IP with Security Events review. No disruptive bursts without an approved testing window.
4. Real production-host Turnstile challenge/verified-account submission end-to-end only after other release gates, plus emergency disable.
5. Actual wrong-account Cloudflare Access moderator denial verification; mock identity tests do not replace real denied-account testing.

Do NOT set legal/WAF review flags or AURORA_INTAKE_ENABLED based on this read-only audit alone.


## 4 November 2026 — signed-in reporter privacy inventory

- New GET /api/account/privacy is scoped to the verified Supabase token; it returns only that UUID's private receipt references, statuses and timestamps with private/no-store. No POST/DELETE operation.
- The anonymous prelaunch checker now makes exactly eleven bounded GET requests and requires unsigned access to the account privacy endpoint to return HTTP 401 with no-store.
- This is not a completed data erasure workflow. Email requests are handled manually. See docs/ACCOUNT-PRIVACY-OPERATIONS-2026-11-04.md.


4 Nov follow-up: authenticated privacy inventory was initially tied to the disabled submission Auth flag and yielded HTTP 503. A fix separates read-only account verification from submission enablement. The after-deploy read-only preflight must show 401 (no token) while report intake stays disabled; do not claim this until verified.


## 4 Nov — WAF path-scope and emergency shutdown tests

Offline tests confirm that noncanonical POST paths reach neither Supabase/Turnstile nor D1, and that disabling the intake flag blocks future submissions while keeping old reports quarantined. This does NOT prove real Cloudflare WAF mitigation. An approved bounded live test must be correlated with Cloudflare Security Events; see docs/WAF-TURNSTILE-EMERGENCY-RUNBOOK-2026-11-04.md.


## 4 November 2026: live owner-approved WAF block confirmed

- Preflight: GET /api/intake/status returned accepting:false; the test used no user identity, personal data, real reports or Turnstile tokens.
- From NightKnightPC, exactly 11 synthetic invalid POST requests to /api/intake/submit completed in 310 ms. Requests 1-10 returned 503; request 11 returned 429 and probing stopped.
- Cloudflare GraphQL Security Events returned one exact Ray ID match, action=block, source=ratelimit, correct path, valid rule ID, UTC time 2026-11-03T22:59:24Z. No raw Ray IDs or source IP addresses are committed to GitHub.
- After waiting beyond the mitigation timeout, a 12th and last invalid POST returned origin HTTP 503 again.
- Public intake remained disabled; read-only D1 counts afterward showed zero submissions, audit records and reporter links, with no database writes.
- This proves a single real rate-limiting block and later recovery. It does not establish universal distributed abuse resistance.
- For safety, production AURORA_INTAKE_WAF_REVIEWED and all other launch flags were NOT changed. Separate privacy, legal, Turnstile and moderator checks remain pending.


## Owner-only real Turnstile diagnostic (4 November)

Added isolated signed-Access-protected /api/moderation/turnstile. It exposes only a public site key, requires a genuine action aurora_report challenge and uses Siteverify with the encrypted Pages secret. Its POST never accesses private reports or D1. The daily anonymous prelaunch monitor now includes this route as a twelfth GET check. The real challenge remains unverified until an owner successfully completes it in a browser, and public intake remains OFF. See docs/OWNER-TURNSTILE-DIAGNOSTIC-2026-11-04.md.


## Real Turnstile diagnostic failure observed 4 Nov 2026

Owner screenshot: Cloudflare widget displayed Success while AURORA diagnostic showed FAIL. The production Turnstile gate remains unverified. Added sanitized server failure classes and a retryable diagnostic; this is a diagnostic improvement, not proof that the underlying credential configuration is corrected. No secrets or real tokens have been inspected or logged. Refer to docs/OWNER-TURNSTILE-DIAGNOSTIC-2026-11-04.md for follow-up.
