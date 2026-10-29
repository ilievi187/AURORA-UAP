# GROK source discovery

Status: implemented on `agent/grok-sources`. Not merged. The Google News pipeline in `functions/api/news.js` is unchanged.

## What changed

- `GET /api/sources` returns 28 publisher feeds. Each feed URL was fetched on 2026-10-29 and returned HTTP 200 with RSS, Atom, or RDF.
- `GET /api/discovery?region=` reads at most 12 of those fixed feeds, keeps UAP/UFO/OVNI/AARO/НЛО keyword matches, and dedupes them. Callers cannot pass a URL.
- `/sources.html` lists the catalog and the keyword matches. Matches are labeled as publisher headlines, not verified cases.
- `dedupeHeadlines()` is a separate helper for later integration. It is not wired into `fetchHeadlines`.

## Checked feeds

Preview set, in fetch order: The Debrief, The War Zone, BBC World, Al Jazeera English, France 24 English, Deutsche Welle English, NASA news releases, The Japan Times, CBC World, ABC News Australia Just In, Africanews, The Hindu science.

Also catalogued, and used when their region is selected: ESA, UK Ministry of Defence, NOAA, BBC Mundo, DW Wissen, NPR Science, The Guardian world, Le Monde sciences, El País ciencia, Der Spiegel international, NHK, Yonhap English, Folha mundo, Dnevnik, SVT Nyheter, ANSA.

Rejected after a live check, and not invented back into the catalog: AP News (HTTP 403), Reuters (HTTP 401), AARO (HTTP 404), BTA (HTTP 404), BNR (HTTP 404), U.S. Department of War RSS page (HTML, not a feed), Radio New Zealand science (soft 404), Al Jazeera Arabic (redirected to an opaque id).

NHK's feed responded, and its newest item on that day was dated 2026-08-08, so it stays out of the default preview.

## Integration note

`news.html` had uncommitted edits in another workspace, so this branch does not add a navigation link. After that work lands, one link is enough: `<a href="/sources.html">Източници</a>`.

## Verification

Commands run in this worktree on 2026-10-29:

- `node --test tests/source-catalog.test.mjs` — 10 passed
- `AURORA_CHROMIUM=/usr/bin/chromium node --test tests/source-discovery-browser.test.mjs` — 2 passed. The directory rendered both fixture publishers, refused a `javascript:` homepage and an `http:` feed link, showed one BBC keyword match, showed an empty state for the Americas filter, and stayed within a 390px viewport.

A replay of the 28 fetched feed bodies through `parseFeedXml` produced https article links for every source. Counts ranged from 1 (DW Wissen) to the 40-item cap.

No production deploy. No change to intake, moderation, or the news worker.
