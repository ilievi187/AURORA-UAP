// On-demand diagnostics for the fixed source catalog.
// Callers cannot supply a feed URL. Responses contain counts and provenance,
// never feed bodies or article text. Not wired into functions/api/news.js.

import {titleKey} from "./headline-dedup.js";
import {inspectFeed} from "./feed-parse.js";
import {CATALOG_CHECKED_ON, REGIONS, SOURCE_CATALOG} from "./source-catalog.js";
import {readAllowlistedFeed, selectFeeds} from "./discovery.js";

const RETRYABLE = new Set(["timeout", "network", "server"]);

export async function readFeedWithRetry(source, fetcher, timeoutMs) {
  const first = await readAllowlistedFeed(source, fetcher, timeoutMs);
  if (first.ok || !RETRYABLE.has(first.error)) return {...first, attempts: 1};
  const second = await readAllowlistedFeed(source, fetcher, timeoutMs);
  return {...second, attempts: 2, elapsedMs: first.elapsedMs + second.elapsedMs};
}

function emptyRow(entry, checkedAt) {
  return {
    id: entry.id,
    publisher: entry.publisher,
    feed_host: entry.feed_host,
    availability: "unavailable",
    http_status: 0,
    elapsed_ms: 0,
    attempts: 1,
    format: null,
    accepted: 0,
    duplicate_titles: 0,
    newest: null,
    undated: 0,
    stale: 0,
    future: 0,
    error: "internal",
    checked_at: checkedAt
  };
}

function duplicateTitles(items) {
  const seen = new Set();
  let duplicates = 0;
  for (const item of items) {
    const key = titleKey(item.title);
    if (!key) continue;
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  }
  return duplicates;
}

export async function checkSourceHealth({
  catalog = SOURCE_CATALOG,
  fetcher = fetch,
  now = Date.now(),
  region = "all",
  timeoutMs = 8000
} = {}) {
  if (!REGIONS.includes(region)) throw new Error("invalid_region");
  const selected = selectFeeds(catalog, region);
  const checkedAt = new Date(now).toISOString();
  const settled = await Promise.allSettled(selected.map(async (entry) => {
    const fetched = await readFeedWithRetry(entry, fetcher, timeoutMs);
    const row = {
      ...emptyRow(entry, checkedAt),
      http_status: fetched.status || 0,
      elapsed_ms: fetched.elapsedMs,
      attempts: fetched.attempts,
      error: fetched.ok ? "" : fetched.error
    };
    if (!fetched.ok) return row;
    const report = inspectFeed(fetched.xml, entry, now);
    const newestMs = report.accepted.reduce((max, item) => Math.max(max, Date.parse(item.published) || 0), 0);
    const live = report.format !== "unknown";
    return {
      ...row,
      availability: live ? "live" : "invalid_format",
      format: report.format,
      accepted: report.accepted.length,
      duplicate_titles: duplicateTitles(report.accepted),
      newest: newestMs ? new Date(newestMs).toISOString() : null,
      undated: report.undated,
      stale: report.stale,
      future: report.future,
      error: live ? "" : "format"
    };
  }));
  const sources = settled.map((result, index) => result.status === "fulfilled" ? result.value : emptyRow(selected[index], checkedAt));
  let status = "live";
  if (selected.length === 0) status = "empty_region";
  else if (sources.every((row) => row.availability !== "live")) status = "unavailable";
  return {
    status,
    region,
    checked_on: CATALOG_CHECKED_ON,
    checked: selected.map((entry) => entry.id),
    sources,
    notice: "Feed availability for catalog sources only. Counts are diagnostics, not verified UAP cases or sighting statistics."
  };
}
