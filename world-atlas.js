import { clusterMarkers, filterCases, hasCoordinates, mapPrecision, markerDensityTier } from './world-atlas-model.js';
import { labels } from './world-atlas-labels.js';
import { caseTextLanguage as resolvedCaseTextLanguage, translationDisclosure } from './archive-localization.js';

const byId = (id) => document.getElementById(id);
const ui = {
  canvas: byId('worldMapCanvas'),
  viewport: byId('worldMapViewport'),
  surface: byId('worldMapSurface'),
  pins: byId('worldMapPins'),
  bulkPins: byId('worldBulkPins'),
  countryLinks: byId('worldCountryLinks'),
  detail: byId('worldCaseDetail'),
  count: byId('worldMapCount'),
  countLabel: byId('worldMapCountLabel'),
  summary: byId('worldMapSummary'),
  resultsHeading: byId('worldResultsHeading'),
  results: byId('worldMapResults'),
  status: byId('worldMapState'),
  filters: document.querySelector('.world-atlas-filters'),
  search: byId('worldSearch'),
  country: byId('worldCountry'),
  year: byId('worldYear'),
  category: byId('worldCategory'),
  zoomIn: byId('worldZoomIn'),
  zoomOut: byId('worldZoomOut'),
  zoomReset: byId('worldZoomReset'),
  zoomLevel: byId('worldZoomLevel'),
  controls: document.querySelector('.world-map-controls'),
  help: byId('worldMapHelp')
};

if (!ui.canvas || !ui.viewport || !ui.surface || !ui.pins) throw new Error('World atlas markup is incomplete');
const context = ui.canvas.getContext('2d');
if (!context) throw new Error('World atlas canvas is unavailable');

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 500;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const RESULTS_PAGE_SIZE = 10;
const deg = Math.PI / 180;
ui.canvas.width = MAP_WIDTH;
ui.canvas.height = MAP_HEIGHT;

let baseCases = [];
let approvedCases = [];
let sourceAnchors = [];
let sourceCountryCounts = [];
let cases = [];
let filtered = [];
let land = [];
let selected = null;
let dataReady = false;
let archiveFailed = false;
let registryIncomplete = false;
let resultsStart = 0;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let drag = null;


const language = () => document.documentElement.lang || 'en';
const t = (key) => labels[language()]?.[key] || labels.en[key] || key;
const localized = (value) => {
  if (typeof value === 'string') return value;
  return value?.[language()] || value?.en || value?.bg || '';
};
const caseDisplayLanguage = (item) => resolvedCaseTextLanguage(item, language());
const caseText = (item, field) => {
  const value = item?.[field];
  if (typeof value === 'string') return value;
  const locale = caseDisplayLanguage(item);
  return value?.[locale] || value?.en || value?.bg || '';
};
const needsTranslationDisclosure = (item) => language() !== 'en' && caseDisplayLanguage(item) !== language();
const precisionLabelKeys = {
  exact: 'precisionExact',
  approx_city: 'precisionApproxCity',
  approx_region: 'precisionApproxRegion',
  approx_country: 'precisionApproxCountry'
};
const precisionLabel = (kind) => t(precisionLabelKeys[kind] || 'notMapped');
const precisionNote = (item) => {
  const kind = mapPrecision(item);
  if (kind === 'unmapped') return t('notMapped');
  const detail = language() === 'bg' && item.location_precision_bg
    ? item.location_precision_bg
    : item.location_precision;
  return `${precisionLabel(kind)}${detail ? ` · ${localized(detail)}` : ''}`;
};
const safeUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
};
const validRecord = (item) => typeof item?.id === 'string' &&
  Boolean(item.title?.en && item.summary?.en && safeUrl(item.source?.url)) &&
  ((item.lat == null && item.lng == null) || hasCoordinates(item));

function categoryName(category) {
  if (category === 'lights') return t('lights');
  if (category === 'object') return t('objects');
  if (category === 'instrument') return t('instrument');
  if (category === 'other') return t('other');
  return category || '';
}

/* Photographic, locally hosted equirectangular Earth textures. The pins keep their
 * existing geographic projection; this is visual imagery, not a realtime scan.
 * Any texture failure falls back to honest land outlines, never a blank map. */
const satellite = { night: null, day: null, clouds: null };
const SATELLITE_TEXTURES = [
  ['night', '/assets/earth/earth-night-4096.jpg'],
  ['day', '/assets/earth/earth-day-4096.jpg'],
  ['clouds', '/assets/earth/earth-clouds-1024.png']
];
for (const [name, src] of SATELLITE_TEXTURES) {
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => { satellite[name] = image; paint(land); };
  image.onerror = () => { console.warn('AURORA atlas: optional satellite texture unavailable', name); };
  image.src = src;
}

function paint(polygons) {
  context.save();
  // The black-space background is deliberately quiet: no neon cartographic fill.
  const backdrop = context.createLinearGradient(0, 0, MAP_WIDTH, MAP_HEIGHT);
  backdrop.addColorStop(0, '#010408');
  backdrop.addColorStop(.48, '#06111b');
  backdrop.addColorStop(1, '#010307');
  context.fillStyle = backdrop;
  context.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  if (satellite.night) {
    // Geographic texture first, then night lights as additive luminance.
    // Use the same -180..180 equirectangular projection as the real case pins.
    // This deliberately brightens geography without turning the sea cyan.
    if (satellite.day) {
      context.globalAlpha = .84;
      context.filter = 'brightness(.65) contrast(1.15) saturate(.48)';
      context.drawImage(satellite.day, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    }
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = .98;
    context.filter = 'brightness(1.55) contrast(1.1) saturate(.78)';
    context.drawImage(satellite.night, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    context.globalCompositeOperation = 'source-over';
    if (satellite.clouds) {
      context.globalAlpha = .13;
      context.filter = 'brightness(.88) contrast(1.08)';
      context.drawImage(satellite.clouds, 0, 0, MAP_WIDTH, MAP_HEIGHT);
    }
    context.globalAlpha = 1;
    context.filter = 'none';
  } else {
    // Offline image fallback: country/land contours remain usable but understated.
    context.fillStyle = '#09141f';
    context.strokeStyle = '#5c7d934a';
    context.lineWidth = .65;
    for (const polygon of polygons) {
      if (!Array.isArray(polygon) || polygon.length < 3) continue;
      let previousX = null;
      let started = false;
      context.beginPath();
      for (const point of polygon) {
        if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) continue;
        const x = (point[0] + 180) / 360 * MAP_WIDTH;
        const y = (90 - point[1]) / 180 * MAP_HEIGHT;
        if (previousX !== null && Math.abs(x - previousX) > MAP_WIDTH / 2) {
          context.closePath(); context.fill(); context.stroke(); context.beginPath(); started = false;
        }
        if (!started) { context.moveTo(x, y); started = true; }
        else context.lineTo(x, y);
        previousX = x;
      }
      if (started) { context.closePath(); context.fill(); context.stroke(); }
    }
  }

  // Subtle orbital instrumentation. It follows the same projection as the image.
  context.lineWidth = .55;
  for (let x = 0; x <= MAP_WIDTH; x += 100) {
    context.strokeStyle = x === MAP_WIDTH / 2 ? '#b2d3e32c' : '#84b6d718';
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, MAP_HEIGHT); context.stroke();
  }
  for (let y = 0; y <= MAP_HEIGHT; y += 50) {
    context.strokeStyle = y === MAP_HEIGHT / 2 ? '#b2d3e32c' : '#84b6d718';
    context.beginPath(); context.moveTo(0, y); context.lineTo(MAP_WIDTH, y); context.stroke();
  }
  const atmosphere = context.createRadialGradient(500, 225, 60, 500, 225, 620);
  atmosphere.addColorStop(0, '#203e4b00');
  atmosphere.addColorStop(.58, '#07131e1c');
  atmosphere.addColorStop(1, '#01030566');
  context.fillStyle = atmosphere;
  context.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  const horizon = context.createLinearGradient(0, 0, 0, MAP_HEIGHT);
  horizon.addColorStop(0, '#01030739');
  horizon.addColorStop(.14, '#01030710');
  horizon.addColorStop(.8, '#01030710');
  horizon.addColorStop(1, '#01030758');
  context.fillStyle = horizon;
  context.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  context.restore();
}

function clampPan() {
  const width = ui.surface.clientWidth || MAP_WIDTH;
  const height = ui.surface.clientHeight || MAP_HEIGHT;
  const maxX = width * (zoom - 1) / 2;
  const maxY = height * (zoom - 1) / 2;
  offsetX = Math.max(-maxX, Math.min(maxX, offsetX));
  offsetY = Math.max(-maxY, Math.min(maxY, offsetY));
}

function applyViewport() {
  clampPan();
  ui.viewport.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
  ui.surface.classList.toggle('is-zoomed', zoom > 1);
  ui.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
  ui.zoomIn.disabled = zoom >= MAX_ZOOM;
  ui.zoomOut.disabled = zoom <= MIN_ZOOM;
}

function renderDetails(item) {
  ui.detail.replaceChildren();
  if (!item) {
    const empty = document.createElement('p');
    empty.className = 'world-empty-detail';
    empty.textContent = filtered.length ? '' : t('noResults');
    ui.detail.append(empty);
    return;
  }
  const tag = document.createElement('span');
  tag.className = 'world-tag';
  tag.textContent = [item.country, item.date, categoryName(item.category)].filter(Boolean).join(' · ');
  const heading = document.createElement('h3');
  heading.textContent = caseText(item, 'title');
  const place = document.createElement('p');
  place.className = 'world-case-place';
  place.textContent = `${localized(item.city) || t('unknownLocation')}${item.country ? ` · ${item.country}` : ''}`;
  const summary = document.createElement('p');
  summary.className = 'world-case-summary';
  summary.textContent = caseText(item, 'summary');
  ui.detail.append(tag, heading, place, summary);
  if (needsTranslationDisclosure(item)) {
    const disclosure = document.createElement('small');
    disclosure.className = 'world-translation-disclosure';
    disclosure.setAttribute('role', 'note');
    disclosure.textContent = translationDisclosure(language());
    ui.detail.append(disclosure);
  }
  const precision = document.createElement('p');
  precision.className = 'world-location-note';
  precision.textContent = precisionNote(item);
  ui.detail.append(precision);
  const dossier = document.createElement('a');
  dossier.href = (item.recordOrigin === 'd1' ? '/cases/' : '/archive/') + encodeURIComponent(item.id);
  dossier.textContent = t('readCase');
  ui.detail.append(dossier);

  if (safeUrl(item.source?.url)) {
    const source = document.createElement('a');
    source.href = item.source.url;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = `${t('originalSource')}${item.source.name ? ` · ${item.source.name}` : ''}`;
    ui.detail.append(source);
  }
  const media = (Array.isArray(item.media) ? item.media : []).filter((entry) => safeUrl(entry?.url));
  if (media.length) {
    const title = document.createElement('h4');
    title.className = 'world-media-heading';
    title.textContent = t('media');
    const list = document.createElement('ul');
    list.className = 'world-media-links';
    for (const entry of media) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = entry.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `${entry.type ? `${entry.type} · ` : ''}${localized(entry.title) || t('originalSource')}`;
      li.append(link);
      list.append(li);
    }
    ui.detail.append(title, list);
  }
}

function selectCase(id) {
  const item = filtered.find((entry) => entry.id === id);
  if (!item) return;
  selected = item.id;
  const selectedIndex = filtered.findIndex((entry) => entry.id === selected);
  const resultsNeedPageChange = selectedIndex >= 0 && (selectedIndex < resultsStart || selectedIndex >= resultsStart + RESULTS_PAGE_SIZE);
  if (resultsNeedPageChange) resultsStart = Math.floor(selectedIndex / RESULTS_PAGE_SIZE) * RESULTS_PAGE_SIZE;
  renderDetails(item);
  if (resultsNeedPageChange) renderResults();
  renderResultsSelection();
  renderPins();
  renderSourcePins();
}

function renderResultsSelection() {
  for (const button of ui.results.querySelectorAll('[data-world-case-id]')) {
    button.setAttribute('aria-current', String(button.dataset.worldCaseId === selected));
  }
}

function renderResults() {
  ui.results.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('li');
    empty.className = 'world-no-results';
    empty.textContent = t('noResults');
    ui.results.append(empty);
    return;
  }
  const visible = filtered.slice(resultsStart, resultsStart + RESULTS_PAGE_SIZE);
  for (const item of visible) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'world-result';
    button.dataset.worldCaseId = item.id;
    button.setAttribute('aria-current', String(item.id === selected));
    const meta = document.createElement('span');
    meta.className = 'world-result-meta';
    meta.textContent = [item.date, item.country, categoryName(item.category)].filter(Boolean).join(' · ');
    const title = document.createElement('strong');
    title.textContent = caseText(item, 'title');
    const location = document.createElement('span');
    location.className = 'world-result-place';
    location.textContent = localized(item.city) || t('unknownLocation');
    button.append(meta, title, location);
    if (needsTranslationDisclosure(item)) {
      const disclosure = document.createElement('small');
      disclosure.className = 'world-result-language';
      disclosure.textContent = translationDisclosure(language());
      button.append(disclosure);
    }
    const precision = document.createElement('span');
    const precisionKind = mapPrecision(item);
    precision.className = precisionKind === 'unmapped' ? 'world-result-unknown' : 'world-result-place world-result-precision';
    precision.textContent = precisionKind === 'unmapped' ? t('notMapped') : precisionLabel(precisionKind);
    button.append(precision);
    button.addEventListener('click', () => selectCase(item.id));
    row.append(button);
    ui.results.append(row);
  }
  if (filtered.length > RESULTS_PAGE_SIZE) {
    const row = document.createElement('li');
    row.className = 'world-results-pagination';
    const pager = document.createElement('div');
    pager.className = 'world-results-pager';
    pager.setAttribute('role', 'group');
    pager.setAttribute('aria-label', t('results'));
    if (resultsStart > 0) {
      const previous = document.createElement('button');
      previous.id = 'worldResultsPrevious';
      previous.type = 'button';
      previous.className = 'world-page-button';
      previous.textContent = t('previousPage');
      previous.setAttribute('aria-controls', 'worldMapResults');
      previous.addEventListener('click', () => {
        resultsStart = Math.max(0, resultsStart - RESULTS_PAGE_SIZE);
        renderResults();
        renderResultsSelection();
        focusResultPager('worldResultsPrevious');
      });
      pager.append(previous);
    }
    const range = document.createElement('span');
    range.className = 'world-results-range';
    range.textContent = `${resultsStart + 1}–${Math.min(resultsStart + RESULTS_PAGE_SIZE, filtered.length)} / ${filtered.length}`;
    pager.append(range);
    // Jump directly between numbered pages instead of requiring 10+ Next clicks.
    const pages = Math.ceil(filtered.length / RESULTS_PAGE_SIZE);
    const active = Math.floor(resultsStart / RESULTS_PAGE_SIZE);
    const first = Math.max(0, Math.min(active - 3, pages - 7));
    for (let page = first; page < Math.min(pages, first + 7); page++) {
      const jump = document.createElement('button');
      jump.type = 'button';
      jump.className = 'world-page-button world-page-number';
      jump.dataset.page = String(page + 1);
      jump.textContent = String(page + 1);
      jump.setAttribute('aria-label', 'Page ' + (page + 1) + ' of ' + pages);
      jump.setAttribute('aria-current', page === active ? 'page' : 'false');
      jump.setAttribute('aria-controls', 'worldMapResults');
      jump.addEventListener('click', () => {
        resultsStart = page * RESULTS_PAGE_SIZE;
        renderResults();
        renderResultsSelection();
        ui.results.querySelector('[data-page="' + (page + 1) + '"]')?.focus();
      });
      pager.append(jump);
    }
    if (resultsStart + RESULTS_PAGE_SIZE < filtered.length) {
      const next = document.createElement('button');
      next.id = 'worldResultsNext';
      next.type = 'button';
      next.className = 'world-page-button';
      next.textContent = t('nextPage');
      next.setAttribute('aria-controls', 'worldMapResults');
      next.addEventListener('click', () => {
        resultsStart = Math.min(resultsStart + RESULTS_PAGE_SIZE, Math.floor((filtered.length - 1) / RESULTS_PAGE_SIZE) * RESULTS_PAGE_SIZE);
        renderResults();
        renderResultsSelection();
        focusResultPager('worldResultsNext');
      });
      pager.append(next);
    }
    row.append(pager);
    ui.results.append(row);
  }
}

function focusResultPager(preferredId) {
  const fallbackId = preferredId === 'worldResultsNext' ? 'worldResultsPrevious' : 'worldResultsNext';
  (document.getElementById(preferredId) || document.getElementById(fallbackId))?.focus();
}

function countryDisplayName(code) {
  try { return new Intl.DisplayNames([language(), 'en'], { type: 'region' }).of(code) || code; }
  catch { return code; }
}

// The supplementary layer contains 2,715 sourced GEIPAN city-level geographic
// reference points. They are grouped by country before spatial clustering;
// no Blue Book file is assigned a fabricated event coordinate.
function renderSourcePins() {
  if (!ui.bulkPins) return;
  const width = ui.surface.clientWidth || MAP_WIDTH;
  const height = ui.surface.clientHeight || MAP_HEIGHT;
  const chosen = ui.country.value;
  const year = ui.year.value;
  const countryGroups = new Map();
  for (const point of sourceAnchors) {
    if (chosen && point.country !== chosen) continue;
    if (year && !String(point.date).startsWith(year)) continue;
    if (!countryGroups.has(point.country)) countryGroups.set(point.country, []);
    countryGroups.get(point.country).push(point);
  }
  ui.bulkPins.replaceChildren();
  const fragment = document.createDocumentFragment();
  const allClusters = [];
  for (const [code, items] of countryGroups) {
    for (const cluster of clusterMarkers(items, { width, height, zoom, radius: 38 }))
      allClusters.push({code,cluster});
  }
  // Monaco, Switzerland and France have nearby city anchors. Without a
  // display-only offset, one country can physically obscure another's link.
  // Preserve the actual coordinates in source data; move only the drawn circles.
  allClusters.sort((a,b)=>b.cluster.count-a.cluster.count||a.code.localeCompare(b.code));
  const occupied = [];
  function place(left,top){
    const originalX=left/100*width,originalY=top/100*height;
    for(const distance of [0,26,47,68,89,110]){
      const steps=distance===0?1:24;
      for(let k=0;k<steps;k++){
        const angle=k/steps*Math.PI*2;
        const x=Math.max(19,Math.min(width-19,originalX+Math.cos(angle)*distance));
        const y=Math.max(19,Math.min(height-19,originalY+Math.sin(angle)*distance));
        if(occupied.every(p=>Math.hypot(p.x-x,p.y-y)>=39)){
          occupied.push({x,y});return {left:x/width*100,top:y/height*100,shift:distance};
        }
      }
    }
    occupied.push({x:originalX,y:originalY});
    return {left,top,shift:0};
  }
  for (const {code,cluster} of allClusters) {
      const marker=place(cluster.left,cluster.top);
      const link = document.createElement('a');
      link.className = 'world-source-marker density-' + markerDensityTier(cluster.count);
      link.href = '/countries/' + encodeURIComponent(code);
      link.dataset.country = code;
      link.dataset.geoCount = String(cluster.count);
      link.dataset.anchorShift = String(marker.shift);
      link.style.left = marker.left + '%';
      link.style.top = marker.top + '%';
      link.textContent = ''; // Density is conveyed by size and color, not numeric bubbles.
      const note=marker.shift ? ' · Marker offset for visibility' : '';
      link.title = countryDisplayName(code) + ' · ' + cluster.count +
        ' approximate city source records · Open country dossiers' + note;
      link.setAttribute('aria-label', 'Open ' + countryDisplayName(code) + ' dossiers · ' +
        cluster.count + ' approximate source locations');
      fragment.append(link);
  }
  ui.bulkPins.append(fragment);
}

async function loadSourceNavigation() {
  try {
    const [geoResponse,countryResponse] = await Promise.all([
      fetch('/data/bulk/geo-points.json',{cache:'no-cache'}),
      fetch('/data/bulk/countries.json',{cache:'no-cache'})
    ]);
    if (!geoResponse.ok || !countryResponse.ok) return;
    const [geo,landCounts] = await Promise.all([geoResponse.json(),countryResponse.json()]);
    if (!Array.isArray(geo.points) || geo.points.length > 10000 ||
        !Array.isArray(landCounts.countries) || landCounts.countries.length > 250) return;
    sourceAnchors = geo.points.filter(point => /^[A-Z]{2}$/.test(point?.country||'') &&
      point.precision === 'city' && hasCoordinates(point));
    sourceCountryCounts = landCounts.countries.filter(entry => /^[A-Z]{2}$/.test(entry?.code||'') &&
      Number.isSafeInteger(entry.count) && entry.count > 0);
    renderSourcePins();
    if (language() === 'en') ui.countLabel.textContent = 'CURATED CASES';
    if (ui.countryLinks) {
      ui.countryLinks.replaceChildren();
      const caption = document.createElement('span');
      caption.textContent = sourceAnchors.length.toLocaleString(language()) +
        ' approximate city anchors · Open country dossiers:';
      ui.countryLinks.append(caption);
      for (const record of sourceCountryCounts.slice(0,6)) {
        const a=document.createElement('a');
        a.href='/countries/'+record.code;
        a.textContent=countryDisplayName(record.code)+' · '+record.count.toLocaleString(language());
        ui.countryLinks.append(a);
      }
      const all=document.createElement('a');
      all.href='/countries.html';all.textContent='ALL COUNTRIES ↗';ui.countryLinks.append(all);
    }
  } catch(error) {
    console.warn('Supplementary source map unavailable; curated markers remain visible',error);
  }
}

function renderPins() {
  const mapHadFocus = ui.pins.contains(document.activeElement);
  const focusedCaseId = mapHadFocus
    ? (document.activeElement.dataset.selectedCaseId || document.activeElement.dataset.markerCaseId)
    : null;
  const width = ui.surface.clientWidth || MAP_WIDTH;
  const height = ui.surface.clientHeight || MAP_HEIGHT;
  const clusters = [];
  const byCountry = new Map();
  for (const entry of filtered) {
    const code = /^[A-Z]{2}$/.test(entry.country || '') && entry.country !== 'XZ'
      ? entry.country : '__UNLOCATED_COUNTRY__';
    if (!byCountry.has(code)) byCountry.set(code, []);
    byCountry.get(code).push(entry);
  }
  for (const [country, countryCases] of byCountry) {
    for (const cluster of clusterMarkers(countryCases, { width, height, zoom, radius: 38 }))
      clusters.push({ ...cluster, country });
  }
  ui.pins.replaceChildren();
  for (const cluster of clusters) {
    const button = document.createElement('button');
    button.type = 'button';
    const precisionKinds = [...new Set(cluster.cases.map(mapPrecision))];
    const precisionLabels = precisionKinds.map(precisionLabel);
    const precisionKind = cluster.count === 1
      ? precisionKinds[0]
      : precisionKinds.length === 1 ? precisionKinds[0] : 'mixed';
    const approximate = cluster.count === 1 && precisionKind !== 'exact';
    button.className = (cluster.count > 1 ? 'world-map-marker is-cluster' : 'world-map-marker') + ' density-' + markerDensityTier(cluster.count);
    if (approximate) button.classList.add('is-approximate');
    button.style.left = `${cluster.left}%`;
    button.style.top = `${cluster.top}%`;
    button.dataset.clusterCount = String(cluster.count);
    button.dataset.markerCaseId = cluster.cases[0].id;
    button.dataset.mapPrecision = precisionKind;
    button.textContent = ''; // Keep exact counts in ARIA/title/data, not in the map dot.
    const preview = cluster.cases.slice(0, 3).map((item) => caseText(item, 'title')).join(', ');
    const additional = cluster.count > 3 ? ` (+${cluster.count - 3})` : '';
    const sourceLanguage = cluster.cases.some(needsTranslationDisclosure) ? ` · ${translationDisclosure(language())}` : '';
    button.title = `${preview}${additional} · ${precisionLabels.join(', ')}${sourceLanguage}`;
    const selectedInCluster = cluster.cases.some((item) => item.id === selected);
    if (selectedInCluster) button.dataset.selectedCaseId = selected;
    button.setAttribute('aria-pressed', String(selectedInCluster));
    // A marker is navigation, never an implicit zoom control. Mixed-country
    // cells are separated before clustering so each dot has one destination.
    const code = cluster.country;
    const hasCountry = /^[A-Z]{2}$/.test(code) && code !== 'XZ';
    const countryName = hasCountry ? countryDisplayName(code) : 'Location without an assigned country';
    button.dataset.country = hasCountry ? code : '';
    button.title = `${cluster.count} case${cluster.count === 1 ? '' : 's'} · ${preview}${additional} · ${precisionLabels.join(', ')} · ${countryName} · Open ${hasCountry?'country dossiers':'case dossier'}`;
    button.setAttribute('aria-label', `${countryName} · ${precisionLabels.join(', ')} · Open ${hasCountry?'country':'case'} files · ${cluster.count} map locations`);
    button.addEventListener('click', () => {
      const destination=hasCountry ? '/countries/' + encodeURIComponent(code)
        : '/archive/' + encodeURIComponent(cluster.cases[0].id);
      window.location.assign(destination);
    });
    ui.pins.append(button);
  }
  if (mapHadFocus) {
    const markers = [...ui.pins.querySelectorAll('button')];
    const replacement = markers.find((button) => button.dataset.selectedCaseId === selected) ||
      markers.find((button) => button.dataset.markerCaseId === focusedCaseId);
    (replacement || ui.surface).focus({ preventScroll: true });
  }
}

function zoomBy(factor) {
  const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
  if (nextZoom === zoom) return;
  const ratio = nextZoom / zoom;
  zoom = nextZoom;
  offsetX *= ratio;
  offsetY *= ratio;
  applyViewport();
  renderPins();
  renderSourcePins();
}

function resetView() {
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  applyViewport();
  renderPins();
  renderSourcePins();
}

function populateFilters() {
  const previous = { country: ui.country.value, year: ui.year.value, category: ui.category.value };
  for (const select of [ui.country, ui.year, ui.category]) select.length = 1;
  const countryCodes = [...new Set(cases.map((item) => item.country).filter((code) => /^[A-Z]{2}$/.test(code || '')))].sort();
  const years = [...new Set(cases.map((item) => String(item.date || '').slice(0, 4)).filter((year) => /^\d{4}$/.test(year)))].sort().reverse();
  const categories = [...new Set(cases.map((item) => item.category).filter(Boolean))].sort();
  let displayNames;
  try { displayNames = new Intl.DisplayNames([language(), 'en'], { type: 'region' }); } catch { displayNames = null; }
  for (const code of countryCodes) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${displayNames?.of(code) || code} · ${code}`;
    ui.country.append(option);
  }
  for (const year of years) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    ui.year.append(option);
  }
  for (const category of categories) {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = categoryName(category);
    ui.category.append(option);
  }
  ui.country.value = countryCodes.includes(previous.country) ? previous.country : '';
  ui.year.value = years.includes(previous.year) ? previous.year : '';
  ui.category.value = categories.includes(previous.category) ? previous.category : '';
}

function render() {
  if (!dataReady || archiveFailed) return;
  const focusedResultId = ui.results.contains(document.activeElement)
    ? document.activeElement.dataset.worldCaseId
    : null;
  resultsStart = 0;
  filtered = filterCases(cases, {
    query: ui.search.value,
    country: ui.country.value,
    year: ui.year.value,
    category: ui.category.value,
    language: language()
  });
  if (!filtered.slice(0, RESULTS_PAGE_SIZE).some((item) => item.id === selected)) selected = filtered[0]?.id || null;
  const mapped = filtered.filter(hasCoordinates).length;
  ui.count.textContent = new Intl.NumberFormat(language()).format(filtered.length);
  ui.countLabel.textContent = t('results');
  ui.summary.textContent = `${filtered.length} ${t('results')} · ${mapped} ${t('mapped')}`;
  renderResults();
  renderDetails(filtered.find((item) => item.id === selected) || null);
  renderPins();
  renderResultsSelection();
  const visibleStatus = filtered.length ? ui.summary.textContent : t('noResults');
  ui.status.textContent = registryIncomplete ? `${visibleStatus} · ${t('registryIncomplete')}` : visibleStatus;
  if (focusedResultId) {
    const replacement = [...ui.results.querySelectorAll('[data-world-case-id]')]
      .find((button) => button.dataset.worldCaseId === focusedResultId);
    (replacement || ui.results).focus({ preventScroll: true });
  }
}

function updateLabels() {
  document.querySelectorAll('[data-world-t]').forEach((element) => {
    const key = element.dataset.worldT;
    if (t(key)) element.textContent = t(key);
  });
  ui.search.setAttribute('aria-label', t('search'));
  ui.search.placeholder = t('searchHint');
  ui.country.setAttribute('aria-label', window.AURORA_UI?.label('country') || 'Country');
  ui.year.setAttribute('aria-label', t('year'));
  ui.category.setAttribute('aria-label', t('category'));
  ui.controls.setAttribute('aria-label', t('mapControls'));
  ui.filters.setAttribute('aria-label', t('search'));
  const mapDescription = `${t('mapCaveat')} ${language() === 'en'
    ? 'Click any location circle to open its country dossiers. Drag to pan after manually zooming with the controls.'
    : t('mapHelp')}`;
  ui.surface.setAttribute('aria-label', `${t('results')} map. ${mapDescription}`);
  ui.zoomIn.setAttribute('aria-label', t('zoomIn'));
  ui.zoomOut.setAttribute('aria-label', t('zoomOut'));
  ui.zoomReset.setAttribute('aria-label', t('resetView'));
  ui.help.textContent = mapDescription;
  ui.countLabel.textContent = t('results');
  ui.resultsHeading.textContent = t('results').toLocaleUpperCase(language());
  ui.results.setAttribute('aria-label', t('results'));
  ui.pins.setAttribute('aria-label', t('mapMarkers'));
  ui.country.options[0].textContent = window.AURORA_UI?.label('allCountries') || (language() === 'bg' ? 'ВСИЧКИ ДЪРЖАВИ' : 'ALL COUNTRIES');
  ui.year.options[0].textContent = t('allYears');
  ui.category.options[0].textContent = t('allCategories');
  populateFilters();
  applyViewport();
  if (archiveFailed) {
    ui.detail.textContent = t('archiveUnavailable');
    ui.status.textContent = t('archiveUnavailable');
  } else if (dataReady) render();
}

function setCases(next) {
  const byCaseId = new Map();
  for (const item of baseCases) byCaseId.set(item.id, item);
  for (const item of next) byCaseId.set(item.id, item);
  cases = [...byCaseId.values()];
  populateFilters();
  render();
}

async function loadApprovedCases() {
  try {
    const statsResponse = await fetch('/api/stats', { cache: 'no-store' });
    if (!statsResponse.ok) {
      registryIncomplete = true;
      render();
      return;
    }
    const stats = await statsResponse.json();
    if (stats?.includes_demo === true) {
      registryIncomplete = true;
      render();
      return;
    }
    if (stats?.includes_demo !== false || !Array.isArray(stats.by_country) || !Number.isSafeInteger(stats.sightings) || stats.sightings < 0) {
      registryIncomplete = true;
      render();
      return;
    }
    registryIncomplete = false;

    const pageSize = 250;
    const maxOffset = 100000;
    const maxPages = Math.floor(maxOffset / pageSize) + 1;
    const concurrency = 4;
    const total = stats.sightings;
    if (!Number.isSafeInteger(total) || total < 0) {
      registryIncomplete = true;
      render();
      return;
    }
    if (total === 0) return;

    const loaded = new Map();
    approvedCases = [];
    const pageCount = Math.ceil(total / pageSize);
    const pagesToLoad = Math.min(pageCount, maxPages);
    if (pagesToLoad < pageCount) registryIncomplete = true;

    for (let firstPage = 0; firstPage < pagesToLoad; firstPage += concurrency) {
      const offsets = Array.from({ length: Math.min(concurrency, pagesToLoad - firstPage) }, (_, index) => (firstPage + index) * pageSize);
      const results = await Promise.allSettled(offsets.map(async (offset) => {
        const response = await fetch(`/api/cases?limit=${pageSize}&offset=${offset}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Registry page ${offset} returned HTTP ${response.status}`);
        return response.json();
      }));
      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') { registryIncomplete = true; return; }
        const offset = offsets[index];
        const payload = result.value;
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          registryIncomplete = true;
          return;
        }
        const page = Array.isArray(payload.cases) ? payload.cases : [];
        const expectedLength = Math.min(pageSize, total - offset);
        const expectedHasMore = offset + pageSize < total;
        if (payload.offset !== offset || payload.limit !== pageSize || payload.total !== total ||
            page.length !== expectedLength || payload.has_more !== expectedHasMore) registryIncomplete = true;
        const validPage = page.filter(validRecord);
        if (validPage.length !== page.length || validPage.some((item) => loaded.has(item.id))) registryIncomplete = true;
        for (const item of validPage) loaded.set(item.id, { ...item, recordOrigin: 'd1' });
      });
      approvedCases = [...loaded.values()];
    }
    approvedCases = [...loaded.values()];
    if (registryIncomplete) console.warn('AURORA registry loaded partially; keeping all successfully fetched approved cases');
    if (approvedCases.length) setCases(approvedCases);
    else if (registryIncomplete) render();
  } catch (error) {
    registryIncomplete = true;
    if (approvedCases.length) setCases(approvedCases);
    else render();
    console.warn('AURORA registry unavailable; preserving the source-linked archive', error);
  }
}

function updateZoomFromControls(factor) { zoomBy(factor); }
ui.zoomIn.addEventListener('click', () => updateZoomFromControls(1.5));
ui.zoomOut.addEventListener('click', () => updateZoomFromControls(1 / 1.5));
ui.zoomReset.addEventListener('click', resetView);
ui.search.addEventListener('input', render);
ui.country.addEventListener('change', () => { render(); renderSourcePins(); });
ui.year.addEventListener('change', () => { render(); renderSourcePins(); });
ui.category.addEventListener('change', render);

ui.surface.addEventListener('keydown', (event) => {
  if (event.target !== ui.surface) return;
  if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomBy(1.5); }
  else if (event.key === '-') { event.preventDefault(); zoomBy(1 / 1.5); }
  else if (event.key === '0') { event.preventDefault(); resetView(); }
  else if (zoom > 1 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const distance = 38;
    if (event.key === 'ArrowLeft') offsetX += distance;
    if (event.key === 'ArrowRight') offsetX -= distance;
    if (event.key === 'ArrowUp') offsetY += distance;
    if (event.key === 'ArrowDown') offsetY -= distance;
    applyViewport();
  }
});

ui.surface.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || zoom <= 1 || event.target.closest('button,a')) return;
  drag = { x: event.clientX, y: event.clientY, offsetX, offsetY, pointerId: event.pointerId };
  ui.surface.setPointerCapture(event.pointerId);
  ui.surface.classList.add('is-dragging');
});
ui.surface.addEventListener('pointermove', (event) => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  offsetX = drag.offsetX + event.clientX - drag.x;
  offsetY = drag.offsetY + event.clientY - drag.y;
  applyViewport();
});
function stopDrag(event) {
  if (!drag || (event && drag.pointerId !== event.pointerId)) return;
  drag = null;
  ui.surface.classList.remove('is-dragging');
}
ui.surface.addEventListener('pointerup', stopDrag);
ui.surface.addEventListener('pointercancel', stopDrag);

const resize = () => { applyViewport(); renderPins(); renderSourcePins(); };
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(ui.surface);
else window.addEventListener('resize', resize);
new MutationObserver(updateLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

async function start() {
  updateLabels();
  const [caseResult, landResult] = await Promise.allSettled([
    fetch('/data/cases.json', { cache: 'no-cache' }).then(async (response) => {
      if (!response.ok) throw new Error('case archive');
      return response.json();
    }),
    fetch('/data/earth-land.json', { cache: 'force-cache' }).then(async (response) => {
      if (!response.ok) throw new Error('map outline');
      return response.json();
    })
  ]);
  if (landResult.status === 'fulfilled' && Array.isArray(landResult.value?.polygons)) land = landResult.value.polygons;
  paint(land);
  if (caseResult.status !== 'fulfilled') {
    dataReady = true;
    archiveFailed = true;
    ui.detail.textContent = t('archiveUnavailable');
    ui.status.textContent = t('archiveUnavailable');
    return;
  }
  const archive = Array.isArray(caseResult.value?.cases) ? caseResult.value.cases : [];
  // Normalize historical cases consistently with the globe and country views.
  const archiveRecords = globalThis.AURORA_ARCHIVE?.prepareArchiveCases(archive) ?? archive;
  baseCases = archiveRecords.filter(validRecord).map((item) => ({ ...item, recordOrigin: 'archive' }));
  cases = baseCases.slice();
  dataReady = true;
  archiveFailed = false;
  populateFilters();
  render();
  loadApprovedCases();
  // Source geo/navigation is supplemental, so it never blocks the curated map.
  void loadSourceNavigation();
}

start().catch((error) => {
  console.warn('AURORA world atlas initialization failed', error);
  dataReady = true;
  archiveFailed = true;
  paint([]);
  ui.detail.textContent = t('archiveUnavailable');
  ui.status.textContent = t('archiveUnavailable');
});
