# Test Results

## 2026-10-28 initial session baseline

- Main local Node tests: 60 passed, 0 failed (`--experimental-sqlite`; static, DB, deployment, D1 and intake suites).
- PR #14 targeted tests: 15 passed, 0 failed (`intake.test.mjs`, `moderation.test.mjs`).
- PR #14 additional static/DB/deployment tests: 48 passed, 0 failed.
- PR #14 GitHub Actions: all six checks passed (Cloudflare Pages, browser-e2e, d1-operations, database-api, deployment-readiness, private-intake).
- Production live intake status: `accepting:false`, `mode:local_draft_only`.
- Production `scripts/check-registry.mjs --mode staged`: PASS; API endpoints gated and eight sourced reference cases separate from D1.
- Production homepage and report page: HTTP 200 after canonical 308 redirect.
- PR #14 preview unauthenticated moderation API: HTTP 403 `unavailable`.
- Local browser: unavailable; Chrome failed before DevToolsActivePort. No local screenshot/visual inspection claimed.

Tests are environment-specific. Re-run relevant suites on the latest commit before merge/release; CI/deployment/live verification are separate proofs.

## 2026-10-28 follow-up (PR #30 candidate)

- Regression: browser test reproduced Bulgarian newsroom copy on clean `/news` while Spanish was selected; passed after path normalization. It also checks `/sky/`, cross-page persistence and localized title.
- Local browser E2E: 26 passed, 0 failed (Playwright 1.56.1 with system Chromium).
- Local static: 22/22; live-feed tests: 9/9; SQLite DB/API: 20/20; intake + deployment readiness: 19/19; D1 operations: 3/3.
- `node --check subpage-i18n.js` and `git diff --check`: pass.
- PR #30 code-only run `40770993688` passed all nine checks, including browser E2E and Cloudflare Pages deployment; the final state-doc commit also passed checks in run `40772160758`.

## 2026-10-28 post-merge production verification

- Main commit `9c9d2275e2df6a83d8b755d8f7ad84cd7866441d`; main-push run `40772316033` completed successfully.
- Production browser check: after selecting English, `/news` and `/sky` showed English document language, selector, headings, titles and navigation; English persisted across navigation and a newsroom reload.
- Production API check at 21:33:21Z: `/api/news?edition=global&lang=en&offset=0` returned HTTP 503 `news_source_unavailable`, zero items and no last-good response. This independent issue remains blocked; see `BLOCKERS.md`.

## 2026-10-29 Issue #32 news reliability candidate

- Production API at 08:05:59Z returned HTTP 503 `news_source_unavailable`, 69-byte JSON response without diagnostics, `cf-cache-status: DYNAMIC`. Production `/news` browser later showed a localized visible offline message and zero cards.
- On latest `origin/main` `5aa42c0`, a new concurrency regression failed with observed maximum 10 feed requests. After implementing a five-worker queue, the same test passed with the expected one deduplicated item.
- New tests were observed red before implementation for missing per-source diagnostics, partial-source serving, parser classification, malformed XML/control markers, duplicate and namespace-expanded attributes, item-like comment/CDATA/PI markup, XML declaration/outside-root whitespace, RSS root/channel identity, bounded timeout classification, node/depth/attribute/namespace limits, oversized response-stream cancellation, tiny-chunk limits/no-text-fallback, non-OK body cancellation, stale translated fallback and intermediary cache headers. Candidate tests now pass: `npm run test:feeds` 25/25.
- Candidate static tests: `node --test tests/aurora-v1.test.mjs` 22/22; SQLite DB/API 20/20; D1 ops 3/3; deployment gate 7/7; intake 12/12. Playwright browser E2E 27/27, including the new mobile 503/offline-state test. `node --check functions/api/news.js` and `git diff --check` pass.
- Bounded local live RSS smoke parsed all ten configured sources and 692 feed items; 200 deduplicated items were returned with zero source errors. This is not Cloudflare runtime evidence.
- Exact production cause remains unconfirmed because Cloudflare runtime logs/bindings are unavailable. No production deployment, global-cache guarantee, or live-feed recovery is claimed.
