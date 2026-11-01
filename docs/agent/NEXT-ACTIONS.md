# AURORA UAP — Next Actions (Roadmap 2.0)

**Updated:** 2026-11-01 (Europe/Sofia). **Source of truth:** [MASTER-ROADMAP.md](MASTER-ROADMAP.md). Current `main`: `796700ae3a050df54d27a3e8de36e155eb6af9bc`. Re-fetch current `main` and coordination [issue #52](https://github.com/ilievi187/AURORA-UAP/issues/52) before changing code.

## What we just verified

- At the start of M0 work on 2026-11-01, GitHub `main` was `733a43e9f64d95711b980da01b4a11982badbca6` (PR #108 changed the roadmap documents only); the last application-code snapshot audited here was `5b81f6e517c56246de7079440d0598b6e21d9226` (PR #107).
- The 2026-11-01 production audit showed 101 dossiers / 98 mapped / 18 UI locales plus Bulgarian legacy card text and English fallback. PR #109 is merged; exact-head checks and main-commit workflows passed, Cloudflare Pages reported “Deployed successfully,” and the post-merge Bulgarian homepage/atlas/dossier read-back is verified below.
- 101 public source-backed case records, with complete English stories; **33 source-authored Bulgarian** narratives and **68 placeholder/mixed-language Bulgarian** entries as of audit. Prior claims of 101 real BG translations were overbroad.
- Video metadata: **23 video references across 14 cases**, 4 photo media entries, 155 document entries; live in-browser playback still needs source-by-source verification.
- `payment-config.js` sets `AURORA_PAYMENT_LINK = null`; no owner-verified public payment URL is configured. Before PR #111, the public donate page had an enabled button and vague preparation notice. PR #111 is merged as `e62d6931afcddef40447a20a5c25c7c35738152a`; all 16 exact-head checks and 7/7 main workflows passed, Cloudflare Pages succeeded, and a post-merge production browser read confirmed the disabled checkout, explicit Bulgarian unavailable notice, preserved purpose content and home navigation. No real transaction occurred.
- `robots.txt` currently says `Disallow: /` and no root sitemap is present. Owner must authorize switching intentional indexing on for public pages only.
- Existing intake is safely disabled and **must stay disabled** until Cloudflare/privacy/moderation gates are completed and explicitly approved.
- **M0.5 is delivered in PR #113**, merged as `796700ae3a050df54d27a3e8de36e155eb6af9bc`: eight fictional sample records, four unused images and old dialogs were removed; Mission Control now has one localized archive link; report routes stay local-draft-only with legacy draft recovery; the disclosure is covered in all 18 locales. Exact-head PR checks 18/18, main checks 18/18 and the Cloudflare Pages deployment check passed. No post-deploy production browser read-back was performed under Issue #52 owner-safety.

## Ranked next six engineering PRs (M0.5 delivered)

1. **M0.1/M0.2 — delivered in PR #109:** homepage cards, primary world-atlas details/results and related dossier previews reject legacy Bulgarian placeholders as native copy; English source fallback is disclosed; the gate identifies interface language and warns in all 18 locales that dossier text may remain English. Exact PR checks and post-merge workflows passed; Cloudflare Pages reported successful deployment, and the previously authorized Bulgarian public-page read-back is recorded in the master roadmap. The separate Mission Control globe remains under PR #43 ownership.
2. **M0.4 — delivered in PR #111:** donate checkout honesty is live-read-back verified; no payment URL was invented and no live transaction was performed. Only an owner-verified public creator URL may activate checkout.
3. **M0.3 public indexing — owner-gated:** the current explicit instruction is to keep `robots.txt Disallow: /` and not publish a sitemap until indexing is explicitly approved. Do not change either now; the global crawl block remains a known limitation.
4. **M1.1 Bulgarian editorial batch 1:** enrich 10–15 of the 68 imported BG dossiers with source-reviewed narratives, chronology, uncertainty, citations and importer-preservation checks. Use a batch with accessible primary sources; do not invent eyewitness quotes, media rights or coordinates. Aim for **101/101 genuine BG + EN** stories, not 101 placeholders of adequate length.
5. **M2 translation quality:** verify the owner-configured `AI` binding and billing guard before any production use; then cover the 18-locale page matrix, complete-story translation and honest fallback. Do not claim cloud inference runs solely from unit tests.
6. **M3 media rights/player QA, then M4 news reliability:** verify each of the 23 video references and rights before enabling playback; separately diagnose current 403/503/WAF behavior only through owner-approved logs. Never bypass Cloudflare Error 1010.

## Longer-gated streams

- **Private user reports:** D1 + backups + reviewed privacy rights + Access-authenticated moderation + Turnstile + WAF + retention + human action. Draft PR #14 still isolated; no production activation without owner sign-off.
- **Archive provenance:** draft PR #43 and sync PR #57 still open; avoid overlapping changes. Handle duplicate reports of one physical event, `XZ` regions and unknown coordinates explicitly.
- **Polish:** cinematic design consistency, page-by-page mobile/desktop locale/a11y tests, broken links, performance, monitoring and current release docs.

## Test/merge rule

Each change needs explicit ownership, non-destructive tests, exact-head green PR checks, clean mergeability, post-merge check and Cloudflare deploy result. A green build does not prove live AI, news availability, payment flow or moderated submissions. Source links and media rights must remain attributable; fake cases and airplane radar are out of scope by owner decision.

**Audit limitation:** the earlier 2026-11-01 read-only live browser verification for PR #109 covered `/`, `/#worldAtlas` and `/archive/disclosure-iraq-2022` in Bulgarian at 1280×577. PR #113's main commit has a successful Cloudflare Pages check and 18/18 main check runs, but no production browser read-back was performed under Issue #52 owner-safety. No separate production API, D1, news-source or mutation flows were probed; prior news Error 1010 and database authorization limits remain respected.
