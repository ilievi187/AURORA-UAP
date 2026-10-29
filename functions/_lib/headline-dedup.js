// Title/URL dedup for headlines already parsed from fixed feeds.
// Keeps a direct publisher URL ahead of a news.google.com wrapper when both
// describe the same story. Does not invent or merge unrelated headlines.

const TRACKING_KEYS = new Set([
  "fbclid", "gclid", "mc_cid", "mc_eid", "igshid", "traffic_source", "maca", "ncmp", "cmp", "ref_src"
]);

export function titleKey(title) {
  const lower = String(title ?? "").normalize("NFKC").toLocaleLowerCase("en");
  const folded = lower.replace(/\p{Script=Latin}+/gu, (word) => word.normalize("NFKD").replace(/\p{M}+/gu, ""));
  return folded.replace(/[^\p{L}\p{N}]+/gu, "").slice(0, 150);
}

export function urlKey(value) {
  let url;
  try {
    url = new URL(String(value));
  } catch {
    return "";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "";
  url.hash = "";
  const kept = [];
  for (const [key, val] of url.searchParams.entries()) {
    const name = key.toLowerCase();
    if (name.startsWith("utm_") || TRACKING_KEYS.has(name)) continue;
    if (name === "ref" && String(val).toLowerCase() === "rss") continue;
    kept.push([key, val]);
  }
  kept.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  url.search = "";
  for (const [key, val] of kept) url.searchParams.append(key, val);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "") || "/";
  return `${url.protocol}//${host}${path}${url.search}`;
}

function rank(item) {
  let host = "";
  let params = 99;
  try {
    const url = new URL(item.url);
    host = url.hostname.toLowerCase();
    params = [...url.searchParams.keys()].length;
  } catch { /* unusable urls sort last */ }
  return {direct: host === "news.google.com" ? 0 : 1, params, published: Date.parse(item?.published) || 0};
}

export function dedupeHeadlines(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const ranked = items.map((item, index) => ({item, index})).sort((a, b) => {
    const left = rank(a.item);
    const right = rank(b.item);
    if (left.direct !== right.direct) return right.direct - left.direct;
    if (left.params !== right.params) return left.params - right.params;
    if (left.published !== right.published) return right.published - left.published;
    return a.index - b.index;
  });
  const seenTitle = new Set();
  const seenUrl = new Set();
  const kept = [];
  for (const {item} of ranked) {
    const title = titleKey(item?.title);
    const url = urlKey(item?.url);
    if (!title && !url) continue;
    if ((title && seenTitle.has(title)) || (url && seenUrl.has(url))) continue;
    if (title) seenTitle.add(title);
    if (url) seenUrl.add(url);
    kept.push(item);
  }
  return kept.sort((a, b) => (Date.parse(b.published) || 0) - (Date.parse(a.published) || 0));
}
