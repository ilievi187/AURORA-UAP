import { clusterMarkers, filterCases, hasCoordinates } from './world-atlas-model.js';
import { labels } from './world-atlas-labels.js';

const byId = (id) => document.getElementById(id);
const ui = {
  canvas: byId('worldMapCanvas'),
  viewport: byId('worldMapViewport'),
  surface: byId('worldMapSurface'),
  pins: byId('worldMapPins'),
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
const RESULTS_PAGE_SIZE = 60;
const deg = Math.PI / 180;
ui.canvas.width = MAP_WIDTH;
ui.canvas.height = MAP_HEIGHT;

let baseCases = [];
let approvedCases = [];
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
const clusterCycle = new Map();

const language = () => document.documentElement.lang || 'en';
const t = (key) => labels[language()]?.[key] || labels.en[key] || key;
const localized = (value) => {
  if (typeof value === 'string') return value;
  return value?.[language()] || value?.en || value?.bg || '';
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

function paint(polygons) {
  const gradient = context.createLinearGradient(0, 0, 0, MAP_HEIGHT);
  gradient.addColorStop(0, '#092d40');
  gradient.addColorStop(.5, '#0c3948');
  gradient.addColorStop(1, '#072332');
  context.fillStyle = gradient;
  context.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  context.strokeStyle = '#47798b66';
  context.lineWidth = .7;
  for (let x = 0; x <= MAP_WIDTH; x += 100) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, MAP_HEIGHT); context.stroke();
  }
  for (let y = 0; y <= MAP_HEIGHT; y += 50) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(MAP_WIDTH, y); context.stroke();
  }
  context.fillStyle = '#1d6c6c';
  context.strokeStyle = '#8cdbc186';
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
  heading.textContent = localized(item.title);
  const place = document.createElement('p');
  place.className = 'world-case-place';
  place.textContent = `${localized(item.city) || t('unknownLocation')}${item.country ? ` · ${item.country}` : ''}`;
  const summary = document.createElement('p');
  summary.textContent = localized(item.summary);
  ui.detail.append(tag, heading, place, summary);
  if (!hasCoordinates(item)) {
    const unknown = document.createElement('p');
    unknown.className = 'world-location-note';
    unknown.textContent = t('notMapped');
    ui.detail.append(unknown);
  } else if (item.location_precision) {
    const precision = document.createElement('p');
    precision.className = 'world-location-note';
    precision.textContent = item.location_precision;
    ui.detail.append(precision);
  }
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

function selectCase(id, { center = false } = {}) {
  const item = filtered.find((entry) => entry.id === id);
  if (!item) return;
  selected = item.id;
  if (center && hasCoordinates(item)) {
    const targetZoom = Math.max(zoom, 2.4);
    zoomTo((item.lng + 180) / 360 * 100, (90 - item.lat) / 180 * 100, targetZoom);
  }
  const selectedIndex = filtered.findIndex((entry) => entry.id === selected);
  const resultsNeedPageChange = selectedIndex >= 0 && (selectedIndex < resultsStart || selectedIndex >= resultsStart + RESULTS_PAGE_SIZE);
  if (resultsNeedPageChange) resultsStart = Math.floor(selectedIndex / RESULTS_PAGE_SIZE) * RESULTS_PAGE_SIZE;
  renderDetails(item);
  if (resultsNeedPageChange) renderResults();
  renderResultsSelection();
  renderPins();
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
    title.textContent = localized(item.title);
    const location = document.createElement('span');
    location.className = 'world-result-place';
    location.textContent = localized(item.city) || t('unknownLocation');
    button.append(meta, title, location);
    if (!hasCoordinates(item)) {
      const note = document.createElement('span');
      note.className = 'world-result-unknown';
      note.textContent = t('notMapped');
      button.append(note);
    }
    button.addEventListener('click', () => selectCase(item.id, { center: true }));
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

function renderPins() {
  const mapHadFocus = ui.pins.contains(document.activeElement);
  const focusedCaseId = mapHadFocus
    ? (document.activeElement.dataset.selectedCaseId || document.activeElement.dataset.markerCaseId)
    : null;
  const width = ui.surface.clientWidth || MAP_WIDTH;
  const height = ui.surface.clientHeight || MAP_HEIGHT;
  const clusters = clusterMarkers(filtered, { width, height, zoom, radius: 38 });
  ui.pins.replaceChildren();
  for (const cluster of clusters) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = cluster.count > 1 ? 'world-map-marker is-cluster' : 'world-map-marker';
    button.style.left = `${cluster.left}%`;
    button.style.top = `${cluster.top}%`;
    button.dataset.clusterCount = String(cluster.count);
    button.dataset.markerCaseId = cluster.cases[0].id;
    button.textContent = cluster.count > 1 ? String(cluster.count) : '';
    const preview = cluster.cases.slice(0, 3).map((item) => localized(item.title)).join(', ');
    const additional = cluster.count > 3 ? ` (+${cluster.count - 3})` : '';
    button.title = `${preview}${additional}`;
    const selectedInCluster = cluster.cases.some((item) => item.id === selected);
    if (selectedInCluster) button.dataset.selectedCaseId = selected;
    button.setAttribute('aria-pressed', String(selectedInCluster));
    button.setAttribute('aria-label', cluster.count > 1
      ? `${cluster.count} ${t('cluster')}. ${t('zoomIn')}. ${button.title}`
      : `${localized(cluster.cases[0].title)} · ${localized(cluster.cases[0].city) || t('unknownLocation')}`);
    button.addEventListener('click', () => {
      if (cluster.count > 1 && zoom < MAX_ZOOM) {
        const representative = cluster.cases[0];
        selectCase(representative.id);
        zoomTo(cluster.left, cluster.top, Math.min(MAX_ZOOM, Math.max(zoom + .75, zoom * 1.85)));
        return;
      }
      const index = cluster.count > 1 ? (clusterCycle.get(cluster.id) || 0) % cluster.count : 0;
      clusterCycle.set(cluster.id, index + 1);
      selectCase(cluster.cases[index].id);
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

function zoomTo(leftPercent, topPercent, targetZoom) {
  zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom));
  const width = ui.surface.clientWidth || MAP_WIDTH;
  const height = ui.surface.clientHeight || MAP_HEIGHT;
  const x = leftPercent / 100 * width;
  const y = topPercent / 100 * height;
  offsetX = -(x - width / 2) * zoom;
  offsetY = -(y - height / 2) * zoom;
  applyViewport();
  renderPins();
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
}

function resetView() {
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  applyViewport();
  renderPins();
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
  const mapDescription = `${t('mapCaveat')} ${t('mapHelp')}`;
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
ui.country.addEventListener('change', render);
ui.year.addEventListener('change', render);
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
  if (event.button !== 0 || zoom <= 1 || event.target.closest('button')) return;
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

const resize = () => { applyViewport(); renderPins(); };
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(ui.surface);
else window.addEventListener('resize', resize);
new MutationObserver(updateLabels).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

async function start() {
  updateLabels();
  const [caseResult, landResult] = await Promise.allSettled([
    fetch('/data/cases.json', { cache: 'force-cache' }).then(async (response) => {
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
  baseCases = archive.filter(validRecord).map((item) => ({ ...item, recordOrigin: 'archive' }));
  cases = baseCases.slice();
  dataReady = true;
  archiveFailed = false;
  populateFilters();
  render();
  loadApprovedCases();
}

start().catch((error) => {
  console.warn('AURORA world atlas initialization failed', error);
  dataReady = true;
  archiveFailed = true;
  paint([]);
  ui.detail.textContent = t('archiveUnavailable');
  ui.status.textContent = t('archiveUnavailable');
});
