# AURORA: Public report launch requirements, 4 November 2026

This operator ledger is not legal certification or permission to activate the private report intake.

| Gate | Evidence/status | Remaining action |
| --- | --- | --- |
| Public content website | Existing live site and 42 automated browser tests green | Continue editorial QA without publishing any private report |
| Reporter identity | Verified Supabase email sign-in deployed | Manually test signed-in receipt list with a real owner account; never extract tokens |
| Adult reporting only | English 18+ self-declaration checked in frontend and backend | Legal review, because self-attestation does not verify actual age |
| Turnstile | Production keys configured; synthetic Siteverify success/fail/replay tests green | One real owner-approved managed challenge, only after independent privacy and retention clearance |
| Cloudflare WAF | LIVE block and recovery verified, matching Ray ID with GraphQL action block/source ratelimit on exact intake endpoint | Retain private Ray evidence; record final owner go/no-go before setting review flag |
| Moderator access | Anonymous Access redirect and private API tests green | Real unauthorized DIFFERENT account denial test |
| D1 quarantine | All migrations, privacy regression tests green; 0 real reports | Keep disabled until all remaining gates completed |
| Encrypted backup | Actual encrypted Google Drive backup, isolated restore and daily timer work | Sign off backup rotation/retention, rights erasure reconciliation and device-off behavior |
| Personal data deletion | Internal D1 erasure tested, authenticated read-only user receipts available | Independently test admin Supabase deletion and provider retention; maintain privacy request log |
| Privacy/legal | Public BG/EN notice, working draft with open details | Qualified BG/EU GDPR review of Art. 6 legal basis, controller details, processors, transfer terms, minors and third-party information |
| Go/live | Production GET still says accepting:false, automatic_publication:false | Explicit final decision after all blockers, with emergency-off playbook ready |

Important: The owner approved the live WAF test; it was completed safely. This is not approval to claim GDPR compliance or activate public reporting. Keep production environment flags off until qualified review and actual remaining live checks are done. No public auto-publication or D1 deletion is permitted.

Reference: docs/RELEASE-SECURITY-EVIDENCE-2026-11-03.md and docs/WAF-TURNSTILE-EMERGENCY-RUNBOOK-2026-11-04.md.
