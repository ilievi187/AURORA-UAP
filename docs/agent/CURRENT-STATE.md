# Current State

Verified: 2026-10-28 21:33 UTC (production checks through 21:33:21Z).

- Application-code baseline: `9c9d2275e2df6a83d8b755d8f7ad84cd7866441d` (`fix(i18n): localize clean newsroom and radar routes`, PR #30); this snapshot follows it with documentation-only updates.
- PR #30 merged at 2026-10-28 21:29:04Z; all nine PR checks passed and main-push quality gate run `40772316033` completed successfully.
- Pre-existing open PR at verification time: #14 `Prepare gated Cloudflare Access moderation queue`, still draft; no other pre-existing PR was open.
- Production: `/news` and `/sky` both follow the saved `aurora-lang=en` across navigation and a newsroom reload. English selector, document language, page titles, headings and navigation were verified after PR #30 merged. Intake remains `accepting:false`, `mode:local_draft_only`.
- Production `/api/news?edition=global&lang=en&offset=0` returned HTTP 503 `news_source_unavailable` with zero items and no last-good feed at 2026-10-28 21:33:21Z. Two representative Google News RSS source URLs returned HTTP 200 from the local host; the Cloudflare edge cause remains unknown.
- Production public D1 registry: staged-mode release verifier passed; public registry endpoints correctly gated and sourced reference archive remains separate.
- D1: production binding/database existence, schema and backups not verified in the Cloudflare account. No Wrangler installation/auth or Cloudflare environment variables found in this session.
- Turnstile/WAF: production keys/rules not independently verified; intake disabled.
- PR #14 preview: `/api/moderation/` without authorization returned HTTP 403 `unavailable`; preview is correctly rejected by hostname guard. Moderation is not production-ready until Access and release gates are configured and tested.
- PR #30 local tests passed: browser E2E 26/26, static 22/22, feeds 9/9, DB 20/20, intake/deployment 19/19, D1 ops 3/3. The clean-route regression failed before the fix and passed afterward. PR checks and the main-push quality gate both passed.
- Browser E2E ran locally using Playwright 1.56.1 with system Chromium; no browser dependency or binary was committed.

- Do not record credentials, private submissions, access tokens, or secret values here.

## 2026-10-29 branch-local atlas UX candidate

- Branch: `feat/luna-radar-search-m34`; implementation is staged and final independent review passed; commit/push/PR remain pending.
- Adds 18-locale search/filter/map controls, marker clustering and zoom/pan with the reported-area uncertainty caveat retained in both visible and accessible descriptions, fixed 60-row result windows, bounded D1 page loading with malformed/demo-stat recovery, and visible status when registry completeness is unknown. Locale-aware Turkish casing and separate region-field search have regression tests.
- No new case records, source claims, or coordinates were added. The existing sourced archive is still the coverage limit; this change must not be described as new worldwide source coverage.
- Local verification passed: static/model 26/26, existing browser 26/26, atlas browser 8/8, database 20/20, intake 12/12, D1 operations 3/3, deployment 7/7, live feeds 9/9. `git diff --cached --check` passed. GitHub Actions, preview behavior, and production deployment are not yet verified for this branch.
- Next: finish independent review, commit/push and open a scoped PR referencing issue #32 without closing it, then inspect live CI and verify preview if permitted. No production write/deploy occurred.
