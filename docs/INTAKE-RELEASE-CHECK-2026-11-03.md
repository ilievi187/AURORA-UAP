# AURORA — real observation intake release checklist (3 Nov 2026)

This is an operational checkpoint, **not** authorization to turn on production intake or a declaration of legal approval. Only real submissions acknowledged HTTP 202 by production count as accepted.

## Independently observed in the owner's production environment (3 Nov 2026)

- `GET https://aurorauap.org/api/intake/status` responded HTTP 200 and `accepting:false, mode:local_draft_only, attachments_enabled:false`.
- Unauthenticated `/moderation` and `/api/moderation/` redirect to Cloudflare Access login (302). This does **not** prove a currently authenticated moderator can view/audit the queue.
- Authenticated Wrangler **read-only** remote query of existing `aurora-uap-production` D1 returned both `intake_submissions` and `intake_review_events` tables. No schema migration was applied, no submission inserted, no database changed.
- The previously deployed `/privacy` was an HTML homepage fallback, not a privacy notice. This PR adds `privacy.html` and static rewrites; verify the actual deployed route after merge.
- Wrangler production Pages secret list showed the four encrypted moderator Access bindings but **did not show** `AURORA_TURNSTILE_SECRET`. A plain environment value is not an adequate way to store the Turnstile secret; provision a production encrypted secret after creating/reusing a hostname-restricted widget.
- Owner-confirmed controller/contact and retention targets exist in `docs/PRIVACY-NOTICE-REVIEW.md`; that document explicitly remains under review. An informational page is not a legal sign-off.

## Must finish before setting `AURORA_INTAKE_ENABLED=enabled`

1. **Privacy:** Review and finalize BG/EN notice with the owner and appropriate Bulgarian/EU privacy guidance. Verify legal basis, relevant technical processing, processor/subprocessor transfers, children's/third-party data policy and an effective deletion/rights request process. Update the actual public notice accordingly. Do not mark `AURORA_INTAKE_LEGAL_APPROVED=yes` merely because HTML exists.
2. **Database:** Verify the real production `DB` binding is the same D1 as queried, full expected column schema, backups/restore and Access-protected moderator queue. Read-only schema checks passed for table existence only. The audit/event tables are already present; **do not re-run migrations blindly**.
3. **Turnstile:** Create or reuse a managed Cloudflare Turnstile widget limited to `aurorauap.org`. Save site key as production Pages variable `AURORA_TURNSTILE_SITE_KEY` and the secret as a production **encrypted secret** `AURORA_TURNSTILE_SECRET`. Backend validates hostname + action `aurora_report`. Never put the secret in git, issue descriptions or command logs.
4. **WAF:** Verify a rule for POST `/api/intake/submit` is actually applied and tested with a safe test schedule. An initial example is a reasonable per-source-IP rate limit such as five requests/minute with temporary mitigation; adjust to actual plan and observed traffic. Only then mark `AURORA_INTAKE_WAF_REVIEWED=yes`.
5. **Retention/deletion:** Implement/verify scheduled or operator-run 90-day rejected-report purge, 180-day review queue escalation, 12-month approved re-assessment, data-subject deletion workflow and handling of backups/audit logs. The repository has a bounded dry-run-first retention worker but does **not** itself schedule or enable purges.
6. **Authorization:** Independently verify authorized moderator login, wrong-user rejection, fail-closed preview, signed JWT, audit and queue pagination, including protection of `/moderation.html` and the API.
7. **Only last:** After verified settings and review, set `AURORA_INTAKE_LEGAL_APPROVED=yes`, `AURORA_INTAKE_WAF_REVIEWED=yes`, `AURORA_INTAKE_POLICY_VERSION=intake-v1-reviewed`, `AURORA_INTAKE_POLICY_URL=https://aurorauap.org/privacy`, `AURORA_INTAKE_HOSTNAME=aurorauap.org`, then `AURORA_INTAKE_ENABLED=enabled`. Use production-only bindings; no preview enablement. Redeploy.
8. **Smoke:** Status must return `accepting:true`; use one fictional, no-personal-data form submission with a real Turnstile token and require HTTP 202 + receipt. Confirm it appears only in private D1 moderation, **not** public cases. Test non-owner moderator denial, origin/captcha failure and emergency disable. Do not send live tests while status is false.

## Current scope

The implemented intake is **text only**. Files and media uploads will require private R2 quarantine, authenticated media inspection, MIME/size/content checks, malware handling, retention and explicit publication rights. Do not enable upload fields with a public bucket or a fake attachment UI. Email notifications and public search of submitted reports are also not implemented.

## CI

- `node --test tests/privacy-route.test.mjs`
- `node --experimental-sqlite --test tests/intake.test.mjs tests/moderation.test.mjs tests/privacy-retention.test.mjs`
- Verify deployed `https://aurorauap.org/privacy` actually contains bilingual notice rather than the homepage.

Use `docs/V1.7-LIVE-SUBMISSION-ACTIVATION.md` and `docs/PRIVACY-NOTICE-REVIEW.md` for additional configuration and legal details.

## Architecture update (owner direction, 3 Nov 2026) — free reports with verified email

- Donations are optional. No payment, donor record or minimum donation may be required to submit a report. Do not create a donor-email allowlist for reports.
- Reporting now has an additional **mandatory verified-email identity gate**, configured separately from owner-only Cloudflare Access moderation, via Supabase Auth. Google, Apple, X and email magic link/OTP are supported by staged code; only expose providers actually configured and tested.
- Auth-server verification of email confirmation is mandatory on every submit; X sign-in alone without an email confirmation is not enough. Apple relay email addresses are allowed.
- New D1 migration `0005_reporter_ownership.sql` adds only a pseudonymous private identity-to-report link. It has **not** been applied to production by the code merge. `intakeSchemaReady` refuses to activate until it exists.
- Production requires `AURORA_REPORT_AUTH_ENABLED=enabled`, a Supabase project `AURORA_REPORT_AUTH_URL`, a **publishable/anon-only** `AURORA_REPORT_AUTH_PUBLISHABLE_KEY`, and comma-separated enabled `AURORA_REPORT_AUTH_PROVIDERS` in addition to all previous release gates. Do not set a privileged `service_role` key in client code.
- The public privacy notice has been updated to disclose account email/identity and Supabase, but provider processors/transfers, account deletion, hosting terms, and an independent privacy review remain blockers. Details: `docs/VERIFIED-REPORTERS-SETUP-2026-11-03.md`.
- Test account and migration must be configured in a private staging environment first. No real account login or public submission may be claimed based on CI mocks.


## Safety evidence update (3 November 2026, after original audit)

- **Verified email and SMTP**: an owner test invite was delivered by Brevo to the Gmail inbox, and the Supabase identity was subsequently recognized as verified in the live report page. Public report submission remains disabled.
- **Private schema**: production migration `0005_reporter_ownership.sql` has since been applied and verified; D1 read-only `PRAGMA foreign_keys` returned `1` and count-only queries found 0 submissions, 0 audit events and 0 reporter links. Do not rerun migrations.
- **Moderator**: the authorized owner opened the Access-protected dashboard and received an empty, styled queue. Anonymous page/API requests redirected to Access; wrong-account login has not been independently demonstrated.
- **Turnstile**: production Pages has a public `AURORA_TURNSTILE_SITE_KEY` text value and an encrypted `AURORA_TURNSTILE_SECRET`. This proves the variables were configured, **not** that a real siteverify challenge has passed.
- **WAF**: zone rule `AURORA intake rate limit` is active, matches exact host `aurorauap.org`, method `POST`, path `/api/intake/submit`, source IP, 10 requests/10 seconds, Block for 10 seconds. **No load/burst test has been run**; do not mark WAF reviewed merely from the configuration.
- **Privacy/deletion improvement**: bilingual notice now names Brevo as the transactional email provider and accurately discloses that Auth operates even while reports are disabled. Local tests cover private retention and owner-approved erasure of a matching quarantined report and its ownership/audit records. **No erasure has run in production.** Supabase account erasure, backup handling, authorization, request tracking, provider transfer terms, and final legal review remain operator tasks.
- **Never activate prematurely**: leave `AURORA_INTAKE_ENABLED` disabled, and do not set WAF/legal readiness flags until their real-world verification is complete.

## Read-only prelaunch release verification (3 Nov 2026)

The reproducible, bounded checker scripts/check-private-release-readiness.mjs --live and offline CI tests confirm closed intake, no-store status, private Access routes, and BG/EN processor disclosures. See docs/RELEASE-SECURITY-EVIDENCE-2026-11-03.md for limitations and the Supabase password protection warning. These tests do not prove real WAF burst mitigation, full Turnstile challenge acceptance, denied-account access or legal compliance.
