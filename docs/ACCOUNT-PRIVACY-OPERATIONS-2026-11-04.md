# AURORA — verified account privacy access and owner-reviewed erasure

Date: 4 November 2026. This is partial technical readiness, not automatic deletion, legal approval, or authorization to open the public intake.

## Reporter-facing workflow

- After verified-email sign-in, the visitor may select View my private reports on the report page, even while public submission is disabled.
- The browser sends the access token only to same-origin GET /api/account/privacy. The server verifies the token with the Supabase /auth/v1/user endpoint before accessing D1.
- Only that verified UUID's private report receipt IDs, statuses, and creation timestamps are returned; at most 50 per page. No email, private description, full report, public dossier, other person's receipt, audit trail or donor information.
- Auth revocation and unconfirmed identities are rejected. Alternate hosts, wrong Origin, cross-site requests, polluted queries, and POST or DELETE fail closed. Responses are private/no-store.
- View results are created using textContent and cleared on sign-out or identity change, never saved in browser localStorage.
- Request account / data deletion is a mailto link to the published privacy address. Opening it does not send an email or erase an account. The requester must send it and identity verification and owner review follow.
- There is no D1 migration or new personal-data storage.

## Owner workflow on an erasure request

1. Receive an actual request through the published privacy contact; acknowledge it without putting email addresses, report text, UUIDs, bearer tokens or receipts in GitHub issues, public logs or chat.
2. Independently verify control of the original Supabase account. Do not rely on a supplied UUID, receipt number, or browser screenshot. Use secure Auth administrative information to correlate the requester with the private link table.
3. Decide scope: report(s), account, full data access, corrections or restrictions, considering legal retention exceptions and third-party/child information. Published dossier material would require a separate privacy assessment.
4. Record approved erasures in an owner-only, minimized reconciliation record outside D1, before executing them. Earlier Cloudflare D1 Time Travel and encrypted Google Drive backups can resurrect records deleted from the live database after a restore. The reconciliation record itself is sensitive and needs legally reviewed retention.
5. For private reports, the existing owner-operated eraseQuarantinedReport helper is dry-run by default and requires receipt ID, verified Auth UUID, explicit owner approval and execution. Verify D1 report, audit and ownership links are gone; unrelated accounts and public cases stay intact. Never expose that helper as an unguarded public route.
6. For requested account deletion, remove the correct Supabase Auth identity through the authorized Dashboard Authentication > Users workflow, separately from private D1 records, after checking any owned Supabase Storage objects. Supabase documents that previously issued JWTs may remain cryptographically valid until expiry; independently confirm token rejection against the live Auth server after deletion. Do not put service-role credentials in Pages client code or GitHub.
7. Account removal does not automatically erase Google Drive backups, D1 snapshots, Brevo email records, Cloudflare security logs or processor systems. Apply lawful exceptions and retention periods after independent review.
8. Reply with the result using a restricted privacy case record, and honor applicable GDPR deadlines. Obtain qualified legal guidance for individual rights restrictions and complex requests.

## Regression evidence

- Tests use real D1 migrations in synthetic local SQLite and two distinct fake Supabase UUIDs.
- Only the account holder's private receipt metadata is returned; anonymous/revoked access fails.
- Query pollution, cross-site access, pagination, unexpected writes and POST/DELETE are rejected.
- Browser tests confirm authorized receipt viewing with submission OFF and empty the private list on logout.
- The anonymous prelaunch checker asserts the new endpoint denies unsigned requests with HTTP 401 and no-store.

This is NOT self-service report-body export or automated account removal. Processor retention, controlled real deletion, legal review and response handling remain required before public intake launch.

Supabase official documentation: https://supabase.com/docs/guides/auth/managing-user-data
