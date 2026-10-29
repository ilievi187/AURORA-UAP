# Test Results

## PR #30 — 2026-10-28 locale routes

- Local browser E2E 26/26; static 22/22; feeds 9/9; DB/API 20/20; intake+deployment 19/19; D1 ops 3/3.
- PR #30 and main-push quality gate passed. Production `/news` and `/sky` retained selected English across navigation/reload.

## PR #35 — 2026-10-29 atlas UX (merged)

- Static/model 26/26; existing browser 26/26; atlas browser 8/8; DB/API 20/20; intake 12/12; D1 ops 3/3; deployment gate 7/7; feeds 9/9.
- All 10 PR checks passed. Squash merge `8af79e4b14cf9a14bbe0b637911162c71296963a`; main V1 quality run `40935359711` and world-atlas run `40935359714` passed; Cloudflare Pages production deployment succeeded.
- Production browser verified 15 sourced archive cases, `Australia` → `westall-1966` search, and location caveat. `/api/stats` returned 503 `database_unavailable`; UI showed incomplete registry and retained archive. No production writes/new data.

## PR #33 — NEWS reliability candidate (not deployed)

- Baseline fan-out regression observed 10 simultaneous feed requests; failed before implementation and passed after a five-worker cap.
- Candidate local suites: feeds 25/25; static 22/22; DB/API 20/20; D1 ops 3/3; deployment gate 7/7; intake 12/12; browser E2E 27/27. Bounded local smoke parsed 692 items from 10 feeds and returned 200 deduplicated headlines with zero local-source errors; this does not prove Cloudflare egress.
- Pushed head `7c9b4e8` had 13 checks pass at latest remote read (including Cloudflare Pages, browser, localization, mobile, and function-build checks). Local branch is now at `1d9186a` after integrating main through `91676b2`; fresh CI on this new head is pending.
- Full integration after main through `eea13fe`: static 22/22; feeds 25/25; DB/API 20/20; intake 12/12; deployment 7/7; D1 ops 3/3; source catalog 10/10; i18n unit 2/2; browser E2E 27/27; atlas model/browser 12/12; source-discovery browser 2/2; i18n browser 2/2; gate-focus browser 2/2; donation browser 10/10; Wrangler Pages Functions build compiled successfully.
- After integrating main `91676b2` (PR #44), targeted suites passed: static 22/22; feeds 25/25; headline translation 2/2; browser E2E 27/27; i18n browser 2/2; mobile-menu browser 2/2; Wrangler Pages Functions build compiled; JS syntax and `git diff --check` passed.
- Production branch preview API previously returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`. No retry/bypass. Production `/news` showed an unavailable state and a later single API request returned HTTP 403 of uncharacterized cause. Functional preview and production recovery are not verified.

## Main post-merge checks

- PR #44 merged to `main` at `91676b2`; main quality (`40949433969`), localization (`40949434020`), gate-focus (`40949433981`), mobile-menu (`40949433879`) and donation (`40949433999`) workflows passed.
- PR #44's Cloudflare Pages preview check passed; production deployment/user-journey after that merge is not verified.
