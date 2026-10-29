# Deployment Status

Verified 2026-10-29 22:25 UTC. Re-check live state before claiming a new release.

- Latest observed `main` is `760db33d8967874cf6d2958d3a4416fb8f0af32a`, including PR #54 specialist discovery. PR #33 app-code checkpoint `59280cb` adds catalog-backed news; first docs-only checkpoint `c04c93d` passed 14 checks. Later status documentation is docs-only; refresh current branch head/CI. The feature has not been deployed or functionally preview-verified.
- PR #35 production deployment at `8af79e4b14cf9a14bbe0b637911162c71296963a` and its browser verification remain confirmed: sourced 15-case archive, `Australia` search (`westall-1966`) and accessible location caveat.
- Latest production `/news` browser audit showed the localized unavailable-source state. A direct API request returned HTTP 403 with no characterized cause; the owner-recorded read-only bridge GET at 2026-10-29 21:43 UTC returned HTTP 503. LUNA made no repeat request; PR #33 has not been deployed.
- Production `/api/stats` last returned HTTP 503 `database_unavailable`. Code emits this if `env.DB` is absent OR `AURORA_REGISTRY_PUBLIC` is not `enabled`; production configuration has not been confirmed. UI showed incomplete registry and retained the archive. No D1 writes were made.
- Production report route/intake was previously confirmed disabled/local-draft-only. Access, Turnstile, WAF and moderation remain unverified.
- A current production browser verification after PR #54 is not available because of the API access-denial blocker. After one preview inspection before reading the owner’s desktop-safety notice, no further shared-browser/GUI actions will be taken. Do not report deployment/user-journey as verified from green CI alone.
