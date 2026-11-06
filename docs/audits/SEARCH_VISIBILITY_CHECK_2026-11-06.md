# AURORA Search Visibility and Search Engine Notification Check

**Date:** November 6, 2026  
**Canonical website:** https://aurorauap.org  
**Follow-up on:** [Independent production audit](./INDEPENDENT_RELEASE_AUDIT_2026-11-06.md)

## What we can and cannot claim

- Production is live and publicly crawlable: the homepage, international news, source listings, media pages, country pages and 85 selected edited case dossiers return the expected HTML/canonical metadata. The sitemap contains **124 unique canonical URLs**.
- Public discovery search queries included `"aurorauap.org"`, `"Aurora UAP"`, `site:aurorauap.org`, and `UAP case archive`. The search data did **not** give a reliable #1 placement or exact ranking.
- A later public `site:aurorauap.org` query **did return the AURORA homepage**, but from a **stale crawl approximately six days old**, showing the prelaunch Bulgarian/demo design. This indicates discovery by at least one search retrieval index, **not proof of first-place Google/Bing indexing**.
- Direct automated Google Search scraping returned a bot-protection checkpoint rather than a results page. Automated Bing results were inconsistent with query intent, so no numerical rank is asserted from that session.
- Google Search Console's **Page indexing**, **URL Inspection**, and **Search results Performance** reports have not yet been reviewed with a verified owner account. Without them, indexing status and measured search positions remain **unconfirmed**.

## Completed technical readiness

- Open `robots.txt` and a valid 124-URL sitemap; sensitive API and moderator routes are excluded.
- Canonical links, crawlable English server HTML, truthful illustrated Open Graph previews and escaped case-specific H1 for the selected curated archive.
- Exact reviewed-only scope: public base pages + country pages + 85 edited/indexable dossiers; do not submit personal reports or source-only 10K import records to indexing.

## IndexNow setup

The repo provides a public domain ownership proof at the root (`{key}.txt`) and a guarded script at `scripts/submit-indexnow.mjs`.

- Dry-run / validate only: `node scripts/submit-indexnow.mjs`
- Explicit submission of all 124 current indexable URLs: `node scripts/submit-indexnow.mjs --submit`
- Reuse in GitHub Actions through the manually initiated **AURORA public IndexNow URL notification** workflow.
- The script independently validates all URLs against the curated SEO index, rejects unknown/private/external URLs, checks that the owner key is publicly deployed, and sends one JSON POST to `https://api.indexnow.org/indexnow`.
- IndexNow notifies participating search engines such as Bing. **Google does not use IndexNow as its standard sitemap or URL Inspection submission path.** A successful IndexNow response is acknowledgement, not proof of crawling, ranking or indexing.

## Remaining owner checkpoint

Visit [Google Search Console](https://search.google.com/search-console) and verify the Domain property `aurorauap.org` (Cloudflare DNS TXT if needed). Submit `https://aurorauap.org/sitemap.xml`, inspect the homepage and `/archive/westall-1966`, then review Google-selected canonical, Page indexing and performance impressions/average position. See [GitHub issue #182](https://github.com/ilievi187/AURORA-UAP/issues/182).

Ranking by generic keywords such as `UAP case archive` is competitive and depends on content quality, credible references, relevant third-party links, user intent and time. No #1 guarantee is technically honest.
