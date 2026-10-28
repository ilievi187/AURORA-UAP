# Test Results

## 2026-10-28

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
