# Active Task

## P1 — Issue #32 NEWS reliability slice

Status: PR #33 is open from `fix/news-recovery-diagnostics-issue32`. Its nine checks passed on earlier heads, but `mergeStateStatus` became `DIRTY` after PR #35 merged. Conflicts are resolved locally by merge commit `34d30c7d88abd3bfbfcf06030fd0b0898d11e33e` integrating current `main` (`35a61ff`); the update has not yet been pushed, so fresh PR CI is pending.

Production `/api/news?edition=global&lang=en&offset=0` last returned HTTP 503 `news_source_unavailable` at 2026-10-29 08:05:59Z. Cloudflare runtime logs/account bindings are unavailable, so root cause is unconfirmed. PR #33's preview API returned HTTP 403 Error 1010 `browser_signature_banned` with `owner_action_required`; do not retry or bypass. Keep PR open until a permitted user-path preview check can be done.

Candidate scope: five-worker RSS fan-out, sanitized aggregate diagnostics, bounded XML parsing/stream reading, partial-source serving and explicitly cached last-good fallback. This is a mitigation/diagnostics slice, not proof production is fixed or globally cached.

## PR #34 — in-site video player

Status: draft, all current checks passed, but actual supported playback has not been verified. Do not merge until a legitimate source plays inside the AURORA UI. No paywall, CAPTCHA, WAF or publisher restrictions may be bypassed.

## PR #14 — gated moderation queue

Status: draft. Production moderation/intake remain blocked pending security review, real Cloudflare Access configuration, privacy/retention approval and synthetic-only authenticated verification. Never enable production intake as part of D1 registry work.

## PR #35 — searchable global atlas UX (complete)

Squash-merged 2026-10-29 as `8af79e4b14cf9a14bbe0b637911162c71296963a`. Main quality/world-atlas workflows and Cloudflare production deployment passed; production browser verified 15 archived cases and search. Production `/api/stats` still returns 503 because `DB` is unconfigured; the UI reports incomplete registry and preserves the static archive. No new cases or coordinates; issue #32 remains open.
