# AURORA UAP — Master Roadmap 2.0

**Audited:** 2026-11-01 (Europe/Sofia), based on GitHub \`main\` at \`5b81f6e517c56246de7079440d0598b6e21d9226\`, the owner-opened production homepage browser tab, latest main CI, and project source/config/data. This document supersedes the stale 2026-10-29 roadmap, but **is not** proof that every production subpage, Workers AI binding or external API works.

**Product goal:** a beautiful, neutral, source-attributed, **public and free** international UAP platform. The viewer judges the evidence; no unsupported extraterrestrial conclusion. The historical UAP atlas stays. **Aircraft radar stays removed** by owner decision. Donation is optional, not a paywall.

## A. Verified current state and honest limitations

| Area | Observed state | Verification / limitation |
| --- | --- | --- |
| Site / deployment | Cloudflare Pages is connected to \`main\`. Latest referenced commit \`5b81f6e\`. | **20 successful checks + 2 skipped** on that main commit; Pages build successful. This is not full live functional verification. |
| Homepage | Live browser tab shows cinematic black AURORA homepage, language gate, world atlas, live **101 cases / 98 mapped**, source-backed home cards, donate/report navigation. | Direct production homepage DOM read. It still shows imported Bulgarian catalog placeholders and some English strings. |
| Archive | **101 public source-backed records**, each with source URL; 101 English stories with >=3 paragraphs; 10 cases/page = **11 pages** in dedicated \`/archive.html\` directory. | \`data/cases.json\`, \`archive-directory.js\`; 3 cases lack coordinates. Home shows a shorter paginated preview rather than every card. |
| Bulgarian case narratives | **33 authored/non-placeholder BG records; 68 imported BG entries contain boilerplate plus English \`EN ·\` passages**. | Counted with existing legacy-placeholder detector, independently from mere paragraph lengths. Do not call all 101 natively translated. PR #107 corrected archive/dossier fallback, but the live homepage map/card still renders some placeholders. |
| Locales | **18 UI locales**, but 16 other-language case narratives are not all pre-translated. | \`/api/archive-translation\` requires Cloudflare Pages Workers AI binding called \`AI\`; actual production binding/status unverified. A translated UI label is not proof translated case evidence. |
| Map | 98 cases have geolocations; clustered approximate markers. | Case data, code and visible homepage. Unknown/redacted sites must remain unpinned; no invented exact points. Five source records use non-ISO \`XZ\` location code; four have blank country code, requiring honest unknown-region handling. |
| News | News UI/API and 75-source discovery catalog exist; dated source audit found **73/75 reachable feeds on 2026-10-30**. | Current production news freshness and source API not independently confirmed. Historical Cloudflare 403/503/preview Error 1010 require owner-approved diagnosis, not bypass. |
| Media | **23 video references across 14 cases**, **4 photo references**, 155 document media references. Some 18 video references have playback metadata, but metadata is not the same as successful in-browser playback. | \`data/cases.json\`; \`media-player.js\` supports source-cleared HTML5 or publisher embeds; full live playback matrix not independently verified. One player per dossier is the intended UX. |
| Donations | Site has donate page and CTA, but public \`payment-config.js\` currently sets \`window.AURORA_PAYMENT_LINK = null\`. | No working checkout configured in repository. Requires owner-verified Buy Me a Coffee profile and clear visitor disclosure before activation. |
| Search visibility | \`robots.txt\` contains \`User-agent: *\` + \`Disallow: /\`; no root \`sitemap.xml\` was found. | Crawlers are globally blocked despite public-page \`index,follow\` metadata. Do not expose private submissions/admin paths when correcting. |
| User reports / DB | Public intake is **deliberately disabled**; browser drafts only. D1/public registry, Turnstile, WAF, Cloudflare Access, verified privacy notice and human moderation are not fully released. | This is a safety gate, not a reason to expose a partially configured service. The registry and private quarantine are independent. |
| Open agent branches | Draft PR #14 (Access moderation), #43 (geography/source quality), #57 (archive sync audit). | Do not override active ownership or merge unfinished work blindly. Coordination issue #52. |

## B. Release strategy — finish in this order

### M0 — HONEST PUBLIC EXPERIENCE / LAUNCH BLOCKERS (P0; first)

- [ ] **M0.1** Correct the **homepage** case cards, world atlas panels and related-case previews: reject the same 68 Bulgarian placeholders already rejected by archive/dossier; when a genuine translation is unavailable, show the actual source English **with an explicit BG/original-language notice**. Carry this through all 18 UI locales.
- [ ] **M0.2** Remove or reconcile misleading phrases such as “Full locale” on the 18-language selection gate unless entire dossiers in that locale are demonstrably complete; distinguish **UI translated** vs **case narrative translated**.
- [ ] **M0.3** Define a public-indexing decision: when the owner approves indexing, replace global \`robots.txt Disallow: /\` with a public allow policy, exclude private/moderation/API secrets and nonpublic records, publish \`sitemap.xml\` for canonical public routes, validate redirects, robots/meta consistency and search-console accessibility. **Do not index private queues**.
- [ ] **M0.4** Make the unconfigured donate page honest and usable: show a clear not-yet-configured state while \`AURORA_PAYMENT_LINK\` is null. Once owner confirms a public Buy Me a Coffee profile URL, verify the HTTPS checkout route and visible donation-purpose explanation, without making a real transaction in CI.
- [ ] **M0.5** Audit homepage legacy/demo remnants (old demo form/dialog and duplicated navigation/gate sequences) for visible confusion, but preserve working routes; remove only after dependency and screenshot review.
- [ ] **M0 exit:** zero placeholder Bulgarian claims rendered as native; honest donation behavior; search indexing rules intentionally documented; desktop/mobile homepage + archive + dossier language-gate and navigation browser tests passing.

### M1 — 101 DOSSIERS WORTH READING (P1; content first)

- [ ] **M1.1** Replace **all 68 BG legacy placeholders** with real case-specific, professionally edited Bulgarian summaries and full narratives, credited to their actual sources; maintain current 33 genuinely authored BG case files. Batch 10–15 cases with review diffs and counts rather than one giant unverifiable rewrite.
- [ ] **M1.2** For every record, enforce editorial contract: date and date precision, geography with uncertainty, original sources, 3+ substantive paragraphs, chronology when sourced, status/alternative explanations, media provenance/rights and no unsupported conclusions. Avoid fabricated eyewitness quotes.
- [ ] **M1.3** Investigate overlapping events on the map (e.g. multiple JAL 1628, Nimitz/FLIR, AARO entries) and link distinct **source records about the same event** rather than silently deleting evidence. Coordinate with draft PR #43.
- [ ] **M1.4** Replace \`XZ\` country-code display and blank-country UI with a localized “unknown/redacted or multinational location” label; do not coerce to arbitrary ISO countries or assign fake points.
- [ ] **M1.5** Strengthen archive importer continuity: source revisions and editorial overlay retention, deterministic refresh, stale-source attribution, deduplication and conflicts/quality reports; coordinate with PR #57. Never let scheduled sync erase curated descriptions or cleared video rights.
- [ ] **M1 exit:** 101/101 **true** BG + EN complete stories (no legacy placeholders), source URL and uncertainty attached, same underlying claims preserved on sync rerun, 11 accessible archive pages, no invented positions.

### M2 — MULTILINGUAL CONTENT (P1; depends on honest M0)

- [ ] **M2.1** Authorized Cloudflare operator checks the production **Workers AI binding \`AI\`**, request limits, billing and cache policy. No dummy credentials, bypass or speculative successful status.
- [ ] **M2.2** End-to-end locale matrix for 18 languages: initial gate → homepage → map → archive → dossier → video → news → source directory → donate → report → back to home; language persisted and every partial source translation labelled honestly.
- [ ] **M2.3** Translate the **complete public authored narrative**, not just the title/summary. Existing Cloudflare endpoint and bounded-cache behavior are a foundation; provide retriable failure state, cost limits and backfill/caching where practical.
- [ ] **M2.4** Localize metadata, citation/uncertainty labels, source-assessment categories, country/region names, date formats and any remaining hard-coded English fallback on BG pages. Maintain RTL layout and keyboard use for Arabic.
- [ ] **M2 exit:** every tested page accurately identifies text language; no mixed source prose represented as a full translation; 18-locale browser coverage and owner-approved live Workers AI smoke; published coverage dashboard distinguishes completed/partial/unavailable.

### M3 — VIDEOS, PHOTOS & PRIMARY DOCUMENTS (P1, parallel with M1 editorial batches)

- [ ] **M3.1** Make the **single click-to-load player** on archive cards and dossiers consistent; thumbnails open the player inside AURORA when legally and technically supported, never silently redirect the play button.
- [ ] **M3.2** Build a real-source playback matrix for all 23 video entries: published original URL, provider/embed format, original file licensing, actual browser result, thumbnail, error/fallback. Only public-authorized embeds/hosted copies; if a publisher blocks embedding, visibly label an **external source** instead of a fake play button.
- [ ] **M3.3** Seek more real **rights-verified incident photos**, clearly separating actual footage from AURORA art. Current 4 photo media entries are thin; no automatic third-party rehosting or invented screenshots.
- [ ] **M3.4** Keep native in-site PDF preview and source links, accessible keyboard controls and mobile sizing; expand to source-backed timelines where documents permit.
- [ ] **M3 exit:** every eligible video demonstrably plays in Chrome mobile/desktop in CI or approved live test; every unsupported video has an explicit legitimate source link; one player per dossier; no rights gaps or false imagery.

### M4 — TRUSTWORTHY GLOBAL NEWS (P1, parallel after API diagnosis)

- [ ] **M4.1** Diagnose historical 403/503/preview WAF errors with **approved Cloudflare logs/owner test path**, respecting prior Error 1010 blocker; no proxy/identity evasion. Do not infer present production outages solely from older notes.
- [ ] **M4.2** Audit the 75 catalog feeds for **UAP relevance**, not merely RSS reachability; present source, published/updated date, original URL, last-success timestamp, real cache age and verifiable 18-locale title/summary translations.
- [ ] **M4.3** Guarantee graceful partial-feed behavior and last-known-good news without fabricating new headlines; add explicit freshness markers, error diagnostics and edge workload/timeout controls.
- [ ] **M4.4** Preserve multi-page archive of news and meaningful filters (global, Bulgaria, official, source/date), with reliable previous/next pagination and translated content on every visible page. Do not promise 10 pages if source volume is insufficient.
- [ ] **M4 exit:** two separate owner-approved production checks showing real sourced news and correct date/locale fallback; source failures never wipe verified recent items; automated freshness/duplicates regression tests.

### M5 — PUBLIC SUBMISSIONS, MODERATION, TRANSPARENCY (P1 SECURITY GATE; owner-dependent)

- [ ] **M5.1** Verify production D1 project identity, backups, migrations, \`DB\` bindings and whether public registry enablement is appropriate; safe dry run and rollback plan.
- [ ] **M5.2** Publish a genuinely reviewed GDPR/BG/EU privacy notice with controller/contact, purpose, retention, rights requests and deletion, covering sensitive information users may enter into free text.
- [ ] **M5.3** Configure real origin-verified Turnstile keys, rate limits/WAF, incident monitoring and Cloudflare Access for moderation UI **and API**; fail closed without all safeguards.
- [ ] **M5.4** Finish human-review queue from draft PR #14: pagination beyond 100 records, Access certificate/network failure tests, reviewer audit trail, retention/deletion and no auto-publish.
- [ ] **M5.5** Run authorized synthetic submission → quarantine → human review → receipt → deletion end-to-end tests; **activate production intake only on explicit owner approval**. Media attachments and email notifications are separate follow-on features after secure storage, file scanning, consent and operating cost approval.
- [ ] **M5 exit:** security/legal/operations release checklist signed, tested private lifecycle, safe retention, controlled production enablement. Until then report page plainly says local draft only.

### M6 — PREMIUM POLISH, DISCOVERY & LONG-TERM OPERATIONS (P2)

- [ ] **M6.1** One coherent black/cinematic design system across homepage, atlas, archive, countries, news, media, sources, donate and report. Retain user-requested saucer/Earth look without extra confusing cockpit chrome.
- [ ] **M6.2** Audit desktop/mobile viewport, accessibility (keyboard, focus, contrast, screen reader), reduced-motion, performance budgets, WebGL/canvas graceful fallback, and oldest smartphones.
- [ ] **M6.3** Eliminate redundant downloaded CSS/JS and abandoned demo code **only when proven unreferenced**, optimizing actual Core Web Vitals before/after.
- [ ] **M6.4** Search quality/SEO: truthful canonical titles, meaningful case descriptions, structured data only where supportable, sitemap, broken-link health and image asset optimization. No claims of definitive UFO proof.
- [ ] **M6.5** Reliability: automated source-health dashboard, license-expiry review, import drift checks, broken images/video detection, Cloudflare AI consumption alarms, uptime/freshness reports and a maintainable release changelog.
- [ ] **M6 exit:** every public route passes mobile/desktop keyboard/locale checks; measurable loading and accessibility improvements; crawl controls and monitoring operate as documented.

## C. Next engineering sequence / small independent PRs

| Order | PR-sized mission | Scope | Required success proof |
| --- | --- | --- | --- |
| 1 | Fix homepage source-language consistency | Homepage case cards, map-details label, locale disclosure | Chrome BG/EN/DE browser test on legacy and authored cases |
| 2 | Indexing + donate honesty | \`robots.txt\`, \`sitemap.xml\`, checkout disabled/unconfigured messaging | Public URL test; no private indexing; donation button never claims completed payment |
| 3 | Bulgarian editorial batches | 10–15 cases per batch in controlled annotations | Authentic BG paragraphs, reviewable sources, importer idempotence |
| 4 | Locale/runtime cost and completeness | AI binding verification (owner), translation UI and quality metrics | 18-locale coverage report; no untranslated text relabelled as native |
| 5 | Source-rights media matrix | Video/photo metadata, poster/player browser fixtures | Authorized real playback or explicit original source fallback |
| 6 | News functional verification | Cloudflare logs (owner), news API, dated caches | Two source-backed production checks without WAF bypass |
| 7 | Safe intake launch | Owner-run legal + D1 + Access + Turnstile + WAF gates | Signed checklist, synthetic end-to-end, explicit activation approval |
| 8 | Full visual/performance/SEO sweep | All public page templates; release automation | Chrom(e/ium) mobile+desktop screenshots, a11y/perf regression budget |

### Assignment and merge discipline

- Keep draft PR **#14** moderation, **#43** source geography and **#57** sync audit isolated; review overlap/ownership on [issue #52](https://github.com/ilievi187/AURORA-UAP/issues/52) before modifying their files.
- Every PR must pin its GitHub base/head, add tests, preserve fail-closed intake, wait for exact-head green CI and be rechecked after merge. A successful Cloudflare **build** does not prove production end-to-end service health.
- No aggressive content scraping, unauthorized media rehosting, unverifiable aerial-event claims, fake coordinates, fake news, forced payments, automated publication, external private-data AI processing or reintroduction of aircraft radar.
- **Owner actions** are explicitly needed for public checkout URL, Cloudflare AI/D1/WAF/Turnstile/Access configuration, GDPR/privacy sign-off and launch approval.

## D. Definition of a meaningfully finished public V2

1. **Discoverable:** a visitor can arrive from search and share canonical public routes, without exposing private data.
2. **Readable:** every one of 101 archive dossiers has genuinely authored BG/EN descriptions, clear source evidence and an intact history; all 18 locales are accurately translated or explicitly labelled original.
3. **Watchable:** source-authorized video is playable **inside** AURORA with one player, and disabled embedding is communicated honestly; images/documents have provenance.
4. **Current:** world news works reliably within the limits of real source availability; genuine source age and translations are visible.
5. **Trustworthy:** no wrong locations, duplicated claims presented as separate sightings, fabricated proof, hidden AI failures or deceptive donation flow.
6. **Safe:** user submissions open only after private database, consent, abuse prevention and human moderation are fully verified and deliberately enabled.
7. **Premium:** polished black sci-fi visuals with fast and accessible desktop/mobile behavior; no abandoned demo surfaces.

### Audit method

- **Live read:** owner-opened public homepage tab, including gate, header, map, cards, footer and local-draft demo. **Other production routes were not directly navigated/visually verified in this audit** because the website fetcher could not access them. Their findings are based on current GitHub source, CI browser tests and earlier documented checks.
- **Source read:** current \`main\`, root directory, 101 cases, media/translation/news/donation/report modules, existing workflow/check-run metadata, owner-approved configuration docs.
- **External dependencies:** historical news and D1 API blocks were **not** retested, in line with previously documented owner-action/WAF restrictions.
- Recalculate the contents and CI snapshot at the start of each mission; do not treat this document as an automatic/live health monitor.
