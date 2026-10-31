import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {dirname, join, resolve, sep} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mime = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml"};

const catalog = {
  status: "catalog",
  checked_on: "2026-10-29",
  count: 2,
  sources: [
    {
      id: "bbc-world",
      publisher: "BBC News",
      homepage: "https://www.bbc.com/news/world",
      feed_url: "https://feeds.bbci.co.uk/news/world/rss.xml",
      format: "rss",
      language: "en",
      country_name: "United Kingdom",
      region: "europe",
      role: "public-broadcaster",
      covers: "BBC News world desk. General international news, not a UAP desk.",
      preview: true,
      note: ""
    },
    {
      id: "bad-source",
      publisher: "Should Not Link",
      homepage: "javascript:alert(1)",
      feed_url: "http://evil.example/rss",
      format: "rss",
      language: "en",
      country_name: "Nowhere",
      region: "americas",
      role: "international-desk",
      covers: "A fixture with unsafe URLs that the page must not follow.",
      preview: false,
      note: "Shown as text only."
    }
  ]
};

function discovery(region) {
  if (region === "americas") {
    return {status: "no_matches", checked: ["bad-source"], failed: [], count: 0, items: []};
  }
  return {
    status: "live",
    checked: ["bbc-world"],
    failed: [{id: "bad-source", error: "fetch_failed"}],
    count: 1,
    items: [{
      title: "Senate schedules UAP hearing",
      url: "https://www.bbc.com/news/uap-hearing",
      source: "BBC News",
      published: "2026-10-28T12:00:00.000Z"
    }]
  };
}

const server = createServer(async (req, res) => {
  const path = decodeURIComponent((req.url || "/").split("?")[0]);
  if (path === "/api/sources") {
    res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"}).end(JSON.stringify(catalog));
    return;
  }
  if (path === "/api/discovery") {
    const region = new URL(req.url, "http://127.0.0.1").searchParams.get("region") || "all";
    res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"}).end(JSON.stringify(discovery(region)));
    return;
  }
  if (path === "/api/source-health") {
    const query = new URL(req.url, "http://127.0.0.1").searchParams;
    if (query.has("url") || query.has("feed")) {
      res.writeHead(400).end();
      return;
    }
    res.writeHead(200, {"Content-Type": "application/json; charset=utf-8"}).end(JSON.stringify({
      status: "live",
      sources: [{
        id: "bbc-world",
        publisher: "BBC News",
        feed_host: "feeds.bbci.co.uk",
        availability: "live",
        http_status: 200,
        elapsed_ms: 120,
        format: "rss",
        accepted: 4,
        duplicate_titles: 1,
        error: ""
      }]
    }));
    return;
  }
  const filename = resolve(join(root, path === "/" ? "index.html" : path.replace(/^\/+/, "")));
  if (filename !== root && !filename.startsWith(root + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const data = await readFile(filename);
    const ext = filename.slice(filename.lastIndexOf("."));
    res.writeHead(200, {"Content-Type": mime[ext] || "application/octet-stream"}).end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const port = server.address().port;
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.AURORA_CHROMIUM || undefined
});

try {
  await test("source directory renders checked publishers and only safe links", async () => {
    const page = await browser.newPage({viewport: {width: 1200, height: 900}, reducedMotion: "reduce"});
    const errors = [];
    const discoveryRegions = [];
    const healthQueries = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/discovery") discoveryRegions.push(url.searchParams.get("region"));
      if (url.pathname === "/api/source-health") healthQueries.push(url.search);
    });
    await page.goto(`http://127.0.0.1:${port}/sources.html`);
    await page.waitForSelector("article h3");
    assert.equal(await page.locator("article h3").nth(0).textContent(), "BBC News");
    assert.equal(await page.locator("article h3").nth(1).textContent(), "Should Not Link");
    const hrefs = await page.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    assert.equal(hrefs.includes("javascript:alert(1)"), false);
    assert.equal(hrefs.some((href) => href && href.startsWith("http://")), false);
    assert.ok(hrefs.includes("https://www.bbc.com/news/world"));
    await page.waitForSelector("#matchList a");
    assert.equal(await page.locator("#matchList a").textContent(), "Senate schedules UAP hearing");
    assert.equal(await page.locator("#matchList a").getAttribute("href"), "https://www.bbc.com/news/uap-hearing");
    assert.match(await page.locator("#matchStatus").textContent(), /Отвори оригиналните публикации/);
    assert.match(await page.locator("#matchStatus").textContent(), /Не отговориха: Should Not Link/);
    await page.locator("#sourceRegion").selectOption("americas");
    await page.waitForFunction(() => document.querySelector("#matchStatus")?.textContent?.includes("Няма съвпадения"));
    assert.equal(await page.locator("#matchList a").count(), 0);
    assert.equal(await page.locator("#sourceList h3").textContent(), "Should Not Link");
    assert.deepEqual(errors, []);
    assert.ok(discoveryRegions.includes("all") && discoveryRegions.includes("americas"));
    assert.equal(healthQueries.length, 0);
    await page.locator("#checkHealth").click();
    await page.waitForSelector("#healthList article");
    assert.match(await page.locator("#healthStatus").textContent(), /1 от 1/);
    assert.match(await page.locator("#healthList").textContent(), /HTTP 200/);
    assert.equal(healthQueries.length, 1);
    assert.equal(healthQueries[0].includes("url="), false);
    assert.equal(healthQueries[0].includes("feed="), false);
    await page.close();
  });

  await test("mobile source directory does not overflow the viewport", async () => {
    const page = await browser.newPage({viewport: {width: 390, height: 844}, reducedMotion: "reduce"});
    await page.goto(`http://127.0.0.1:${port}/sources.html`);
    await page.waitForSelector("#matchList a");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1);
    await page.close();
  });
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
