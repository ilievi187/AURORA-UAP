# AURORA — prelaunch read-only security verification

Date: 3 November 2026. Evidence only, NOT legal approval or permission to enable public intake.

## Current live production evidence

- GET /api/intake/status: HTTP 200, Cache-Control: no-store, accepting:false, mode:local_draft_only, auth_required:true, automatic_publication:false, attachments_enabled:false. Turnstile site key not disclosed while intake off.
- GET /privacy: HTTP 200; both Bulgarian and English pages disclose Supabase Auth and Brevo.
- Unauthenticated GET /moderation, /moderation.html, /api/moderation/ and /api/moderation/?view=overview: 302 to Cloudflare Access (no-store redirects).
- Unauthenticated GET /news-editor and /news-editor.html: HTTP 403.
- Live D1 read-only PRAGMA foreign_keys: 1; private report, review event, ownership link row counts all 0; no private report bodies inspected.
- Real age-encrypted D1 snapshot uploaded to owner-only Google Drive, downloaded and restored in isolated SQLite. Integrity + foreign-key checks passed. Daily systemd timer active on NightKnightPC, depends on machine/user manager availability.
- WAF rate limit configured and visually verified for POST /api/intake/submit with 10 requests/10 seconds per IP and temporary 10-second block. Actual edge burst mitigation has NOT been tested.
- Turnstile Siteverify public test credential behavior and production key configuration verified, but NOT a real production-host challenge while intake off.

## Reproducible anonymous-only prelaunch check

Run manually from network-connected machine:

    node scripts/check-private-release-readiness.mjs --live

The checker makes exactly ten bounded, anonymous GET requests. It never submits reports, accesses private report data, bursts traffic or changes D1, Cloudflare, Supabase or backups. It fails if a protected page is HTTP 200, a redirect is not to Cloudflare Access, public intake becomes enabled, status caching violates no-store, or the bilingual privacy/processor notice disappears.

Offline deterministic tests:

    node --test tests/private-release-readiness.test.mjs

This is deliberately a PRELAUNCH checker. If a public launch is authorized, replace its disabled-intake expectation with a proper postlaunch probe. Never treat a simulated successful submit as production readiness.

## Supabase advisory from a read-only inspection

One warning: auth_leaked_password_protection — Leaked Password Protection Disabled. AURORA currently exposes verified email login. Independently verify whether Supabase password login or enrollment is available at the server level, not just UI. If password sign-in is enabled, consider leaked-password protection where supported or disable password-based authentication if it is unnecessary. No password policy was modified automatically.

## Genuine launch blockers

1. Independent Bulgarian/EU privacy review and owner approval: legal basis, controller correspondence information, Cloudflare/Supabase/Brevo agreements, cross-border transfers, minors and third-party data.
2. Working rights request and Supabase account deletion process, deletion reconciliation after restoration, privacy-approved backup retention and processor logging retention.
3. Controlled WAF rule exercise from a dedicated test IP with Security Events review. No disruptive bursts without an approved testing window.
4. Real production-host Turnstile challenge/verified-account submission end-to-end only after other release gates, plus emergency disable.
5. Actual wrong-account Cloudflare Access moderator denial verification; mock identity tests do not replace real denied-account testing.

Do NOT set legal/WAF review flags or AURORA_INTAKE_ENABLED based on this read-only audit alone.
