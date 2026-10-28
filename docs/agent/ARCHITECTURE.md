# Architecture Map (repository inspection, 2026-10-28)

- Hosting: static HTML/CSS/ES modules on Cloudflare Pages; Pages Functions under `functions/`; production custom domain `aurorauap.org`.
- Front end: homepage, report, country directory/detail, archive/case dossier, donation, mission-control/HUD and globe assets. Bulgarian and English are primary; several additional locales are complete or explicitly partial/preview (see README).
- Public data: `data/cases.json` is a sourced historical reference archive; `data/imports/aaro-reviewed.json` is a curated import manifest; `data/earth-land.json` is simplified visualization geography. Fictional DEMO records are explicitly separate. Do not treat demos or unresolved cases as evidence.
- Public API: `/api/cases`, `/api/cases/:id`, `/api/countries/:code`, `/api/stats`; `functions/_lib/public.js` and `AURORA_REGISTRY_PUBLIC` gate public D1 exposure.
- Intake API: `functions/api/intake/status.js`, `submit.js`, shared `functions/_lib/intake.js`. Requires D1, explicit legal/WAF/policy/hostname flags and Turnstile; accepted records are private quarantine only. `report.html` saves local drafts when unavailable. No receipt lookup endpoint exists, avoiding identifier enumeration/data exposure.
- Database: `migrations/0001_init.sql` public research/provenance schema; `0002_intake_quarantine.sql` private submissions and audit events. Tests exercise migrations with local SQLite. Remote production state not verified.
- Moderation: PR #14 adds `functions/_lib/access.js`, `/api/moderation/`, and `moderation.html/js`; not merged, production Access config not verified. Review stays quarantined.
- Workflows: `.github/workflows/aurora-v1-checks.yml` quality gates; `d1-bootstrap.yml` manual/approval gated D1 operation; `verify-registry.yml` read-only verification; `pages.yml` optional GitHub Pages; production Pages connected to main according to repository docs and PR deployment notice.
- Tests: Node test suites for static UX, SQLite migration/import/API, intake, D1 operations, deployment gate, and Playwright browser E2E in CI.
- Security boundaries: no file uploads, no email/contact collection, no automatic publication, no confirmed production D1, Turnstile/WAF or admin configuration. No secrets belong in repository.

Potential follow-up: reconcile stale historical README claims with current releases; add a user-facing privacy page only after verified owner/legal details and review; evaluate request-size and availability controls for authenticated moderation endpoints.
