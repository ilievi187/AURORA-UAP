const localizedValues = (value) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(localizedValues);
  if (value && typeof value === "object") return Object.values(value).flatMap(localizedValues);
  return [];
};

const normalize = (value, language = 'en') => {
  let lowered;
  try { lowered = String(value ?? '').toLocaleLowerCase(language); }
  catch { lowered = String(value ?? '').toLowerCase(); }
  return lowered.normalize('NFD').replace(/\p{Diacritic}/gu, '');
};

const regionDisplays = new Map();
const normalizedRecords = new WeakMap();
const regionName = (code, language) => {
  try {
    if (!regionDisplays.has(language)) regionDisplays.set(language, new Intl.DisplayNames([language, "en"], { type: "region" }));
    return regionDisplays.get(language).of(code) ?? "";
  } catch {
    return "";
  }
};

const searchableText = (item, language) => {
  let byLocale = normalizedRecords.get(item);
  if (!byLocale) { byLocale = new Map(); normalizedRecords.set(item, byLocale); }
  if (!byLocale.has(language)) {
    byLocale.set(language, normalize([
      item.id, item.date, item.country, regionName(item.country, language), ...localizedValues(item.region), item.category, item.status,
      ...localizedValues(item.title), ...localizedValues(item.city),
      ...localizedValues(item.summary), ...localizedValues(item.source?.name),
      ...(item.media ?? []).flatMap((media) => localizedValues(media.title))
    ].join(' '), language));
  }
  return byLocale.get(language);
};

export function filterCases(cases, { query = "", country = "", year = "", category = "", language = "en" } = {}) {
  const needle = normalize(query.trim(), language);
  return cases.filter((item) => {
    if (country && item.country !== country) return false;
    if (year && !String(item.date ?? "").startsWith(year)) return false;
    if (category && category !== "all" && item.category !== category) return false;
    if (!needle) return true;
    return searchableText(item, language).includes(needle);
  }).sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")) || String(a.id).localeCompare(String(b.id)));
}

export function hasCoordinates(item) {
  return Number.isFinite(item?.lat) && Number.isFinite(item?.lng) &&
    Math.abs(item.lat) <= 90 && Math.abs(item.lng) <= 180;
}

export function clusterMarkers(cases, { width, height, zoom = 1, radius = 42 } = {}) {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) return [];
  const scale = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const cellSize = Number.isFinite(radius) && radius > 0 ? radius : 42;
  const cells = new Map();
  for (const item of cases) {
    if (!hasCoordinates(item)) continue;
    const x = (item.lng + 180) / 360 * width;
    const y = (90 - item.lat) / 180 * height;
    const cellX = Math.floor(x * scale / cellSize);
    const cellY = Math.floor(y * scale / cellSize);
    const id = `${cellX}:${cellY}`;
    let cell = cells.get(id);
    if (!cell) {
      cell = { id, cases: [], x: 0, y: 0 };
      cells.set(id, cell);
    }
    cell.cases.push(item);
    cell.x += x;
    cell.y += y;
  }
  // The caller supplies date-sorted cases; preserve their order to keep grouping O(n).
  return [...cells.values()].map((cell) => ({
    id: cell.id,
    cases: cell.cases,
    count: cell.cases.length,
    left: cell.x / cell.cases.length / width * 100,
    top: cell.y / cell.cases.length / height * 100
  }));
}
