# Active Task

## P1 — NEWS reliability (successor issue #52; originating from #32)

Status: PR #33 app-code checkpoint `59280cb` is based on main `760db33` and includes checked-publisher integration. Follow-up hardening now uses one 1.5-second deadline across the full feed request, allowlisted redirect, and body read, with streamed byte/chunk caps. Local targeted suite passed 80/80 and Pages Functions build compiled. Require fresh CI on the exact current branch head before any merge; keep unmerged until an owner-approved functional preview/API path is available.

Production `/news` displayed “Източникът временно не отговаря.” in the latest browser audit. A direct `/api/news?edition=global&lang=en&offset=0` request returned HTTP 403 with no characterized error body; LUNA made no retry. The earlier probe was HTTP 503 `news_source_unavailable` at 2026-10-29 08:05:59Z; the owner-recorded read-only bridge GET at 21:43 UTC returned HTTP 503. Cloudflare runtime logs/account access are unavailable, so cause is unconfirmed. The branch preview API returned Error 1010 `browser_signature_banned` / `owner_action_required`; do not retry or bypass.

Candidate scope: five-worker Google News fan-out; bounded catalog-backed publisher headlines for global, official and Bulgaria editions; sanitized diagnostics; bounded XML parsing/streaming; partial-source serving; and explicitly cached last-good fallback. These are mitigations, not proof production is fixed or globally cached.

## PR #34 — in-site video player

Status: draft; checks pass, but actual supported playback has not been verified. The deployed PR preview `/media` showed 20 media links but no play button, iframe, or video element. One preview inspection occurred before the owner’s desktop-safety notice was read; no further shared-browser/GUI actions will be taken. Wait for an isolated, owner-approved test path and a public, rights-cleared source. Do not merge until a legitimate source plays inside AURORA. Never bypass paywalls, CAPTCHA, WAF or publisher restrictions.

## PR #14 — gated moderation queue

Status: draft. Independent read-only review found no introduced JWT/auth/CSRF/XSS/audit/fail-closed bypass. Residual gates: the queue returns only the newest 100 submissions without pagination, and tests omit certificate-fetch failure/unknown key ID. Production still requires Access protection on both UI/API paths, configuration, privacy/retention approval and authenticated synthetic-only verification. Never enable intake as part of D1 registry work.

## PR #35 — searchable global atlas UX (complete)

Squash-merged 2026-10-29 as `8af79e4b14cf9a14bbe0b637911162c71296963a`. Main workflows and production deployment passed; production browser verified 15 archived cases and search. Production `/api/stats` last returned 503 `database_unavailable`; code returns this if `DB` is absent or the public-registry flag is not enabled, and no authorized production inspection confirms which. The UI reports incomplete registry and preserves the static archive. No new cases or coordinates. Issue #32 was still open at that checkpoint; the owner closed it at 21:27:11 UTC and successor #52 now tracks remaining work.
