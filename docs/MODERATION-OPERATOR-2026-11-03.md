# AURORA — private moderation operator guide (3 November 2026)

This is a software operator guide, **not** permission to enable public reporting or proof of a successful owner login.

## Private moderator dashboard

- Visit `https://aurorauap.org/moderation` only as the authorized owner. Cloudflare Access protects the page and API; the origin also verifies the signed Access JWT, issuer, audience, expiry and exact moderator email. Do not share dashboard screenshots containing report descriptions or audit rationales.
- The new read-only overview displays counts by status and due actions: rejected reports older than 90 days, unresolved reports older than 180 days, and approved-but-quarantined reports due reassessment after 365 days.
- Search for an exact `aur-int-<UUID>` receipt to inspect that single private report and its chronological audit history. This does **not** grant reporter access to the queue.
- Review decisions require a meaningful rationale and are saved as private audited events. An `approved` report remains **quarantined**, never auto-published.
- Overview/dossier reads do **not** run deletions, purges or any automated publication. The project has an opt-in dry-run-first retention worker, but no scheduled production purge is configured by this interface.

## Before calling production moderation validated

1. As owner, confirm an interactive Cloudflare Access login opens the dashboard and its overview and queue load (an empty queue is valid).
2. In a clean incognito session, verify unauthorized visitors receive Cloudflare Access login rather than private JSON. A **different email** must be denied. Never bypass Access to troubleshoot.
3. Verify a bad/expired JWT, mismatched hostname, invalid receipt and cross-origin review request fail closed. The automated suites cover these cases with synthetic JWTs and database records; they **do not** replace live Access verification.
4. Only in a private test environment, use fictional text-only reports for reviewing audit history and pagination. Do not create real public reports merely to test the owner dashboard.
5. Keep `/api/intake/status` returning `accepting:false` until owner-approved legal basis, processor/privacy checks, retention deletion/backup procedures, Turnstile and WAF configuration are independently validated.
6. The site currently needs an independently reviewed privacy notice and operating procedure for subject access/deletion. A retention overview is only a visibility improvement, not retention compliance.

## Technical surface

- `GET /api/moderation/?view=overview`: owner-only numeric status and retention-due counts; no reporter names, email or report descriptions.
- `GET /api/moderation/?receipt=aur-int-<UUID>`: owner-only single report and capped audit timeline (up to 100 entries).
- `GET /api/moderation/?offset=N`: existing 50-report private pagination.
- `POST /api/moderation/`: unchanged owner-only same-origin audited review action.
- All replies are `Cache-Control: no-store`. The UI writes untrusted reports and review rationales via `textContent`, never `innerHTML`.

Run `node --test tests/moderation.test.mjs tests/privacy-retention.test.mjs` and the Playwright browser suite when changing these routes.
