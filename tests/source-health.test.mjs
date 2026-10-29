import test from "node:test";
import assert from "node:assert/strict";
import {inspectFeed} from "../functions/_lib/feed-parse.js";
import {SOURCE_CATALOG} from "../functions/_lib/source-catalog.js";
import {checkSourceHealth} from "../functions/_lib/source-health.js";
import {onRequestGet as healthApi} from "../functions/api/source-health.js";

const now = Date.parse("2026-10-29T12:00:00.000Z");
const source = SOURCE_CATALOG.find((entry) => entry.id === "bbc-world");

function responseFor(body, status = 200, headers = {}) {
  return new Response(body, {status, headers});
}

function rss(items) {
  const body = items.map((item) => `<item><title>${item.title}</title><link>${item.link}</link><pubDate>${item.pubDate}</pubDate></item>`).join("");
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Fixture</title>${body}</channel></rss>`;
}

const liveFeed = rss([
  {title: "Senate schedules UAP hearing", link: "https://www.bbc.com/news/uap", pubDate: "Wed, 28 Oct 2026 12:00:00 GMT"},
  {title: "Senate schedules UAP hearing", link: "https://www.bbc.com/news/uap-copy", pubDate: "Wed, 28 Oct 2026 11:00:00 GMT"},
  {title: "Old UAP hearing archive", link: "https://www.bbc.com/news/old", pubDate: "Mon, 01 Jun 2026 12:00:00 GMT"},
  {title: "Undated UAP hearing note", link: "https://www.bbc.com/news/undated", pubDate: "not-a-date"}
]);

test("feed inspection reports format, duplicates, and date problems", () => {
  const report = inspectFeed(liveFeed, source, now);
  assert.equal(report.format, "rss");
  assert.equal(report.accepted.length, 2);
  assert.equal(report.stale, 1);
  assert.equal(report.undated, 1);
  const future = rss([{title: "Future UAP hearing date", link: "https://www.bbc.com/news/future", pubDate: "Mon, 11 Jan 2027 12:00:00 GMT"}]);
  assert.equal(inspectFeed(future, source, now).future, 1);
  assert.equal(inspectFeed("<html><title>not a feed</title></html>", source, now).format, "unknown");
  assert.equal(inspectFeed(`<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><item rdf:about="https://www.bbc.com/rdf"><title>UAP hearing opens</title><link>https://www.bbc.com/rdf</link><dc:date>2026-10-28T12:00:00Z</dc:date></item></rdf:RDF>`, source, now).format, "rdf");
});

test("health retries one timeout or server error and does not retry a 404", async () => {
  const calls = [];
  const fetcher = async () => {
    calls.push("bbc");
    if (calls.length === 1) {
      const error = new Error("timed out");
      error.name = "TimeoutError";
      throw error;
    }
    return responseFor(liveFeed);
  };
  const retried = await checkSourceHealth({catalog: [source], fetcher, now, region: "all"});
  assert.equal(calls.length, 2);
  assert.equal(retried.status, "live");
  assert.equal(retried.sources[0].attempts, 2);
  assert.equal(retried.sources[0].availability, "live");
  assert.equal(retried.sources[0].duplicate_titles, 1);
  assert.equal(retried.sources[0].stale, 1);
  assert.equal(JSON.stringify(retried).includes("<rss"), false);
  assert.equal(Object.hasOwn(retried.sources[0], "xml"), false);

  let denied = 0;
  const missing = await checkSourceHealth({
    catalog: [source],
    fetcher: async () => {
      denied += 1;
      return responseFor("missing", 404);
    },
    now,
    region: "all"
  });
  assert.equal(denied, 1);
  assert.equal(missing.status, "unavailable");
  assert.equal(missing.sources[0].http_status, 404);
  assert.equal(missing.sources[0].availability, "unavailable");

  let servers = 0;
  const recovered = await checkSourceHealth({
    catalog: [source],
    fetcher: async () => {
      servers += 1;
      if (servers === 1) return responseFor("down", 503);
      return responseFor(liveFeed);
    },
    now,
    region: "all"
  });
  assert.equal(servers, 2);
  assert.equal(recovered.sources[0].http_status, 200);
});

test("health stays inside the twelve-feed window and rejects caller URLs", async () => {
  let called = false;
  const fetcher = async () => {
    called = true;
    throw new Error("should not fetch");
  };
  const blocked = await healthApi({
    request: new Request("https://aurorauap.org/api/source-health?region=europe&url=https://evil.example/rss"),
    fetcher
  });
  assert.equal(blocked.status, 400);
  assert.equal(called, false);
  const badRegion = await healthApi({request: new Request("https://aurorauap.org/api/source-health?region=moon"), fetcher});
  assert.equal(badRegion.status, 400);

  const checked = await checkSourceHealth({
    catalog: SOURCE_CATALOG,
    fetcher: async () => responseFor(liveFeed),
    now,
    region: "all"
  });
  assert.equal(checked.checked.length, 12);
  assert.equal(checked.sources.length, 12);
  assert.equal(checked.sources.some((row) => row.feed_host.includes("evil.example")), false);

  const response = await healthApi({
    request: new Request("https://aurorauap.org/api/source-health?region=global"),
    fetcher: async (url) => {
      assert.equal(String(url).includes("evil.example"), false);
      return responseFor(liveFeed);
    }
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=120");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.ok(body.checked.includes("un-news"));
  assert.ok(body.checked.length <= 12);
});
