import {decodeXmlBytes, parseFeedXml} from "./feed-parse.js";
import {dedupeHeadlines} from "./headline-dedup.js";
import {REGIONS, SOURCE_CATALOG} from "./source-catalog.js";

export const DISCOVERY_FEED_LIMIT = 12;
export const MATCH_LIMIT = 40;
export const MAX_FEED_BYTES = 500_000;

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
        headers: {Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml"},
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
    if (buffer.byteLength > MAX_FEED_BYTES) {
      return {ok: false, status, error: "size", elapsedMs: Date.now() - started, xml: ""};
    }
    return {
      ok: true,
      status,
      error: "",
      elapsedMs: Date.now() - started,
      xml: decodeXmlBytes(buffer, response.headers?.get?.("content-type") || "")
    };
  }
  return {ok: false, status, error: "redirect", elapsedMs: Date.now() - started, xml: ""};
}

export async function discoverMatches({
  catalog = SOURCE_CATALOG,
  fetcher = fetch,
  now = Date.now(),
  region = "all",
  timeoutMs = 8000
} = {}) {
  if (!REGIONS.includes(region)) throw new Error("invalid_region");
  const selected = selectFeeds(catalog, region);
  const settled = await Promise.allSettled(selected.map(async (entry) => {
    const fetched = await readAllowlistedFeed(entry, fetcher, timeoutMs);
    if (!fetched.ok) throw new Error("fetch_failed");
    return parseFeedXml(fetched.xml, entry, now).filter((item) => titleMatchesTopic(item.title));
  }));
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
