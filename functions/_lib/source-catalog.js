// Official publisher feeds fetched on 2026-10-29.
// Each feed_url returned HTTP 200 and an RSS, Atom, or RDF document.
// These are news sources, not verified UAP cases.

export const CATALOG_CHECKED_ON = "2026-10-29";
export const REGIONS = ["all", "europe", "americas", "asia-pacific", "middle-east-africa", "global"];
export const ROLES = ["official-institution", "public-broadcaster", "international-desk", "specialist-press"];

function source(entry) {
  return {
    link_scheme: "https-only",
    preview: false,
    http_status: 200,
    checked_on: CATALOG_CHECKED_ON,
    note: "",
    redirect_hosts: [],
    ...entry
  };
}

export const SOURCE_CATALOG = [
  source({
    id: "the-debrief",
    publisher: "The Debrief",
    homepage: "https://thedebrief.org/",
    feed_url: "https://thedebrief.org/feed/",
    feed_host: "thedebrief.org",
    format: "rss",
    language: "en",
    country: "US",
    country_name: "United States",
    region: "americas",
    role: "specialist-press",
    covers: "U.S. science, space, and defense outlet. UAP topics appear only when this publisher reports them.",
    priority: 1,
    preview: true,
    link_hosts: ["thedebrief.org"]
  }),
  source({
    id: "the-war-zone",
    publisher: "The War Zone",
    homepage: "https://www.twz.com/",
    feed_url: "https://www.twz.com/feed",
    feed_host: "www.twz.com",
    format: "rss",
    language: "en",
    country: "US",
    country_name: "United States",
    region: "americas",
    role: "specialist-press",
    covers: "U.S. defense reporting. Not a UAP-only feed and not a government source.",
    priority: 2,
    preview: true,
    link_hosts: ["twz.com"]
  }),
  source({
    id: "bbc-world",
    publisher: "BBC News",
    homepage: "https://www.bbc.com/news/world",
    feed_url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    feed_host: "feeds.bbci.co.uk",
    format: "rss",
    language: "en",
    country: "GB",
    country_name: "United Kingdom",
    region: "europe",
    role: "public-broadcaster",
    covers: "BBC News world desk. General international news, not a UAP desk.",
    priority: 3,
    preview: true,
    link_hosts: ["bbc.com", "bbc.co.uk"]
  }),
  source({
    id: "aljazeera-english",
    publisher: "Al Jazeera English",
    homepage: "https://www.aljazeera.com/",
    feed_url: "https://www.aljazeera.com/xml/rss/all.xml",
    feed_host: "www.aljazeera.com",
    format: "rss",
    language: "en",
    country: "QA",
    country_name: "Qatar",
    region: "middle-east-africa",
    role: "public-broadcaster",
    covers: "Al Jazeera English all-news feed from the Doha newsroom.",
    priority: 4,
    preview: true,
    link_hosts: ["aljazeera.com"]
  }),
  source({
    id: "france24-english",
    publisher: "France 24",
    homepage: "https://www.france24.com/en/",
    feed_url: "https://www.france24.com/en/rss",
    feed_host: "www.france24.com",
    format: "rss",
    language: "en",
    country: "FR",
    country_name: "France",
    region: "europe",
    role: "public-broadcaster",
    covers: "France 24 English international desk.",
    priority: 5,
    preview: true,
    link_hosts: ["france24.com"]
  }),
  source({
    id: "dw-english",
    publisher: "Deutsche Welle",
    homepage: "https://www.dw.com/en/",
    feed_url: "https://rss.dw.com/xml/rss-en-all",
    feed_host: "rss.dw.com",
    format: "rss",
    language: "en",
    country: "DE",
    country_name: "Germany",
    region: "europe",
    role: "public-broadcaster",
    covers: "Deutsche Welle English news feed.",
    priority: 6,
    preview: true,
    link_hosts: ["dw.com"]
  }),
  source({
    id: "nasa-releases",
    publisher: "NASA",
    homepage: "https://www.nasa.gov/news-release/",
    feed_url: "https://www.nasa.gov/news-release/feed/",
    feed_host: "www.nasa.gov",
    format: "rss",
    language: "en",
    country: "US",
    country_name: "United States",
    region: "americas",
    role: "official-institution",
    covers: "NASA news releases. Official agency updates, not a sighting database.",
    priority: 7,
    preview: true,
    link_hosts: ["nasa.gov"]
  }),
  source({
    id: "japan-times",
    publisher: "The Japan Times",
    homepage: "https://www.japantimes.co.jp/",
    feed_url: "https://www.japantimes.co.jp/feed/",
    feed_host: "www.japantimes.co.jp",
    format: "rss",
    language: "en",
    country: "JP",
    country_name: "Japan",
    region: "asia-pacific",
    role: "international-desk",
    covers: "The Japan Times latest-articles feed.",
    priority: 8,
    preview: true,
    link_hosts: ["japantimes.co.jp"]
  }),
  source({
    id: "cbc-world",
    publisher: "CBC News",
    homepage: "https://www.cbc.ca/news/world",
    feed_url: "https://www.cbc.ca/webfeed/rss/rss-world",
    feed_host: "www.cbc.ca",
    format: "rss",
    language: "en",
    country: "CA",
    country_name: "Canada",
    region: "americas",
    role: "public-broadcaster",
    covers: "CBC world news. Public broadcaster, not a UAP desk.",
    priority: 9,
    preview: true,
    link_hosts: ["cbc.ca"]
  }),
  source({
    id: "abc-australia",
    publisher: "ABC News Australia",
    homepage: "https://www.abc.net.au/news",
    feed_url: "https://www.abc.net.au/news/feed/51120/rss.xml",
    feed_host: "www.abc.net.au",
    format: "rss",
    language: "en",
    country: "AU",
    country_name: "Australia",
    region: "asia-pacific",
    role: "public-broadcaster",
    covers: "ABC News Australia Just In feed. General news, not a science-only desk.",
    priority: 10,
    preview: true,
    link_hosts: ["abc.net.au"]
  }),
  source({
    id: "africanews",
    publisher: "Africanews",
    homepage: "https://www.africanews.com/",
    feed_url: "https://www.africanews.com/feed/rss",
    feed_host: "www.africanews.com",
    format: "rss",
    language: "en",
    country: "FR",
    country_name: "France",
    region: "middle-east-africa",
    role: "public-broadcaster",
    covers: "Pan-African Africanews feed. Euronews service edited in Lyon, covering Africa.",
    priority: 11,
    preview: true,
    link_scheme: "upgrade-http",
    link_hosts: ["africanews.com"],
    note: "Item links are published as http and upgraded to https only for africanews.com."
  }),
  source({
    id: "hindu-science",
    publisher: "The Hindu",
    homepage: "https://www.thehindu.com/sci-tech/science/",
    feed_url: "https://www.thehindu.com/sci-tech/science/feeder/default.rss",
    feed_host: "www.thehindu.com",
    format: "rss",
    language: "en",
    country: "IN",
    country_name: "India",
    region: "asia-pacific",
    role: "international-desk",
    covers: "The Hindu science desk.",
    priority: 12,
    preview: true,
    link_hosts: ["thehindu.com"]
  }),
  source({
    id: "esa-top-news",
    publisher: "European Space Agency",
    homepage: "https://www.esa.int/",
    feed_url: "https://www.esa.int/rssfeed/Our_Activities",
    feed_host: "www.esa.int",
    format: "rss",
    language: "en",
    country: "FR",
    country_name: "France",
    region: "europe",
    role: "official-institution",
    covers: "ESA top news. Headquarters in Paris; the agency is European.",
    priority: 20,
    link_hosts: ["esa.int"]
  }),
  source({
    id: "uk-ministry-of-defence",
    publisher: "UK Ministry of Defence",
    homepage: "https://www.gov.uk/government/organisations/ministry-of-defence",
    feed_url: "https://www.gov.uk/government/organisations/ministry-of-defence.atom",
    feed_host: "www.gov.uk",
    format: "atom",
    language: "en",
    country: "GB",
    country_name: "United Kingdom",
    region: "europe",
    role: "official-institution",
    covers: "GOV.UK Atom feed of Ministry of Defence publications and updates.",
    priority: 21,
    link_hosts: ["gov.uk"]
  }),
  source({
    id: "noaa-news",
    publisher: "NOAA",
    homepage: "https://www.noaa.gov/",
    feed_url: "https://www.noaa.gov/rss.xml",
    feed_host: "www.noaa.gov",
    format: "rss",
    language: "en",
    country: "US",
    country_name: "United States",
    region: "americas",
    role: "official-institution",
    covers: "National Oceanic and Atmospheric Administration public RSS feed.",
    priority: 22,
    link_hosts: ["noaa.gov"]
  }),
  source({
    id: "bbc-mundo",
    publisher: "BBC Mundo",
    homepage: "https://www.bbc.com/mundo",
    feed_url: "https://feeds.bbci.co.uk/mundo/rss.xml",
    feed_host: "feeds.bbci.co.uk",
    format: "rss",
    language: "es",
    country: "GB",
    country_name: "United Kingdom",
    region: "europe",
    role: "public-broadcaster",
    covers: "BBC Mundo Spanish-language international service.",
    priority: 23,
    link_hosts: ["bbc.com", "bbc.co.uk"]
  }),
  source({
    id: "dw-wissen",
    publisher: "Deutsche Welle",
    homepage: "https://www.dw.com/de/",
    feed_url: "https://rss.dw.com/rdf/rss-de-wissenschaft",
    feed_host: "rss.dw.com",
    format: "rdf",
    language: "de",
    country: "DE",
    country_name: "Germany",
    region: "europe",
    role: "public-broadcaster",
    covers: "Deutsche Welle German science and environment RDF feed.",
    priority: 24,
    link_hosts: ["dw.com"]
  }),
  source({
    id: "npr-science",
    publisher: "NPR",
    homepage: "https://www.npr.org/sections/science/",
    feed_url: "https://feeds.npr.org/1007/rss.xml",
    feed_host: "feeds.npr.org",
    format: "rss",
    language: "en",
    country: "US",
    country_name: "United States",
    region: "americas",
    role: "public-broadcaster",
    covers: "NPR science topic feed.",
    priority: 25,
    link_hosts: ["npr.org"]
  }),
  source({
    id: "guardian-world",
    publisher: "The Guardian",
    homepage: "https://www.theguardian.com/world",
    feed_url: "https://www.theguardian.com/world/rss",
    feed_host: "www.theguardian.com",
    format: "rss",
    language: "en",
    country: "GB",
    country_name: "United Kingdom",
    region: "europe",
    role: "international-desk",
    covers: "The Guardian world desk.",
    priority: 26,
    link_hosts: ["theguardian.com"]
  }),
  source({
    id: "lemonde-sciences",
    publisher: "Le Monde",
    homepage: "https://www.lemonde.fr/sciences/",
    feed_url: "https://www.lemonde.fr/sciences/rss_full.xml",
    feed_host: "www.lemonde.fr",
    format: "rss",
    language: "fr",
    country: "FR",
    country_name: "France",
    region: "europe",
    role: "international-desk",
    covers: "Le Monde sciences section.",
    priority: 27,
    link_hosts: ["lemonde.fr"]
  }),
  source({
    id: "elpais-ciencia",
    publisher: "El País",
    homepage: "https://elpais.com/ciencia/",
    feed_url: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/ciencia/portada",
    feed_host: "feeds.elpais.com",
    format: "rss",
    language: "es",
    country: "ES",
    country_name: "Spain",
    region: "europe",
    role: "international-desk",
    covers: "El País ciencia section.",
    priority: 28,
    link_hosts: ["elpais.com"]
  }),
  source({
    id: "spiegel-international",
    publisher: "Der Spiegel",
    homepage: "https://www.spiegel.de/international/",
    feed_url: "https://www.spiegel.de/international/index.rss",
    feed_host: "www.spiegel.de",
    format: "rss",
    language: "en",
    country: "DE",
    country_name: "Germany",
    region: "europe",
    role: "international-desk",
    covers: "Der Spiegel international desk.",
    priority: 29,
    link_hosts: ["spiegel.de"]
  }),
  source({
    id: "nhk-news",
    publisher: "NHK",
    homepage: "https://www3.nhk.or.jp/news/",
    feed_url: "https://www3.nhk.or.jp/rss/news/cat0.xml",
    feed_host: "www3.nhk.or.jp",
    format: "rss",
    language: "ja",
    country: "JP",
    country_name: "Japan",
    region: "asia-pacific",
    role: "public-broadcaster",
    covers: "NHK Japanese news RSS. Listed for coverage; not part of the default preview.",
    priority: 30,
    link_scheme: "upgrade-http",
    link_hosts: ["www3.nhk.or.jp"],
    note: "On 2026-10-29 the feed returned RSS whose newest item was dated 2026-08-08. Article links are http and are upgraded to https only on www3.nhk.or.jp."
  }),
  source({
    id: "yonhap-english",
    publisher: "Yonhap News Agency",
    homepage: "https://en.yna.co.kr/",
    feed_url: "https://en.yna.co.kr/RSS/news.xml",
    feed_host: "en.yna.co.kr",
    format: "rss",
    language: "en",
    country: "KR",
    country_name: "South Korea",
    region: "asia-pacific",
    role: "public-broadcaster",
    covers: "Yonhap News Agency English wire.",
    priority: 31,
    link_hosts: ["en.yna.co.kr"]
  }),
  source({
    id: "folha-mundo",
    publisher: "Folha de S.Paulo",
    homepage: "https://www1.folha.uol.com.br/mundo/",
    feed_url: "https://feeds.folha.uol.com.br/mundo/rss091.xml",
    feed_host: "feeds.folha.uol.com.br",
    format: "rss",
    language: "pt",
    country: "BR",
    country_name: "Brazil",
    region: "americas",
    role: "international-desk",
    covers: "Folha de S.Paulo world section. The feed is RSS 0.91 in ISO-8859-1.",
    priority: 32,
    link_hosts: ["redir.folha.com.br", "folha.uol.com.br"],
    note: "Item links use Folha's redir.folha.com.br wrapper."
  }),
  source({
    id: "dnevnik",
    publisher: "Dnevnik",
    homepage: "https://www.dnevnik.bg/",
    feed_url: "https://www.dnevnik.bg/rss/",
    feed_host: "www.dnevnik.bg",
    format: "rss",
    language: "bg",
    country: "BG",
    country_name: "Bulgaria",
    region: "europe",
    role: "international-desk",
    covers: "Dnevnik Bulgarian news feed.",
    priority: 33,
    link_hosts: ["dnevnik.bg"]
  }),
  source({
    id: "svt-nyheter",
    publisher: "SVT Nyheter",
    homepage: "https://www.svt.se/nyheter/",
    feed_url: "https://www.svt.se/rss.xml",
    feed_host: "www.svt.se",
    format: "rss",
    language: "sv",
    country: "SE",
    country_name: "Sweden",
    region: "europe",
    role: "public-broadcaster",
    covers: "SVT Nyheter, Sweden's public-service news RSS.",
    priority: 34,
    link_hosts: ["svt.se"]
  }),
  source({
    id: "ansa-top",
    publisher: "ANSA",
    homepage: "https://www.ansa.it/",
    feed_url: "https://www.ansa.it/sito/notizie/topnews/topnews_rss.xml",
    feed_host: "www.ansa.it",
    format: "rss",
    language: "it",
    country: "IT",
    country_name: "Italy",
    region: "europe",
    role: "public-broadcaster",
    covers: "ANSA Italian top-news wire.",
    priority: 35,
    link_hosts: ["ansa.it"]
  })
];

const HOST = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function blockedHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host.includes(":")) return true;
  const parts = host.split(".").map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

export function validateSourceCatalog(catalog = SOURCE_CATALOG) {
  const errors = [];
  const ids = new Set();
  const feeds = new Set();
  if (!Array.isArray(catalog) || catalog.length === 0) errors.push("catalog must be a non-empty array");
  for (const entry of catalog || []) {
    const where = entry?.id || "(missing id)";
    if (!/^[a-z0-9-]{3,64}$/.test(entry?.id || "")) errors.push(`${where}: invalid id`);
    if (ids.has(entry.id)) errors.push(`${where}: duplicate id`);
    ids.add(entry.id);
    if (!entry.publisher || entry.publisher.length < 2 || entry.publisher.length > 80) errors.push(`${where}: publisher`);
    if (!entry.covers || entry.covers.length < 20 || entry.covers.length > 240) errors.push(`${where}: covers`);
    if (!ROLES.includes(entry.role)) errors.push(`${where}: role`);
    if (!REGIONS.includes(entry.region) || entry.region === "all") errors.push(`${where}: region`);
    if (!/^[a-z]{2}$/.test(entry.language || "")) errors.push(`${where}: language`);
    if (!/^[A-Z]{2}$/.test(entry.country || "")) errors.push(`${where}: country`);
    if (!entry.country_name || entry.country_name.length > 40) errors.push(`${where}: country_name`);
    if (!["rss", "atom", "rdf"].includes(entry.format)) errors.push(`${where}: format`);
    if (!Number.isInteger(entry.priority) || entry.priority < 1 || entry.priority > 999) errors.push(`${where}: priority`);
    if (typeof entry.preview !== "boolean") errors.push(`${where}: preview`);
    if (!["https-only", "upgrade-http"].includes(entry.link_scheme)) errors.push(`${where}: link_scheme`);
    if (entry.checked_on !== CATALOG_CHECKED_ON) errors.push(`${where}: checked_on`);
    if (entry.http_status !== 200) errors.push(`${where}: http_status`);
    if (typeof entry.note !== "string" || entry.note.length > 300) errors.push(`${where}: note`);
    for (const field of ["homepage", "feed_url"]) {
      let url;
      try { url = new URL(entry[field]); } catch { errors.push(`${where}: ${field} url`); continue; }
      if (url.protocol !== "https:" || url.username || url.password || url.port) errors.push(`${where}: ${field} must be https without credentials or a port`);
      if (blockedHost(url.hostname) || !HOST.test(url.hostname)) errors.push(`${where}: ${field} host`);
      if (field === "feed_url" && url.hostname !== entry.feed_host) errors.push(`${where}: feed_host mismatch`);
    }
    if (feeds.has(entry.feed_url)) errors.push(`${where}: duplicate feed_url`);
    feeds.add(entry.feed_url);
    if (!Array.isArray(entry.link_hosts) || entry.link_hosts.length === 0 || entry.link_hosts.length > 6) errors.push(`${where}: link_hosts`);
    for (const host of entry.link_hosts || []) {
      if (!HOST.test(host) || blockedHost(host)) errors.push(`${where}: bad link host ${host}`);
    }
    if (!Array.isArray(entry.redirect_hosts)) errors.push(`${where}: redirect_hosts`);
  }
  const priorities = (catalog || []).map((entry) => entry.priority);
  if (new Set(priorities).size !== priorities.length) errors.push("priorities must be unique");
  const previewCount = (catalog || []).filter((entry) => entry.preview).length;
  if (previewCount !== 12) errors.push(`expected 12 preview feeds, found ${previewCount}`);
  return errors;
}
