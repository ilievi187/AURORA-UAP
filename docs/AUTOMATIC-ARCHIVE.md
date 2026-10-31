# AURORA — automatic public case archive

This pipeline **automatically imports licensed public case metadata** into the historical editorial archive. It never imports user submissions from D1 and never treats a public sighting report as proof of its explanation.

## Running — review-gated automation

- GitHub Actions validates both licensed upstream sources in an **isolated temporary folder** on source-code PRs, pushes and manual validation runs. Validation does **not** publish public cases.
- A twice-daily schedule runs at 02:17 and 14:17 UTC. The update job is enabled **only** when the GitHub Actions repository variable `AURORA_ARCHIVE_PR_AUTOMATION_ENABLED` is exactly `true`. This variable is intentionally not changed by the importer itself.
- When enabled, the schedule imports both approved sources into one candidate snapshot, checks data safety/tests, and pushes **only a draft PR** on `automation/archive-sync`. It does **not** merge itself or publish to `main`. A human or approved owner-directed review/release is still necessary.
- The source reader validates expected license, payload count and HTTPS provenance, rejects shrinking datasets and never replaces manually curated dossiers.
- `data/archive-sync-status.json` and `data/disclosure-zone-sync-status.json` are produced only for real candidate snapshots; no status is fabricated when disabled.
- Offline tests: `node --test tests/auto-archive-sync.test.mjs tests/disclosure-zone-sync.test.mjs tests/archive-records.test.mjs`.
- Read-only diagnostics: `node scripts/sync-open-case-archive.mjs --check` and `node scripts/sync-disclosure-zone.mjs --check`.

## First allowed provider

`https://www.uap-archive.org/uap/data/cases.json` — **UAP Records Archive** (independent archive, not an official authority). Source metadata is released as **Creative Commons Attribution 4.0**. Official U.S. government document links remain links to their original or preservation URLs, not rehosted assets.

The provider currently describes individual **official case designations**, not all government documents in its broader records catalog. A record catalog listing 80 documents is **not** 80 independently validated sightings. Future integrations must explicitly differentiate cases, documents, news and unreviewed witness reports.

## Second allowed worldwide provider

`https://disclosure.zone/api/cases.json` — **disclosure.zone**, an independent research collection published under **CC BY 4.0** with attribution. The public dataset currently declares 87 case entries (source count may change). It provides English narrative descriptions, reported explanations and source links. A separate adapter `scripts/sync-disclosure-zone.mjs` keeps metadata separate from government findings and does not import any private contact fields or source-derived scoring as if it were an AURORA measurement.

- Its coordinates, if supplied, are **publisher-supplied approximate map anchors**, not instrument-measured positions. The dossier and globe precision note must remain visible. Unknown coordinates remain `null`, and unknown country `XX` becomes unset.
- Its `explained`, `disputed`, `unresolved`, and `insufficient` flags are **publisher assessments**, not proof of an event's cause.
- Descriptions remain attributed **English source text**, not fictional machine-generated Bulgarian translations. The Bulgarian view explicitly identifies text shown in the original language.
- Public HTTPS sources are copied as links, not as scraped articles or hosted images/videos. No new autoplay or implied video permissions.
- Alias/title/date checks preserve existing curated canonical dossiers and prevent duplicate pins where recognized.
- No mass republication of witness contact details or private reports; legal and factual review is still expected for each new provider.
- A case catalog contains a mixture of resolved, disputed and insufficiently documented reports. No new entry is presented as confirmed nonhuman technology.

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