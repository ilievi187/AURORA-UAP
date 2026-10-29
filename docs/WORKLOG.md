# AURORA Project Worklog

## 2026-10-29 — Atlas UX delivery (PR #35)

- The searchable atlas UX was completed on `feat/luna-radar-search-m34`; no case data, source claims, media, or coordinates were added.
- Local suites passed: model/static 26/26, existing browser 26/26, atlas browser 8/8, DB/API 20/20, intake 12/12, D1 ops 3/3, deployment gate 7/7, feeds 9/9. PR #35 passed all 10 checks.
- PR #35 was squash-merged at 18:55:35Z as `8af79e4b14cf9a14bbe0b637911162c71296963a`. Main V1 quality and world-atlas workflows passed; Cloudflare Pages production deployment succeeded.
- Production browser check: 15 sourced archive cases rendered; `Australia` search returned `westall-1966`; the location caveat was visible and accessible. Production `/api/stats` returned HTTP 503 `database_unavailable` because D1 binding `DB` is not configured; the UI marked registry completeness unknown and retained the static archive. No production D1 write occurred. Issue #32 remains open.

## 2026-10-29 — NEWS reliability candidate (PR #33)

- Production `/api/news?edition=global&lang=en&offset=0` returned HTTP 503 `news_source_unavailable`, no diagnostics and `cf-cache-status: DYNAMIC` at 08:05:59Z. In a later browser audit, production `/news` displayed “Източникът временно не отговаря.” One direct API request returned HTTP 403; the cause and body were not characterized, so no further requests were made to that endpoint. Production root cause remains unknown.
- Candidate hardens RSS fan-out to five workers, adds sanitized source diagnostics and bounded XML parsing/streaming, preserves partial successes, and reports a local last-good fallback as `cached` with current failed-refresh diagnostics. It does not claim a global Cloudflare cache or proven production fix.
- Regression test observed 10 simultaneous feed requests before the cap and passed afterward. Bounded local smoke parsed 692 items from 10 feeds and returned 200 deduplicated items with zero source errors; this is not Cloudflare runtime evidence.
- PR #33 pushed head `7c9b4e8` had 13 passing checks at the latest remote check. A subsequent local merge integrates current `origin/main` through `91676b2` in commit `1d9186a`; relevant post-merge suites and Pages Functions build passed locally. The new integration commit is not pushed; fresh CI is pending.
- The direct branch-preview API previously returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`. No retry or bypass. PR #33 is not merged or deployed; functional preview and production recovery are unverified.

## 2026-10-29 — Main integrations and operational gates

- PRs #38 (18-locale subpage translation), #39 (verified source catalog), #40–#42 (keyboard/mobile accessibility), and #44 (script-aware headline/summary translation) merged. Main workflows for `91676b2` passed. PR #44's Cloudflare Pages check is not evidence of production user-journey verification.
- `npx wrangler@4.156.0 whoami` reports unauthenticated. The example Wrangler config contains only a placeholder D1 ID; no Cloudflare settings or data were changed.
- One Gemini browser visit showed a guest/sign-in state and cookie-consent panel. No prompt was submitted, no credentials entered, and no external research was completed.
- PR #14 security review is pending. PR #34 remains blocked on an authorized, embeddable source with real playback. PR #43 archive/source expansion is owned by another agent; do not duplicate its work.
- Production intake remains disabled. No cases, media, or coordinates were invented or added.
