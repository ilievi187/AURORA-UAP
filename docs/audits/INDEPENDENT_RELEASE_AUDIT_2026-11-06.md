# AURORA UAP — Independent Production Release Audit

**Date:** 2026-11-06  
**Target:** https://aurorauap.org  
**Repository:** `ilievi187/AURORA-UAP`, `main`  
**Audited starting revision:** `f4d1f31aac4efe2fbc6762d18c131dc6a957993e`  
**Status:** Public website operational; search-engine crawl readiness improved; Google indexing **not yet verified**.

## Scope and method

This is a new audit of current production and a fresh, clean checkout. It does **not** repeat the previously completed real report/moderation/deletion test. That work remains recorded as complete, with the documented private release gates still active.

- Tested **24 production paths** with ordinary HTTPS requests, including indexable pages, historical dossiers, known-invalid URLs, auth-only pages, API status, sitemap and robots.
- Validated `sitemap.xml` as XML with **124 unique URLs** and probed **21 representative entries**; this is a sample, not a claim that all 124 were individually crawled by Google.
- Examined seven public page templates, dynamically generated country/dossier SEO metadata, and production safety headers.
- Ran the project’s full **122-test static quality gate**, an additional SEO/locale test suite, **44 browser E2E tests**, and the Cloudflare Pages Functions build for this revision.
- Reviewed connected GitHub Actions CI and the source-backed news/media/data artifacts.
- Re-ran the **17-check read-only postlaunch privacy/security monitor**, all passing; no new submission or deletion was performed.
- External search queries did not independently confirm Google-indexed pages. The Search Console owner report was **not accessible to this audit**.

## Current production findings (before this fix)

| Area | Observation | Classification |
|---|---|---|
| Uptime/core pages | `/`, `/archive`, `/news`, `/media`, `/countries`, `/sources`, `/privacy` return HTTP 200 | PASS |
| Crawl permission | Public `robots.txt` allows `/`; private/API paths are disallowed from crawl | PASS |
| Sitemap | Valid XML with 124 unique URLs, source-reviewed dossiers and country pages | PASS |
| Indexable dossier | `/archive/westall-1966` returns 200 with `index,follow` and matching canonical | PASS |
| Thin bulk dossier | `/archive/geipan-4851` returns 200 with `noindex,follow`, deliberately excluded | PASS by design |
| 404 behavior | Missing cases, countries and random paths return real 404 | PASS |
| Live news | `/api/news?edition=global&lang=en&offset=0` returns 200, cached publisher snapshot, 119 records | PASS |
| Source discovery | `/api/discovery?region=all` returns 200, dated publisher snapshot | PASS |
| Public intake availability | `/api/intake/status` returns 200 and `accepting: true`; private moderation stays gated | PASS for status; past real-world testing already completed |
| Admin access | Anonymous `/moderation.html` redirects to the access challenge; `/news-editor.html` is denied | PASS for anonymous access |
| Public D1 registry | `/api/stats` returns 503 `database_unavailable`; the public registry is intentionally disabled | OPTIONAL feature, not evidence of failed private reports |
| Home canonical | Missing from production HTML at starting revision | FIXED in this patch |
| Country/news/media canonical | Missing on public listing pages at starting revision | FIXED in this patch |
| Share metadata | Public templates had no consistent `og:title`, `og:url`, `og:image` | FIXED in this patch |
| English-only fallback | English-tagged HTML still shipped Bulgarian visible text without JS | FIXED in this patch |
| Dossier crawler H1 | Generic `AURORA / CASE DOSSIER` before JS hydration | FIXED for public dossiers |
| Redirect configuration | Stray malformed `/PRIVACY REWRITE` row in `_redirects` | REMOVED |

## Changes introduced by this release

1. Canonical URL and Open Graph/Twitter summary metadata for all seven indexable public page templates, pointing to an existing **explicitly illustrative** AURORA image (not presented as a witnessed UFO photograph).
2. Page-specific source-backed Open Graph data and unique, escaped HTML H1 on indexable curated dossiers. Dossiers that are catalog-only remain `noindex,follow`.
3. Authored **English server-side fallback copy** across home, archive, country directory, news, media and sources, retaining original-language names in optional legacy language menus.
4. Removed an invalid Cloudflare `_redirects` entry.
5. Added `tests/public-discovery-metadata.test.mjs` to the existing GitHub quality gate to prevent regressions.

## What is genuinely unfinished or needs owner/provider confirmation

| Priority | Item | Who needs to act? | Completion criterion |
|---|---|---|---|
| P1 | **Google Search Console coverage** | Site owner | Verify the `aurorauap.org` Domain property, submit `https://aurorauap.org/sitemap.xml`, and inspect `/`, `/news`, `/archive/westall-1966`. Confirm actual indexed coverage and correct Google-selected canonicals. This cannot be proven with a public `site:` search alone. |
| P2 | **Editorial quality of machine-translated news** | Editors / continuing QA | Review spot samples and corrections while retaining publisher attribution, original language and timestamps. Automated translation ≠ editorial verification. |
| P2 | **Long-term index coverage** | Search engines + editor | Monitor the 85 curated indexable cases, review genuine duplicate/thin pages; do not submit the ~10K source-catalog-only records indiscriminately. |
| P2 | **Social preview image refinement** | Design/QA | Optional branded 1200×630 share asset can replace the existing smaller illustrative image after visual review. Current metadata uses a verified existing repository asset. |
| Optional, decision required | **Public D1 registry** | Owner | The read API is deliberately disabled; enable only if there is an explicit publication policy and source-reviewed public data. Private intake/moderation does not require this. |
| External provider | **Donation payout settlement/verification** | Buy Me a Coffee account owner/provider | Confirm payout approval in the provider dashboard. The public external donation link and on-site button are separate from payout eligibility. Never share payment credentials with the repo. |
| Periodic | **Performance/accessibility in real user conditions** | Continuing QA | Collect Lighthouse/CWV after the current archive listing optimization and test on slower phones/low-bandwidth networks. No unsupported score is claimed here. |

## Previously completed — do **not** reopen without a regression

- Verified-account test report, private moderation controls, test-report deletion, and test Auth-account cleanup were previously exercised and reviewed with the owner.
- Latest real `/api/intake/status` returns `accepting: true`; the manual review queue remains private.
- Donation button currently opens the verified public Buy Me a Coffee page; archive and reporting remain free to access.
- DVIDS video previews use source-authorized publisher images and a single embedded player, verified on mobile/desktop.

## Search indexing conclusion

**Technically crawlable:** yes, provided the deployed site serves the checked response codes, robots rules and canonical metadata.  
**Definitely indexed by Google:** **unconfirmed**. Google Search Console's *URL Inspection* and *Page indexing* reports are the authoritative next step for the owner; appearing in a public `site:` search is only a clue, not a definitive indexing inventory.  
**Guaranteed ranking/first-page placement:** no claim made.

## Release protocol

Keep changes small and verified. Run the existing static/browser/Pages build gates, push the tested revision to `main`, verify real HTTPS production metadata and response codes, and preserve anonymous denial for administrator endpoints. Avoid unnecessary destructive actions or repeated creation of private test reports.
