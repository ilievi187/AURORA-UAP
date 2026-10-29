# Next Actions — read first when resuming

Updated 2026-10-29 20:43 UTC.

1. PR #33 local sync is complete at `2ab1e24769a18433458a121781aadcb0d9c19eb1` (integrates `origin/main` through `199b437`); current static/feed/source-catalog/source-health/source-directory/browser tests and Pages Functions build pass. Commit/push the updated state docs and integration head, then verify fresh PR checks.
2. Keep PR #33 unmerged until a site-owner-approved preview user journey can be verified. The preview API previously returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`; do not retry through another host, IP, proxy, identity or browser signature.
3. Production `/news` showed the unavailable-source state; a single direct API request returned HTTP 403 with unknown cause. Do not query that endpoint again without an approved test path. After access is approved, verify diagnostics and the real browser journey; treat the five-worker change as mitigation until evidence confirms recovery.
4. Production `/api/stats` last returned 503 because D1 `DB` is unconfigured. `npx wrangler@4.156.0 whoami` reported not authenticated. Ask the owner to authorize Cloudflare access; do not guess IDs, create/overwrite data, or enable intake.
5. PR #34 remains draft until a supported real source plays inside AURORA. Gemini was opened once but showed guest/sign-in; no prompt or credentials were sent. Ask the owner to sign in in the existing browser or provide an owner-approved public embeddable source. Do not use the Gemini API or bypass publisher restrictions.
6. PR #14 stays draft pending independent security review and verified real Access/privacy/retention controls. Keep production intake disabled.
7. PR #43 source/archive expansion is assigned to another agent. Avoid duplicate work; resume only after reading its result/ownership status.
8. Continue only authentic source-backed work; no fabricated cases, headlines, media or coordinates. Issue #32 remains OPEN.

Resume policy: re-fetch current state, read issue #32 and PR threads, then review this file, `CURRENT-STATE.md`, `ACTIVE-TASK.md` and `BLOCKERS.md`.
