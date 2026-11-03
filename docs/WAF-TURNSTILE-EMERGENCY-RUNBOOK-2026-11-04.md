# AURORA — WAF, Turnstile, and emergency intake shutdown

Operational draft updated 4 November 2026. A bounded single-source live WAF block is now confirmed via Cloudflare Security Events. This does NOT authorize public intake and does not prove global protection against distributed abuse.

## Configured Cloudflare rate limit (dashboard-reviewed, not traffic-tested)

- Rule: AURORA intake rate limit (active on the Free plan).
- Match: host aurorauap.org, method POST, exact path /api/intake/submit.
- Source-IP counter: 10 requests per 10 seconds, action Block for 10 seconds.
- The cloud dashboard showed one rule out of one available rate-limiting rule. No rate-limit burst was performed.
- VERIFIED LIVE on 4 November 2026 00:59 EET: exactly eleven synthetic invalid POSTs from the owner-controlled NightKnightPC to the correct path, completed in 310 ms. Requests 1-10 received origin HTTP 503; request 11 received HTTP 429 and testing stopped immediately.
- Cloudflare GraphQL firewallEventsAdaptive independently returned a matching exact Ray ID and rule ID with action=block, source=ratelimit and correct path, at 2026-11-03T22:59:24Z.
- After the mitigation window a 12th and FINAL invalid POST received origin HTTP 503, demonstrating recovery.
- Production intake remained disabled; read-only D1 counts after test: 0 private submissions, 0 audit events, 0 reporter-account links. No writes were made.
- This confirms one real single-source WAF block, not universal behavior across all Cloudflare colos or distributed abuse. Review flags are deliberately unchanged while other launch gates remain incomplete.
- Raw Ray IDs are stored privately on the owner's workstation with file mode 0600 and MUST NOT be committed, disclosed or inserted into public logs.

## Origin-side protection

The submit handler now rejects noncanonical paths with 404 before reading JSON, verifying email via Supabase, checking the challenge via Cloudflare Siteverify, or touching D1. Tests cover trailing slash, extra segment, suffix, encoded slash and uppercase route variations. This limits the risk of alternate Pages routes bypassing the exact-path WAF rule.

Cloudflare recommends matching origin URL normalization and edge-path configuration:
https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/

## Repeating a controlled LIVE rate-limit test — explicit owner approval required

DO NOT run this through CI or scheduled checks.

1. First verify the production status reports accepting:false and automatic_publication:false. Confirm no visitor reports can be accepted, and review private D1 counts without reading any report contents.
2. Obtain owner approval for a narrow time window and a dedicated test IP that is NOT shared with real visitors. Open Cloudflare Security Events with the exact rate-limit rule selected.
3. Record the current rule expression, enabled state, requests/period, IP counting characteristics, action and timeout. Confirm the path is still exact before generating traffic.
4. From the dedicated test source, send AT MOST 12 small, sequential, deliberately INVALID POST requests to the exact URL https://aurorauap.org/api/intake/submit within the 10-second window. Use only synthetic invalid JSON and the same-origin Origin value; no real reporter account, Turnstile token or personal data.
5. Stop at the FIRST Cloudflare mitigation, unexpected error, effect on real visitors, or the 12th attempt. Do not retry or schedule additional bursts. An origin 503 is NOT evidence of a WAF block. Cloudflare Block may use HTTP 403, not necessarily 429.
6. Match a Ray ID, source IP, UTC timestamp and rule name/ID with a Block event in Cloudflare Security Events. Only this correlation proves the rule blocked this particular test. If events are missing or ambiguous, report INCONCLUSIVE, not pass.
7. Check that no new private D1 report, ownership or audit row was stored. Wait beyond mitigation. A single optional check afterward also requires approval.
8. Save only sanitized operational evidence. Cloudflare counters are per characteristic combination and data center; one successful test does not establish global abuse resistance.

References:
https://developers.cloudflare.com/waf/rate-limiting-rules/request-rate/
https://developers.cloudflare.com/waf/rate-limiting-rules/parameters/

## Emergency stop — only if intake is ever separately authorized to open

1. In Cloudflare Pages PROJECT PRODUCTION settings, set AURORA_INTAKE_ENABLED to off or remove it, then initiate a PRODUCTION redeployment. A setting edit alone may not change already deployed Workers. Leave login, D1, moderator and secret bindings unchanged.
2. If an active attack requires immediate edge containment while redeploy is pending, an authorized zone owner may create a temporary custom WAF Block rule with expression:
   http.host eq "aurorauap.org" and http.request.method eq "POST" and http.request.uri.path eq "/api/intake/submit"
   Check the custom-rule quota and other rules first; emergency rule changes require separate owner authorization.
3. Verify a new production deployment is ACTIVE. Poll GET https://aurorauap.org/api/intake/status until accepting:false, mode:local_draft_only, automatic_publication:false and attachments_enabled:false.
4. The origin gate rejects new submissions before parsing user JSON or verifying Supabase, Turnstile or D1. Synthetic tests confirm this; actual in-flight requests from the prior deployment may still complete.
5. Do not erase or publish existing private reports as part of emergency shutoff. Audit independently and preserve encrypted Drive backups and the separate rights erasure ledger.
6. Remove an emergency WAF Block rule only after owner review. Never automate re-enabling intake or flipping WAF/legal approval flags.

## Managed Turnstile readiness

The production site key and encrypted secret have been configured and the code strictly requires successful Siteverify for exact hostname aurorauap.org and action aurora_report. Cloudflare's official dummy keys are refused by the production activation gate. Dummy success/failure and replay checks prove application logic, NOT a real challenge.

A real verified-email account plus managed production Turnstile challenge must be tried with a single fabricated, no-personal-data report ONLY after privacy, retention and WAF conditions are independently cleared and an owner explicitly authorizes the staged live test. Confirm the pending report enters the private queue only, no public case is published, and the emergency shutoff works.

## Launch status

Still blocked: GDPR and processor review, actual account/backup erasure process, bounded WAF edge event proof, real Turnstile protected submission, and wrong-account Cloudflare Access moderator denial. Do not set the production approval variables based solely on these unit tests.
