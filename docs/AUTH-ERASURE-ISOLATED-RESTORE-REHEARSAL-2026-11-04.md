# AURORA — isolated account erasure, Auth revocation and old-snapshot rehearsal

**4 November 2026: Synthetic test only; no real Supabase Auth user deleted, no production D1 changed, and no public report intake enabled.**

## Purpose and audited workflow

Existing AURORA operator building blocks now have an integrated OFFLINE regression simulating the full erasure lifecycle:

1. Local fake Supabase Auth validates two distinct fictional account identities and user bearer tokens. The private /api/account/privacy endpoint lists only the signed-in owner's quarantined receipt IDs; no cross-account leakage. Live report submissions remain disabled.
2. A read-only D1 account erasure preview counts the owner's private reports and related audit entries. The owner-held independent version-one ledger is cross-checked against each CURRENT owner-scoped report ID. This does NOT validate ledger provenance or historical completeness.
3. A real synthetic SQLite database snapshot is created BEFORE deletion in an isolated temporary directory; it contains NO production data.
4. After a simulated separately approved erasure request, the owner-only D1 helper deletes two fictional reports, linked ownership records, and private audit events without touching the second fictional account.
5. A simulated successful Supabase administrator deletion disables the fictional owner's Auth session; /api/account/privacy now returns HTTP 401 WITHOUT even querying D1. This is a fake Auth service, not a real Supabase revocation proof. The unrelated second fictional identity remains active.
6. Opening the OLD SQLite snapshot resurrects both deleted reports, their private review histories and ownership links. The independent erasure-restore guard detects two resurrected records and marks restoration unsafe. Repeating approved local erasure only within this isolated copy reconciles those records; other-account data remains untouched.
7. Even with complete synthetic reconciliation, the guard continues to return sufficient_for_public_launch:false. The synthetic snapshot is removed after testing.

## Fail-closed conditions demonstrated

- A missing current report in the erasure register stops the planned process. There is no automatic mass deletion.
- If simulated Supabase administrator deletion fails, a successful D1 deletion does NOT mark the account gone; the Auth session remains active and a reviewer must investigate the incomplete erasure.
- The single-report D1 erasure SQL now rechecks both owner AND quarantine status inside the D1.batch statements, not just in the preceding read. D1.batch commits statements affecting zero rows without automatically rolling back earlier successful deletions. A state change to published or an ownership reassignment between the eligibility read and the batch previously risked deleting the audit or link while leaving a report untouched. The first delete only targets confirmed, currently quarantined owner-linked rows. Ownership-link cleanup only proceeds when the submission is truly absent. Synthetic race tests assert intact report, audit, and link when a report becomes published or moves to another account in that gap.

## Runbook: one-command synthetic proof

    node --test tests/privacy-auth-restore-rehearsal.test.mjs tests/privacy-retention.test.mjs tests/privacy-restore-guard.test.mjs tests/privacy-account-ledger-coverage.test.mjs tests/backup-recovery.test.mjs

All tests run on fictitious data in local SQLite and a fake in-process Supabase Auth responder. They require no service-role token, production database, Cloudflare D1 token, Google Drive data, or live Auth user.

## REAL SUPABASE ADMINISTRATIVE TEST STILL REQUIRED (not authorized here)

For an actual controlled test, independently arrange an explicitly designated expendable Supabase Auth test user (never the real operator). First secure a reviewed backup and the external erasure register; obtain specific owner approval for its deletion, scope and retention consequences. Test the real Supabase Auth administrative removal through authorized admin controls in a restricted environment. After deleting only that agreed test identity, verify that the existing bearer token is rejected through the actual /auth/v1/user endpoint and that the account cannot access AURORA private receipts; consider token-expiry and soft-delete behavior. Verify D1 ownership/audit cleanup, Supabase Storage and providers, and isolated recovery reconciliation. Keep actual service-role secrets off GitHub, browser code and chat.

A real test user may still require independent identity, legal basis, retention and procedural review. Do NOT create, delete, or modify any real Supabase account automatically simply to satisfy this checklist.

## Security/legal boundary

Encrypted daily D1 backup and synthetic old-snapshot reconciliation are technical evidence, not legally approved retention, compliant erasure of all processors, historical ledger completeness, or a go-live authorization. The external rights register itself can contain personal identifiers and must be access-restricted and separately retained under a reviewed policy. An outdated backup may resurrect private records even if SQLite integrity_check is healthy.

Other remaining production release gates: qualified BG/EU privacy and processor/legal review, real different-email Cloudflare Access denial, real consented owner/reporting walkthrough, verified Supabase administrative erasure, old-backup reconciliation policy, confirmation of next unattended backup run, and explicit operator go/no-go.

Supabase advisory on password security (noncritical warning during this audit): https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
