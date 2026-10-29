# Next Actions — read first when resuming

Updated 2026-10-29 22:04 UTC.

1. PR #33 code checkpoint `59280cb` includes main through `760db33`, source-catalog integration, 78/78 targeted local tests and 14/14 passing PR checks. Re-fetch the exact head/mergeability and fresh checks before any merge; keep it unmerged until an owner-approved functional preview path exists.
2. Keep PR #33 unmerged until a site-owner-approved preview user journey can be verified. The preview API previously returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`; do not retry through another host, IP, proxy, identity or browser signature.
3. Production `/news` showed the unavailable-source state; a single direct API request returned HTTP 403 with unknown cause. Do not query that endpoint again without an approved test path. After access is approved, verify diagnostics and the real browser journey; treat the five-worker change as mitigation until evidence confirms recovery.
4. Production `/api/stats` last returned 503 because D1 `DB` is unconfigured. `npx wrangler@4.156.0 whoami` reported not authenticated. Ask the owner to authorize Cloudflare access; do not guess IDs, create/overwrite data, or enable intake.
5. PR #34 remains draft until a supported real source plays inside AURORA. The current preview `/media` page showed 20 media links but no player control/iframe/video element. Ask the owner for a public, rights-cleared embeddable source or an approved test path; do not bypass publisher restrictions.
6. PR #14 stays draft. Read-only review found no auth/JWT/CSRF/XSS/audit bypass; pagination is limited to 100 submissions and two Access certificate error paths lack tests. Production Access/privacy/retention controls still need approval and verification. Keep intake disabled.
7. PR #43 source/archive expansion is assigned to another agent. Avoid duplicate work; resume only after reading its result/ownership status.
8. The GROK catalog now flows into the PR #33 candidate (global preview plus specialist desks, official sources, and the checked BG feed); production integration is not verified. Continue only authentic source-backed work; no fabricated cases, headlines, media or coordinates. Issue #32 remains OPEN.

Resume policy: re-fetch current state, read issue #32 and PR threads, then review this file, `CURRENT-STATE.md`, `ACTIVE-TASK.md` and `BLOCKERS.md`.
