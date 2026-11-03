# AURORA — privacy rights and retention operating safeguards (draft)

**Not a public self-service feature, not an automated GDPR compliance claim, and not an authorization to enable intake.**

## Receiving a rights request

1. The requester can write to the privacy contact named in `/privacy`, ideally quoting the original `aur-int-<uuid>` report receipt. Do not put the full request, receipt, token, email address or report text in GitHub issues or logs.
2. Independently verify control of the Supabase account associated with the report. A receipt ID alone must **never** be sufficient to disclose or delete a report. For an account holder, securely compare their confirmed Supabase Auth UUID against the private D1 `intake_reporter_links.auth_user_id`. Treat requests by third parties/guardians according to the reviewed legal policy.
3. Before executing any deletion, check applicable legal retention restrictions, recovery/backups, outstanding reviews and whether any **separately published** case needs a distinct rights review. This operator function only targets quarantined reports.
4. The internal `worker/privacy-rights.js` helper defaults to a read-only preview. Execution requires the matching private Auth UUID, explicit `execute:true` **and** `ownerApproved:true`. There is deliberately **no** public API route and no enabled production job.
5. Under the authorized owner-only private workflow, a D1 transactional batch deletes the matching report, its private moderation audit events and its pseudonymous account link. Confirm the targeted records are gone and unrelated records remain intact; do not log witness descriptions. The verified email itself lives in Supabase Auth and must be dealt with separately if account erasure was requested.
6. Determine account deletion steps in Supabase and appropriate Brevo/Cloudflare log/backup retention requirements. Their records are not erased by deleting a D1 row. Record completion of a rights request in the owner's restricted, appropriately minimized case-management record, not in GitHub.
7. Independently review GDPR controller details, lawful basis, deletion exceptions, backups, child/third-party data, international transfers and response deadlines with qualified advice before public intake launches.

## Automatic retention is not yet enabled

- Read-only `retentionDueCounts` powers the protected overview.
- `purgeRejectedReports` is an **opt-in** transactional helper for rejected reports over 90 days old, with dry-run by default and batch size capped at 500.
- Tests now include the production `0005_reporter_ownership.sql` schema and confirm an expired rejected report's private ownership link is deleted along with the report and audit events.
- Pending and approved reports are **flagged for manual action**, never silently deleted or published.
- A real, approved production schedule, incident/backup procedure and operator authorization are required before enabling any deletion task.

Run:
`node --test tests/privacy-retention.test.mjs tests/privacy-route.test.mjs`

The owner should review the workflow and all local/legal prerequisites before ever using `execute:true` or setting `AURORA_INTAKE_LEGAL_APPROVED=yes`.
