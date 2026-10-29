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
  "unbekanntes flugobjekt",
  "unidentifiziertes flugobjekt",
  "objeto voador não identificado",
  "oggetto volante non identificato",
  "неидентифициран",
  "неопознан",
  "未確認飛行"
];
const CYRILLIC_UFO = /(?<![\p{L}\p{N}])нло(?![\p{L}\p{N}])/iu;

export function titleMatchesTopic(title) {
  const text = String(title ?? "").normalize("NFKC").toLocaleLowerCase("en");
  if (LATIN.test(text) || CYRILLIC_UFO.test(text)) return true;
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

async function feedText(source, fetcher, timeoutMs) {
  let url = source.feed_url;
  for (let hop = 0; hop < 2; hop += 1) {
    const response = await fetcher(url, {
      redirect: "manual",
      headers: {Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml"},
      signal: AbortSignal.timeout(timeoutMs)
    });
    const status = Number(response.status);
    if ([301, 302, 303, 307, 308].includes(status)) {
      const next = allowedRedirect(source, response.headers?.get?.("location"), url);
      if (!next || next === url) throw new Error("redirect");
      url = next;
      continue;
    }
    if (!response.ok) throw new Error("status");
    const buffer = typeof response.arrayBuffer === "function"
      ? await response.arrayBuffer()
      : new TextEncoder().encode(await response.text()).buffer;
    if (buffer.byteLength > MAX_FEED_BYTES) throw new Error("size");
    return decodeXmlBytes(buffer, response.headers?.get?.("content-type") || "");
  }
  throw new Error("redirect");
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
    const xml = await feedText(entry, fetcher, timeoutMs);
    return parseFeedXml(xml, entry, now).filter((item) => titleMatchesTopic(item.title));
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
