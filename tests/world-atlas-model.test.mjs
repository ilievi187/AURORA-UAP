import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';
import * as atlas from '../world-atlas-model.js';
import { labels } from '../world-atlas-labels.js';

test('global atlas exposes accessible search, filters, results, and zoomable map controls', () => {
  const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const id of ['worldSearch', 'worldCountry', 'worldYear', 'worldCategory', 'worldMapViewport', 'worldMapResults', 'worldZoomIn', 'worldZoomOut', 'worldZoomReset']) {
    assert.match(page, new RegExp('id="' + id + '"'), 'missing ' + id);
  }
  assert.match(page, /type="module" src="\/world-atlas\.js"/);
  assert.match(readFileSync(new URL('../world-atlas.js', import.meta.url), 'utf8'), /world-atlas-labels\.js/);
});


test('orbital atlas uses local night-Earth imagery and preserves precise case coordinates', () => {
 const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const source=readFileSync(new URL('../world-atlas.js',import.meta.url),'utf8');
 const orbital=readFileSync(new URL('../world-atlas-orbital.css',import.meta.url),'utf8');
 assert.match(page,/world-atlas-orbital\.css/,'dedicated orbital skin is loaded');
 assert.ok(page.indexOf('world-atlas-orbital.css')<page.indexOf('aurora-silence.css'),'the approved homepage still has final visual authority');
 assert.match(page,/id="worldMapCanvas"/);
 assert.match(page,/id="worldMapPins"/);
 assert.match(page,/world-map-orbital-legend/);
 assert.match(source,/assets\/earth\/earth-night-4096\.jpg/);
 assert.match(source,/assets\/earth\/earth-day-4096\.jpg/);
 assert.match(source,/context\.drawImage\(satellite\.night/);
 assert.match(source,/Offline image fallback/);
 assert.match(source,/clusterMarkers\(filtered/,'clustering still uses real case records');
 assert.match(orbital,/prefers-reduced-motion:reduce/);
 assert.match(orbital,/\.world-map-marker/);
 const night=readFileSync(new URL('../assets/earth/earth-night-4096.jpg',import.meta.url));
 assert.equal(night[0],0xff);assert.equal(night[1],0xd8,'image is a JPEG not a placeholder');
});

test('atlas controls have labels in every advertised locale', () => {
  const locales = ['bg', 'en', 'de', 'ru', 'zh-CN', 'fr', 'es', 'it', 'pt', 'tr', 'ro', 'el', 'sr', 'uk', 'pl', 'ar', 'ja', 'ko'];
  for (const locale of locales) {
    assert.ok(labels[locale], `missing ${locale}`);
    for (const key of ['search', 'searchHint', 'year', 'allYears', 'category', 'allCategories', 'lights', 'objects', 'instrument', 'zoomIn', 'zoomOut', 'resetView', 'results', 'mapped', 'noResults', 'unknownLocation', 'readCase', 'originalSource', 'media', 'mapHelp', 'cluster', 'archiveUnavailable', 'notMapped', 'other', 'mapControls', 'mapMarkers', 'mapCaveat', 'registryIncomplete', 'nextPage', 'previousPage']) {
      assert.ok(labels[locale][key], `missing ${locale}.${key}`);
    }
  }
});

const cases = [
  {
    id: 'westall-1966', date: '1966-04-06', category: 'object', country: 'AU',
    title: { en: 'Westall witnesses', bg: 'Свидетелите от Уестол' },
    city: { en: 'Melbourne', bg: 'Мелбърн' },
    summary: { en: 'School reports', bg: 'Свидетелски разкази' },
    lat: -37.94, lng: 145.14
  },
  {
    id: 'phoenix-1997', date: '1997-03-13', category: 'lights', country: 'US',
    title: { en: 'Phoenix Lights', bg: 'Светлините над Финикс' },
    city: { en: 'Phoenix', bg: 'Финикс' },
    summary: { en: 'Reports from Arizona', bg: 'Съобщения от Аризона' },
    lat: 33.448, lng: -112.074
  },
  {
    id: 'unknown-location', date: '1990', category: 'lights', country: 'GB',
    title: { en: 'Unlocated report', bg: 'Съобщение без местоположение' },
    city: { en: 'Location not reported', bg: 'Неизвестен район' },
    summary: { en: 'No coordinates were published', bg: 'Няма публикувани координати' },
    lat: null, lng: null
  }
];

test('case search is accent-insensitive, localized, and composes with country/year/category filters', () => {
  assert.equal(typeof atlas.filterCases, 'function', 'world-atlas-model exports filterCases');
  assert.deepEqual(atlas.filterCases(cases, { query: 'Wéstall', language: 'en' }).map(c => c.id), ['westall-1966']);
  assert.deepEqual(atlas.filterCases(cases, {
    query: 'Мелбърн', language: 'bg', country: 'AU', year: '1966', category: 'object'
  }).map(c => c.id), ['westall-1966']);
  assert.deepEqual(atlas.filterCases(cases, { country: 'GB' }).map(c => c.id), ['unknown-location']);
  assert.deepEqual(atlas.filterCases(cases, { query: 'Australia', language: 'en' }).map(c => c.id), ['westall-1966']);
  const iraq = { id: 'iraq', date: '2003', country: 'IQ', category: 'lights', title: 'Report', city: 'Baghdad' };
  assert.deepEqual(atlas.filterCases([iraq], { query: 'ırak', language: 'tr' }).map(c => c.id), ['iraq']);
  const regional = { id: 'case-42', date: '2024', country: 'DE', region: 'Bavaria', category: 'lights', title: 'Regional report', city: 'Munich' };
  assert.deepEqual(atlas.filterCases([regional], { query: 'Bavaria', language: 'en' }).map(c => c.id), ['case-42']);
  const localizedRegion = { id: 'case-43', date: '2024', country: 'DE', region: { en: 'Bavaria', de: 'Bayern' }, category: 'lights', title: 'Regional report', city: 'Munich' };
  assert.deepEqual(atlas.filterCases([localizedRegion], { query: 'Bayern', language: 'de' }).map(c => c.id), ['case-43']);
});

test('map clustering groups nearby markers, separates them with zoom, and omits unknown coordinates', () => {
  assert.equal(typeof atlas.clusterMarkers, 'function', 'world-atlas-model exports clusterMarkers');
  const locations = [
    { id: 'paris', lat: 48.85, lng: 2.35 },
    { id: 'london', lat: 51.51, lng: -0.12 },
    { id: 'phoenix', lat: 33.448, lng: -112.074 },
    { id: 'unknown', lat: null, lng: null }
  ];
  const world = atlas.clusterMarkers(locations, { width: 1000, height: 500, zoom: 1, radius: 32 });
  assert.deepEqual(world.map(cluster => cluster.cases.length).sort(), [1, 2]);
  assert.ok(world.every(cluster => cluster.cases.every(c => c.id !== 'unknown')));
  const closer = atlas.clusterMarkers(locations, { width: 1000, height: 500, zoom: 4, radius: 32 });
  assert.deepEqual(closer.map(cluster => cluster.cases.length).sort(), [1, 1, 1]);
  const dense = Array.from({ length: 12000 }, (_, index) => ({ id: `dense-${index}`, date: '2020-01-01', lat: 40, lng: -70 }));
  const start = performance.now();
  const denseGroups = atlas.clusterMarkers(dense, { width: 1000, height: 500, zoom: 1, radius: 32 });
  const elapsed = performance.now() - start;
  assert.equal(denseGroups.length, 1);
  assert.equal(denseGroups[0].count, dense.length);
  assert.equal(denseGroups[0].cases[0].id, 'dense-0');
  assert.equal(denseGroups[0].cases.at(-1).id, `dense-${dense.length - 1}`);
  assert.ok(elapsed < 1500, `dense marker clustering took ${elapsed.toFixed(1)}ms`);
});
