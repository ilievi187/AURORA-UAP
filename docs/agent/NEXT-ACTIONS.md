# Next Actions — read first when resuming

Updated 2026-10-29 19:50 UTC.

1. Finish merging latest `origin/main` into the clean PR #33 worktree. Resolve the four docs conflicts while preserving both atlas and news histories; keep the auto-merged `tests/aurora-browser.test.mjs` changes. Do not edit TERA's worktree.
2. Run the NEWS/parser suites, static checks, and complete browser suite on the merged PR33 candidate. Commit and push conflict resolution; wait for fresh CI on the new head. Do not report older checks as current.
3. Keep PR #33 open until a permitted preview user journey is verified. The previous API probe returned HTTP 403 Error 1010 `browser_signature_banned` / `owner_action_required`; do not retry via another host, IP, proxy, account or browser signature. Request the site owner's approved test path.
4. After authorized preview/deployment, inspect sanitized diagnostics for `/api/news`, then confirm the actual `/news` route in a browser. Treat the 5-worker change as a mitigation until evidence confirms root cause/recovery. Never fabricate headlines or mark stale content live.
5. Check available official Cloudflare access before attempting the production D1 binding fix. `/api/stats` is 503 because `DB` is unconfigured. Do not guess database IDs, destroy/create over existing data, or enable intake; preserve data and require backup/restore verification.
6. PR #34 remains draft until a supported real source plays inside AURORA. Use Gemini in-browser for required external research when available; do not bypass publisher, WAF, CAPTCHA or account restrictions.
7. Continue authenticated/attributed international source and archive expansion only with authentic evidence and defensible locations. No invented cases, media or coordinates.
8. Keep report intake disabled until D1, Turnstile, WAF, privacy, retention and moderation gates are verified. PR #14 is separate; don't enable production moderation as a shortcut.
9. TERA has active remote branch `tera/mobile-a11y-regression` (`972661a`) for donation mobile styling/accessibility. Leave it untouched and coordinate before taking overlapping frontend work.

Resume policy: re-fetch remote state, read the issue #32 thread and current PR comments, then consult this file, `CURRENT-STATE.md`, `ACTIVE-TASK.md` and `BLOCKERS.md`. Issue #32 remains OPEN.
