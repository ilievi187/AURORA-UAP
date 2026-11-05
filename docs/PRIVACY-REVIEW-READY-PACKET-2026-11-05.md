# AURORA UAP — qualified privacy review handoff (5 November 2026)

> **UNAPPROVED REVIEW PACK. PUBLIC REPORT INTAKE REMAINS OFF.** This document records engineering evidence, not legal advice, a signed DPA, a verified international transfer arrangement, or a GDPR compliance certificate. Review by a qualified Bulgarian/EU privacy professional and independent owner sign-off are required. No real visitor report or private identifiers belong in this repository.

## Later clarification — owner self-review is permitted (5 Nov 2026)

Earlier references below to a mandatory *independent professional* are an AURORA internal release preference, **not** a universal GDPR requirement. The owner/controller may conduct a documented, proportionate legal-basis, risk, processor-contract and retention review, obtaining external advice if the facts warrant it. The missing real different-account Access sign-in remains explicitly UNTESTED (not a false PASS). The operational release source of truth is [OWNER-CONTROLLED-REPORT-LAUNCH-2026-11-05.md](OWNER-CONTROLLED-REPORT-LAUNCH-2026-11-05.md). No owner processing decision or production authorization flag is claimed in this addendum.

## Scope and production behavior verified

- Website: https://aurorauap.org; public BG/EN privacy text: https://aurorauap.org/privacy; reporter page: https://aurorauap.org/report.
- On 5 Nov 2026, prelaunch external anonymous verification showed `/api/intake/status` **accepting:false**, no automatic publication; protected moderator/editor surfaces redirected to Access or returned 403. See `docs/FINAL-INTAKE-CHECKPOINT-2026-11-05.md` (17/17).
- Isolated synthetic tests verified same-origin, checked email login, 18+ **self-declaration** (not age verification), Turnstile, private D1 quarantine, moderated decisions, signed Access identity, ownership-scoped receipt inventory, dry-run rights inspection and restored-data resurrection detection. They do **not** demonstrate production processing, real deletion, lawful basis or processor contractual acceptance.
- A real Cloudflare Turnstile Siteverify owner diagnostic PASS and live rate-limit block/recovery are separately documented in `docs/LAUNCH-READINESS-2026-11-04.md`. Neither authorizes public intake.

## Actual data-flow review targets

| Operation | Technical path | Expected personal-data risk | Reviewer / operator decision |
| --- | --- | --- | --- |
| Visitor draft | `report.html`, `report.js` browser storage / local JSON | Visitor controls draft; local devices and shared browsers can expose the draft | Confirm disclosures, removal and no unintended network upload |
| Verified reporter registration/login | Supabase Auth, email only; Brevo transactional email | Email address, login and delivery metadata, possible service-side IP/security logs | Establish purpose, legal basis, account retention, password-vs-link policy and provider terms |
| Text-only private report | `functions/api/intake/submit.js`, `functions/_lib/intake.js`, D1 `intake_submissions` | Approximate location, timestamp, free-text **may identify witnesses/third parties**; consent version and opaque receipt | Review legal basis, Art. 13 notices, genuine consent/withdrawal design, special categories and incident handling |
| Private account linkage | `intake_reporter_links`, `/api/account/privacy` | Pseudonymous Supabase UUID linked to report; receipts/statuses | Confirm lawful basis, restrictions and verified access/erasure procedures |
| Moderator decision + audit | Cloudflare Access; `intake_review_events` | Description, decision rationale, moderator account information | Define access logging, least privilege, retention, third-party redaction and reviewer accountability |
| Anti-abuse and delivery | Cloudflare Pages, Access, WAF, Turnstile | Network identifiers/security logs at processor, outside D1 | Assign legal basis and retention for technical logs, DPA, regional processing, incident notices |
| Encrypted production backup | D1 export, age encryption, private Google Drive, D1 Time Travel | Old copies may resurrect data **after approved erasure** | Review key access, backup TTL, offsite deletion, processor retention and independent erasure register |
| Possible future public dossier | Separate, **not implemented/approved** release path | Free text/media could contain third-party personal data | Separate legal basis, editorial review, data minimization, consent/rights and publication policy **before** release |

The D1 intake schema deliberately lacks required email, phone, attachments or precise GPS fields, but free text is personal data when identifiable information is included. Do not assert that a reporter report is anonymous merely because the email is stored in Auth separately.

## Legal-review decisions required — do not mark complete from test results

1. **Controller identification and contact.** Review the published individual's role and whether additional accessible correspondence information must be provided; avoid publishing a private home address without a legal decision. Check incident/rights contact reliability and whether DPO obligations apply.
2. **Lawful purpose-by-purpose basis.** Decide and document an Article 6 basis separately for Auth account, private report intake/moderation, provider security logs/anti-abuse, operational backup and any later public publication. A checked box is not automatically a sufficient lawful basis. Where consent is chosen, verify withdrawal and consequences.
3. **Art. 13 notice, minors and third parties.** Review the exact Bulgarian/English public copy and policy version (`intake-v1-reviewed` intended, not yet legally authorized); explain 18+ declaration limitations, accidental child data, named witnesses or potentially sensitive content. Define a moderator triage/redaction process.
4. **Processor agreements and transfer review.** Confirm that the *actual AURORA accounts* are covered by applicable terms/DPAs for Cloudflare (Pages/D1/Access/Turnstile), Supabase Auth, Brevo email and the chosen private Google Drive backup account; inspect current subprocessor lists, locations, and EEA transfer mechanisms. A publicly posted DPA is not proof of a particular account's contractual acceptance or regional setup.
5. **Retention deadlines.** Owner-proposed 90-day rejected deletion, 180-day pending review, 365-day approved/unpublished re-review are reflected by `worker/privacy-retention.js`. Internal counting/dry-run and opt-in delete routines do not establish an *operational* deployed retention or purge. Determine lawful time limits for drafts, Auth records, consent versions, moderation journal, WAF/security logs, Brevo messages, backups and the independent erasure ledger.
6. **Rights requests and deletion.** Agree how to authenticate a data subject, log/reply privately, correct/restrict/export records, delete report and Auth identity independently, respect applicable exceptions, and prevent old encrypted backups/D1 Time Travel from reintroducing deleted private data. Synthetic restore tests are not real-provider deletion evidence.
7. **Privacy risk and incident response.** Document incident notification roles, account compromise/moderator access response, backup-key loss/revocation, and whether the processing presents risks requiring a DPIA or additional safeguards.
8. **Final independent sign-off.** Reviewer should provide dated written findings, a confirmed notice and version, a risk/issue register and a clear **approved / not approved** decision. Owner separately decides on public launch only after independent denied second-account Access and controlled genuine reporter-to-moderator tests.

## Evidence checklist (requested from the authorized operator, kept private)

- [ ] Confirmation of processor/contract acceptance for the actual Cloudflare, Supabase and Brevo accounts. Provide documentation to reviewer through restricted channel, not GitHub.
- [ ] Service region and provider/subprocessor/transfers evidence; document the present configuration and supporting clauses.
- [ ] Backup retention, password/key custody, encrypted Google Drive location, D1 Time Travel handling and erasure-reconciliation procedure, without disclosing credentials, UUIDs or report bodies.
- [ ] Incident and DSAR/rights-request operating policy with accountable owner and response-channel custody.
- [ ] Review the final notice in both languages, including exact retention periods and account registration **while report intake is still off**.
- [ ] Real second non-allowlisted mailbox Cloudflare Access denial (owner can do later; user previously has no second mailbox).
- [ ] One separately approved real controlled test reporter and private moderation after legal release, no personal data or publication.
- [ ] Final **separate** owner go/no-go; production flags stay unchanged until then.

## Public primary sources checked 5 Nov 2026

- [European Commission — Information for individuals](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en) (transparency, legal basis, retention, recipients, transfers, rights).
- [EDPB SME guide — Controller / processor roles and contracting](https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_en).
- [EDPB SME guide — International data transfers](https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en).
- [EDPB SME FAQ — Responding to erasure requests](https://www.edpb.europa.eu/sme/find-practical-info/faq_en).
- [Cloudflare Customer Data Processing Addendum](https://www.cloudflare.com/cloudflare-customer-dpa/) and [subprocessor list](https://www.cloudflare.com/gdpr/subprocessors/).
- [Supabase Data Processing Addendum (1 Aug 2026)](https://supabase.com/legal/customer-resources/data-processing-addendum) and [subprocessor list](https://supabase.com/legal/customer-resources/subprocessor-list).
- [Brevo — where its DPA is published](https://help.brevo.com/hc/en-us/articles/15403782599570-Where-can-I-find-the-Data-Processing-Agreement-DPA) (links to provider Terms of Service).

## Release boundaries

Keep `AURORA_INTAKE_ENABLED` disabled and `AURORA_INTAKE_LEGAL_APPROVED` unset/unaltered; never set `AURORA_INTAKE_WAF_REVIEWED` merely because this document exists. No modification of Cloudflare security policies, Auth users, real D1 records, donations, source archives or publication workflows is in scope. The reviewer pack must remain a **request for an external decision**, not become an automated approval.
