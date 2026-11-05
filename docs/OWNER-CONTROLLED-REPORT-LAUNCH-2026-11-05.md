# AURORA UAP — owner-controlled report intake launch (5 Nov 2026)

**Purpose:** One operational path to launch **private text-only reporting**. This consolidates earlier repeated checks. Do not rerun already passing tests merely to satisfy a checklist. This document is not legal advice or an assertion that any unfinished step has passed.

## Decision about GDPR advisers and the second email

The GDPR does **not** universally require an external lawyer, GDPR consultant, or DPO for every small independent website. The owner/controller can conduct and document a proportionate self-assessment. Whether a DPO or DPIA is required depends on the actual scale and risk, not whether a consultant is hired. **Choosing self-review does not waive GDPR duties.**

Official references: [EDPB SME DPO guidance](https://www.edpb.europa.eu/sme/be-compliant/data-protection-officer_en); [EDPB lawful basis and consent](https://www.edpb.europa.eu/sme/be-compliant/process-personal-data-lawfully_en); [EU GDPR Article 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng).

The existing Cloudflare Access owner-only rule was reviewed from a dashboard screenshot: one exact Email `Allow` rule linked to the moderation app; no broad `Everyone` or `Bypass` in that policy. Anonymous routes are blocked, and different-account signed JWTs are denied in isolated tests. **A genuinely independent non-allowlisted sign-in has not been completed.** It is additional assurance, *not itself a GDPR legal obligation*. The operator should document either an independently tested denial or a specific residual-risk decision based on existing layered protections; do not label the missing test PASS.

## Reuse these completed engineering results

- The site and reporter-authenticated account/receipt UI are deployed. Reporter login is free and separate from donations.
- Server requires a fresh verified email, 18+ self-attestation, 50–5,000 character description, genuine Turnstile Siteverify, canonical HTTPS origin, policy confirmation and a transactional D1 private record. No attachments or mandatory contact fields.
- A moderator with signed Cloudflare Access identity can review. `approved` remains **quarantined**, never a public dossier.
- Genuine production owner Turnstile diagnostics passed after PR #153; real WAF rate limiting and recovery were observed.
- Isolated reporter→moderator tests, private receipt ownership, erasure/recovery safety tests and anonymous route audits passed. Those are not the same as a genuine live full-flow report.
- Postlaunch monitor is in `main` (PR #169); it stays in prelaunch mode until authorized launch.

## Minimal owner-led processing decisions to document privately before opening

This is not a request to repeat technical tests. The controller must confirm *actual provider agreements and organizational duties*, which CI cannot inspect.

1. **Purposes / lawful bases:** specify Article 6 legal basis per activity: Supabase email login/account; consensual report and human moderation; Cloudflare security and WAF logs; encrypted D1 backup; future public publication (still separate and OFF). The currently implemented checkbox is for voluntary *private report moderation* only. Consent must be withdrawable. Assess whether legitimate interests apply to service security, with balancing where used.
2. **Transparent notice:** record approved `/privacy` BG/EN wording, controller contact and how reporters request access, withdrawal or erasure. Do not state that merely checking a box cures any lawful-basis or third-party-data issue.
3. **Processors and transfers:** verify contracts/DPAs applicable to these actual accounts (Cloudflare Pages/D1/Access/Turnstile, Supabase Auth, Brevo and encrypted private Google Drive), current subprocessors, transfer arrangements and relevant retention terms. Public provider pages alone are not account-level acceptance evidence.
4. **Data minimization / safeguarding:** 18+ self-attestation is not independent age verification; forbid witnesses' names, children, exact addresses and special-category data in reports. Remove accidental third-party personal data on receipt/triage. No automatic publication; assess DPIA need against the real risk.
5. **Retention / subject rights:** owner previously selected 90 days after rejecting, 180 days to review pending and 365 days to reassess approved-but-unpublished reports. Confirm a *working* routine (manual scheduling is possible) and person responsible; account deletion is separate from D1 erasure. Document how backup copies and D1 Time Travel are reconciled after erasure, and the security/transactional-email log retention. Do not promise automatic deletion until it is operational.
6. **Controller outcome:** date the private decision as `GO` or `NO-GO` with findings, accepted residual risks, processor evidence and a named emergency-disable operator. Do not publish private account/backup credentials, DPA acceptance screenshots or a witness report in GitHub.

## Production activation — one controlled change window

**Current public status (verified earlier 5 Nov):** `GET https://aurorauap.org/api/intake/status` = `accepting:false`, `mode:local_draft_only`, `auth_required:true`, `automatic_publication:false`.

After the real owner processing review is recorded, **and not before**, the authorized Cloudflare operator uses the existing production Pages project bindings; do not change any Access allowlist or reveal secret values:

- Verify D1 binding `DB` and required tables `intake_submissions`, `intake_review_events`, `intake_reporter_links` exist, without reading report content.
- Retain existing live `AURORA_TURNSTILE_SITE_KEY`, private `AURORA_TURNSTILE_SECRET`, Supabase publishable Auth URL/key, verified-email provider, and configured moderator Access team/audience/email.
- Match the code gates: `AURORA_INTAKE_HOSTNAME=aurorauap.org`, `AURORA_INTAKE_POLICY_URL=https://aurorauap.org/privacy`, `AURORA_INTAKE_POLICY_VERSION=intake-v1-reviewed`, `AURORA_REPORT_AUTH_ENABLED=enabled`, `AURORA_MODERATION_ENABLED=enabled`; change `AURORA_INTAKE_LEGAL_APPROVED=yes` **only after owner processing decision**, `AURORA_INTAKE_WAF_REVIEWED=yes` only after confirming previously documented live WAF evidence, and `AURORA_INTAKE_ENABLED=enabled` **last**.
- The first real POST is an independently authenticated, fictional, no-PII test with a genuine new Turnstile token and same-origin request; verify HTTP 202 pending/private receipt, report owner inventory and moderator queue, owner-only review and **no public output**. Keep intake OFF if this cannot be validated without private token leakage.
- After controlled launch, explicitly set GitHub Actions repository variable `AURORA_RELEASE_MONITOR_PROFILE=postlaunch`, run `AURORA public-report privacy boundary monitor` once, and confirm the same 17 anonymous GET gates pass. This monitor never submits reports.
- **Emergency rollback:** disable `AURORA_INTAKE_ENABLED` first; confirm public status `accepting:false`; revert monitor profile to `prelaunch`. Leave D1 data, Access protections and audit records intact pending private review.

## Why the final switch has not yet been executed from this chat

The current Chat-side browser connector is **read-only**; existing Cloudflare production variables cannot be changed from it. The available connected CLI machines did not expose a configured Wrangler command, while the previously authorized NightKnightPC device is offline. GitHub deployments by themselves do not set the missing Cloudflare production flags. This is an **access limitation**, not a new request for an external privacy consultant or a fresh re-run of existing tests.

**Release status today: technical implementation ready; public reporting not yet enabled.** Never claim the launch succeeded until `accepting:true`, the genuine controlled report and owner-only moderation evidence are all observed.
