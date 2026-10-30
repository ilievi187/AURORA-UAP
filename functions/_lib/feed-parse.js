// Parses RSS 2.0, RSS 1.0/RDF, and Atom from a fixed publisher feed.
// Emits https links on the source's own hosts only.

export const MAX_XML_CHARS = 500_000;
export const MAX_ACCEPTED_ITEMS = 50;
export const MAX_ITEM_AGE_MS = 120 * 24 * 60 * 60 * 1000;
export const MAX_FUTURE_MS = 2 * 24 * 60 * 60 * 1000;

const NAMED = {"&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&nbsp;": " "};

export function decodeXmlText(value) {
  return String(value ?? "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, token) => {
      const code = token[0].toLowerCase() === "x" ? parseInt(token.slice(1), 16) : Number(token);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    })
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, (entity) => NAMED[entity] || entity)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function decodeXmlBytes(buffer, contentType = "") {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  const sniff = new TextDecoder("latin1").decode(bytes.subarray(0, 400));
  const fromXml = sniff.match(/encoding\s*=\s*["']([^"']+)/i)?.[1] || "";
  const fromHeader = String(contentType).match(/charset\s*=\s*["']?([^"';]+)/i)?.[1] || "";
  const declared = (fromXml || fromHeader || "utf-8").toLowerCase();
  const label = /8859-1|latin-?1/.test(declared) ? "latin1" : "utf-8";
  return new TextDecoder(label, {fatal: false}).decode(bytes).replace(/^\uFEFF/, "");
}

function elementText(raw, name) {
  const pattern = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i");
  return raw.match(pattern)?.[1] || "";
}

function atomLink(raw) {
  const tags = [...raw.matchAll(/<link\b[^>]*\/?>/gi)].map((match) => match[0]);
  const links = tags.map((tag) => ({
    href: tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1] || "",
    rel: (tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] || "alternate").toLowerCase()
  })).filter((link) => link.href && !/\b(?:self|hub)\b/.test(link.rel));
  return (links.find((link) => link.rel.split(/\s+/).includes("alternate")) || links[0])?.href || "";
}

function hostAllowed(hostname, hosts) {
  const host = String(hostname || "").toLowerCase();
  return hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

function compactDateMs(value) {
  const match = String(value || "").match(/^(\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!match) return NaN;
  const year = 2000 + Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return NaN;
  return Date.UTC(year, month - 1, day, hour, minute);
}

function publishedMs(raw) {
  for (const name of ["pubDate", "published", "updated", "dc:date"]) {
    const text = decodeXmlText(elementText(raw, name));
    if (!text) continue;
    const parsed = Date.parse(text);
    if (Number.isFinite(parsed)) return parsed;
    const compact = compactDateMs(text);
    if (Number.isFinite(compact)) return compact;
  }
  return NaN;
}

export function shrinkFeedXml(xml) {
  return String(xml || "")
    .replace(/<content:encoded\b[^>]*>[\s\S]*?<\/content:encoded>/gi, "")
    .replace(/<dc:content\b[^>]*>[\s\S]*?<\/dc:content>/gi, "")
    .replace(/<description\b[^>]*>[\s\S]*?<\/description>/gi, "");
}

export function parseFeedXml(xml, source, now = Date.now()) {
  if (typeof xml !== "string" || xml.length === 0 || xml.length > MAX_XML_CHARS) return [];
  if (!/<(?:rss|feed|rdf:RDF)\b/i.test(xml.slice(0, 8000))) return [];
  const hosts = Array.isArray(source?.link_hosts) ? source.link_hosts : [];
  const items = [];
  for (const match of xml.matchAll(/<(item|entry)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    if (items.length >= MAX_ACCEPTED_ITEMS) break;
    const raw = match[3];
    const title = decodeXmlText(elementText(raw, "title")).slice(0, 240);
    let link = decodeXmlText(elementText(raw, "link"));
    if (!/^https?:\/\//i.test(link)) link = decodeXmlText(atomLink(raw));
    if (!/^https?:\/\//i.test(link)) {
      link = decodeXmlText(match[2].match(/\brdf:about\s*=\s*["']([^"']+)["']/i)?.[1] || "");
    }
    if (source?.link_scheme === "upgrade-http" && /^http:\/\//i.test(link)) link = `https://${link.slice(7)}`;
    let url;
    try { url = new URL(link); } catch { continue; }
    if (url.protocol !== "https:" || url.username || url.password || url.port) continue;
    if (!hostAllowed(url.hostname, hosts)) continue;
    const ms = publishedMs(raw);
    if (!Number.isFinite(ms)) continue;
    const age = now - ms;
    if (age > MAX_ITEM_AGE_MS || age < -MAX_FUTURE_MS) continue;
    if (title.length < 8) continue;
    items.push({
      title,
      url: url.toString(),
      source: source.publisher,
      source_id: source.id,
      feed_host: source.feed_host || "",
      published: new Date(ms).toISOString(),
      language: source.language
    });
  }
  return items;
}

export function inspectFeed(xml, source, now = Date.now()) {
  const text = typeof xml === "string" ? xml : "";
  const sample = text.slice(0, 8000);
  const format = /<rdf:RDF\b/i.test(sample) ? "rdf" : /<feed\b/i.test(sample) ? "atom" : /<rss\b/i.test(sample) ? "rss" : "unknown";
  const accepted = format === "unknown" ? [] : parseFeedXml(text, source, now);
  let undated = 0;
  let stale = 0;
  let future = 0;
  let seen = 0;
  if (format !== "unknown") {
    for (const match of text.matchAll(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi)) {
      if (seen >= 80) break;
      seen += 1;
      const ms = publishedMs(match[0]);
      if (!Number.isFinite(ms)) {
        undated += 1;
        continue;
      }
      const age = now - ms;
      if (age > MAX_ITEM_AGE_MS) stale += 1;
      else if (age < -MAX_FUTURE_MS) future += 1;
    }
  }
  return {format, accepted, undated, stale, future};
}
