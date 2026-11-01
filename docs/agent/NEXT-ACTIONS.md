# AURORA UAP — Next Actions (Roadmap 2.0)

**Updated:** 2026-11-01 (Europe/Sofia). **Source of truth:** [MASTER-ROADMAP.md](MASTER-ROADMAP.md). Supersedes the 2026-10-29 plan/PR references. Re-fetch current `main` and coordination [issue #52](https://github.com/ilievi187/AURORA-UAP/issues/52) before changing code.

## What we just verified

- At the start of M0 work on 2026-11-01, GitHub `main` was `733a43e9f64d95711b980da01b4a11982badbca6` (PR #108 changed the roadmap documents only); the last application-code snapshot audited here was `5b81f6e517c56246de7079440d0598b6e21d9226` (PR #107).
- The 2026-11-01 production audit showed 101 dossiers / 98 mapped / 18 UI locales plus Bulgarian legacy card text and English fallback. PR #109 is merged; exact-head checks and main-commit workflows passed, Cloudflare Pages reported “Deployed successfully,” and the post-merge Bulgarian homepage/atlas/dossier read-back is verified below.
- 101 public source-backed case records, with complete English stories; **33 source-authored Bulgarian** narratives and **68 placeholder/mixed-language Bulgarian** entries as of audit. Prior claims of 101 real BG translations were overbroad.
- Video metadata: **23 video references across 14 cases**, 4 photo media entries, 155 document entries; live in-browser playback still needs source-by-source verification.
- `payment-config.js` sets `AURORA_PAYMENT_LINK = null`; no owner-verified public payment URL is configured. Before PR #111, the public donate page had an enabled button and vague preparation notice. PR #111 is merged as `e62d6931afcddef40447a20a5c25c7c35738152a`; all 16 exact-head checks and 7/7 main workflows passed, Cloudflare Pages succeeded, and a post-merge production browser read confirmed the disabled checkout, explicit Bulgarian unavailable notice, preserved purpose content and home navigation. No real transaction occurred.
- `robots.txt` currently says `Disallow: /` and no root sitemap is present. Owner must authorize switching intentional indexing on for public pages only.
- Existing intake is safely disabled and **must stay disabled** until Cloudflare/privacy/moderation gates are completed and explicitly approved.

## Ranked first six engineering PRs

1. **M0.1/M0.2 — delivered in PR #109:** homepage cards, primary world-atlas details/results and related dossier previews reject legacy Bulgarian placeholders as native copy; English source fallback is disclosed; the gate identifies interface language and warns in all 18 locales that dossier text may remain English. Exact PR checks and post-merge workflows passed; Cloudflare Pages reported successful deployment, and Bulgarian public-page behavior is read back and verified. The separate Mission Control globe remains under PR #43 ownership.
2. **Public discoverability + donate honesty:** donate checkout honesty is delivered in PR #111 and live-read-back verified; no payment URL was invented and no live transaction was performed. Only an owner-verified public creator URL may activate checkout. Safe public-only robots/sitemap remains owner-gated; do not change `robots.txt Disallow: /` or publish a sitemap without permission. The global crawl block remains the current known indexing risk.
3. **Editorial BG batches:** groups of 10–15 source-reviewed imported dossiers; verify correct narrative, uncertainty, citation and importer preservation. Aim for **101/101 genuine BG + EN** stories, not 101 placeholders of adequate length.
4. **Workers AI service proof / translation quality:** owner-configured `AI` binding, billing guard, 18-locale page matrix, full-story translations and explicit fallback. Do not claim cloud inference runs solely from unit tests.
5. **Video/photo rights and player QA:** 23 video references, public publisher embeds and verified hosted files only, 1 player per dossier; include real browser checks and original-source links.
6. **News reliability with approved test path:** 75 source catalog, 73/75 reachable at 2026-10-30 audit only; investigate current 403/503/WAF behavior through owner-approved logs. Never bypass Cloudflare Error 1010.

## Longer-gated streams

- **Private user reports:** D1 + backups + reviewed privacy rights + Access-authenticated moderation + Turnstile + WAF + retention + human action. Draft PR #14 still isolated; no production activation without owner sign-off.
- **Archive provenance:** draft PR #43 and sync PR #57 still open; avoid overlapping changes. Handle duplicate reports of one physical event, `XZ` regions and unknown coordinates explicitly.
- **Polish:** cinematic design consistency, page-by-page mobile/desktop locale/a11y tests, broken links, performance, monitoring and current release docs.

## Test/merge rule

Each change needs explicit ownership, non-destructive tests, exact-head green PR checks, clean mergeability, post-merge check and Cloudflare deploy result. A green build does not prove live AI, news availability, payment flow or moderated submissions. Source links and media rights must remain attributable; fake cases and airplane radar are out of scope by owner decision.

**Audit limitation:** 2026-11-01 read-only live browser verification covered `/`, `/#worldAtlas` and `/archive/disclosure-iraq-2022` in Bulgarian at 1280×577. No separate production API, D1, news-source or mutation flows were probed; prior news Error 1010 and database authorization limits remain respected.
