# AURORA UAP — owner GDPR operations (5 November 2026)

**Status:** This is a concrete owner procedure and decision register, **not** certification or a substitute for the owner's documented Article 6 assessment. Real verified-email text reports are LIVE in Cloudflare D1 quarantine. The real reporter → receipt → owner moderation → rejection → audit test has passed. No automatic public publication.

**Controller already identified on [public notice](https://aurorauap.org/privacy):** Iliyan Danielov Iliev, individual operator; privacy correspondence `blizzard9011@gmail.com`. Do not add a residential address to this public repository; confirm whether an additional correspondence address is required and how to make one available. This document should contain no personal report text, account UUIDs, screenshots, tokens, private backups or signed consent decisions.

## The three real operational priorities

### 1. Confirm and record lawful basis per processing activity — owner decision required

| Activity | Actual data and purpose | Candidate legal basis for owner to assess, **not preapproved** |
|---|---|---|
| Verified reporter login | Email, Auth UUID, verification/transactional-delivery and security metadata through Supabase and Brevo | Art 6(1)(b) **only if** objectively necessary to deliver the account service; otherwise consider consent or legitimate interests and transparency |
| Private observation and human moderation | Approximate location, local time, text, account link, receipt, audit | Art 6(1)(a) consent for voluntary report **if** freely given, informed, specific and effectively withdrawable; test the real withdrawal/erasure procedure |
| Anti-abuse/access/security | Turnstile, Cloudflare IP/logs, Access moderator identity, WAF | Consider Art 6(1)(f) legitimate interests, balanced against visitors' rights and protected by minimization; verify processor-specific purpose |
| Encrypted backups, anti-resurrection erasure journal | Historic private report data and private erasure evidence | Document necessity, security, strict retention, restore reconciliation and actual lawful basis |
| Future PUBLIC dossier | Not authorized by today's private-report consent | **No automatic publication.** Conduct separate editorial, rights, legal basis and third-party data review before any public release |

Owner to privately sign/date the decision, document any legitimate-interest balancing and consent withdrawal handling, and make the corresponding BG/EN notice specific. **A boolean Cloudflare `AURORA_INTAKE_LEGAL_APPROVED=yes` is not evidence of compliance by itself.**

### 2. Confirm supplier agreements and data location — owner/provider account inspection required

Review actual account terms/processor agreements and subprocessor/transfer safeguards, retaining evidence **privately**, not in GitHub:

- [Cloudflare Customer DPA](https://www.cloudflare.com/cloudflare-customer-dpa/) — Pages, Workers, D1, Access, Turnstile; verify contractual acceptance, data handling and incident notifications.
- [Supabase DPA (1 Aug 2026)](https://supabase.com/legal/customer-resources/data-processing-addendum) — Auth in `eu-central-1`; verify agreement applies to this account and applicable transfer safeguards.
- [Brevo DPA help](https://help.brevo.com/hc/en-us/articles/15403782599570-Where-can-I-find-the-Data-Processing-Agreement-DPA) — account's transactional email contract, logs and any international transfer.
- Google Drive private encrypted D1 backup — verify applicable Google terms, account access, sharing controls, Drive object retention/deletion and encrypted historical copies.
- Cloudflare D1 Time Travel and source-host encrypted local backup — establish maximum restorable interval and reconciliation duties after an erasure; avoid exposing encryption key anywhere public.

**Unverified:** whether each *real account* has binding DPA terms accepted; provider retention/transfers; independent erasure evidence. Public vendor links don't prove account acceptance.

### 3. Actually run retention and data-rights requests

Existing code has: `worker/privacy-retention.js` (dry-run due counts, opt-in rejected-case purge); `worker/privacy-rights.js` (owner-gated per-report erasure with Auth UUID matching); `worker/privacy-restore-guard.js` (restore anti-resurrection checks). This functionality is **not** an enabled production deletion scheduler.

A workable initial **manual** policy, until approved automated workflow:
1. **Weekly**, owner opens [Access-only moderation overview](https://aurorauap.org/moderation) and checks three due counters. `rejected_expired`: reports 90 days after the decision — initiate approved D1 + backup-ledger reconciliation/purge. `awaiting_review`: review pending/needs_clarification older than 180 days. `approved_reassessment`: reassess approved-but-unpublished after 365 days. Pending/approved counters are **review**, not deletion.
2. **On receipt of a privacy email**, privately log received date, category (access, correction, withdrawal, restriction, erasure, portability), owner, response due date and outcome, but do not copy the report body or unnecessary personal data into public code. Verify identity via the original Supabase account. A receipt number alone is not proof of ownership.
3. Acknowledge and answer **without undue delay and normally within 1 month**. A further 2 months is only possible for complex/multiple requests, with timely notice of extension during the first month. Assess lawful exemptions and document reasons.
4. For approved erasure: review report scope/any independent legal retention exception; inspect owner/private D1 data, delete the D1 report and moderation/link metadata with the existing verified owner-gated path, separately handle Supabase Auth account, Brevo/provider metadata, backup purging/reconciliation and resurrection guard. Verify at the end. **Never delete private user data merely from a chat instruction or receipt number.**
5. After any suspected leak, preserve minimal incident metadata privately; contain exposure, evaluate risk to persons and document the determination. Where GDPR Art 33 notification is required, notify the competent supervisory authority without undue delay and where feasible **within 72 hours of becoming aware**; notify affected individuals when required. Do not publish incident personal data on GitHub.
6. Confirm a practical local duty operator and manual response continuity if the NightKnightPC backup host is off. Existing backup timer success alone does not verify D1 Time Travel or encrypted Drive purging.

## Incomplete decisions, intentionally NOT marked done

- [ ] Owner's dated lawful-basis and risk/consent-withdrawal review.
- [ ] Private evidence for account-specific Cloudflare, Supabase, Brevo, Google agreements/transfers.
- [ ] Actual backup, log and Auth account retention windows and erasure reconciliation procedure (includes D1 Time Travel).
- [ ] Manual weekly owner review assigned / repeatable, plus private DSAR intake record.
- [ ] BG/EN website notice updated with the final confirmed decisions/periods, including third-party data and any transfer safeguards.
- [ ] Evaluate need for a DPO/DPIA proportionately to real nature/scale; not automatically mandatory because it is a website.
- [x] Real reporter-to-moderator production flow including rejection and audit verified 5 Nov 2026.
- [x] Anonymous postlaunch isolation 17/17, no automatic publication verified 5 Nov 2026.

## Official reference points

- [European Commission — required privacy information](https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en)
- [EDPB — data subject request and one-month period](https://www.edpb.europa.eu/sme/find-practical-info/faq_en)
- [EDPB — records and processing operations](https://www.edpb.europa.eu/sme/be-compliant/be-compliant_en)
- [EDPB — processor agreements and transfers](https://www.edpb.europa.eu/sme/be-compliant/international-data-transfers_en)
- [GDPR Art. 33 on EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)

**Operational note:** Live intake must not be mistaken for GDPR certification. If any severe control fails, owner can disable `AURORA_INTAKE_ENABLED` as an emergency-off without deleting existing records. Return to live service only after control remediation.
