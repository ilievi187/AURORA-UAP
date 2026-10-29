# Deployment Status

Verified 2026-10-29 22:44 UTC. Re-check live state before claiming a new release.

- PR #33 app code adds catalog-backed news; follow-up hardening enforces a 1.5-second total per-feed deadline and streaming byte/chunk limits. Local suites 80/80 and Wrangler build pass. The branch remains open/unmerged; refresh current head/CI. The feature has not been deployed or functionally preview-verified.
- PR #35 production deployment at `8af79e4b14cf9a14bbe0b637911162c71296963a` and its browser verification remain confirmed: sourced 15-case archive, `Australia` search (`westall-1966`) and accessible location caveat.
- Latest production `/news` browser audit showed the localized unavailable-source state. A direct API request returned HTTP 403 with no characterized cause; the owner-recorded read-only bridge GET at 2026-10-29 21:43 UTC returned HTTP 503. LUNA made no repeat request; PR #33 has not been deployed.
- Production `/api/stats` last returned HTTP 503 `database_unavailable`. Code emits this if `env.DB` is absent OR `AURORA_REGISTRY_PUBLIC` is not `enabled`; production configuration has not been confirmed. UI showed incomplete registry and retained the archive. No D1 writes were made.
- Production report route/intake was previously confirmed disabled/local-draft-only. Access, Turnstile, WAF and moderation remain unverified.
- A current production browser verification after PR #54 is not available because of the API access-denial blocker. After one preview inspection before reading the owner’s desktop-safety notice, no further shared-browser/GUI actions will be taken. Do not report deployment/user-journey as verified from green CI alone.
