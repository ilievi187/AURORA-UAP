# AURORA · International UAP Research Archive — bulk source imports

The public collection holds 101 existing curated case dossiers, plus 10,032
source-linked records imported from the UAPDrop CC BY 4.0 compiled dataset:
https://www.uapdrop.com/data.html

| Source collection | Imported records |
| --- | ---: |
| French CNES GEIPAN (original cases) | 2,715 |
| US National Archives, Project Blue Book file-unit records | 7,317 |
| Existing curated case dossiers | 101 |
| **Source-linked records in the archive** | **10,133** |

Records are not verdicts. A record can describe a witness statement, government
catalogue file, collection entry or a case with a publisher's own assessment.
The platform preserves attributed accounts without determining what actually
occurred. Records for individual document files are not necessarily distinct
witness sightings. Never label archive totals as independently confirmed sightings.

## Data integrity and licensing

- Compilation credit: **UAPDrop, UAP Sightings Open Dataset (CC BY 4.0)**,
  https://www.uapdrop.com/data.html.
- Original references link to **CNES GEIPAN** or **US National Archives**
  as supplied by the source compilation. Original collections retain their own
  terms; the compilation's licence does not automatically cover attachments.
- Long GEIPAN accounts are preserved in their **original French** and explicitly
  identified as French; no fictitious translation is generated.
- US National Archives file-unit dates supplied with an artificial day 01 are
  expressed at **month precision**. Unspecified/low-precision NARA coordinates
  are **not** shown as measured incident coordinates. GEIPAN publishes city-level
  reference points.
- No photographs from Fold3 or other third parties are rehosted. These bulk
  entries contain no licensed playable videos. Existing source-cleared playable
  recordings in the original curated 101 dossiers remain available.
- Import rejects malformed sources, URLs, IDs, and duplicates; it preserves
  original record IDs in provenance. The importer never overwrites the curated
  101 records.

## Efficient delivery

- `data/bulk/index.json` — titles, country, approximate region, date, source,
  and summary for archive browsing/searching, about 6.5 MB uncompressed.
- `data/bulk/shards/00.json`–`63.json` — full reports, loaded **only when an
  individual dossier is opened**.
- `data/bulk/manifest.json` — source counts and provenance.
- Archive listing paginates ten at a time. The existing 101-case map remains a
  **curated map**, not a claim that all 10,133 records are plotted.

To reimport an authorized snapshot:

```bash
node scripts/import-uapdrop-records.mjs /path/to/sightings.json --check
node scripts/import-uapdrop-records.mjs /path/to/sightings.json
node --test tests/bulk-source-import.test.mjs
```

Source snapshot: https://www.uapdrop.com/rest/v1/public/sightings.json
Review rights and data drift before updating public files. Keep the resulting
data under version control and deploy only after testing.

This is an independent archive/project, not a legally registered federation.


## Country navigation and geographic map

- `data/bulk/countries.json` contains counts grouped by actual ISO country
  codes, combining the existing curated sources with new records. Records with
  no recognized country remain accessible through the world archive.
- `data/bulk/geo-points.json` contains **2,715 source-provided GEIPAN city
  anchors**. These are approximate city references, not exact measured sighting
  positions; the Blue Book catalogue records supply no reliable event points
  and are not assigned invented map coordinates.
- The map clusters these source anchors and renders **clickable country links**.
  Selecting a map circle opens a country dossier page; only the separate manual
  +/− controls change scale. Closely spaced country links are offset **visually
  only** for clickability; their original coordinates are unchanged.
- Country lists show up to 24 source-linked dossiers per page with text search,
  source metadata and case-specific links. No generic photo is repeated as
  purported footage; actual publisher videos remain in the existing curated
  media pages.

Rebuild navigation assets after any approved bulk reimport:

```bash
node scripts/build-archive-navigation.mjs
node --test tests/country-navigation.test.mjs
```
