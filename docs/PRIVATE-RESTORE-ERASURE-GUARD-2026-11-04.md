# AURORA — detect erased private reports in an older restored backup

4 November 2026. Operator guide and **synthetic regression only**. This does not authorize production restore, real user data deletion, or launching report intake.

## Risk

A Google Drive / Cloudflare D1 backup made before an approved erasure request can reintroduce an erased report, private moderator audit entries and the Supabase ownership link. Even when SQLite integrity_check returns ok, the restored records can violate a subsequent erasure.

The internal, READ-ONLY worker/privacy-restore-guard.js helper inspects a restored isolated D1 or SQLite snapshot against an independent owner-held approved erasure register. It returns counts only; it does not erase records, read report descriptions, contact Supabase, modify the database or expose any public endpoint.

## Independent private erasure register

- The owner must establish an encrypted, restricted ledger of only already-approved erasures, OUTSIDE the database and backups being restored. Establish legal retention, authenticity, completeness and a secure key location independently.
- Input shape for the internal helper: version equal to 1, entries array (at most 500 per inspection). Every entry contains ONLY receiptId and authUserId as verified from the private account link table. Do not store names, emails, full report bodies or free-form notes in this input.
- Receipt IDs and Auth UUIDs are still personal information. NEVER put the real manifest in Git, a PR, an AI chat, plain terminal output or unencrypted storage. Use a restricted maintenance session and memory-only ephemeral copies where practical.
- Duplicate IDs, invalid IDs and unexpected fields are rejected. A correct-looking manifest does NOT prove it is current or complete.

## Operator-only restoration procedure

1. Obtain owner approval, verify lawful retention/recovery and stop new intake writes. Never restore production as a test.
2. Use an isolated, access-restricted staging database and decrypt only in a trusted temporary environment. Check integrity, schema, foreign keys and current D1 migrations.
3. Independently validate the external erasure register and use inspectRestoredPrivateErasures(db,{register}) on the isolated database.
4. Review only returned aggregate counts: absent, resurrected, wrong owner, missing ownership link, unexpected audit/owner metadata, or inconsistent publication state.
5. Any unresolved count means STOP. A published, conflicted or unlinked record must never be automatically deleted. The existing owner-approved single-report erasure helper is a separate, controlled process.
6. After an approved reconciliation, rerun the read-only check. Even a clean result explicitly returns sufficient_for_public_launch:false.
7. Independently reconcile Supabase Auth accounts, Cloudflare D1 Time Travel, Google Drive encrypted copies, Brevo processor data and public dossier material. Handle legally required retention exceptions.
8. Require a fresh independent operator and privacy sign-off before connecting any restored instance to the live site.

## Synthetic testing

    node --test tests/privacy-restore-guard.test.mjs tests/backup-recovery.test.mjs

Tests use fictional reports and a real temporary SQLite snapshot, detect resurrection before reconciliation, validate an already-removed report, prove unchanged unrelated accounts and zero D1 writes, and reject incomplete/malformed private ledgers. No real credentials, private records or deletion requests are used.

The daily backup timer is NOT proof of a legally approved archival retention or erasure procedure.

See docs/BACKUP-RECOVERY-PRIVACY-2026-11-03.md and docs/ACCOUNT-PRIVACY-OPERATIONS-2026-11-04.md.
