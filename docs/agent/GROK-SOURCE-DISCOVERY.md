# GROK source discovery

Status: reliability pass on `agent/grok-source-reliability`. The catalog has 75 feeds after one stale feed was removed. `functions/api/news.js` is unchanged.

## Catalog

`GET /api/sources` returns 75 publisher feeds. Corriere scienze was removed on 2026-10-29 after a live read showed its newest items dated 2024-04-03, outside the 120-day window. The 12 preview feeds are unchanged.

Added after that live check, all `preview: false`:

- Europe: tagesschau, NRK, NOS, ORF, ERR, TVN24 world, RTP, Yle, The Irish Times, Guardian science, France 24 French, Sky News world, Spiegel Wissenschaft, Libération sciences, BBC science, Nature, Phys.org space.
- Americas: Space.com, Science News, Scientific American, Live Science, New York Times science, The Globe and Mail world, Clarín Lo último, Folha ciência, NPR world, ABC News top stories, BBC Latin America, CBC technology.
- Asia-Pacific: RNZ world, SBS News, Sydney Morning Herald world, Straits Times world, CNA, SCMP world, Asahi headlines.
- Middle East and Africa: BBC Africa, SABC News, AllAfrica, The Jerusalem Post, Guardian Africa, DW English for Africa, RFI Afrique, Premium Times Nigeria.
- International organizations: UN News, IAEA top news, U.S. GAO reports.

Clarín is a general latest-news feed. AllAfrica aggregates African newsrooms and is based in the United States. UN News, IAEA, and GAO are official publication feeds, not UAP offices. Asahi and IAEA item links were `http` on their own hosts, so those two entries use `upgrade-http`.

## Live audit on 2026-10-29

First pass at 21:10:31Z, before the reader change, used the allowlisted fetcher on all 76 feeds. 74 returned HTTP 200. Dnevnik answered 302 to `https://tollbit.dnevnik.bg/rss/`, which is not an allowlisted host, so it was rejected. NRK timed out once. The Debrief, The War Zone, Space.com, and Live Science were HTTP 200 but larger than 500 KB because of full article HTML, so the reader discarded them. Only one accepted title matched a UAP keyword: Scientific American, "Strange triangular craft reported in new U.S. government UFO release".

The reader now sends an identifying User-Agent, strips `content:encoded` and `description` before the 500 KB parse cap, and keeps a 2 MB download ceiling. A second pass at 21:14:57Z covered the remaining 75 feeds. 73 parsed as RSS, Atom, or RDF. Dnevnik then returned HTTP 200 with 29 accepted items. NRK returned HTTP 200. IAEA dates in the form `26-10-28 14:21` parsed, and that feed had 15 accepted items with the newest on 2026-10-28. The Debrief's 15 October headline, "Israeli Military Continues the Search for an Unidentified Aerial Object Detected Near Lebanese Border", was item 42 and is now kept. That made 2 keyword matches from 2 feeds. The other 73 feeds had no keyword match in the accepted titles. These are publisher headlines, not verified cases.

CBC world and CBC technology failed twice in that pass. Node and curl both saw `HTTP/2 INTERNAL_ERROR`, and HTTP/1.1 timed out with zero bytes. Both feeds had returned RSS earlier the same day, so they stay in the catalog. A failed feed does not remove matches from feeds that respond.

Still inside the 120-day window, but the oldest accepted items were NHK on 2026-08-08 and SBS on 2026-08-26. No separate historical UAP archive feed was verified, so none was added.

Regional counts after the Corriere removal: Europe 31, Americas 19, Asia-Pacific 12, Middle East and Africa 10, global 3.

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

In `/home/nightknight/Work/aurora-grok-reliability` on 2026-10-29:

- `node --test tests/source-catalog.test.mjs tests/source-health.test.mjs` — 16 passed. Coverage includes a bulk `content:encoded` feed, the IAEA compact date, a surname containing "ufo", one timed-out feed beside a live match, and the 2 MB download ceiling.
- `AURORA_CHROMIUM=/usr/bin/chromium node --test tests/source-discovery-browser.test.mjs` — 2 passed. A failed fixture source is named, and the matching headline stays on the page. Caller URLs are still absent.

No production deploy of this branch yet. No change to intake, payments, moderation, or the news worker. `/api/source-health?url=` remains HTTP 400.
