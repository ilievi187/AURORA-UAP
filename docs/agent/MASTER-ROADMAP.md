# Master Roadmap

Statuses reflect remote and local evidence checked 2026-10-29; re-check live state before acting.

| Priority | Status | Task / Acceptance criteria | Dependencies / evidence |
|---|---|---|---|
| P0 | COMPLETE (staged safeguards) | Production site and intake remain fail-closed; no accidental public intake. | `/api/intake/status` reports disabled; staged registry verifier passes. |
| P1 | COMPLETE | Localize newsroom/radar on clean Cloudflare Pages routes and preserve saved language. | PR #30 merged; production `/news` and `/sky` language persistence verified. |
| P1 | IN PROGRESS / PREVIEW BLOCKED | Restore dependable sourced news, partial-source success, diagnostics and last-good behavior. | PR #33 all nine checks passed on prior heads. Latest production probe (2026-10-29 08:05:59Z) returned 503; root cause unknown. Merge conflicts resolved locally on `34d30c7` against main `35a61ff`; push and fresh CI pending. Preview API 403 Error 1010 requires owner-approved test access. Do not bypass. |
| P1 | IN PROGRESS (draft PR) | Gated moderation queue with Cloudflare Access verification and audited private review; approval never publishes. | PR #14 draft. Production enablement remains blocked until real Access configuration, review, privacy and synthetic-only verification. |
| P1 | BLOCKED | Provision/verify production D1, safely apply migrations, bind `DB`, verify backups and a read/write smoke test. | Production `/api/stats` returned 503 `database_unavailable` on 2026-10-29 because binding `DB` is not configured. Requires authorized Cloudflare account access; preserve existing data. |
| P1 | BLOCKED | Production Turnstile hostname/widget, Siteverify, WAF limits and abuse monitoring. | Cloudflare account and owner-approved configuration required; no secrets in Git. |
| P1 | BLOCKED | Final privacy notice, lawful basis, controller/contact, retention and rights handling. | Owner/legal review and verified privacy-contact test required; intake stays disabled. |
| P1 | TODO | Secure deletion/access-request and retention workflow with no public data leak. | Depends on approved privacy policy and authenticated moderation workflow. |
| P2 | IN PROGRESS | Complete multilingual persistence/content and accessibility/mobile audit across all pages. | PR #30 covers clean newsroom/radar routing only. TERA has active branch `tera/mobile-a11y-regression` for donation heading/mobile QA; do not duplicate. Other route mismatches were observed and remain to be coordinated. |
| P2 | TODO | Security headers/CSP/CORS/rate limits and dependency audit. | Non-destructive tests only. |
| P2 | TODO | SEO, broken-link and truthful-content review; protect private/admin routes from indexing. | Never index private data. |
| P2 | TODO | Registry provenance and responsive map audit; no fake counts or precise personal coordinates. | Current archive remains the sourced 15-case fallback; production D1 is unavailable. |
| P3 | COMPLETE (merged) | Searchable global case-atlas UX: localized search/filters, accessible clusters, bounded results and honest D1 completeness state. | PR #35 merged via squash to `main` on 2026-10-29 (`8af79e4b14cf9a14bbe0b637911162c71296963a`). Main CI and Cloudflare deployment passed; production browser check passed. No new records/coordinates; issue #32 remains open. |
| P3 | IN PROGRESS (draft PR) | Accessible in-site media player; verify actual supported playback. | PR #34 remains draft; local mock tests pass but live playback was not verified. No access-control or publisher restriction bypass. |
| P3 | TODO | Private media uploads only after cost, privacy and file-safety approval. | No upload endpoint until controls/cost approved. |
| P3 | TODO | AI moderation only after privacy/vendor assessment; human decision required. | No personal data to external AI without approval. |
| P3 | TODO | Additional full locales after Bulgarian/English completeness. | Specialist/legal terminology review required. |
| P3 | TODO | Verify donation account and disclosures. | Owner confirmation; no test payment. |

V1.8 completion is the full owner acceptance list, not a green build alone. Issue #32 remains open for news, video, source expansion and additional authentic cases.
