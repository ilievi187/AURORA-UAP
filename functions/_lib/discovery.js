import {decodeXmlBytes, MAX_XML_CHARS, parseFeedXml, shrinkFeedXml} from "./feed-parse.js";
import {dedupeHeadlines} from "./headline-dedup.js";
import {REGIONS, SOURCE_CATALOG} from "./source-catalog.js";

export const DISCOVERY_FEED_LIMIT = 12;
export const MATCH_LIMIT = 40;
export const MAX_DOWNLOAD_BYTES = 2_000_000;
export const FEED_USER_AGENT = "AURORA-UAP-source-check/1.0 (+https://aurorauap.org/sources)";

const LATIN = /(?<![\p{L}\p{N}])(?:uap|ufo|ovni|aaro)(?![\p{L}\p{N}])/iu;
const PHRASES = [
  "unidentified anomalous",
  "unidentified aerial",
  "unidentified flying",
  "fenómeno anómalo",
  "fenómeno aéreo no identificado",
  "phénomène aérien non identifié",
  "objet volant non identifié",
  "objeto volador no identificado",
  "unbekanntes flugobjekt",
  "unidentifiziertes flugobjekt",
  "objeto voador não identificado",
  "oggetto volante non identificato",
  "niezidentyfikowany obiekt",
  "ongeïdentificeerd vliegend",
  "okänt flygande",
  "tanımlanamayan uçan",
  "ιπτάμενο αντικείμενο",
  "جسم طائر مجهول",
  "неидентифициран",
  "неопознан",
  "未確認飛行",
  "不明飞行物",
  "不明飛行物",
  "미확인비행"
];
const CYRILLIC_UFO = /(?<![\p{L}\p{N}])нло(?![\p{L}\p{N}])/iu;
const RO_UFO = /(?<![\p{L}\p{N}])ozn(?![\p{L}\p{N}])/iu;
const EL_UFO = /(?<![\p{L}\p{N}])ατια(?![\p{L}\p{N}])/iu;

export function titleMatchesTopic(title) {
  const text = String(title ?? "").normalize("NFKC").toLocaleLowerCase("en");
  if (LATIN.test(text) || CYRILLIC_UFO.test(text) || RO_UFO.test(text) || EL_UFO.test(text)) return true;
  return PHRASES.some((phrase) => text.includes(phrase));
}

export function selectFeeds(catalog, region, limit = DISCOVERY_FEED_LIMIT) {
  const rows = (catalog || []).filter((entry) => region === "all" || entry.region === region);
  return rows
    .slice()
    .sort((a, b) => Number(b.preview) - Number(a.preview) || a.priority - b.priority || a.id.localeCompare(b.id))
    .slice(0, limit);
}

function allowedRedirect(source, location, base) {
  let next;
  try { next = new URL(location, base); } catch { return ""; }
  if (next.protocol !== "https:" || next.username || next.password || next.port) return "";
  const allowed = new Set([source.feed_host, ...(source.redirect_hosts || [])]);
  if (!allowed.has(next.hostname.toLowerCase())) return "";
  return next.toString();
}

function failureKind(error) {
  const name = String(error?.name || "");
  if (name === "TimeoutError" || name === "AbortError") return "timeout";
  return "network";
}

export async function readAllowlistedFeed(source, fetcher, timeoutMs) {
  const started = Date.now();
  let url = source.feed_url;
  let status = 0;
  for (let hop = 0; hop < 2; hop += 1) {
    let response;
    try {
      response = await fetcher(url, {
        redirect: "manual",
        headers: {
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
          "User-Agent": FEED_USER_AGENT
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (error) {
      return {ok: false, status: 0, error: failureKind(error), elapsedMs: Date.now() - started, xml: ""};
    }
    status = Number(response.status);
    if ([301, 302, 303, 307, 308].includes(status)) {
      const next = allowedRedirect(source, response.headers?.get?.("location"), url);
      if (!next || next === url) return {ok: false, status, error: "redirect", elapsedMs: Date.now() - started, xml: ""};
      url = next;
      continue;
    }
    if (!response.ok) {
      const error = status >= 500 ? "server" : "status";
      return {ok: false, status, error, elapsedMs: Date.now() - started, xml: ""};
    }
    const buffer = typeof response.arrayBuffer === "function"
      ? await response.arrayBuffer()
      : new TextEncoder().encode(await response.text()).buffer;
    if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
      return {ok: false, status, error: "size", elapsedMs: Date.now() - started, xml: ""};
    }
    let xml = shrinkFeedXml(decodeXmlBytes(buffer, response.headers?.get?.("content-type") || ""));
    if (xml.length > MAX_XML_CHARS) xml = xml.slice(0, MAX_XML_CHARS);
    return {ok: true, status, error: "", elapsedMs: Date.now() - started, xml};
  }
  return {ok: false, status, error: "redirect", elapsedMs: Date.now() - started, xml: ""};
}

const RETRYABLE = new Set(["timeout", "network", "server"]);

export async function readFeedWithRetry(source, fetcher, timeoutMs, maxAttempts = 2) {
  const attempts = Number.isInteger(maxAttempts) && maxAttempts > 0 ? Math.min(2, maxAttempts) : 2;
  const first = await readAllowlistedFeed(source, fetcher, timeoutMs);
  if (first.ok || attempts === 1 || !RETRYABLE.has(first.error)) return {...first, attempts: 1};
  const second = await readAllowlistedFeed(source, fetcher, timeoutMs);
  return {...second, attempts: 2, elapsedMs: first.elapsedMs + second.elapsedMs};
}

export async function discoverMatches({
  catalog = SOURCE_CATALOG,
  fetcher = fetch,
  now = Date.now(),
  region = "all",
  timeoutMs = 8000,
  feedLimit = DISCOVERY_FEED_LIMIT,
  maxConcurrency = DISCOVERY_FEED_LIMIT,
  maxAttempts = 2
} = {}) {
  if (!REGIONS.includes(region)) throw new Error("invalid_region");
  const safeLimit = Number.isInteger(feedLimit) ? Math.max(0, Math.min(DISCOVERY_FEED_LIMIT, feedLimit)) : DISCOVERY_FEED_LIMIT;
  const safeConcurrency = Number.isInteger(maxConcurrency) ? Math.max(1, Math.min(DISCOVERY_FEED_LIMIT, maxConcurrency)) : DISCOVERY_FEED_LIMIT;
  const safeAttempts = Number.isInteger(maxAttempts) && maxAttempts > 0 ? Math.min(2, maxAttempts) : 2;
  const selected = selectFeeds(catalog, region, safeLimit);
  const settled = new Array(selected.length);
  let next = 0;
  const worker = async () => {
    while (true) {
      const index = next++;
      if (index >= selected.length) return;
      try {
        const fetched = await readFeedWithRetry(selected[index], fetcher, timeoutMs, safeAttempts);
        if (!fetched.ok) throw new Error("fetch_failed");
        settled[index] = {status: "fulfilled", value: parseFeedXml(fetched.xml, selected[index], now).filter((item) => titleMatchesTopic(item.title))};
      } catch (reason) {
        settled[index] = {status: "rejected", reason};
      }
    }
  };
  await Promise.all(Array.from({length: Math.min(selected.length, safeConcurrency)}, () => worker()));
  const failed = [];
  const matched = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") matched.push(...result.value);
    else failed.push({id: selected[index].id, error: "fetch_failed"});
  });
  const items = dedupeHeadlines(matched).slice(0, MATCH_LIMIT);
  let status = "live";
  if (selected.length === 0) status = "empty_region";
  else if (failed.length === selected.length) status = "unavailable";
  else if (items.length === 0) status = "no_matches";
  return {
    status,
    region,
    checked_on: "2026-10-29",
    checked: selected.map((entry) => entry.id),
    failed,
    count: items.length,
    items,
    notice: "Keyword matches from official publisher feeds. These are not verified UAP cases and are not evidence of an extraterrestrial explanation."
  };
}
