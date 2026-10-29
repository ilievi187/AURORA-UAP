# Deployment Status

Verified 2026-10-29 22:04 UTC. Re-check live state before claiming a new release.

- Latest observed `main` is `760db33d8967874cf6d2958d3a4416fb8f0af32a`, including PR #54 specialist discovery. PR #33 code checkpoint `59280cb` has 14 passing checks and catalog-backed news integration; it has not been deployed or functionally preview-verified.
- PR #35 production deployment at `8af79e4b14cf9a14bbe0b637911162c71296963a` and its browser verification remain confirmed: sourced 15-case archive, `Australia` search (`westall-1966`) and accessible location caveat.
- Latest production `/news` browser audit showed the localized unavailable-source state. One direct API request returned HTTP 403 with no characterized cause; the earlier known response was HTTP 503 `news_source_unavailable`. No request was repeated after the 403. PR #33 has not been deployed.
- Production `/api/stats` last returned HTTP 503 `database_unavailable` because `DB` was not configured; UI showed incomplete registry and retained the archive. No D1 writes were made.
- Production report route/intake was previously confirmed disabled/local-draft-only. Access, Turnstile, WAF and moderation remain unverified.
- A current production browser verification after PR #54 is not available because of the API access-denial blocker. Do not report deployment/user-journey as verified from green CI alone.
