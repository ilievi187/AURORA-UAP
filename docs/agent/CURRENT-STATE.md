# Current State

Verified: 2026-10-29 11:09 UTC (production API through 08:05:59Z; latest completed PR checks through 11:08Z).

- Latest `origin/main` baseline: `5aa42c0425083e415de1756ba61c616f125280d8` (PR #31 documentation update). The news candidate is isolated on `fix/news-recovery-diagnostics-issue32`; the pre-existing dirty worktree was left unchanged.
- PR #30 merged at 2026-10-28 21:29:04Z; all nine PR checks passed and main-push quality gate run `40772316033` completed successfully.
- Pre-existing open PR at verification time: #14 `Prepare gated Cloudflare Access moderation queue`, still draft; no other pre-existing PR was open.
- Production: `/news` and `/sky` both follow the saved `aurora-lang=en` across navigation and a newsroom reload. English selector, document language, page titles, headings and navigation were verified after PR #30 merged. Intake remains `accepting:false`, `mode:local_draft_only`.
- Production `/api/news?edition=global&lang=en&offset=0` returned HTTP 503 `news_source_unavailable`, 69-byte body with no diagnostics and `cf-cache-status: DYNAMIC` at 2026-10-29 08:05:59Z. Production `/news` later rendered its explicit localized offline state with zero cards. Exact Cloudflare edge cause remains unknown.
- Production public D1 registry: staged-mode release verifier passed; public registry endpoints correctly gated and sourced reference archive remains separate.
- D1: production binding/database existence, schema and backups not verified in the Cloudflare account. No Wrangler installation/auth or Cloudflare environment variables found in this session.
- Turnstile/WAF: production keys/rules not independently verified; intake disabled.
- PR #14 preview: `/api/moderation/` without authorization returned HTTP 403 `unavailable`; preview is correctly rejected by hostname guard. Moderation is not production-ready until Access and release gates are configured and tested.
- News PR #33 is open; independent review passed and all nine CI checks passed in run `40862406395` for the code head and run `40863006822` after state-doc updates. Production remains unchanged.
- News candidate regression evidence: baseline feed concurrency was 10 and the new cap test failed at 10; it passes with a maximum of five. Independent reviews caught XML control-marker spoofing, malformed/namespace-expanded attributes, CDATA/PI markup, stale translated-fallback diagnostics, intermediary caching, invalid RSS identity, non-XML outside-root whitespace, timeout verification, AST/namespace/attribute/chunk amplification, and uncanceled non-OK bodies. Fixes include a fixed 800 KB body buffer with a 4,096-chunk cap/no `text()` fallback; non-OK response cancellation; 10,000-node/64-depth, 64-attribute/element, 4,096-attribute and 256-namespace-declaration limits; transient parent-linked scopes; and direct channel-item extraction. Cached fallbacks use no-store. Candidate feeds 25/25, static 22/22, DB/API 20/20, D1 ops 3/3, deployment 7/7, intake 12/12. News behavior is not deployed.
- Bounded local live RSS smoke: all 10 configured sources returned parsed RSS, 692 feed items were parsed and 200 deduplicated items returned with zero source errors. This is local-host evidence, not proof of Cloudflare egress.
- Cloudflare Pages deployment check passed in run `40863006822`; direct preview API access on the previous preview returned 403 Error 1010 `browser_signature_banned` at 11:05:03Z. The site marks it owner-action-required; no retry or bypass was attempted. Functional preview verification remains blocked.
- Candidate browser E2E: 27/27 passed with Playwright 1.64.1 and cached Chromium, including a mobile test that verifies a 503 shows an explicit offline state. The temporary dependency symlink was removed; no browser dependency or binary was committed.

Do not record credentials, private submissions, access tokens, or secret values here.
