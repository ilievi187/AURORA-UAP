# Active Task

## P1 — Issue #32 NEWS reliability slice

Status: scoped NEWS PR #33 is open from `fix/news-recovery-diagnostics-issue32`, based on `5aa42c0425083e415de1756ba61c616f125280d8`; latest head is `817fefaffbe7466b6bd144db882d58ab9a45e14e`. Independent review passed and all nine GitHub checks passed in run `40862406395`. It is not merged or deployed and is not proven to fix the production outage.

Production evidence at 2026-10-29 08:05:59Z: `/api/news?edition=global&lang=en&offset=0` returned HTTP 503 `news_source_unavailable`, 69-byte body with no diagnostics and `cf-cache-status: DYNAMIC`. A live `/news` browser check later showed the translated explicit offline state with zero cards. Cloudflare runtime logs and account bindings are unavailable; the exact edge root cause remains unconfirmed.

Candidate: bound RSS fan-out to five workers; report sanitized aggregate HTTP, timeout, network, parser, invalid/unverified and parsed-source outcomes; retain partial headlines when any source succeeds; attach current failed-refresh diagnostics to an explicitly `cached` last-good response. No source URLs or exception text are exposed. `caches.default` fallback is location-local, not a global last-good guarantee.

Verified so far: baseline fan-out regression observed 10 concurrent requests and failed; it passed after the cap. Independent reviews caught XML control-marker spoofing, malformed/namespace-expanded attributes, XML declaration whitespace, CDATA/PI markup, invalid RSS identity, outside-root whitespace, AST/namespace/attribute/chunk amplification, uncanceled HTTP bodies, stale translated-fallback diagnostics and intermediary caching; regressions now pass with bounded response streaming (800 KB/4,096 chunks; no `text()` fallback), cancellation of non-OK bodies, tokenizer limits (10,000 nodes/64 depth, 64 attrs/element, 4,096 attrs and 256 namespace declarations/document), transient parent-linked scopes, direct channel-item extraction, fresh/no-store fallback diagnostics and an abort-verified shared 9-second deadline. Local tests: feeds 25/25, static 22/22, DB/API 20/20, D1 ops 3/3, deployment 7/7, intake 12/12, browser E2E 27/27. PR #33 CI is green; preview deployment exists but functional verification is blocked by Cloudflare Error 1010 (`browser_signature_banned`, owner action required).

Next: ask the site owner to allow a permitted preview check; do not bypass the Error 1010 block. Then verify preview API and newsroom, decide merge only after verification, and after any deployment use aggregate diagnostics to confirm or reject the concurrency hypothesis. Do not change production bindings or invent headlines.

## PR #14 — gated moderation queue

Status: draft PR; implementation exists and tests are green, but final approval/merge is pending.

Scope: Cloudflare Access JWT verification at origin, private queue GET, audited review POST, static moderation shell and operational setup guidance. Review approval must remain distinct from publication.

Verified: head `b089eb254ecb714df39bcd89653e6db01452aabf`; six PR checks passed; local targeted tests 15/15 and additional suite 48/48 passed; preview unauthenticated API returns 403.

Before merge: complete security/code review, confirm the PR author has marked it ready only when intended, check latest commit and checks again. Before any production enablement, verify the actual Access application protects both UI/API, exact moderator policy, production environment configuration, independent review, and synthetic-only authenticated test. The preview hostname guard means normal preview cannot authenticate; keep it that way unless a separately safe staging design is reviewed.

Do not merge or enable production moderation/intake based solely on these tests. Privacy and retention/deletion operational gates remain open.
