# Deployment Status

Verified 2026-10-29 19:50 UTC. Re-check live state before claiming a new release.

- Production custom domain `https://aurorauap.org/` is reachable.
- PR #35 merged to `main` at 18:55:35Z as `8af79e4b14cf9a14bbe0b637911162c71296963a`; main V1 run `40935359711`, world-atlas run `40935359714`, and Cloudflare Pages deployment `c50339a9` passed.
- Production browser verified the 15-case archive, `Australia` search (`westall-1966`) and accessible location caveat.
- Production `/api/stats` returns HTTP 503 `database_unavailable` because `DB` is not configured; the UI reports incomplete registry and retains the archive. No production D1 writes.
- Production `/api/news` last returned HTTP 503 `news_source_unavailable` at 2026-10-29 08:05:59Z. PR #33 is not deployed; its preview API was blocked by Error 1010, so news recovery is unverified.
- Production report route is reachable; intake remains disabled/local-draft-only. Access, Turnstile, WAF and moderation are unverified.
