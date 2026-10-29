# Next Actions — read first when resuming

Updated 2026-10-29 22:44 UTC.

1. PR #33 app-code checkpoint `59280cb` is based on main `760db33`, includes source-catalog integration, and now has a follow-up one-deadline/stream-bounded feed reader. The targeted local suite passed 80/80 and Pages Functions compiled. Require fresh CI on the exact current branch head and refetch mergeability before any merge; keep it unmerged until owner-approved functional preview verification.
2. Keep PR #33 unmerged until a site-owner-approved preview user journey can be verified. The preview API previously returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`; do not retry through another host, IP, proxy, identity or browser signature.
3. Production `/news` showed the unavailable-source state. One direct API request returned HTTP 403 with unknown cause; the owner-recorded read-only bridge GET at 21:43 UTC returned HTTP 503. Do not query again without an approved path. The cause remains unknown.
4. Production `/api/stats` last returned 503; code emits this if `env.DB` is absent OR `AURORA_REGISTRY_PUBLIC` is not `enabled`, and production configuration has not been confirmed. `npx wrangler@4.156.0 whoami` reported not authenticated. Ask the owner to authorize Cloudflare access; do not guess IDs, create/overwrite data, or enable intake.
5. PR #34 remains draft; the preview showed 20 media links but no player control/iframe/video. One preview inspection occurred before the owner’s desktop-safety notice was read; no further shared-browser/GUI work. Ask for an isolated, owner-approved test path and public, rights-cleared source; do not bypass publisher restrictions.
6. PR #14 stays draft. Read-only review found no auth/JWT/CSRF/XSS/audit bypass; pagination is limited to 100 submissions and two Access certificate error paths lack tests. Production Access/privacy/retention controls still need approval and verification. Keep intake disabled.
7. PR #43 source/archive expansion is assigned to another agent. Avoid duplicate work; resume only after reading its result/ownership status.
8. The GROK catalog now flows into the PR #33 candidate (global preview plus specialist desks, official sources, and the checked BG feed); production integration is not verified. Issue #32 was closed by the owner at 2026-10-29 21:27:11 UTC; use successor issue #52 for coordination. Continue only authentic source-backed work; no fabricated cases, headlines, media or coordinates.

Resume policy: re-fetch current state, read successor issue #52, issue #32 closure history and PR threads, then review this file, `CURRENT-STATE.md`, `ACTIVE-TASK.md` and `BLOCKERS.md`.
