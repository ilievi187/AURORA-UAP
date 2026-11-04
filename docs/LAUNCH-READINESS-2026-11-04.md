# AURORA: Public report launch requirements, 4 November 2026

This operator ledger is not legal certification or permission to activate the private report intake.

| Gate | Evidence/status | Remaining action |
| --- | --- | --- |
| Public content website | Existing live site and 42 automated browser tests green | Continue editorial QA without publishing any private report |
| Reporter identity | Verified Supabase email sign-in deployed | Manually test signed-in receipt list with a real owner account; never extract tokens |
| Adult reporting only | English 18+ self-declaration checked in frontend and backend | Legal review, because self-attestation does not verify actual age |
| Turnstile | **PASS: real owner-only production managed challenge and server Siteverify confirmed by owner screenshot after PR #153**; hostname/action enforcement remains in code and tests | Later, a distinct staged end-to-end private-report test with an actual verified reporter (only after legal/retention release gates) |
| Cloudflare WAF | LIVE block and recovery verified, matching Ray ID with GraphQL action block/source ratelimit on exact intake endpoint | Retain private Ray evidence; record final owner go/no-go before setting review flag |
| Moderator access | Anonymous Access redirect and private API tests green | Real unauthorized DIFFERENT account denial test |
| D1 quarantine | All migrations, privacy regression tests green; 0 real reports | Keep disabled until all remaining gates completed |
| Encrypted backup | Actual encrypted Google Drive backup, isolated restore and daily timer work | Sign off backup rotation/retention, rights erasure reconciliation and device-off behavior |
| Personal data deletion | Private D1 single-report erasure tested, authenticated read-only receipts available, new account-wide D1 dry-run inventory with dual-account isolation tests | Independently test actual Supabase deletion, legal retention, Drive/D1 backup reconciliation and restricted rights-request log; no auto-delete |
| Privacy/legal | Public BG/EN notice, working draft with open details | Qualified BG/EU GDPR review of Art. 6 legal basis, controller details, processors, transfer terms, minors and third-party information |
| Go/live | Production GET still says accepting:false, automatic_publication:false | Explicit final decision after all blockers, with emergency-off playbook ready |

Important: The owner approved the live WAF test; it was completed safely. This is not approval to claim GDPR compliance or activate public reporting. Keep production environment flags off until qualified review and actual remaining live checks are done. No public auto-publication or D1 deletion is permitted.

Reference: docs/RELEASE-SECURITY-EVIDENCE-2026-11-03.md and docs/WAF-TURNSTILE-EMERGENCY-RUNBOOK-2026-11-04.md.


## Additional continuous prelaunch control

A daily GitHub Actions workflow now runs the anonymous twelve-route security preflight without credentials or requests that mutate the production app. It alerts through the normal GitHub Actions failed-run mechanism when a guarded route becomes public or intake changes unintentionally. The monitor expects prelaunch accepting:false; it must be updated to an authorized postlaunch profile before public submissions open. See docs/DAILY-SECURITY-MONITOR-2026-11-04.md.


## Separate genuine Turnstile diagnostic now available

Owner-only diagnostic: https://aurorauap.org/api/moderation/turnstile. The separate page requires a valid Cloudflare Access owner identity and allows one actual managed challenge without activating report intake or writing to D1. The diagnostic itself cannot automatically prove a user completed the challenge: a PASS is only established after the owner opens the page and completes it. See docs/OWNER-TURNSTILE-DIAGNOSTIC-2026-11-04.md.


## 4 November — real Turnstile browser outcome and instrumented follow-up

The owner completed the real Cloudflare Turnstile widget (browser showed Success), but the AURORA owner-only diagnostic reported server FAIL. This is NOT a verified end-to-end Siteverify pass. A code change now provides safe, finite diagnostic categories for rejected server secrets, tokens, expired/reused challenges, hostname/action mismatches and upstream availability. The client offers a fresh challenge retry without submitting reports or modifying D1. Retest on the live Access-protected diagnostic only after this change is deployed, then confirm and address the actual reason. Do not activate public intake based on a browser widget Success alone.


## 4 Nov 2026 — real Siteverify PASS after Worker compatibility fix

The owner completed the genuine managed Turnstile challenge after PR #153 and supplied a screenshot displaying **PASS: real Turnstile Siteverify succeeded. No report was submitted.** This closes the separate owner-only challenge diagnostic check. Earlier FAIL / retry notes above describe the previous state and are no longer the latest result.

**Still required before intake activation:** independently approved privacy/processor/retention and erasure process, actual unauthorized-different-account Cloudflare Access denial test, and later a distinct controlled reporter-to-moderator end-to-end flow. The 18+ checkbox is self-attestation, not legal age verification. No production intake, legal or WAF flags were changed by this evidence update.
