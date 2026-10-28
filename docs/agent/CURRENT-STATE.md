# Current State

Verified: 2026-10-28 21:24 UTC (live checks at 20:57 UTC).

- Main SHA: `b06a3c9bd89e03f3fa194264244b93541482d3f7` (`Fix translated headlines in search and filtered pagination`, PR #29).
- PR #29 merged at 2026-10-28 20:59:01Z; its main-push quality-gate run completed successfully. No production deployment from that merge has been independently confirmed.
- Open PRs: #14 `Prepare gated Cloudflare Access moderation queue` remains draft; #30 `fix(i18n): localize clean newsroom and radar routes` includes implementation commit `a2deddb`. Its code-only CI/Pages run `40770993688` passed; the project-state follow-up will rerun checks.
- Production: homepage and clean `/news` route are reachable. With `aurora-lang=en`, `/news` had `html[lang]=en` but its title, heading and navigation remained Bulgarian; PR #30 covers the clean-route locale regression. Intake status remains `accepting:false`, `mode:local_draft_only`.
- Production `/api/news?edition=global&lang=en&offset=0` returned HTTP 503 `news_source_unavailable` at 2026-10-28 20:57:46Z; no last-good feed was served. Two representative Google News RSS source URLs returned HTTP 200 from the local host, so the edge-specific cause is not established.
- Production public D1 registry: staged-mode release verifier passed; public registry endpoints correctly gated and sourced reference archive remains separate.
- D1: production binding/database existence, schema and backups not verified in the Cloudflare account. No Wrangler installation/auth or Cloudflare environment variables found in this session.
- Turnstile/WAF: production keys/rules not independently verified; intake disabled.
- PR #14 preview: `/api/moderation/` without authorization returned HTTP 403 `unavailable`; preview is correctly rejected by hostname guard. Moderation is not production-ready until Access and release gates are configured and tested.
- PR #30 local tests passed: browser E2E 26/26, static 22/22, feeds 9/9, DB 20/20, intake/deployment 19/19, D1 ops 3/3. The new clean-route locale regression was observed failing before the code change and passing after it. Code-only CI/Pages run passed; a docs follow-up rerun was pending at this snapshot.
- Browser E2E ran locally using Playwright 1.56.1 with system Chromium; no browser dependency or binary was committed.

Do not record credentials, private submissions, access tokens, or secret values here.
