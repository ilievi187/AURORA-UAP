# Test Results

## PR #30 — 2026-10-28 locale routes

- Local browser E2E 26/26; static 22/22; feeds 9/9; DB/API 20/20; intake+deployment 19/19; D1 ops 3/3.
- PR #30 and main-push quality gate passed. Production `/news` and `/sky` retained selected English across navigation/reload.

## PR #35 — 2026-10-29 atlas UX (merged)

- Static/model 26/26; existing browser 26/26; atlas browser 8/8; DB/API 20/20; intake 12/12; D1 ops 3/3; deployment gate 7/7; feeds 9/9.
- All 10 PR checks passed. Squash merge `8af79e4b14cf9a14bbe0b637911162c71296963a`; main V1 quality run `40935359711` and world-atlas run `40935359714` passed; Cloudflare Pages production deployment succeeded.
- Production browser verified 15 sourced archive cases, `Australia` → `westall-1966` search, and location caveat. `/api/stats` returned 503 `database_unavailable`; UI showed incomplete registry and retained archive. No production writes/new data. Issue #32 was still open at that checkpoint; the owner closed it at 21:27:11 UTC and successor #52 is now the coordination board.

## PR #33 — NEWS reliability candidate (not deployed)

- Baseline fan-out regression observed 10 simultaneous feed requests; failed before implementation and passed after a five-worker cap.
- Candidate local suites: feeds 25/25; static 22/22; DB/API 20/20; D1 ops 3/3; deployment gate 7/7; intake 12/12; browser E2E 27/27. Bounded local smoke parsed 692 items from 10 feeds and returned 200 deduplicated headlines with zero local-source errors; this does not prove Cloudflare egress.
- Historical checkpoint: pushed head `7c9b4e8` had 13 checks pass after the earlier main sync. It was superseded by code integration `2ab1e24`; the pushed follow-up `2b6ec18` now has 13/13 checks pass. See the latest integration section below.
- Full integration after main through `eea13fe`: static 22/22; feeds 25/25; DB/API 20/20; intake 12/12; deployment 7/7; D1 ops 3/3; source catalog 10/10; i18n unit 2/2; browser E2E 27/27; atlas model/browser 12/12; source-discovery browser 2/2; i18n browser 2/2; gate-focus browser 2/2; donation browser 10/10; Wrangler Pages Functions build compiled successfully.
- Historical targeted suites after integrating main `91676b2` (PR #44), before the source-health/Africa-Americas sync: static 22/22; feeds 25/25; headline translation 2/2; browser E2E 27/27; i18n browser 2/2; mobile-menu browser 2/2; Wrangler Pages Functions build compiled; JS syntax and `git diff --check` passed.
- Production branch preview API previously returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`. No retry/bypass. Production `/news` showed an unavailable state and a later single API request returned HTTP 403 of uncharacterized cause. Functional preview and production recovery are not verified.

## Historical PR #33 integration after PR #45/#46 (local head `2ab1e24`)

- Current base at this local checkpoint included main `199b437` (checked-feed/source-health plus Africa/Americas source desks). No PR #43 archive changes were copied or edited.
- Post-merge local tests passed: static 22/22; live feeds 25/25; source catalog + health 13/13; source-directory browser 2/2; news/outage browser E2E 27/27. Wrangler Pages Functions build compiled; relevant JS syntax checks and `git diff --check` passed.
- At that checkpoint, pushed PR #33 code head `2b6ec18` and docs correction `c5f2fc9` each passed 13 checks. Main was then `c4d4614` and the merge tree was clean.

## Historical main post-merge checks through PR #50

- Main workflows on `199b437` passed: V1 quality `40950940522`, source catalog `40950940849`, language gate `40950940575`, mobile navigation `40950940669`, donation browser `40950940665`.
- PR #50 merged to `main` as `c4d4614`; its 14 PR checks passed. Main post-merge workflows on `c4d4614` passed: V1 `40952647800`, localization `40952647812`, demo image `40952647819`, language gate `40952647870`, mobile navigation `40952647877`, donation `40952648079`.
- Production deployment/user-journey after PRs #45–#50 has not been verified; the production news route was unavailable and one API probe returned an uncharacterized HTTP 403.

## PR #33 source-catalog newsroom integration (code checkpoint `59280cb`)

- Branch synced main through PR #54 merge `760db33`; `functions/api/news.js` now combines Google News with the catalog's 12 preview plus specialist window (21 global sources currently), official-institution feeds, and the checked BG feed.
- Local combined suite passed 80/80: `tests/aurora-v1.test.mjs`, `tests/live-feeds.test.mjs`, `tests/source-catalog.test.mjs`, `tests/source-health.test.mjs`, and `tests/gemini-i18n-quality.test.mjs` under Node 22.
- `npx --yes wrangler@4 pages functions build` compiled successfully. Focused local Semgrep rules found no dynamic-code or unsafe-HTML sinks in the three feed-path modules; this is a narrow scan only.
- GitHub reported 14/14 checks on code checkpoint `59280cba105b5bf56047e1991a0a0e25c764fa7e`; later PR heads also passed. The feed-reader follow-up below needs fresh CI on its final head. PR remains open and unmerged pending owner-approved functional preview verification. An owner-recorded read-only bridge GET returned production HTTP 503 at 21:43 UTC; LUNA did not repeat the earlier HTTP 403 request.

## PR #33 review follow-up — reader deadline and streaming bounds

- Independent review found that each allowed redirect started a fresh 1.5-second timeout and that the 2 MB check happened only after `arrayBuffer()` had buffered the whole feed.
- The reader now creates one per-attempt abort signal shared across allowlisted redirects and body consumption, maps body timeouts to sanitized timeout failures, streams into a fixed 2 MB buffer, caps a response at 4,096 chunks, cancels when either limit is exceeded, and has no unbounded text fallback.
- Added a red/green redirect-plus-body deadline regression and early-cancel tests for oversized and many-tiny-chunk streams; source-health fixtures now use real `Response` streams. The targeted Node 22 suite passed 80/80, `node --check` and `git diff --check` passed, and Wrangler Pages Functions compiled. At 2026-10-29 22:44 UTC, GitHub CI had not yet run on the follow-up head; no production endpoint or browser was queried.

## PR #14 review and PR #34 playback checkpoint

- PR #14 read-only security review at `b089eb2` found no introduced JWT/access-authorization/CSRF/XSS/audit-log/fail-closed bypass. Residual release gates: no pagination beyond the latest 100 queue entries, missing tests for certificate-fetch failure/unknown key ID, and production Access/privacy/retention approval.
- A browser inspection of PR #34 preview `/media` at head `448ee00` showed 20 linked media records but no play button, iframe, or `<video>` element. The owner’s desktop-safety notice was read afterward; no further shared-browser/GUI actions will occur. Actual in-site playback remains unverified; PR #34 remains draft.
