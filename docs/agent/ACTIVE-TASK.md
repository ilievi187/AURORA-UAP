# Active Task

## P1 — Issue #32 NEWS reliability slice

Status: The tested PR #33 code integration is `2b6ec18`; docs-only checkpoint `59cfee2` also passed 13/13 checks. The handoff docs now correct the stale push instructions; this follow-up is docs-only. Re-fetch the exact head and verify fresh CI before any merge. Keep the PR unmerged until an owner-approved functional preview path is available.

Production `/news` displayed “Източникът временно не отговаря.” in the latest browser audit. A single direct `/api/news?edition=global&lang=en&offset=0` request returned HTTP 403 with no characterized error body; stop further requests to that endpoint. The earlier production probe returned HTTP 503 `news_source_unavailable` at 2026-10-29 08:05:59Z. Cloudflare runtime logs/account access are unavailable, so the cause is unconfirmed. The branch preview API returned 403 Error 1010 `browser_signature_banned` / `owner_action_required`; do not retry or bypass.

Candidate scope: five-worker RSS fan-out, sanitized diagnostics, bounded XML parsing/streaming, partial-source serving and explicitly cached last-good fallback. It is a mitigation/diagnostics slice, not proof production is fixed or globally cached.

## PR #34 — in-site video player

Status: draft; checks pass, but actual supported playback has not been verified. Gemini browser was opened once and showed guest/sign-in; no prompt or credentials were submitted. Wait for the user to sign in or provide an owner-approved public embeddable source. Do not merge until a legitimate source plays inside AURORA. Never bypass paywalls, CAPTCHA, WAF or publisher restrictions.

## PR #14 — gated moderation queue

Status: draft. Read-only security review is pending. Production moderation/intake remain blocked pending independent security review, real Cloudflare Access configuration, privacy/retention approval and synthetic-only authenticated verification. Never enable intake as part of D1 registry work.

## PR #35 — searchable global atlas UX (complete)

Squash-merged 2026-10-29 as `8af79e4b14cf9a14bbe0b637911162c71296963a`. Main workflows and production deployment passed; production browser verified 15 archived cases and search. Production `/api/stats` still last returned 503 because `DB` is unconfigured; the UI reports incomplete registry and preserves the static archive. No new cases or coordinates; issue #32 remains open.
