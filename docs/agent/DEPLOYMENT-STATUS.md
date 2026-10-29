# Deployment Status

Verified 2026-10-29 10:48 UTC.

- Production custom domain is reachable: `https://aurorauap.org/` responds 200 (canonical redirects may occur).
- Production clean routes `/news` and `/sky` now render the selected English locale and retain it across navigation/reload after PR #30. Production browser verification passed on 2026-10-28.
- Production `/api/news?edition=global&lang=en&offset=0` returned HTTP 503 `news_source_unavailable`, zero items, no diagnostics and `cf-cache-status: DYNAMIC` at 2026-10-29 08:05:59Z. The newsroom reliability candidate remains code-only; do not claim production is fixed or live.
- PR #29 merged to main at 20:59:01Z; its main-push quality gate passed. PR #30 merged at 21:29:04Z; its nine PR checks and main-push quality gate passed. The English clean-route behavior was independently verified on production.
- Production report route responds 200.
- Production intake is disabled: `/api/intake/status` reports `accepting:false`, `local_draft_only`.
- Public registry is in staged mode; remote read-only verifier passes and public D1 endpoints are gated.
- PR #14 preview deployment reports successful in the PR check; its unauthenticated moderation API returns 403. This does not establish a production moderation deployment.
- No Cloudflare account admin credentials/tools were found in this session. Production D1, bindings, migrations, backup, Turnstile, WAF, Access application and environment variables are unverified.
- Do not change gates or claim production intake/admin readiness. Follow `docs/V1.7-LIVE-SUBMISSION-ACTIVATION.md` and `docs/V1.8-MODERATION-SETUP.md` after PR #14 is reviewed/merged and an authorized operator can inspect the account.
