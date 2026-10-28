# Active Task

## PR #30 — clean-route subpage localization

Status: implementation and local verification complete; the code-only PR run passed all checks and the Pages deployment check. A project-state documentation follow-up is being added and must pass its rerun. Do not claim production deployment until the merged result is checked live.

Scope: normalize the final path segment in `subpage-i18n.js` so Cloudflare Pages clean routes `/news`, `/news/` and `/sky/` receive the same locale pack as `.html` routes. Browser E2E now serves clean routes and asserts localized page title, heading, navigation and saved language across newsroom/radar navigation.

Evidence: based on main `b06a3c9`; implementation commit `a2deddb` is in PR #30. The regression test failed against the previous route check (`/news` remained Bulgarian under Spanish), then passed after the fix. Full local suite passed; see `TEST-RESULTS.md`.

Next: check PR #30's latest checks and Pages preview, merge only when all required checks pass, then verify `/news` and `/sky` on production with a saved non-Bulgarian locale.

## PR #14 — gated moderation queue

Status: draft PR; implementation exists and tests are green, but final approval/merge is pending.

Scope: Cloudflare Access JWT verification at origin, private queue GET, audited review POST, static moderation shell and operational setup guidance. Review approval must remain distinct from publication.

Verified: head `b089eb254ecb714df39bcd89653e6db01452aabf`; six PR checks passed; local targeted tests 15/15 and additional suite 48/48 passed; preview unauthenticated API returns 403.

Before merge: complete security/code review, confirm the PR author has marked it ready only when intended, check latest commit and checks again. Before any production enablement, verify the actual Access application protects both UI/API, exact moderator policy, production environment configuration, independent review, and synthetic-only authenticated test. The preview hostname guard means normal preview cannot authenticate; keep it that way unless a separately safe staging design is reviewed.

Do not merge or enable production moderation/intake based solely on these tests. Privacy and retention/deletion operational gates remain open.
