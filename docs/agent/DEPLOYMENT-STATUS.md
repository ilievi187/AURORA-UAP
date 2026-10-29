# Deployment Status

Verified 2026-10-29 20:30 UTC. Re-check live state before claiming a new release.

- Latest observed `main` is `91676b2a8701bfd34cb1c18715b2afd1b9cde436`; main V1 quality, localization, language-gate, mobile-menu and donation workflows passed. PR #44's Cloudflare Pages check passed on its preview; that alone does not prove the production route changed or works.
- PR #35 production deployment at `8af79e4b14cf9a14bbe0b637911162c71296963a` and its browser verification remain confirmed: sourced 15-case archive, `Australia` search (`westall-1966`) and accessible location caveat.
- Latest production `/news` browser audit showed the localized unavailable-source state. One direct API request returned HTTP 403 with no characterized cause; the earlier known response was HTTP 503 `news_source_unavailable`. No request was repeated after the 403. PR #33 has not been deployed.
- Production `/api/stats` last returned HTTP 503 `database_unavailable` because `DB` was not configured; UI showed incomplete registry and retained the archive. No D1 writes were made.
- Production report route/intake was previously confirmed disabled/local-draft-only. Access, Turnstile, WAF and moderation remain unverified.
- A current production browser verification after PR #44 is not available because of the API access-denial blocker. Do not report deployment/user-journey as verified from green CI alone.
