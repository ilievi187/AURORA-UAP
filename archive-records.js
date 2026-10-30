/* Shared, source-preserving normalization for public historical cases.
 * This file does NOT touch private D1 reports or publication decisions. */
"use strict";
(function (root) {
  const text = (value) => String(value ?? "").trim();
  const title = (item) => text(item.title?.en || item.title?.bg).normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " ");
  const sourceUrl = (item) => {
    const raw = text(item.source?.url || item.provenance?.source_url);
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "https:") return "";
      parsed.hash = "";
      return parsed.toString();
    } catch { return ""; }
  };
  function identity(item) {
    const explicit = text(item.dedup_key);
    if (explicit) return "dedup:" + explicit;
    const url = sourceUrl(item);
    const externalId = text(item.provenance?.source_record_id);
    if (url && externalId) return "record:" + url + "|" + externalId;
    // Same source article, date and normalized case title identifies a repeat
    // without merging distinct incidents mentioned by the same publisher.
    if (url && item.date && title(item)) return "article:" + url + "|" + text(item.date) + "|" + title(item);
    return "local:" + text(item.id);
  }
  function hasCoordinates(item) {
    return Number.isFinite(item?.lat) && Number.isFinite(item?.lng) &&
      Math.abs(item.lat) <= 90 && Math.abs(item.lng) <= 180;
  }
  function prepareArchiveCases(records) {
    const keys = new Set(), ids = new Set(), result = [];
    for (const item of Array.isArray(records) ? records : []) {
      if (!item || typeof item !== "object" || !text(item.id)) continue;
      const key = identity(item), id = text(item.id);
      if (keys.has(key) || ids.has(id)) continue;
      keys.add(key); ids.add(id);
      if (hasCoordinates(item)) result.push({...item});
      else result.push({...item, lat: null, lng: null,
        location_precision: text(item.location_precision) || "Coordinates not published"});
    }
    return result;
  }
  root.AURORA_ARCHIVE = Object.freeze({identity, hasCoordinates, prepareArchiveCases});
})(globalThis);
