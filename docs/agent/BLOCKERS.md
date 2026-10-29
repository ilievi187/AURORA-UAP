# Blockers

1. Production news remains unhealthy. Earlier `/api/news` returned HTTP 503 `news_source_unavailable` with no diagnostics and `cf-cache-status: DYNAMIC` at 2026-10-29 08:05:59Z. The latest browser audit showed “Източникът временно не отговаря.”; one later direct API request returned HTTP 403, but its cause was not characterized. Do not make more calls to that endpoint until an approved test path is provided.
2. PR #33 preview API returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`. No retry/bypass. A site-owner-approved preview test path is required before functional preview verification and merge.
3. Production `/api/stats` last returned HTTP 503 `database_unavailable`; binding `DB` was not configured. `npx wrangler@4.156.0 whoami` says not authenticated; example config has a placeholder database ID. Do not guess IDs, overwrite/create database destructively, or enable intake.
4. Production Turnstile, WAF, Access, D1 migrations and backups are not verified. Public intake remains disabled; production moderation remains gated.
5. Privacy worksheet is draft; legal approval, privacy-contact delivery and retention are unverified.
6. PR #14 is draft; read-only security review is pending, and production moderation is blocked pending real Access verification and independent approval.
7. PR #34 is draft; actual supported playback inside AURORA is unverified. Gemini is guest/signed out; no prompt was submitted. Do not enter credentials or bypass publisher restrictions, CAPTCHA, WAF or account walls.
8. PR #43 archive/source expansion is active under another agent. Do not duplicate its files or claims. Issue #32 remains open; do not invent cases, media, source claims or coordinates.
