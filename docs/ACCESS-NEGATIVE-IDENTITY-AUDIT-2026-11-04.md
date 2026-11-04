# AURORA — independent negative Cloudflare Access identity audit

4 November 2026. Technical test evidence, NOT the equivalent of a real denied second email account. No real credentials, cookies, owner identity or personal data were used.

## Live anonymous read-only URL aliases

One bounded read-only audit sent ten GET requests to alternative moderator/news-editor routes (trailing slash, encoded period and letter, nested index and encoded slash).
- Protected aliases were denied with HTTP 403 or redirected to the Cloudflare Access login with HTTP 302.
- Two routes returned HTTP 200: /api/moderation%2f and /news-editor.html/. Inspection of their HTML showed the title AURORA UAP | Explore the Unexplained and exactly the ordinary public homepage fallback, not a moderator or editor shell. The separate nonexistent-URL control returned the same homepage.
- The daily prelaunch monitor now tests five additional explicitly protected variants: /moderation.html/, /moderation%2ehtml, /moderation/index.html, /api/moderation/index, /api/moderation/turnstile/. The monitor runs 17 anonymous read-only GET checks. Any accidental 200 on a protected path fails the monitor.

## Synthetic signed different-account JWT denial

The offline test tests/access-denial-matrix.test.mjs generates an ephemeral RSA private key, public JWKS and short-lived RS256 tokens, all fictional. It verifies that:
- A correctly signed JWT carrying a DIFFERENT email is denied, even though its issuer, audience and signature are otherwise valid.
- A wrong application audience, wrong issuer, expired or future token, incorrectly typed audience, unknown public key ID, tampered signature, missing and malformed token are rejected.
- Every negative identity is denied from both private moderator/editor HTML pages, report moderation GET and POST APIs, Turnstile diagnostic GET and POST, and newsroom editor GET and POST.
- All denied requests return HTTP 403 with private no-store and cause ZERO database queries, mutations or schema introspection.

## Defense improvement

Before this change, the newsroom editor API checked the private D1 schema BEFORE verifying Cloudflare Access JWT identity. This did not expose report content, but was an unnecessary database query from unauthorized requests. The new sequence verifies the signed identity FIRST; only the owner may trigger the schema inspection.

## Not completed

- Earlier Cloudflare dashboard review found an exact owner-only Allow policy. Fresh read-only attempts to inspect Cloudflare Access policy via API returned HTTP 401/403 for the available OAuth token. The current edge policy was NOT revalidated by API, nor was any policy changed.
- The user has no separate non-allowlisted mailbox; a live login attempt with a different email was NOT performed. Offline synthetic tokens are NOT a substitute for an actual denied Cloudflare Access sign-in. Keep this launch check OPEN.
- Later, an independently controlled different email may try the normal Cloudflare Access page in a private window and confirm that its OTP sign-in yields Access Denied. Never paste passwords, codes or JWTs into chat or GitHub.
- Privacy/legal review, full-account and provider erasure, and a separately controlled reporter-to-moderator end-to-end test remain outstanding. Public report intake stays disabled.

## Repeat tests

    node --test tests/access-denial-matrix.test.mjs tests/moderation.test.mjs tests/newsroom.test.mjs tests/private-release-readiness.test.mjs

The live anonymous monitor uses no cookies, tokens or writes:

    node scripts/check-private-release-readiness.mjs --live

These are independent proofs of application behavior, NOT a representation of a second live user session.
