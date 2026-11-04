> **LATEST VERIFIED RESULT — 4 Nov 2026:** The owner supplied a screenshot of the genuine production managed Turnstile widget showing success **and** AURORA displaying "PASS: real Turnstile Siteverify succeeded. No report was submitted." after PR #153. This confirms the isolated owner-only Siteverify proof; prior failures below are retained as historical incident notes. No token, key, reporter data or screenshot of unrelated desktop content was committed.

# AURORA — owner-only live Turnstile challenge diagnostic

Prelaunch operator procedure, 4 November 2026. This does NOT activate public intake, create a report or mark legal review completed.

## Isolated owner URL

https://aurorauap.org/api/moderation/turnstile

- Access is checked twice: Cloudflare Access at the edge (when matched by the dashboard policy) AND an independent exact-issuer, signed JWT, audience and owner-email verification at the Pages origin.
- Requires AURORA_MODERATION_ENABLED=enabled, production hostname, and real non-dummy Turnstile site and encrypted secret keys.
- Unlike the normal report intake, it does NOT require AURORA_INTAKE_ENABLED. This is deliberately a read-only operational proof for the owner.
- GET responds with a restricted, no-store diagnostic HTML page and only the public site key. No cloud secrets, reporter data or private moderation reports.
- The user manually clicks Run real Turnstile challenge in the isolated page. The widget performs the genuine managed challenge with action aurora_report.
- The temporary challenge token is POSTed to the same Access-protected endpoint, where the origin verifies it against real Cloudflare Siteverify. Success requires actual success:true and exact hostname aurorauap.org and action aurora_report. The result reports ONLY verification status and confirms no report was submitted.
- The verification endpoint does NOT have or access any D1 resource. The diagnostic cannot accept reports, publish anything, delete data or change production feature flags.
- A separate CSP permits challenges.cloudflare.com only in this isolated diagnostic response. The existing sensitive moderation.html CSP remains unchanged.
- POST requests have strict Origin and JSON-only validation, bounded token size, fail-closed authentication and no-store headers. There is no access for anonymous users, wrong account claims, previews, public dummy keys or other paths.
- The standalone diagnostics JavaScript does not log or store the token; it uses only textContent to render the outcome.

## Owner verification checklist

1. Open https://aurorauap.org/moderation after normal owner Cloudflare Access sign-in.
2. Use the Open isolated Turnstile test link. If the session is valid, the new page should appear.
3. Click Run real Turnstile challenge. Complete any prompted verification. Wait for PASS: real Turnstile verification succeeded. No report was submitted.
4. Privately note the result and time. Do not send the challenge token, JWT or private account details in chat or GitHub.
5. Confirm GET https://aurorauap.org/api/intake/status still returns accepting:false; confirm private D1 rows unchanged. A PASS proves Turnstile only, NOT reporter submission, privacy compliance or moderator wrong-account denial.
6. If the page is forbidden, confirm the Access app protects /api/moderation/* and the owner's Cloudflare identity is authorized. Do not weaken JWT checks. If the challenge fails, verify hostname/action, real configured secret and the isolated diagnostic CSP.

## Automated coverage

- tests/moderation.test.mjs uses signed fake Access JWTs and synthetic Siteverify responses. It checks unauthorized denial, wrong identity, non-production host rejection, dummy key rejection, CSP isolation, exact hostname/action proof and absence of database calls.
- scripts/check-private-release-readiness.mjs now includes the diagnostic URL in the anonymous-only safety monitor; it must not return a public HTTP 200.
- The only genuine challenge proof comes from the owner's real browser interaction. Tests alone cannot assert success until that occurs.

Remaining public launch blockers are documented in docs/LAUNCH-READINESS-2026-11-04.md.


## 4 November 2026 — real widget success and server failure follow-up

The real managed widget displayed Cloudflare Success, but AURORA's previous frontend showed only a generic FAIL. A successful widget alone does not prove server-side Siteverify passed. There is no evidence of a successful production Siteverify yet.

The diagnostic now displays only safe failure categories: server_secret_rejected, token_rejected, expired_or_reused_token, hostname_mismatch, action_mismatch, siteverify_rejected and siteverify_unavailable. It never exposes a token, secret, account identifier, raw upstream message, IP or Cloudflare Access JWT. The owner can try a fresh challenge after failure, with intake disabled and no D1 access.

A server_secret_rejected result requires an authorized dashboard review of encrypted Pages AURORA_TURNSTILE_SECRET against the same Turnstile widget as the site's public key. Never paste secret values in a chat or PR. A token_rejected result can also signal mismatched widget credentials. The server continues to demand the exact action aurora_report and hostname aurorauap.org.


## 4 November 2026 — root cause of HTTP 503 found

The real browser widget showed Success but the server returned HTTP 503. Source review found that the shared Siteverify helper passed redirect:error to a Cloudflare Pages/Workers fetch. Cloudflare Workers Request API does not implement redirect:error and throws TypeError before sending the network request. This explains the diagnostic error without suggesting the owner entered wrong keys.

The approved correction changes fetch to redirect:manual, which does NOT follow redirects; the existing non-2xx response rejection remains mandatory. Same unsupported mode was found in the restricted Supabase user verification and news-tip Turnstile helper and was corrected there too. The actual successful production Siteverify challenge must still be rechecked after deployment; code and synthetic tests alone do not prove success.


## Owner confirmation after PR #153 — actual PASS (4 November 2026)

After deploying the Cloudflare Workers redirect:manual compatibility fix in PR #153, the owner re-ran the production-only Access-protected diagnostic and supplied a screenshot showing both the real Cloudflare widget success and the message:

PASS: real Turnstile Siteverify succeeded. No report was submitted.

This passes the **real Siteverify owner diagnostic** gate: the server accepted the one-time token with the expected hostname and aurora_report action. The result is not an end-to-end private-report submission test, does not verify D1 moderation workflows with a real reporter identity, and is not a GDPR or launch authorization.

Do not rerun this diagnostic needlessly or paste Turnstile tokens or Cloudflare Access credentials into source control.
