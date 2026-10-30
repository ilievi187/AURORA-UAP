# AURORA UAP — 75-Source Diagnostic Audit Report (Mission 70)

- **Audited on:** 2026-10-30
- **Total catalog sources:** 75
- **Reachable & valid feeds:** 73 / 75 (73/75 HTTP 200; 2 CBC feeds HTTP 520 / HTTP2 stream error upstream)
- **Why `official` showed 7 articles:** On Cloudflare Edge, Google News RSS returned HTTP `503` for both `official` queries, and the 7 general institutional feeds (`nasa-releases`, `esa-top-news`, `uk-ministry-of-defence`, `noaa-news`, `un-news`, `iaea-topnews`, `gao-reports`) had 0 UAP-keyword headlines in their latest 10–30 general releases. The supplemental fallback therefore queried the first 4 `specialist-press` feeds under a 120-day window (`MAX_ITEM_AGE_MS = 120d`), which yielded 5 matches from `the-debrief` + 2 from `guardian-science` = **7 articles** (while `space-com` had 1 match from Aug 2026 and 7 more within 365 days).

## Per-Source Diagnostic Table (All 75 Sources)

| # | ID | Publisher | Role | Region | Country | Reachable | HTTP | Format | Articles (120d) | Newest Date | UAP Matches | Images | Summaries | Dups | Active Editions |
|---|---|---|---|---|---|---|---|---|---:|---|---:|---|---|---:|---|
| 1 | `the-debrief` | The Debrief | `specialist-press` | `americas` | US | YES | 200 | `rss` | 6 | 2026-09-16 | 5 | Yes | Yes | 0 | `global` |
| 2 | `the-war-zone` | The War Zone | `specialist-press` | `americas` | US | YES | 200 | `rss` | 36 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 3 | `bbc-world` | BBC News | `public-broadcaster` | `europe` | GB | YES | 200 | `rss` | 37 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 4 | `aljazeera-english` | Al Jazeera English | `public-broadcaster` | `middle-east-africa` | QA | YES | 200 | `rss` | 25 | 2026-10-30 | 0 | No | Yes | 0 | `global` |
| 5 | `france24-english` | France 24 | `public-broadcaster` | `europe` | FR | YES | 200 | `rss` | 24 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 6 | `dw-english` | Deutsche Welle | `public-broadcaster` | `europe` | DE | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | No | Yes | 0 | `global` |
| 7 | `nasa-releases` | NASA | `official-institution` | `americas` | US | YES | 200 | `rss` | 10 | 2026-10-30 | 0 | Yes | Yes | 0 | `global,official` |
| 8 | `japan-times` | The Japan Times | `international-desk` | `asia-pacific` | JP | YES | 200 | `rss` | 30 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 9 | `cbc-world` | CBC News | `public-broadcaster` | `americas` | CA | NO (network) | 0 | `none` | 0 | — | 0 | No | No | 0 | `global` |
| 10 | `abc-australia` | ABC News Australia | `public-broadcaster` | `asia-pacific` | AU | YES | 200 | `rss` | 25 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 11 | `africanews` | Africanews | `public-broadcaster` | `middle-east-africa` | FR | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 12 | `hindu-science` | The Hindu | `international-desk` | `asia-pacific` | IN | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 13 | `esa-top-news` | European Space Agency | `official-institution` | `europe` | FR | YES | 200 | `rss` | 8 | 2026-10-30 | 0 | Yes | Yes | 0 | `official` |
| 14 | `uk-ministry-of-defence` | UK Ministry of Defence | `official-institution` | `europe` | GB | YES | 200 | `atom` | 20 | 2026-10-30 | 0 | No | Yes | 0 | `official` |
| 15 | `noaa-news` | NOAA | `official-institution` | `americas` | US | YES | 200 | `rss` | 9 | 2026-10-16 | 0 | Yes | Yes | 0 | `official` |
| 16 | `bbc-mundo` | BBC Mundo | `public-broadcaster` | `europe` | GB | YES | 200 | `rss` | 34 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 17 | `dw-wissen` | Deutsche Welle | `public-broadcaster` | `europe` | DE | YES | 200 | `rdf` | 1 | 2026-10-29 | 0 | No | Yes | 0 | `excluded(limit)` |
| 18 | `npr-science` | NPR | `public-broadcaster` | `americas` | US | YES | 200 | `rss` | 10 | 2026-10-29 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 19 | `guardian-world` | The Guardian | `international-desk` | `europe` | GB | YES | 200 | `rss` | 45 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 20 | `lemonde-sciences` | Le Monde | `international-desk` | `europe` | FR | YES | 200 | `rss` | 20 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 21 | `elpais-ciencia` | El País | `international-desk` | `europe` | ES | YES | 200 | `rss` | 22 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 22 | `spiegel-international` | Der Spiegel | `international-desk` | `europe` | DE | YES | 200 | `rss` | 16 | 2026-10-27 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 23 | `nhk-news` | NHK | `public-broadcaster` | `asia-pacific` | JP | YES | 200 | `rss` | 7 | 2026-08-08 | 0 | No | Yes | 0 | `excluded(limit)` |
| 24 | `yonhap-english` | Yonhap News Agency | `public-broadcaster` | `asia-pacific` | KR | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 25 | `folha-mundo` | Folha de S.Paulo | `international-desk` | `americas` | BR | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 26 | `dnevnik` | Dnevnik | `international-desk` | `europe` | BG | YES | 200 | `rss` | 29 | 2026-10-30 | 0 | No | Yes | 0 | `bulgaria` |
| 27 | `svt-nyheter` | SVT Nyheter | `public-broadcaster` | `europe` | SE | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 28 | `ansa-top` | ANSA | `public-broadcaster` | `europe` | IT | YES | 200 | `rss` | 10 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 29 | `tagesschau` | tagesschau | `public-broadcaster` | `europe` | DE | YES | 200 | `rss` | 40 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 30 | `nrk-toppsaker` | NRK | `public-broadcaster` | `europe` | NO | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | Yes | Yes | 2 | `excluded(limit)` |
| 31 | `nos-nieuws` | NOS Nieuws | `public-broadcaster` | `europe` | NL | YES | 200 | `rss` | 20 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 32 | `orf-news` | ORF | `public-broadcaster` | `europe` | AT | YES | 200 | `rdf` | 27 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 33 | `err-uudised` | ERR | `public-broadcaster` | `europe` | EE | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 34 | `tvn24-swiat` | TVN24 | `international-desk` | `europe` | PL | YES | 200 | `rss` | 30 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 35 | `rtp-noticias` | RTP Notícias | `public-broadcaster` | `europe` | PT | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 36 | `yle-uutiset` | Yle Uutiset | `public-broadcaster` | `europe` | FI | YES | 200 | `rss` | 20 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 37 | `irish-times` | The Irish Times | `international-desk` | `europe` | IE | YES | 200 | `rss` | 20 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 38 | `guardian-science` | The Guardian | `specialist-press` | `europe` | GB | YES | 200 | `rss` | 5 | 2026-10-23 | 2 | Yes | Yes | 0 | `global` |
| 39 | `france24-french` | France 24 | `public-broadcaster` | `europe` | FR | YES | 200 | `rss` | 24 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 40 | `sky-news-world` | Sky News | `international-desk` | `europe` | GB | YES | 200 | `rss` | 8 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 41 | `spiegel-wissenschaft` | Der Spiegel | `specialist-press` | `europe` | DE | YES | 200 | `rss` | 20 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 42 | `liberation-sciences` | Libération | `specialist-press` | `europe` | FR | YES | 200 | `rss` | 50 | 2026-10-29 | 0 | No | Yes | 0 | `global` |
| 43 | `bbc-science` | BBC News | `public-broadcaster` | `europe` | GB | YES | 200 | `rss` | 41 | 2026-10-30 | 0 | Yes | Yes | 7 | `excluded(limit)` |
| 44 | `nature` | Nature | `specialist-press` | `europe` | GB | YES | 200 | `rdf` | 50 | 2026-10-30 | 0 | No | Yes | 0 | `global` |
| 45 | `space-com` | Space.com | `specialist-press` | `americas` | US | YES | 200 | `rss` | 1 | 2026-08-22 | 1 | Yes | Yes | 0 | `global` |
| 46 | `science-news` | Science News | `specialist-press` | `americas` | US | YES | 200 | `rss` | 20 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 47 | `phys-org-space` | Phys.org | `specialist-press` | `europe` | IM | YES | 200 | `rss` | 30 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 48 | `scientific-american` | Scientific American | `specialist-press` | `americas` | US | YES | 200 | `rss` | 50 | 2026-10-30 | 1 | No | Yes | 0 | `global` |
| 49 | `live-science` | Live Science | `specialist-press` | `americas` | US | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | Yes | Yes | 0 | `global` |
| 50 | `rnz-world` | RNZ | `public-broadcaster` | `asia-pacific` | NZ | YES | 200 | `rss` | 2 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 51 | `sbs-news` | SBS News | `public-broadcaster` | `asia-pacific` | AU | YES | 200 | `rss` | 25 | 2026-08-26 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 52 | `smh-world` | The Sydney Morning Herald | `international-desk` | `asia-pacific` | AU | YES | 200 | `rss` | 20 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 53 | `straitstimes-world` | The Straits Times | `international-desk` | `asia-pacific` | SG | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 54 | `channel-newsasia` | CNA | `public-broadcaster` | `asia-pacific` | SG | YES | 200 | `rss` | 20 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 55 | `scmp-world` | South China Morning Post | `international-desk` | `asia-pacific` | HK | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 56 | `asahi-headlines` | Asahi Shimbun | `international-desk` | `asia-pacific` | JP | YES | 200 | `rdf` | 40 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 57 | `nyt-science` | The New York Times | `international-desk` | `americas` | US | YES | 200 | `rss` | 30 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 58 | `globe-and-mail` | The Globe and Mail | `international-desk` | `americas` | CA | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | Yes | Yes | 1 | `excluded(limit)` |
| 59 | `clarin-latest` | Clarín | `international-desk` | `americas` | AR | YES | 200 | `rss` | 10 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 60 | `folha-ciencia` | Folha de S.Paulo | `international-desk` | `americas` | BR | YES | 200 | `rss` | 50 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 61 | `npr-world` | NPR | `public-broadcaster` | `americas` | US | YES | 200 | `rss` | 10 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 62 | `abc-news-us` | ABC News | `international-desk` | `americas` | US | YES | 200 | `rss` | 25 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 63 | `bbc-africa` | BBC News | `public-broadcaster` | `middle-east-africa` | GB | YES | 200 | `rss` | 30 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 64 | `sabc-news` | SABC News | `public-broadcaster` | `middle-east-africa` | ZA | YES | 200 | `rss` | 10 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 65 | `allafrica` | AllAfrica | `international-desk` | `middle-east-africa` | US | YES | 200 | `rss` | 33 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 66 | `jerusalem-post` | The Jerusalem Post | `international-desk` | `middle-east-africa` | IL | YES | 200 | `rss` | 26 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 67 | `un-news` | UN News | `official-institution` | `global` | US | YES | 200 | `rss` | 30 | 2026-10-30 | 0 | Yes | Yes | 0 | `official` |
| 68 | `iaea-topnews` | IAEA | `official-institution` | `global` | AT | YES | 200 | `rss` | 15 | 2026-10-30 | 0 | Yes | Yes | 1 | `official` |
| 69 | `gao-reports` | U.S. GAO | `official-institution` | `global` | US | YES | 200 | `rss` | 25 | 2026-10-29 | 0 | No | Yes | 0 | `official` |
| 70 | `guardian-africa` | The Guardian | `international-desk` | `middle-east-africa` | GB | YES | 200 | `rss` | 20 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 71 | `dw-africa` | Deutsche Welle | `public-broadcaster` | `middle-east-africa` | DE | YES | 200 | `rss` | 3 | 2026-10-30 | 0 | No | Yes | 0 | `excluded(limit)` |
| 72 | `rfi-afrique` | RFI | `public-broadcaster` | `middle-east-africa` | FR | YES | 200 | `rss` | 23 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 73 | `premium-times` | Premium Times | `international-desk` | `middle-east-africa` | NG | YES | 200 | `rss` | 15 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 74 | `bbc-latin-america` | BBC News | `public-broadcaster` | `americas` | GB | YES | 200 | `rss` | 17 | 2026-10-30 | 0 | Yes | Yes | 0 | `excluded(limit)` |
| 75 | `cbc-technology` | CBC News | `public-broadcaster` | `americas` | CA | NO (network) | 0 | `none` | 0 | — | 0 | No | No | 0 | `excluded(limit)` |
