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

## 2026-10-29 searchable global atlas UX candidate (local)

- Static/model tests: 26/26 passed; JavaScript syntax checks passed, including Turkish dotless-i casing and region-field search distinct from city search.
- Existing Chromium browser suite: 26/26 passed; dedicated atlas browser suite: 8/8 passed, including page-two D1 sentinel, HTTP failure/null payload recovery, demo-contaminated stats status, map caveat, late-enrichment focus restoration/fallback, 60-row pagination, marker/cluster keyboard focus, and localized labels.
- SQLite database/API: 20/20; private intake: 12/12; D1 operations: 3/3; deployment readiness: 7/7; live feeds: 9/9.
- Dense clustering fixture: 12,000 collocated markers completed within the 1.5-second test bound; implementation uses linear grid-cell aggregation.
- `git diff --cached --check` passed. Local Playwright used `/usr/bin/chromium`; no browser binary/dependency is committed.
- Final independent staged-diff review passed with no actionable findings. GitHub Actions, preview, and production behavior have not been verified for this candidate.
