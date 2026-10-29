# AURORA Project Worklog

## 2026-10-29 — Atlas UX delivery (PR #35)

- The searchable atlas UX was completed on `feat/luna-radar-search-m34`; no case data, source claims, media, or coordinates were added.
- Local suites passed: model/static 26/26, existing browser 26/26, atlas browser 8/8, DB/API 20/20, intake 12/12, D1 ops 3/3, deployment gate 7/7, feeds 9/9. PR #35 passed all 10 checks.
- PR #35 was squash-merged at 18:55:35Z as `8af79e4b14cf9a14bbe0b637911162c71296963a`. Main V1 quality and world-atlas workflows passed; Cloudflare Pages production deployment succeeded.
- Production browser check: 15 sourced archive cases rendered; `Australia` search returned `westall-1966`; the location caveat was visible and accessible. Production `/api/stats` returned HTTP 503 `database_unavailable`; code returns this if `DB` is absent or the public-registry flag is not enabled, and the production condition was not verified. The UI marked registry completeness unknown and retained the static archive. No production D1 write occurred. Issue #32 was still open at that checkpoint; the owner closed it at 21:27:11 UTC and successor #52 now coordinates remaining work.

## 2026-10-29 — NEWS reliability candidate (PR #33)

- Production `/api/news?edition=global&lang=en&offset=0` returned HTTP 503 `news_source_unavailable`, no diagnostics and `cf-cache-status: DYNAMIC` at 08:05:59Z. In a later browser audit, production `/news` displayed “Източникът временно не отговаря.” One direct API request returned HTTP 403; its cause/body were not characterized. The owner-recorded read-only bridge GET at 21:43 UTC returned HTTP 503; LUNA made no further request. Production root cause remains unknown.
- Candidate hardens RSS fan-out to five workers, adds sanitized source diagnostics and bounded XML parsing/streaming, preserves partial successes, and reports a local last-good fallback as `cached` with current failed-refresh diagnostics. It does not claim a global Cloudflare cache or proven production fix.
- Regression test observed 10 simultaneous feed requests before the cap and passed afterward. Bounded local smoke parsed 692 items from 10 feeds and returned 200 deduplicated items with zero source errors; this is not Cloudflare runtime evidence.
- At that earlier checkpoint, PR #33 code head `2b6ec18` and docs correction `c5f2fc9` each passed 13 checks. Main was then `c4d4614` and the merge tree was clean, but functional preview remained blocked.
- The direct branch-preview API previously returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`. No retry or bypass. PR #33 is not merged or deployed; functional preview and production recovery are unverified.

## 2026-10-29 — Main integrations and operational gates

- At that checkpoint, PRs #38–#42 and #44–#50 were merged; main `c4d4614` included PR #49's 18-locale report/donation UX and PR #50's dossier metadata/related-case navigation. Main workflows passed; PR preview checks are not production user-journey evidence. Later main includes PR #54 at `760db33`.
- `npx wrangler@4.156.0 whoami` reports unauthenticated. The example Wrangler config contains only a placeholder D1 ID; no Cloudflare settings or data were changed.
- One Gemini browser visit showed a guest/sign-in state and cookie-consent panel. No prompt was submitted, no credentials entered, and no external research was completed.
- PR #14 independent read-only review found no access/JWT/CSRF/XSS/audit/fail-closed bypass; the newest-100 pagination limit and certificate-fetch/unknown-key test gaps remain. PR #34 still lacks a verified in-site playback source. PR #43 archive/source expansion is owned by another agent; do not duplicate its work.
- Production intake remains disabled. No cases, media, or coordinates were invented or added.

## 2026-10-29 — Checked publisher integration (PR #33)

- Refreshed main through PR #54 at `760db33`; merged it into the PR #33 worktree via merge commit `75ca965`, resolving only the source-discovery and GROK documentation overlap while preserving PR #54 specialist-feed selection.
- Added checked publisher headlines to `/api/news`: global uses the 12-feed preview plus specialist-press feeds (21 selected currently), official uses institution feeds, and Bulgaria uses the checked BG feed. News lanes run sequentially with a maximum of five concurrent upstream requests; the catalog lane uses one attempt and a short timeout. Direct publisher links win deduplication; only keyword matches are shown as headlines, never verified cases.
- Code checkpoint `59280cb` passed local targeted suites 78/78, Wrangler Pages Functions compilation, a focused two-rule local Semgrep scan with zero findings, and 14/14 checks; docs-only head `c04c93d` also passed 14/14. The PR description and issue comments were updated. The PR remains open pending owner-approved functional preview verification; the owner-recorded bridge GET at 21:43 UTC returned production HTTP 503, and LUNA did not repeat the earlier 403 request.
- Wrangler 4.156.0 remains unauthenticated. No D1 binding, migration, production data, intake, or Cloudflare setting was changed.
- PR #34 preview inspection showed 20 media links but no player control/iframe/video; actual playback is unverified. The owner’s desktop-safety notice was read afterward; no further GUI/shared-browser action will be taken. PR #14 review found no authorization bypass but left pagination and production Access/privacy gates. Issue #32 was closed by the owner at 2026-10-29 21:27:11 UTC; successor coordination is #52.
