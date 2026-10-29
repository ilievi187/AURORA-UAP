# GROK source discovery

Status: mission 2 is implemented on `agent/grok-source-health`. `functions/api/news.js` is unchanged.

## Catalog

`GET /api/sources` returns 70 publisher feeds. Every `feed_url` was fetched on 2026-10-29 and returned HTTP 200 with an RSS, Atom, or RDF document. The 12 preview feeds are unchanged, so the default discovery window stays the same.

Added after that live check, all `preview: false`:

- Europe: tagesschau, NRK, NOS, ORF, ERR, TVN24 world, RTP, Yle, The Irish Times, Guardian science, France 24 French, Sky News world, Corriere scienze, Spiegel Wissenschaft, Libération sciences, BBC science, Nature, Phys.org space.
- Americas: Space.com, Science News, Scientific American, Live Science, New York Times science, The Globe and Mail world, Clarín Lo último, Folha ciência, NPR world, ABC News top stories.
- Asia-Pacific: RNZ world, SBS News, Sydney Morning Herald world, Straits Times world, CNA, SCMP world, Asahi headlines.
- Middle East and Africa: BBC Africa, SABC News, AllAfrica, The Jerusalem Post.
- International organizations: UN News, IAEA top news, U.S. GAO reports.

Clarín is a general latest-news feed. AllAfrica aggregates African newsrooms and is based in the United States. UN News, IAEA, and GAO are official publication feeds, not UAP offices. Asahi and IAEA item links were `http` on their own hosts, so those two entries use `upgrade-http`.

## Not added

Checked and left out, rather than invented:

- G1 ciência e saúde: HTTP 200 RSS, newest sampled item 2024-08-09, outside the 120-day window.
- La Repubblica scienze: one stale May 2026 item.
- RNZ science: HTTP 200 with title "Radio NZ Feed - 404".
- Canada DND atom URL and the U.S. Department of War releases URL: HTML, not feeds.
- The National Archives (UK) news RSS and Library of Congress press RSS: old or generic press pages, not a UAP case archive.
- Daily Nation and The EastAfrican: HTTP 403. Times of India technology: malformed link hosts.
- Earlier rejects still stand: AP 403, Reuters 401, AARO 404, BTA 404, BNR 404.

## Health

`GET /api/source-health?region=` checks at most 12 catalog feeds for that region. It records HTTP status, elapsed time, RSS/Atom/RDF format, accepted items, duplicate titles, newest date, and undated, stale, or future counts. One retry is used only for a timeout, a network failure, or HTTP 5xx. A 404 is not retried. The response has no feed body and no article text. Any query other than `region`, including `url` or `feed`, is HTTP 400 and does not fetch.

`/sources.html` runs this check only after "Провери състоянието". Changing region clears the previous result. Keyword discovery is still separate.

This module is the integration surface for a later newsroom hook. It must not be imported into `functions/api/news.js` until LUNA coordinates that change. `dedupeHeadlines()` is still not wired into `fetchHeadlines`.

## Keywords

Titles match UAP, UFO, OVNI, AARO, НЛО, OZN, and ΑΤΙΑ as whole tokens, plus the existing phrases and French, Spanish, Polish, Dutch, Swedish, Turkish, Greek, Arabic, simplified Chinese, traditional Chinese, and Korean equivalents. Ordinary science headlines, "ufology", "Aaron", and "ozone" stay excluded.

## Verification

Commands run in `/home/nightknight/Work/aurora-grok-health` on 2026-10-29:

- `node --test tests/source-catalog.test.mjs tests/source-health.test.mjs` — 13 passed.
- `AURORA_CHROMIUM=/usr/bin/chromium node --test tests/source-discovery-browser.test.mjs` — 2 passed. The directory still refused a `javascript:` homepage and an `http:` feed link. The health request started only after the button click and did not carry a caller URL.

No production deploy of this branch yet. No change to intake, payments, moderation, or the news worker.
