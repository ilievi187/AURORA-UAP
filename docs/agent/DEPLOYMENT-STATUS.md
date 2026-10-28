# Deployment Status

Verified 2026-10-28.

- Production custom domain is reachable: `https://aurorauap.org/` responds 200 (canonical redirects may occur).
- Production report route responds 200.
- Production intake is disabled: `/api/intake/status` reports `accepting:false`, `local_draft_only`.
- Public registry is in staged mode; remote read-only verifier passes and public D1 endpoints are gated.
- PR #14 preview deployment reports successful in the PR check; its unauthenticated moderation API returns 403. This does not establish a production moderation deployment.
- No Cloudflare account admin credentials/tools were found in this session. Production D1, bindings, migrations, backup, Turnstile, WAF, Access application and environment variables are unverified.
- Do not change gates or claim production intake/admin readiness. Follow `docs/V1.7-LIVE-SUBMISSION-ACTIVATION.md` and `docs/V1.8-MODERATION-SETUP.md` after PR #14 is reviewed/merged and an authorized operator can inspect the account.
