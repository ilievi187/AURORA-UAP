# Active Task

## P1 — Issue #32 NEWS reliability slice

Status: PR #33 code checkpoint `59280cb` syncs main through `760db33` and includes checked-publisher integration. This checkpoint passed 14/14 PR checks; local targeted suites passed 78/78 and the Pages Functions build compiled. Re-fetch the exact head and fresh CI before merge. Keep the PR unmerged until an owner-approved functional preview/API path is available.

Production `/news` displayed “Източникът временно не отговаря.” in the latest browser audit. A single direct `/api/news?edition=global&lang=en&offset=0` request returned HTTP 403 with no characterized error body; stop further requests to that endpoint. The earlier production probe returned HTTP 503 `news_source_unavailable` at 2026-10-29 08:05:59Z. Cloudflare runtime logs/account access are unavailable, so the cause is unconfirmed. The branch preview API returned 403 Error 1010 `browser_signature_banned` / `owner_action_required`; do not retry or bypass.

Candidate scope: five-worker Google News fan-out; bounded catalog-backed publisher headlines for global, official and Bulgaria editions; sanitized diagnostics; bounded XML parsing/streaming; partial-source serving; and explicitly cached last-good fallback. These are mitigations, not proof production is fixed or globally cached.

## PR #34 — in-site video player

Status: draft; checks pass, but actual supported playback has not been verified. The deployed PR preview `/media` showed 20 media links but no play button, iframe, or video element. Gemini browser was previously guest/sign-in; no prompt or credentials were submitted. Wait for a public, rights-cleared embeddable source or owner-approved test path. Do not merge until a legitimate source plays inside AURORA. Never bypass paywalls, CAPTCHA, WAF or publisher restrictions.

## PR #14 — gated moderation queue

Status: draft. Independent read-only review found no introduced JWT/auth/CSRF/XSS/audit/fail-closed bypass. Residual gates: the queue returns only the newest 100 submissions without pagination, and tests omit certificate-fetch failure/unknown key ID. Production still requires Access protection on both UI/API paths, configuration, privacy/retention approval and authenticated synthetic-only verification. Never enable intake as part of D1 registry work.

## PR #35 — searchable global atlas UX (complete)

Squash-merged 2026-10-29 as `8af79e4b14cf9a14bbe0b637911162c71296963a`. Main workflows and production deployment passed; production browser verified 15 archived cases and search. Production `/api/stats` still last returned 503 because `DB` is unconfigured; the UI reports incomplete registry and preserves the static archive. No new cases or coordinates; issue #32 remains open.
