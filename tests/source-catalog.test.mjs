import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {dedupeHeadlines} from "../functions/_lib/headline-dedup.js";
import {decodeXmlBytes, parseFeedXml} from "../functions/_lib/feed-parse.js";
import {discoverMatches, selectFeeds, titleMatchesTopic} from "../functions/_lib/discovery.js";
import {REGIONS, SOURCE_CATALOG, validateSourceCatalog} from "../functions/_lib/source-catalog.js";
import {onRequestGet as sourcesApi} from "../functions/api/sources.js";
import {onRequestGet as discoveryApi} from "../functions/api/discovery.js";
import {headlineCases} from "./fixtures/source-discovery/headline-cases.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const now = Date.parse("2026-10-29T12:00:00.000Z");
const previewIds = ["the-debrief", "the-war-zone", "bbc-world", "aljazeera-english", "france24-english", "dw-english", "nasa-releases", "japan-times", "cbc-world", "abc-australia", "africanews", "hindu-science"];

function rss(title, link, pubDate = "Wed, 28 Oct 2026 12:00:00 GMT") {
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Fixture</title><item><title>${title}</title><link>${link}</link><pubDate>${pubDate}</pubDate></item></channel></rss>`;
}

function responseFor(body, status = 200, headers = {}, location = "") {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {get: (name) => (name.toLowerCase() === "location" ? location : headers[name.toLowerCase()] || null)},
    arrayBuffer: async () => new TextEncoder().encode(body).buffer
  };
}

test("catalog is unique, https-only, and limited to checked publisher feeds", () => {
  assert.deepEqual(validateSourceCatalog(), []);
  assert.equal(SOURCE_CATALOG.length, 76);
  assert.equal(SOURCE_CATALOG.filter((entry) => entry.preview).length, 12);
  for (const entry of SOURCE_CATALOG) {
    assert.equal(new URL(entry.feed_url).hostname, entry.feed_host);
    assert.equal(entry.checked_on, "2026-10-29");
    assert.equal(entry.http_status, 200);
  }
});

test("default discovery preview is the twelve priority feeds", () => {
  assert.deepEqual(selectFeeds(SOURCE_CATALOG, "all").map((entry) => entry.id), previewIds);
  const europe = selectFeeds(SOURCE_CATALOG, "europe").map((entry) => entry.id);
  assert.ok(europe.includes("bbc-world") && europe.includes("dnevnik"));
  assert.equal(europe.includes("nasa-releases"), false);
  assert.ok(europe.length <= 12);
});

test("keyword filter keeps UAP terms and rejects ordinary science headlines", () => {
  assert.equal(titleMatchesTopic("Senate schedules UAP hearing"), true);
  assert.equal(titleMatchesTopic("The UFO files"), true);
  assert.equal(titleMatchesTopic("AARO publishes its report"), true);
  assert.equal(titleMatchesTopic("OVNI grabado en el cielo"), true);
  assert.equal(titleMatchesTopic("Свидетели съобщават за НЛО над Пловдив"), true);
  assert.equal(titleMatchesTopic("Unidentified aerial object over the coast"), true);
  assert.equal(titleMatchesTopic("NASA launches Europa probe"), false);
  assert.equal(titleMatchesTopic("A new ufology podcast trailer"), false);
  assert.equal(titleMatchesTopic("Aaron Sorkin writes a play"), false);
  assert.equal(titleMatchesTopic("Нова теория за черните дупки"), false);
  assert.equal(titleMatchesTopic("Un objet volant non identifié au-dessus de Lyon"), true);
  assert.equal(titleMatchesTopic("Un objeto volador no identificado"), true);
  assert.equal(titleMatchesTopic("OZN deasupra Clujului"), true);
  assert.equal(titleMatchesTopic("The ozone layer is not a sighting"), false);
  assert.equal(titleMatchesTopic("不明飞行物出现在夜空"), true);
  assert.equal(titleMatchesTopic("不明飛行物が撮影された"), true);
  assert.equal(titleMatchesTopic("미확인비행물체 포착"), true);
  assert.equal(titleMatchesTopic("ΑΤΙΑ πάνω από την Αθήνα"), true);
  assert.equal(titleMatchesTopic("Η ατμόσφαιρα της Γης"), false);
  assert.equal(titleMatchesTopic("niezidentyfikowany obiekt nad Warszawą"), true);
  assert.equal(titleMatchesTopic("ongeïdentificeerd vliegend voorwerp"), true);
  assert.equal(titleMatchesTopic("okänt flygande föremål"), true);
  assert.equal(titleMatchesTopic("tanımlanamayan uçan cisim"), true);
  assert.equal(titleMatchesTopic("جسم طائر مجهول فوق الساحل"), true);
});

test("dedup fixtures", () => {
  for (const fixture of headlineCases) {
    const urls = dedupeHeadlines(fixture.items).map((item) => item.url);
    assert.deepEqual(urls, fixture.expectUrls, fixture.name);
  }
});

test("parser accepts RSS, Atom, and RDF and drops foreign or insecure links", () => {
  const source = {id: "example", publisher: "Example Press", language: "en", link_scheme: "https-only", link_hosts: ["example.com"]};
  const atom = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>UAP hearing opens</title><link rel="alternate" href="https://www.example.com/atom"/><updated>2026-10-28T12:00:00Z</updated></entry></feed>`;
  const rdf = `<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><item rdf:about="https://www.example.com/rdf"><title><![CDATA[UAP hearing opens]]></title><link>https://www.example.com/rdf</link><dc:date>2026-10-28T12:00:00Z</dc:date></item></rdf:RDF>`;
  assert.equal(parseFeedXml(atom, source, now)[0].url, "https://www.example.com/atom");
  assert.equal(parseFeedXml(rdf, source, now)[0].title, "UAP hearing opens");
  assert.equal(parseFeedXml(rss("UAP hearing opens", "https://evil.example/phish"), source, now).length, 0);
  assert.equal(parseFeedXml(rss("UAP hearing opens", "http://www.example.com/plain"), source, now).length, 0);
  assert.equal(parseFeedXml(rss("UAP hearing opens", "javascript:alert(1)"), source, now).length, 0);
  assert.equal(parseFeedXml("<html><title>not a feed</title></html>", source, now).length, 0);
  assert.equal(parseFeedXml(rss("UAP", "https://www.example.com/short"), source, now).length, 0);
  assert.equal(parseFeedXml(rss("UAP hearing opens", "https://www.example.com/old", "Mon, 01 Jun 2026 12:00:00 GMT"), source, now).length, 0);
  const upgraded = parseFeedXml(rss("UAP hearing opens", "http://www.example.com/secure"), {...source, link_scheme: "upgrade-http"}, now);
  assert.equal(upgraded[0].url, "https://www.example.com/secure");
});

test("ISO-8859-1 feeds keep the declared characters", () => {
  const head = `<?xml version="1.0" encoding="ISO-8859-1"?><rss><channel><item><title>Caso de OVNI: n`;
  const tail = `o</title><link>https://www1.folha.uol.com.br/mundo/story</link><pubDate>Wed, 28 Oct 2026 12:00:00 GMT</pubDate></item></channel></rss>`;
  const bytes = Uint8Array.from([...head].map((char) => char.charCodeAt(0)).concat([0xE3], [...tail].map((char) => char.charCodeAt(0))));
  const xml = decodeXmlBytes(bytes, "application/xml");
  assert.match(xml, /não/);
  const source = SOURCE_CATALOG.find((entry) => entry.id === "folha-mundo");
  assert.equal(parseFeedXml(xml, source, now)[0].title, "Caso de OVNI: não");
});

test("discovery follows only catalog redirects and dedupes keyword matches", async () => {
  const calls = [];
  const catalog = [
    {...SOURCE_CATALOG.find((entry) => entry.id === "nasa-releases"), feed_url: "https://www.nasa.gov/news-release/feed/", redirect_hosts: []},
    SOURCE_CATALOG.find((entry) => entry.id === "bbc-world")
  ];
  const fetcher = async (url) => {
    calls.push(url);
    if (url === "https://www.nasa.gov/news-release/feed/") {
      return responseFor("", 302, {}, "https://evil.example/rss");
    }
    if (url === "https://feeds.bbci.co.uk/news/world/rss.xml") {
      return responseFor(`<?xml version="1.0"?><rss><channel>${[
        ["Senate schedules UAP hearing", "https://www.bbc.com/news/uap"],
        ["NASA launches Europa probe", "https://www.bbc.com/news/europa"],
        ["Senate schedules UAP hearing", "https://www.bbc.com/news/uap?utm_source=rss"]
      ].map(([title, link]) => `<item><title>${title}</title><link>${link}</link><pubDate>Wed, 28 Oct 2026 12:00:00 GMT</pubDate></item>`).join("")}</channel></rss>`);
    }
    throw new Error(`unexpected ${url}`);
  };
  const result = await discoverMatches({catalog, fetcher, now, region: "all"});
  assert.deepEqual(calls.slice().sort(), [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.nasa.gov/news-release/feed/"
  ]);
  assert.equal(calls.some((url) => url.includes("evil.example")), false);
  assert.equal(result.status, "live");
  assert.equal(result.failed[0].error, "fetch_failed");
  assert.deepEqual(result.items.map((item) => item.title), ["Senate schedules UAP hearing"]);
  assert.equal(result.items[0].url, "https://www.bbc.com/news/uap");
});

test("an allowed same-host redirect is fetched once more", async () => {
  const calls = [];
  const source = SOURCE_CATALOG.find((entry) => entry.id === "nasa-releases");
  const fetcher = async (url) => {
    calls.push(url);
    if (calls.length === 1) return responseFor("", 301, {}, "https://www.nasa.gov/news-release/feed/index.xml");
    return responseFor(rss("NASA UAP study update", "https://www.nasa.gov/uap-study"));
  };
  const result = await discoverMatches({catalog: [source], fetcher, now, region: "all"});
  assert.deepEqual(calls, [
    "https://www.nasa.gov/news-release/feed/",
    "https://www.nasa.gov/news-release/feed/index.xml"
  ]);
  assert.equal(result.items[0].title, "NASA UAP study update");
});

test("source and discovery endpoints reject caller-supplied URLs", async () => {
  let called = false;
  const fetcher = async () => { called = true; throw new Error("should not fetch"); };
  const sources = await sourcesApi({request: new Request("https://aurorauap.org/api/sources?url=https://evil.example/rss")});
  assert.equal(sources.status, 400);
  const discovery = await discoveryApi({
    request: new Request("https://aurorauap.org/api/discovery?region=europe&feed=https://evil.example/rss"),
    fetcher
  });
  assert.equal(discovery.status, 400);
  assert.equal(called, false);
  const badRegion = await discoveryApi({request: new Request("https://aurorauap.org/api/discovery?region=moon"), fetcher});
  assert.equal(badRegion.status, 400);
  const ok = await sourcesApi({request: new Request("https://aurorauap.org/api/sources")});
  const body = await ok.json();
  assert.equal(ok.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(body.count, 76);
  assert.equal(body.sources.length, 76);
  assert.ok(body.sources.some((entry) => entry.id === "rfi-afrique"));
  assert.ok(body.sources.some((entry) => entry.id === "premium-times" && entry.country === "NG"));
  assert.ok(body.sources.some((entry) => entry.id === "sabc-news"));
  assert.ok(body.sources.some((entry) => entry.id === "un-news" && entry.region === "global"));
});

test("page and worker agree on region ids", async () => {
  const page = await readFile(join(root, "../sources.js"), "utf8");
  const html = await readFile(join(root, "../sources.html"), "utf8");
  const declared = page.match(/const REGIONS = \[([^\]]+)\]/)[1].match(/"([^"]+)"/g).map((token) => token.slice(1, -1));
  assert.deepEqual(declared, REGIONS);
  for (const region of REGIONS) assert.match(html, new RegExp(`value="${region}"`));
  assert.match(html, /не потвърдени случаи|не е архив на потвърдени случаи/);
  assert.equal(page.includes("innerHTML"), false);
});
