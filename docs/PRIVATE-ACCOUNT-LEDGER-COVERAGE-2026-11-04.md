# AURORA — owner-only private account erasure-register coverage

4 November 2026. Read-only groundwork, NOT actual deletion, GDPR compliance, historical backup certification or permission to enable public intake.

## Purpose

The owner can now check that every CURRENTLY linked private D1 report for an independently verified Supabase account has an entry in the separately protected external erasure register. This prevents an incomplete current-record list from being mistaken for a complete account deletion plan. It is a supplement to, not a replacement for, the existing isolated restore guard.

The private internal function inspectPrivateAccountLedgerCoverage(db,{authUserId,register}) is in worker/privacy-rights.js. There is NO public API route, scheduler, browser exposure, write action or automated account deletion.

## Private owner operating sequence

1. Independently verify the requester's Supabase Auth identity using private administrator controls. A supplied UUID, email message or receipt alone cannot prove identity.
2. Obtain the restricted, version-one external erasure register approved under a legally reviewed policy, kept OUTSIDE D1 and GitHub. This helper checks entry syntax and duplicates but does NOT authenticate the register's provenance or historical completeness.
3. In a trusted, restricted operator environment call the function using a private D1 binding, the independently verified Auth UUID and the owner-held register. Its read-only SQL obtains only report link IDs and publication state in memory, never report text, emails, coordinates or audit rationales.
4. Review aggregate-only counts: currently_unregistered highlights missing ledger entries; nonquarantined_or_orphaned highlights a publication or corrupt-state problem. Inventories over 500 links fail closed rather than silently being truncated.
5. Independently run inspectRestoredPrivateErasures against a securely isolated old backup and the verified register. Inspect all resurrections and conflicts. A complete live inventory does NOT certify historic deletions or Google Drive/D1 Time Travel reconciliation.
6. Supabase Auth deletion, external processors, lawful exceptions, owner approval and restricted privacy-case responses remain separate mandatory checks.

No account identifiers or report IDs are returned. The function ALWAYS reports sufficient_for_deletion:false, sufficient_for_public_launch:false, database_writes:0, provenance and processor verification false. Even zero live records do not yield a green current coverage status; empty D1 cannot prove historic deletion.

## Tests and bounded scope

The synthetic tests/privacy-account-ledger-coverage.test.mjs uses actual migrations in isolated SQLite with two different fake account IDs. Checks full and missing coverage, cross-account isolation, empty or previously deleted records, orphaned/published links, invalid/duplicate register, invalid identity, 501-row overflow, SQL failures and aggregate-only outputs. The read-only SQL is asserted to avoid private report content fields.

    node --test tests/privacy-account-ledger-coverage.test.mjs tests/privacy-retention.test.mjs tests/privacy-restore-guard.test.mjs

No production D1 change or real personal data access is authorized by this test.

## Still required for launch

- Independently approved legal/privacy scope and retention policy, including erasure register ownership and backups.
- Controlled real Supabase Auth admin deletion and post-deletion authentication check.
- D1/Drive historic backup reconciliation using the genuinely protected and complete external register.
- Live different-email Access denial proof and owner-approved end-to-end reporting flow.
- Observation of the next unattended encrypted backup run.

Do not confuse this current-record coverage check with verified destruction or legal readiness.
