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
- PR #30 code-only run `40770993688` passed all nine checks, including browser E2E and Cloudflare Pages deployment. This state-doc follow-up will trigger a new run. Production `/api/news` returned 503 independently; see `BLOCKERS.md`.
