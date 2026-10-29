# Next Actions — read first when resuming

Updated 2026-10-29 20:52 UTC.

1. PR #33 pushed code head `2b6ec18` has 13 passing checks; local suites after source-health/Africa-Americas sync pass. Current main is `c4d4614`; `git merge-tree` reports no conflicts. Commit/push the state-doc checkpoint, then verify fresh CI on its new head before considering any merge.
2. Keep PR #33 unmerged until a site-owner-approved preview user journey can be verified. The preview API previously returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`; do not retry through another host, IP, proxy, identity or browser signature.
3. Production `/news` showed the unavailable-source state; a single direct API request returned HTTP 403 with unknown cause. Do not query that endpoint again without an approved test path. After access is approved, verify diagnostics and the real browser journey; treat the five-worker change as mitigation until evidence confirms recovery.
4. Production `/api/stats` last returned 503 because D1 `DB` is unconfigured. `npx wrangler@4.156.0 whoami` reported not authenticated. Ask the owner to authorize Cloudflare access; do not guess IDs, create/overwrite data, or enable intake.
5. PR #34 remains draft until a supported real source plays inside AURORA. Gemini was opened once but showed guest/sign-in; no prompt or credentials were sent. Ask the owner to sign in in the existing browser or provide an owner-approved public embeddable source. Do not use the Gemini API or bypass publisher restrictions.
6. PR #14 stays draft pending independent security review and verified real Access/privacy/retention controls. Keep production intake disabled.
7. PR #43 source/archive expansion is assigned to another agent. Avoid duplicate work; resume only after reading its result/ownership status.
8. Continue only authentic source-backed work; no fabricated cases, headlines, media or coordinates. Issue #32 remains OPEN.

Resume policy: re-fetch current state, read issue #32 and PR threads, then review this file, `CURRENT-STATE.md`, `ACTIVE-TASK.md` and `BLOCKERS.md`.
