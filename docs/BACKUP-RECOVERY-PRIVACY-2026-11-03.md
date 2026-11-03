# AURORA — D1 recovery and privacy reconciliation

Status: prelaunch operating guide, **not authorization to enable intake or restore production**.

## Verified prelaunch facts (3 November 2026)

- AURORA private D1: aurora-uap-production, approx. 135 KB at verification.
- Cloudflare D1 Time Travel returned a current restore bookmark with NO write or restore.
- Cloudflare Workers Free Time Travel history is limited to **7 days**; the Paid tier is **30 days**. Verify the current plan and provider policy before any future restore. Time Travel is not indefinite offsite archival storage.
- Existing protected local SQL file: ~/.local/share/aurora-backups/aurora-d1-before-reporter-links-20261103.sql. Permission 0600; imported successfully into isolated SQLite, integrity_check returned ok. The backup **predates reporter ownership migration 0005**, so it does not represent the current complete schema.
- Production D1 previously reported zero private submissions, review events and owner links. No live row was deleted, exported, restored or edited during this exercise.
- Private report intake must remain disabled until every release gate is independently approved.

## Recovery procedure (requires owner approval before execution)

1. Record the reason, incident time, authorized operator, impacted tables and legal/data retention constraints. Block new private report writes and check whether existing in-flight writes may be lost.
2. **Never restore into production just to run a test.** A D1 Time Travel restore overwrites the live database and can cancel in-flight requests. Use a separate isolated DB/storage environment for rehearsal.
3. Before any export, define approved encrypted offsite destination, a different location for decryption-key custody, access control, integrity manifest, retention, purge and recovery ownership. A host-local SQL file with 0600 permissions is not offsite and is not encrypted.
4. During a separately approved maintenance window, export from D1 using Wrangler with a private absolute output path and umask 077. Cloudflare warns that full exports may block other database queries. Encrypt immediately, move to approved offsite storage, record integrity digest securely, and remove plaintext after encryption and verification.
5. To restore locally from an **approved, trusted** SQL export, create a fresh isolated SQLite/D1 database. Test schema, current migrations, PRAGMA integrity_check, PRAGMA foreign_key_check, private ownership table, counts, indices and public/private data boundaries.
6. **Privacy-critical:** A backup or Time Travel snapshot made before a data-erasure request can bring the deleted report, audit trail and user UUID association back. Maintain a minimal, restricted, separate erasure reconciliation record outside the database being restored. Never log or store full report descriptions in the manifest.
7. Before serving any restored database, independently reconcile all approved erasures against the restored copy and verify the removal of matching rows from intake_submissions, intake_review_events and intake_reporter_links. Reconcile any Supabase account deletion separately, plus Brevo and other processor data requests.
8. Require owner sign-off after comparing restored counts and checking anonymous Access rejection, fail-closed intake flags and rollback readiness. Do not mark successful recovery merely because SQLite integrity_check says ok.

## Demonstrated safe tests

- tests/backup-recovery.test.mjs seeds two completely fictional reports in in-memory SQLite, creates a temporary snapshot using node:sqlite backup, deletes one report with the existing owner-approved helper, then **proves the old snapshot resurrects that deleted private data**. It repeats the deletion in the isolated restored copy, verifies the other report remains intact, checks ownership + audit deletion and public archive isolation, and removes the temporary database automatically.
- The existing local SQL backup was loaded separately in an in-memory SQLite connection for a read-only restore rehearsal. The result was structurally valid, but the account-link table is absent because the backup is from before the migration.

Run safe tests:

    node --test tests/backup-recovery.test.mjs tests/privacy-retention.test.mjs

No test in this repository executes a Wrangler Time Travel restore or produces an unencrypted production export.

## Supabase deletion is a separate step

Supabase Authentication > Users supports owner-controlled account removal. Deleting the Auth user stops future refresh sessions but previously issued JWTs can remain usable until expiry; Supabase Storage-owned objects may block account deletion. AURORA private intake calls the Supabase Auth server to validate submitted access tokens on each request, rather than trusting only client claims. Do not delete an Auth user before reconciling private D1 reports for that UUID, as doing so may complicate proof of ownership.

## Remaining production go/no-go items

- Approve an encrypted offsite backup location and secure encryption-key custody; run a genuinely isolated restore of a current approved backup.
- Adopt a restricted and minimized erasure reconciliation process, with a suitable legal basis and retention period.
- Independently approve processor privacy terms and deletion/backup windows for D1, Supabase and Brevo.
- Real controlled Turnstile/WAF and owner moderation readiness checks; avoid a bulk rate-limit test on live users.
- Obtain final legal review, then explicitly approve operational launch. None of these approvals may be substituted with automated tests.

Documentation:
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/best-practices/import-export-data/
- https://supabase.com/docs/guides/auth/managing-user-data
