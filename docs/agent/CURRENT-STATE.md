# Current State

Verified: 2026-10-29 20:52 UTC. Re-fetch remote state before action.

## Main and production

- Latest observed `origin/main`: `c4d46147e29932b0b2aa9debc1593b6902bcd206`, including merged PRs #38–#42 and #44–#50. PR #43 remains open. Main workflows for V1, localization, demo image, language gate, mobile navigation and donation passed on `c4d4614`.
- PR #35 production deployment and browser check remain verified: sourced 15-case archive, `Australia` search → `westall-1966`, accessible map caveat. No new cases or coordinates.
- Production `/api/stats` last returned HTTP 503 `database_unavailable` because D1 binding `DB` was not configured; UI marked registry completeness unknown and retained the archive. No production D1 writes.
- Production `/news` displayed the Bulgarian unavailable-source message in the latest in-session browser audit. One direct API request returned HTTP 403 without a characterized error body; no retry. The earlier API response was HTTP 503 `news_source_unavailable` at 08:05:59Z. Cause remains unknown.
- Main/PR Cloudflare Pages checks are green, but production deployment/user-journey after PRs #45–#50 is not verified. Do not infer production behavior from preview checks.

## Open work

- PR #33 code integration `2b6ec18` and docs checkpoint `59cfee2` each passed 13 checks. A docs-only correction to the stale handoff instructions is recorded in this branch; verify its checks on the resulting head before merge. Current main is `c4d4614`; local merge-tree is clean. The preview API's earlier HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required` remains a hard verification blocker; no bypass.
- PR #34 media player remains draft. Actual live playback is unverified; Gemini showed guest/sign-in and no research prompt was sent.
- PR #14 moderation remains draft; independent read-only security review is pending. Production Access, privacy, retention and moderation gates are not verified. Keep intake disabled.
- Cloudflare D1 binding/database/migrations/backups, Turnstile, WAF and Access settings are unverified. `npx wrangler@4.156.0 whoami` reports unauthenticated; example config has a placeholder database ID. No Cloudflare changes made.
- PR #43 archive expansion remains open and assigned to another agent. Avoid overlapping source/archive work.
- Issue #32 remains OPEN for news recovery, video, authentic source expansion and broader archive coverage.

## Coordination

- PRs #38–#42 and #44–#50 are merged by their owners; PR #43 remains open and assigned elsewhere. Do not alter TERA's separate frontend worktree or the active PR #43 archive branch.
