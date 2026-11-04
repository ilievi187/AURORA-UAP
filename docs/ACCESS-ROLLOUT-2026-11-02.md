# AURORA — Cloudflare Access moderator rollout, 2026-11-02

## Verified in production
- A Cloudflare Zero Trust Self-hosted Access application exists for the moderation routes.
- An **Allow** policy named `AURORA Owner Only` is attached, using an exact-email Include selector. Do not change to Everyone or Bypass.
- Unauthenticated requests to `/moderation`, `/moderation.html` and `/api/moderation/` redirect to the Cloudflare Access login (HTTP 302).
- `/api/moderation` without the trailing slash is denied by the origin (HTTP 403).
- The root application and `/api/intake/status` still return HTTP 200; intake status is `accepting:false`.
- Cloudflare Pages **production** has encrypted bindings `AURORA_ACCESS_TEAM`, `AURORA_ACCESS_AUD`, `AURORA_MODERATION_ENABLED` and `AURORA_MODERATOR_EMAIL`. The binding values must never be included in the repository.
- Cloudflare Pages functions are configured Fail Closed for production and preview.

## Purpose of this deploy
Cloudflare Pages secret bindings must exist before the deployment that consumes them. This documentation-only PR triggers a **new main/production deployment** that picks up the verified private moderator bindings, without changing executable code or intake switches.

## Mandatory authenticated smoke after release
1. Open `https://aurorauap.org/moderation` in a normal browser. Cloudflare Access should prompt for the owner's email and deliver a one-time login code.
2. An authorized sign-in should show the private moderation interface (including a private queue that may be empty), not an origin 403.
3. An incognito visitor without authentication must be sent to the Access login; a different email must not be allowed.
4. Open the public home, world atlas and `/report.html`; normal navigation remains available.
5. Check `https://aurorauap.org/api/intake/status` stays `accepting:false` until privacy, backups, Turnstile, WAF and intake activation are separately verified.
6. If the authorized user receives 403 after Access login, do not weaken auth: check issuer, audience, JWT forwarding and the production deployment bindings.
7. Check `/moderation/` too, as Cloudflare Access path handling can differ from Pages canonical routing.

Do not disclose report data or Access JWTs in logs. This PR does **not** set `AURORA_INTAKE_ENABLED`, `AURORA_INTAKE_LEGAL_APPROVED`, `AURORA_INTAKE_WAF_REVIEWED` or `AURORA_RETENTION_PURGE_ENABLED`.


## 4 Nov — negative JWT and route alias proof

The origin now has regression tests using correctly signed synthetic RS256 tokens for a different email, plus issuer/audience/expiry/signature failures, covering moderator/editor pages and APIs and owner Turnstile diagnostics. Access is checked before any D1 query. Read-only production alias probes found no private content. Current Access policy API inspection was denied (401/403), so a real different-email denied login remains required later. See docs/ACCESS-NEGATIVE-IDENTITY-AUDIT-2026-11-04.md.
