# Master Roadmap

Statuses reflect verification on 2026-10-29 (local atlas branch checks only); production and GitHub state must be re-checked before action.

| Priority | Status | Task / Acceptance criteria | Dependencies / evidence |
|---|---|---|---|
| P0 | COMPLETE (current checks) | Production site and intake are reachable and fail closed; no accidental public intake. | Live `/api/intake/status` false; staged registry verifier passes. |
| P1 | COMPLETE | Localize newsroom/radar on clean Cloudflare Pages routes and preserve the selected language. | PR #30 merged; production `/news` and `/sky` verified with saved English locale. |
| P1 | BLOCKED | Restore a dependable sourced global newsroom feed and last-good behavior. | Production `/api/news` returned 503 at 2026-10-28 21:33:21Z; needs Cloudflare Worker runtime/cache diagnostics. Never seed fictional articles. |
| P1 | IN PROGRESS | Secure moderation queue. Access JWT signature, issuer, audience, expiry and owner identity checked at origin; review audited; no publication. | PR #14 draft, CI green. Require full review and real Cloudflare Access setup before enablement. |
| P1 | BLOCKED | Provision/verify production D1, apply both migrations safely, bind `DB`, backup/restore and read/write smoke test. | Requires authorized Cloudflare access; preserve existing DB/data. |
| P1 | BLOCKED | Production Turnstile hostname/widget and Siteverify test; WAF POST limits and abuse monitoring verified. | Requires Cloudflare account and owner-approved setup; never put secret in Git. |
| P1 | BLOCKED | Final privacy notice, lawful basis, controller/contact, retention, rights and operational handling approved and published. | Owner/legal review and verified privacy contact required; do not assert legal readiness. |
| P1 | TODO | Secure deletion/access request and retention workflow; tests prove private records/audit handling and no public leak. | Privacy policy and authenticated moderation workflow. |
| P2 | IN PROGRESS | Complete multilingual persistence/content coverage plus accessibility/mobile audit across all pages. | PR #30 fixes only clean newsroom/radar route localization; audit remaining pages and locale completeness. Local browser E2E is runnable; retain CI evidence. |
| P2 | TODO | Security headers/CSP/CORS/rate-limit and dependency audit; regressions covered. | Non-destructive tests only. |
| P2 | TODO | SEO/public content/broken links and truthful status review; protect admin/private routes from indexing. | No private data indexed. |
| P2 | TODO | Registry provenance and responsive map audit; confirm no fake counts/precise personal coordinates. | Current registry remains safely gated. |
| P3 | IN PROGRESS (draft PR) | Searchable global case-atlas UX: localized search/filters, accessible clusters/map controls, bounded results and D1 completeness reporting. | PR #35; all 10 checks pass and branch preview verified. No new source data or coordinates; broader coverage remains outstanding. Keep draft; no production deployment. |
| P3 | TODO | Evaluate private media uploads only after cost approval, privacy and file-safety controls. | No upload endpoint until controls and cost approved. |
| P3 | TODO | Evaluate AI moderation assistance only after privacy/vendor assessment; human decision required. | No personal data to external AI without approval. |
| P3 | TODO | Evaluate additional full locales after Bulgarian and English completeness. | Legal text requires specialist review. |
| P3 | TODO | Verify donation link/account and disclosures. | Owner confirmation; no test payment. |

Definition of V1.8 completion remains the full acceptance list in the owner contract, not a green build alone.
