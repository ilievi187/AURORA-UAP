# AURORA: Public report launch requirements, 4 November 2026

This operator ledger is not legal certification or permission to activate the private report intake.

| Gate | Evidence/status | Remaining action |
| --- | --- | --- |
| Public content website | Existing live site and 42 automated browser tests green | Continue editorial QA without publishing any private report |
| Reporter identity | Verified Supabase email sign-in deployed | Manually test signed-in receipt list with a real owner account; never extract tokens |
| Adult reporting only | English 18+ self-declaration checked in frontend and backend | Legal review, because self-attestation does not verify actual age |
| Turnstile | **PASS: real owner-only production managed challenge and server Siteverify confirmed by owner screenshot after PR #153**; hostname/action enforcement remains in code and tests | Later, a distinct staged end-to-end private-report test with an actual verified reporter (only after legal/retention release gates) |
| Cloudflare WAF | LIVE block and recovery verified, matching Ray ID with GraphQL action block/source ratelimit on exact intake endpoint | Retain private Ray evidence; record final owner go/no-go before setting review flag |
| Moderator access | Anonymous 17-route Access preflight green; synthetic signed second-email denial matrix for moderator/editor/Turnstile UI and APIs, no D1 reads before auth | Real different-email Access deny remains untested; current Cloudflare Access policy inventory API returned 401/403 |
| D1 quarantine | All migrations, privacy regression tests green; 0 real reports | Keep disabled until all remaining gates completed |
| Encrypted backup | **PASS 4 Nov:** owner-installed account-scoped API token enabled successful real production D1 export, age encryption, private Drive upload, download/decrypt verification and local encrypted copy; systemd exit 0, daily timer active | Verify the next unattended timer run, protect the broader D1 Edit token, approve retention, external erasure-ledger reconciliation and device-off behavior |
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


## Private restore safety: isolated erasure reconciliation

A read-only helper now compares restored D1 contents with an owner-only erasure ledger. Synthetic real SQLite snapshot tests confirm it identifies resurrected private records before reconciliation. This does not constitute a complete lawful erasure process: ledger provenance and custody, Supabase/processor deletion, backup retention, and owner legal sign-off remain unverified. See docs/PRIVATE-RESTORE-ERASURE-GUARD-2026-11-04.md.


## 4 Nov: automation backup authentication blocker

Read-only inspection of the user systemd service found that the 4 Nov 04:13 job failed (exit code 5) before encrypt/upload. Noninteractive Wrangler needs CLOUDFLARE_API_TOKEN; the prior interactive login is insufficient for the service. A least-privilege systemd credential-store integration and a local interactive setup helper are now included, but a real scoped token must still be created privately by the owner. Until a new real export/download/decrypt passes, **automated backups are NOT verified as healthy**. See docs/BACKUP-UNATTENDED-CLOUDFLARE-AUTH-2026-11-04.md.


## 4 Nov evening — backup incident recovery confirmed

The owner created an account-scoped Cloudflare API token and supplied the matching Account ID. D1 Read scope allowed database listing but Wrangler export was rejected with HTTP 403 / code 10000. Owner upgraded to D1 Edit; the real production service run then completed successfully at 21:09 EET 4 Nov 2026: Result=success, ExecMainStatus=0. The newly encrypted local file AURORA-D1-20261104T190946Z.sql.age was saved mode 0600. The private Google Drive upload and downloaded decryption verification in RAM passed. No plaintext SQL file remained in the encrypted archive folder.

The systemd timer is enabled and active; next run is scheduled for about 04:16 EET 5 Nov and is NOT YET observed. D1 Edit has broader write privileges, so the machine-private account-scoped token needs careful custody, periodic review and rotation. Encrypted backup success does not certify legal retention, full account erasure or GDPR compliance. Public intake remains OFF.


## 4 Nov — negative-account Access regression audit (no second mailbox)

An offline RSA/JWKS test proves that an otherwise correctly signed different-email JWT is rejected at origin across the moderator UI/API, newsroom editor and owner Turnstile diagnostic without any D1 query. Tests cover wrong issuer/audience, expired/future JWTs, malformed signatures and configuration. The newsroom schema check now executes only AFTER owner authorization. Ten bounded read-only route-alias probes revealed no private content; five protected aliases joined the daily anonymous monitor (17 GETs total). A fresh Cloudflare Access policy API audit was blocked by OAuth HTTP 401/403. A real second-email denial remains OPEN. See docs/ACCESS-NEGATIVE-IDENTITY-AUDIT-2026-11-04.md.
