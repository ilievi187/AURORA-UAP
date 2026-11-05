# AURORA daily anonymous production security preflight

Active once the associated GitHub Actions workflow is merged into main. This is an **ongoing prelaunch monitor**, not an automatic release/deployment and not a legal compliance certification.

- File: .github/workflows/daily-private-release-monitor.yml
- Schedule: GitHub Actions at 04:42 UTC every day (approximately 06:42 winter / 07:42 summer Bulgarian time; actual scheduler execution can be delayed).
- Optional manual trigger: GitHub Actions > AURORA prelaunch private-surface monitor > Run workflow.
- Credentials: NONE. No Cloudflare API token, Supabase service-role key, personal user token or backup key is provided to the runner.
- Scope: offline unit validation plus exactly seventeen **anonymous GET** requests from a GitHub Actions runner to public production endpoints, covering closed private report intake, bilingual privacy notice, account receipt login gate, Cloudflare Access moderator redirects and denied private editor routes.
- Fails if public intake unexpectedly turns on, a protected endpoint returns HTTP 200, the account-private route stops enforcing 401/no-store, a privacy processor disclosure disappears, or status cache policy weakens.
- No POST, no WAF burst, no Turnstile test, no D1 mutation, no private login and no account deletion.
- Check failed runs in GitHub Actions. GitHub notifications depend on repository/user notification settings; do not assume an immediate email or text alert.
- The monitor specifically expects **prelaunch** status accepting:false. After independently authorized public launch, the owner MUST change the expectation to an explicit postlaunch security check before turning the intake flag on, otherwise the monitor will correctly detect the change as an unexpected event.
- The monitor does not prove ongoing operation of D1 backups on a personal workstation, does not verify the real Turnstile challenge and cannot replace the privacy legal or wrong-account Access reviews.
- Do not automatically change production environment flags in response to a monitor failure. Inspect the issue and perform a separate owner-approved rollback if necessary.

Reference: scripts/check-private-release-readiness.mjs and docs/LAUNCH-READINESS-2026-11-04.md.


## 4 Nov — URL aliases

The daily monitor now makes 17 read-only GETs, including five additional protected route aliases. This is not a live denied-different-account audit; see docs/ACCESS-NEGATIVE-IDENTITY-AUDIT-2026-11-04.md.

## 5 Nov 2026 — separate opt-in POSTLAUNCH mode (prepared, NOT enabled)

The same read-only monitor supports two fail-closed profiles without credentials or report submissions:
- `prelaunch` (the default and current setting): the public API must show `accepting:false`, `local_draft_only`; no Turnstile site key exposed.
- `postlaunch` (future owner-opt-in after explicit legal, independent Access, genuine private walkthrough, and final go/no-go): the public API must show `accepting:true`, `text_only_quarantine`, a non-test public Turnstile site key, `intake-v1-reviewed` policy with canonical URL, verified email among providers, zero contact collection, zero attachments, and **automatic_publication:false**.

Both monitor modes perform the same 17 public anonymous **GET** requests; no identities, private records, POST/DELETE requests, WAF bursts or D1 write credentials. Protected moderator/editor surfaces must still deny the anonymous visitor and the private account receipt endpoint must still return 401 with no-store.

**Changeover procedure:** After all independent release gates, set GitHub repository Actions variable `AURORA_RELEASE_MONITOR_PROFILE=postlaunch` as part of the owner-approved launch window, then manually run the workflow `AURORA public-report privacy boundary monitor`. Confirm it passes after actual authorized intake activation. A prelaunch monitor failing because intake unexpectedly activated is a **security warning**, not something to suppress by switching modes without approval.

**Rollback:** If public intake needs emergency OFF, disable `AURORA_INTAKE_ENABLED` in production *first* and set `AURORA_RELEASE_MONITOR_PROFILE=prelaunch` as part of that rollback, then run the monitor manually. Do not delete reports, disable Access or turn on auto-publication. This monitor is a necessary boundary check, **not** a legal compliance certificate or permission to launch.
