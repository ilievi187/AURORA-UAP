# Current State

Verified: 2026-10-29 22:04 UTC. Re-fetch remote state before action.

## Main and production

- Latest observed `origin/main`: `760db33d8967874cf6d2958d3a4416fb8f0af32a`, including PR #54 specialist discovery; PR #43 remains open and assigned to another agent. Main production behavior after PR #54 is not verified.
- PR #35 production deployment and browser check remain verified: sourced 15-case archive, `Australia` search → `westall-1966`, accessible map caveat. No new cases or coordinates.
- Production `/api/stats` last returned HTTP 503 `database_unavailable` because D1 binding `DB` was not configured; UI marked registry completeness unknown and retained the archive. No production D1 writes.
- Production `/news` displayed the Bulgarian unavailable-source message in the latest in-session browser audit. One direct API request returned HTTP 403 without a characterized error body; no retry. The earlier API response was HTTP 503 `news_source_unavailable` at 08:05:59Z. Cause remains unknown.
- PR #33 Pages preview build check is green, but functional preview is blocked by the earlier Error 1010 owner-action response. Production deployment/user-journey after PRs #45–#54 is not verified. Do not infer production behavior from build checks.

## Open work

- PR #33 code checkpoint `59280cb` includes source-catalog integration and main through `760db33`; its exact head passed 14 checks, local targeted suites passed 78/78, and the Pages Functions build compiled. The PR remains open and unmerged; the earlier preview API Error 1010 `browser_signature_banned` / `owner_action_required` remains a hard verification blocker. No retry or bypass.
- PR #34 remains draft. The deployed preview media page listed 20 media links but had no play button, iframe or video element; actual playback is unverified. No source or media was added.
- PR #14 moderation remains draft. Independent read-only review found no auth/JWT/CSRF/XSS/audit/fail-closed bypass; the 100-submission cap and missing certificate-fetch/unknown-key tests remain. Production Access, privacy, retention and moderation gates are not verified. Keep intake disabled.
- Cloudflare D1 binding/database/migrations/backups, Turnstile, WAF and Access settings are unverified. `npx wrangler@4.156.0 whoami` reports unauthenticated; example config has a placeholder database ID. No Cloudflare changes made.
- PR #43 archive expansion remains open and assigned to another agent. Avoid overlapping source/archive work.
- Issue #32 remains OPEN for news recovery, video, authentic source expansion and broader archive coverage.

## Coordination

- PRs #38–#42 and #44–#50 are merged by their owners; PR #43 remains open and assigned elsewhere. Do not alter TERA's separate frontend worktree or the active PR #43 archive branch.
