# Active Task

## PR #14 — gated moderation queue

Status: draft PR; implementation exists and tests are green, but final approval/merge is pending.

Scope: Cloudflare Access JWT verification at origin, private queue GET, audited review POST, static moderation shell and operational setup guidance. Review approval must remain distinct from publication.

Verified: head `b089eb254ecb714df39bcd89653e6db01452aabf`; six PR checks passed; local targeted tests 15/15 and additional suite 48/48 passed; preview unauthenticated API returns 403.

Before merge: complete security/code review, confirm the PR author has marked it ready only when intended, check latest commit and checks again. Before any production enablement, verify the actual Access application protects both UI/API, exact moderator policy, production environment configuration, independent review, and synthetic-only authenticated test. The preview hostname guard means normal preview cannot authenticate; keep it that way unless a separately safe staging design is reviewed.

Do not merge or enable production moderation/intake based solely on these tests. Privacy and retention/deletion operational gates remain open.
