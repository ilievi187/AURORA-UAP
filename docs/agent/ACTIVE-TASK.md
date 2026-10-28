# Active Task

## P1 — restore the production global newsroom feed

Status: production `/api/news` remains unavailable; root cause is not established. Keep this issue separate from the completed locale fix and do not synthesize headlines.

Evidence: at 2026-10-28 21:33:21Z, `/api/news?edition=global&lang=en&offset=0` returned HTTP 503 `news_source_unavailable`, zero items, and no last-good result. Two representative source RSS URLs returned HTTP 200 from this host; this does not establish the Cloudflare Worker outcome. Cloudflare runtime logs/cache state are unavailable.

Next: get authorized Cloudflare runtime/log access and, if external Cache API documentation is needed, use Gemini in the browser after the owner signs into the existing guest session or explicitly authorizes another research route. Then isolate fetch versus cache failure, add a failing regression test, and fix only the evidenced cause.

Do not change production bindings, add stale-as-live data, or expose unpublished reports.

## PR #14 — gated moderation queue

Status: draft PR; implementation exists and tests are green, but final approval/merge is pending.

Scope: Cloudflare Access JWT verification at origin, private queue GET, audited review POST, static moderation shell and operational setup guidance. Review approval must remain distinct from publication.

Verified: head `b089eb254ecb714df39bcd89653e6db01452aabf`; six PR checks passed; local targeted tests 15/15 and additional suite 48/48 passed; preview unauthenticated API returns 403.

Before merge: complete security/code review, confirm the PR author has marked it ready only when intended, check latest commit and checks again. Before any production enablement, verify the actual Access application protects both UI/API, exact moderator policy, production environment configuration, independent review, and synthetic-only authenticated test. The preview hostname guard means normal preview cannot authenticate; keep it that way unless a separately safe staging design is reviewed.

Do not merge or enable production moderation/intake based solely on these tests. Privacy and retention/deletion operational gates remain open.
