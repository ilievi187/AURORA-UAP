# AURORA — automatic public case archive

This pipeline **automatically imports licensed public case metadata** into the historical editorial archive. It never imports user submissions from D1 and never treats a public sighting report as proof of its explanation.

## Running

- On release of this workflow to `main`, GitHub Actions runs the first sync automatically.
- Then it runs at 02:17 and 14:17 UTC daily (and via `workflow_dispatch`).
- The importer reads a fixed allowlisted source, validates its CC BY 4.0 license, merges into `data/cases.json`, writes `data/archive-sync-status.json` and runs tests.
- GitHub Actions commits changed public **data files only** to `main`; Cloudflare Pages' existing integration publishes that commit.
- To run a read-only diagnostic: `node scripts/sync-open-case-archive.mjs --check`.
- To test offline: `node --test tests/auto-archive-sync.test.mjs tests/archive-records.test.mjs`.

## First allowed provider

`https://www.uap-archive.org/uap/data/cases.json` — **UAP Records Archive** (independent archive, not an official authority). Source metadata is released as **Creative Commons Attribution 4.0**. Official U.S. government document links remain links to their original or preservation URLs, not rehosted assets.

The provider currently describes individual **official case designations**, not all government documents in its broader records catalog. A record catalog listing 80 documents is **not** 80 independently validated sightings. Future integrations must explicitly differentiate cases, documents, news and unreviewed witness reports.

## Non-negotiable data rules

- Source names, URL, source record identity and license are kept in every imported case.
- Existing manually curated dossiers are never replaced.
- Exact source ID and known manual aliases prevent duplicate publication.
- Missing incident date stays `undated`; unknown coordinates stay `null`. Approximate latitude/longitude must not be invented by automatic geocoding.
- Individual case media are **linked only**, never downloaded or republished as files.
- Source failures, license changes, invalid JSON, unexpected shrinking and suspicious empty results fail closed. Existing published data remain intact.
- Derived summaries are plain source metadata; automatic Bulgarian descriptive boilerplate does not pretend to be a translation of a case's original detailed investigation.
- New providers require documented, compatible permission to republish their metadata; **do not scrape or mirror NUFORC or other restricted catalogs** without a written license.
- This process is not a user-submission moderation pipeline. Public reports with personal data have a separate, disabled intake flow.

## Extending worldwide coverage

Build another allowlisted provider adapter only after documenting its metadata license, schema, expected update cadence and privacy treatment. Run sample imports and legal/source checks in a PR, add duplicate-key rules and integration tests, then enable the provider in the automated workflow.

The first source makes the infrastructure automatic; it does **not** on its own transform a 15-case sample archive into a globally comprehensive dataset.