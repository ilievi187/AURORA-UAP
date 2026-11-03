# AURORA daily anonymous production security preflight

Active once the associated GitHub Actions workflow is merged into main. This is an **ongoing prelaunch monitor**, not an automatic release/deployment and not a legal compliance certification.

- File: .github/workflows/daily-private-release-monitor.yml
- Schedule: GitHub Actions at 04:42 UTC every day (approximately 06:42 winter / 07:42 summer Bulgarian time; actual scheduler execution can be delayed).
- Optional manual trigger: GitHub Actions > AURORA prelaunch private-surface monitor > Run workflow.
- Credentials: NONE. No Cloudflare API token, Supabase service-role key, personal user token or backup key is provided to the runner.
- Scope: offline unit validation plus exactly twelve **anonymous GET** requests from a GitHub Actions runner to public production endpoints, covering closed private report intake, bilingual privacy notice, account receipt login gate, Cloudflare Access moderator redirects and denied private editor routes.
- Fails if public intake unexpectedly turns on, a protected endpoint returns HTTP 200, the account-private route stops enforcing 401/no-store, a privacy processor disclosure disappears, or status cache policy weakens.
- No POST, no WAF burst, no Turnstile test, no D1 mutation, no private login and no account deletion.
- Check failed runs in GitHub Actions. GitHub notifications depend on repository/user notification settings; do not assume an immediate email or text alert.
- The monitor specifically expects **prelaunch** status accepting:false. After independently authorized public launch, the owner MUST change the expectation to an explicit postlaunch security check before turning the intake flag on, otherwise the monitor will correctly detect the change as an unexpected event.
- The monitor does not prove ongoing operation of D1 backups on a personal workstation, does not verify the real Turnstile challenge and cannot replace the privacy legal or wrong-account Access reviews.
- Do not automatically change production environment flags in response to a monitor failure. Inspect the issue and perform a separate owner-approved rollback if necessary.

Reference: scripts/check-private-release-readiness.mjs and docs/LAUNCH-READINESS-2026-11-04.md.
