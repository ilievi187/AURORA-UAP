# Next Actions — read first when resuming

Updated 2026-10-28 21:24 UTC.

1. Fetch `main`, inspect open PRs and latest workflow runs. Main SHA at this snapshot is `b06a3c9bd89e03f3fa194264244b93541482d3f7`.
2. Check PR #30 (`fix/subpage-language-canonical-routes`): verify all required checks and Pages preview; merge only if green and no review restriction applies.
3. After PR #30 merges, verify production `/news` and `/sky` with a saved non-Bulgarian locale; confirm the page title, headings, controls and navigation are translated after refresh/navigation.
4. Investigate the production `/api/news` 503 using authorized Cloudflare Worker logs/cache diagnostics. Restore a genuine last-good or live feed; never populate with invented articles. This is independent of PR #30.
5. Review PR #14 (`feat/secure-moderation`, draft, head `b089eb254ecb714df39bcd89653e6db01452aabf`) before merge. Re-run review/checks and recheck `docs/V1.8-MODERATION-SETUP.md`; do not mark production-ready.
6. Refresh these state files after new deployment evidence. Request authorized Cloudflare access only when needed; verify existing D1 before any write and keep intake/registry gates off.
7. Final V1.8 activation remains blocked until real D1+migrations+backup/restore, real Turnstile, verified WAF, reviewed privacy notice/contact/retention, secure moderation/Access, synthetic live test, and production/browser verification are all evidenced.

Resume policy: do not rely on prior chat context. Re-fetch remote state and consult this file, `CURRENT-STATE.md`, `ACTIVE-TASK.md`, and `BLOCKERS.md` first.
