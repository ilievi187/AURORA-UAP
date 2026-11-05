# AURORA UAP — truthful scheduled news history activation (5 Nov 2026)

## Observed state

- A read-only review of GitHub Actions run `41985160608` (5 Nov) found the overall run marked **success**, but its actual “Refresh source-backed editions into durable D1 history” step was **skipped**, because `AURORA_NEWS_REFRESH_TOKEN` was absent from the workflow environment.
- Independently, live anonymous `GET /api/news?edition=global|bulgaria|official` on 5 Nov returned HTTP 200 with `status:"live"` and 9, 8, 9 items respectively. These are fresh headline feed responses, **not evidence of scheduled persistence into D1**.
- GitHub scheduled case-import run `42002941312` was skipped because the separate explicit `AURORA_ARCHIVE_PR_AUTOMATION_ENABLED` repository variable was not `true`. Enabling case automation is a distinct editorial decision; its branch/PR workflow does not publish directly to main.

## Safety fix

In `.github/workflows/news-refresh.yml` the durable news job now has an explicit, owner-controlled job-level gate `vars.AURORA_NEWS_REFRESH_ENABLED == 'true'`, so no opt-in produces a visibly **skipped** job instead of a falsely green refresh. If the owner opts in but forgets the required secret, the job **fails before making a network request** rather than silently reporting success.

This change **does not enable** durable archiving, set any Cloudflare/GitHub secret, mutate D1, or enable private report intake. Live `/api/news` feeds continue independently.

## Owner checklist — activate ONLY when ready

1. Ensure production Cloudflare Pages environment has the D1 `DB` binding, schema migration `0004_news_feed_archive.sql`, and `AURORA_NEWS_ARCHIVE_ENABLED=enabled` (a separate public-headline history feature, not report intake).
2. Generate one long random secret privately (32+ characters). Set the same `AURORA_NEWS_REFRESH_TOKEN` in production Cloudflare Pages secret configuration and in GitHub **Settings → Secrets and variables → Actions → Secrets**. Do not paste it in chat, issue comments, command output or the repository.
3. After both are configured, set GitHub **Settings → Secrets and variables → Actions → Variables** `AURORA_NEWS_REFRESH_ENABLED=true`. Never use this news variable to enable private report intake.
4. Execute one manual GitHub Actions `AURORA scheduled news archive refresh` run. Confirm each of the `global`, `bulgaria` and `official` editions returns `status:"refreshed"`, `fetched_count>=5`, `1<=stored_count<=fetched_count`; check private production D1 history counts through an authorized operator. A green workflow only counts once its **refresh step** actually ran and passed.
5. To stop scheduled writes, set `AURORA_NEWS_REFRESH_ENABLED=false`, revoke/rotate the token if exposed and investigate. Preserve existing `AURORA_INTAKE_ENABLED` (OFF), moderator Access policies, and GDPR gates.

**Do not confuse:** live news headlines, successful scheduled D1 news history, source case-import PR automation, and private observation submissions. They are four separate paths.
