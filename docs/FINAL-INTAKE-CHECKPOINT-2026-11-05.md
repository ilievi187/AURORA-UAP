# AURORA — public-report release checkpoint, 5 November 2026

**Decision: NO-GO for public report submission.** This is an operational test record, not legal advice or a GDPR certification. Do not change production flags `AURORA_INTAKE_ENABLED`, `AURORA_INTAKE_LEGAL_APPROVED`, or `AURORA_INTAKE_WAF_REVIEWED` based on these tests. Public reports and automatic publication remain OFF.

## Current production read-only checks

- On 5 November (Europe/Sofia), an external, unauthenticated, no-cookie, no-redirect HTTP sweep checked exactly 17 URLs in `scripts/check-private-release-readiness.mjs`: **17/17 PASS**.
- `GET /api/intake/status`: HTTP 200; `accepting:false`, `mode:"local_draft_only"`, `automatic_publication:false`, `attachments_enabled:false`, `auth_required:true`; no `site_key`; no-store cache.
- `GET /privacy`: HTTP 200; contains separate BG and EN notices and names Supabase Auth, Brevo, and GDPR.
- `GET /api/account/privacy` anonymously: HTTP 401 with private/no-store caching. No receipt inventory was released.
- All 14 private moderator/editor route variants returned HTTP 302 to Cloudflare Access or HTTP 403, with no protected HTML/API disclosure. This tests anonymous access **only**.
- One deliberately empty JSON POST to `/api/intake/submit`, with correct same-origin header and no personal data, returned HTTP 503 `intake_disabled`. No real report was submitted. Do not repeat as a rate-limit/load test.

## Fresh isolated synthetic regression

A clean, detached temporary Git clone at main `2d7d164`, with pinned project npm dependencies, ran:

```sh
node --experimental-sqlite --test \
  tests/access-denial-matrix.test.mjs \
  tests/privacy-auth-restore-rehearsal.test.mjs \
  tests/backup-recovery.test.mjs \
  tests/report-to-moderation-journey.test.mjs \
  tests/private-release-readiness.test.mjs
```

**16/16 tests passed, 0 failed.** Tests covered signed wrong-email JWT denial without any D1 query, private report ownership, synthetic Supabase account erasure + old-backup resurrection detection/reconciliation, failed-provider and incomplete-ledger stopping rules, and the test-only reporter → moderator → private receipt flow without public publication. All identities, JWTs, databases, and Turnstile results were fake; no private production records, authentication identities or stored backups were created, changed or read. The disposable clone was removed.

## NightKnightPC backup

- On 5 November before the next automatic run: `aurora-d1-backup.service` last returned `Result=success`, `ExecMainStatus=0`, last completed **4 Nov 2026 at 21:09:46 EET**; the independently verified encrypted local and private Drive copy is documented in `docs/LAUNCH-READINESS-2026-11-04.md`.
- `aurora-d1-backup.timer`: `ActiveState=active`, next scheduled **5 Nov 2026 04:14:11 EET**. **This future run is NOT yet proven successful.** Recheck after it executes. Do not display or copy credentials, decrypt real backup content in chat, or manually start the production backup merely to satisfy the gate.

## Exactly three outstanding human-dependent release gates

1. **Real unauthorized identity denial**: using an independently controlled, non-allowlisted mailbox, exercise the normal Cloudflare Access OTP login and confirm genuine edge denial across moderator/editor UI and APIs. No second mailbox is currently supplied. Anonymous denial and offline fake signed JWTs cannot replace this test. Keep the existing policy unchanged.
2. **Privacy, retention, erasure and processor review**: obtain qualified BG/EU review of the real controller contact/address requirements, lawful basis for account/report/security logging, free-text third-party data and minors, processor agreements/transfers (Cloudflare, Supabase, Brevo), operational retention windows, rights-request handling, and independent erasure register including encrypted Drive backups/D1 Time Travel. Tests prove technical safeguards, NOT full rights-process or legal compliance. EU guidance: [European Commission — information for individuals](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en), [EDPB — legal basis](https://www.edpb.europa.eu/topics/key-gdpr-concepts/legal-basis_en), [EDPB coordinated enforcement — erasure challenges](https://www.edpb.europa.eu/system/files/2026-02/edpb_cef-report_2025_right-to-erasure_en.pdf).
3. **Separately approved authentic reporter-to-moderator end-to-end walkthrough**: only after gates 1 and 2, a disposable independently verified reporter submits one fictional no-PII text report with a genuine Turnstile token, receives a private receipt, and an Access-authenticated owner moderates it. Verify private D1 audit, ownership, no public publishing, emergency-off and rollback. Obtain explicit owner **go/no-go** before enabling general public submission. No upload or automatic publishing.

## Release constraints

- There are **zero new permissions** in this checkpoint. No changes to user identities, Cloudflare dashboard, WAF, D1 production data, private Google Drive backups, retention policy or legal flags.
- Keep `AURORA_INTAKE_ENABLED` disabled. Do not change `AURORA_INTAKE_LEGAL_APPROVED` until competent review is received; do not manufacture a second account or bypass Cloudflare Access. The report form remains local-draft-only.
- Never mark a test PASS on the basis of simulated results alone when the gate explicitly requires genuine production/identity evidence.
