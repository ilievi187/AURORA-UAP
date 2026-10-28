# Next Actions — read first when resuming

Updated 2026-10-28 10:46 UTC+02.

1. Fetch `main`, inspect open PRs and latest workflow runs. Main SHA was `da3e42d34f1076d3068bd83680fe3cfbaa0cb6ca` at last verification.
2. Review PR #14 (`feat/secure-moderation`, draft, head `b089eb254ecb714df39bcd89653e6db01452aabf`) before merge. Checks were green, but run fresh review/checks; do not mark production-ready. Recheck `docs/V1.8-MODERATION-SETUP.md` gates.
3. Merge these agent state docs after CI passes, then verify merged SHA and update this file with the docs PR number/commit.
4. Continue an independent P2 code/accessibility/security audit while Cloudflare/legal blockers remain; prioritize real defects and add regression tests. Browser startup failure means use CI/browser alternative until repaired.
5. Request authorized Cloudflare access/owner action only when required. Verify existing D1 before any write; never create/overwrite production resources based on stale notes. Keep intake and registry gates off.
6. Final V1.8 activation remains blocked until real D1+migrations+backup/restore, real Turnstile, verified WAF, reviewed privacy notice/contact/retention, secure moderation/Access, synthetic live test, and production/browser verification are all evidenced.

Resume policy: do not rely on prior chat context. Re-fetch remote state and consult this file, `CURRENT-STATE.md`, `ACTIVE-TASK.md`, and `BLOCKERS.md` first.
