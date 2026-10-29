# Blockers

1. Production `/api/news?edition=global&lang=en&offset=0` last returned HTTP 503 `news_source_unavailable`, no diagnostics and `cf-cache-status: DYNAMIC` at 2026-10-29 08:05:59Z. Main code launched ten feed requests concurrently; PR #33 adds a five-worker mitigation/diagnostics, but Cloudflare's root cause is unconfirmed without runtime logs.
2. PR #33 preview API returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required` at 2026-10-29 11:05:03Z. No retry/bypass. A site-owner-approved preview test path is required before functional preview verification and merge.
3. Production `/api/stats` returns HTTP 503 `database_unavailable`; binding `DB` is not configured. Cloudflare Wrangler is not installed/authenticated and no Cloudflare environment-variable names are available. Do not guess IDs, overwrite/create database destructively, or enable intake.
4. Production Turnstile, WAF, Access, D1 migrations and backups are not verified. Public intake remains disabled; production moderation remains gated.
5. Privacy worksheet is draft; legal approval, privacy-contact delivery and retention are unverified.
6. PR #14 is draft; production moderation is blocked pending independent security review and real Access verification.
7. PR #34 is draft; actual supported playback inside AURORA is unverified. Never bypass publisher restrictions, CAPTCHA, WAF or account walls.
8. Issue #32 remains OPEN for news recovery, inline video, international sources and broader sourced archive coverage. Do not invent cases, media, source claims or coordinates.

Independent local code/tests/docs can continue. TERA's remote branch `tera/mobile-a11y-regression` at `972661a` changes donation mobile layout; leave it untouched.
