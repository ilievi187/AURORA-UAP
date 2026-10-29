# Test Results

## PR #30 — 2026-10-28 locale routes

- Local browser E2E 26/26; static 22/22; feeds 9/9; DB/API 20/20; intake+deployment 19/19; D1 ops 3/3.
- PR #30 and main-push quality gate passed. Production `/news` and `/sky` retained selected English across navigation/reload.

## PR #35 — 2026-10-29 atlas UX (merged)

- Static/model 26/26; existing browser 26/26; atlas browser 8/8; DB/API 20/20; intake 12/12; D1 ops 3/3; deployment gate 7/7; live feeds 9/9.
- All 10 PR checks passed. Squash merge `8af79e4b14cf9a14bbe0b637911162c71296963a`; main V1 quality run `40935359711` and world-atlas run `40935359714` passed; Cloudflare Pages production deployment succeeded.
- Production browser verified 15 sourced archive cases, `Australia` → `westall-1966` search, and the location caveat. Production `/api/stats` returned 503 `database_unavailable` because binding `DB` is not configured; UI displayed incomplete registry and retained the archive. No production writes/new data.

## PR #33 — 2026-10-29 NEWS reliability candidate (not deployed)

- Baseline concurrency regression observed 10 simultaneous feed requests; failed before implementation and passed after a five-worker cap.
- Local candidate suites: feeds 25/25; static 22/22; DB/API 20/20; D1 ops 3/3; deployment gate 7/7; intake 12/12; browser E2E 27/27. Bounded local smoke parsed 692 items from 10 feeds and returned 200 deduplicated headlines with zero local-source errors; this does not prove Cloudflare egress.
- Nine PR checks passed on earlier code head `40862406395` and state-doc head `40863006822`; main advanced to `8af79e4`, so PR #33 became `DIRTY`. Fresh checks are required after conflict resolution.
- Cloudflare Pages preview deployment check passed, but direct preview API returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`. No bypass; functional preview and production recovery are not verified.

## PR #33 conflict resolution in progress

- The conflict-resolution merge commit `34d30c7d88abd3bfbfcf06030fd0b0898d11e33e` includes current `main` `35a61ff`; four docs conflicts were reconciled and the browser test auto-merged.
- Post-merge local tests passed: static 22/22; feeds 25/25; DB/API 20/20; intake 12/12; deployment 7/7; D1 ops 3/3; browser E2E 27/27; atlas model/browser 12/12; donation browser 6/6. `node --check functions/api/news.js` and `git diff --check` passed.
- The updated head has not been pushed; fresh GitHub CI is pending. The previous preview API probe remains blocked by Cloudflare Error 1010, so functional preview verification and merge are still blocked.
