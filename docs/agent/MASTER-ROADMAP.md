# Master Roadmap

Statuses reflect evidence checked 2026-10-29 20:52 UTC; re-check remote and production state before action.

| Priority | Status | Task / Acceptance criteria | Dependencies / evidence |
|---|---|---|---|
| P0 | COMPLETE (staged safeguards) | Production site and intake remain fail-closed; no accidental public intake. | Intake is disabled/local-only; staged registry verifier passes. |
| P1 | IN PROGRESS | Complete locale persistence, translation and accessibility across all supported pages/routes. | PRs #30, #38, #44, #49 and #50 merged. Remaining route-by-route production verification is blocked; do not claim every page complete from CI alone. |
| P1 | IN PROGRESS / PREVIEW BLOCKED | Restore dependable sourced news, partial-source success, diagnostics and last-good behavior. | PR #33 head `2b6ec18` has 13 passing checks; branch includes main through `199b437` and merges cleanly with current main `c4d4614`. Local suites pass. Production `/news` unavailable; one API probe returned 403, cause unknown; preview Error 1010 requires owner-approved access. Do not bypass or merge before functional verification. |
| P1 | IN PROGRESS (draft PR) | Gated moderation queue with Cloudflare Access verification and audited private review; approval never publishes. | PR #14 draft; independent read-only security review pending. Production enablement blocked until real Access configuration, privacy review and synthetic-only verification. |
| P1 | BLOCKED | Provision/verify production D1, safely apply migrations, bind `DB`, verify backups and a read/write smoke test. | Production `/api/stats` last returned 503 `database_unavailable`; binding is unconfigured. Wrangler v4.156.0 is not authenticated and example ID is a placeholder. Requires authorized account access; preserve data. |
| P1 | BLOCKED | Production Turnstile hostname/widget, Siteverify, WAF limits and abuse monitoring. | Cloudflare account and owner-approved configuration required; no secrets in Git. |
| P1 | BLOCKED | Final privacy notice, lawful basis, controller/contact, retention and rights handling. | Owner/legal review and verified privacy-contact test required; intake stays disabled. |
| P1 | TODO | Secure deletion/access-request and retention workflow with no public data leak. | Depends on approved privacy policy and authenticated moderation workflow. |
| P2 | IN PROGRESS | Responsive mobile/desktop audit, keyboard access and no-overflow across every route. | PRs #37, #40–#42 and #47 merged with browser tests. Broader route/browser audit remains; PR #43 archive/source work is owned by another agent. |
| P2 | IN PROGRESS | Build an attributable international source-discovery pipeline without automatic publication. | PR #39 added the source catalog; PR #45 added checked feeds/source health; PR #46 added Africa/Americas desks; all are merged. PR #43 archive expansion remains assigned to another agent. No source finding auto-publishes a case. |
| P2 | TODO | Security headers/CSP/CORS/rate limits and dependency audit. | Non-destructive tests only. |
| P2 | TODO | SEO, broken-link and truthful-content review; protect private/admin routes from indexing. | Never index private data. |
| P2 | TODO | Registry provenance and responsive map audit; no fake counts or precise personal coordinates. | Sourced 15-case archive remains fallback; production D1 is unavailable. |
| P3 | COMPLETE (merged) | Searchable global case-atlas UX with localized search, accessible clusters and honest D1 completeness state. | PR #35 merged as `8af79e4b14cf9a14bbe0b637911162c71296963a`; main workflows and production deployment passed. No new cases/coordinates; issue #32 remains open. |
| P3 | IN PROGRESS (draft PR) | Accessible in-site media player; verify actual supported playback. | PR #34 checks pass but no source has verified live playback. Gemini guest/sign-in; request an approved public source or sign-in. Never bypass access controls. |
| P3 | TODO | Private media uploads only after cost, privacy and file-safety approval. | No upload endpoint until controls/cost approved. |
| P3 | TODO | AI moderation only after privacy/vendor assessment; human decision required. | No personal data to external AI without approval. |
| P3 | TODO | Verify donation account and disclosures. | Owner confirmation; no test payment. |

V1.8 completion is the full owner acceptance list, not a green build alone. Issue #32 remains open for news reliability, real video playback, source-backed archive expansion and production gates.
