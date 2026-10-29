import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { labels as atlasLabels } from '../world-atlas-labels.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const EXPECTED_LOCALES = ['bg', 'en', 'de', 'ru', 'zh-CN', 'fr', 'es', 'it', 'pt', 'tr', 'ro', 'el', 'sr', 'uk', 'pl', 'ar', 'ja', 'ko'];

test('donate-i18n.js provides complete, non-empty translations for all 18 locales without replacement characters', () => {
  const ctx = { window: {} };
  vm.runInNewContext(read('donate-i18n.js'), ctx);
  const translations = ctx.window.AURORA_DONATION_TRANSLATIONS;
  assert.ok(translations && typeof translations === 'object', 'AURORA_DONATION_TRANSLATIONS must be defined');
  const enKeys = Object.keys(translations.en).sort();
  assert.ok(enKeys.length >= 25, 'English donation pack must define all required keys');

  for (const locale of EXPECTED_LOCALES) {
    assert.ok(translations[locale], `Missing donation locale: ${locale}`);
    const keys = Object.keys(translations[locale]).sort();
    assert.deepEqual(keys, enKeys, `Donation locale ${locale} key mismatch`);
    for (const key of enKeys) {
      const val = translations[locale][key];
      assert.equal(typeof val, 'string', `Donation ${locale}.${key} must be string`);
      assert.ok(val.trim().length > 0, `Donation ${locale}.${key} must not be empty`);
      assert.ok(!val.includes('\uFFFD'), `Donation ${locale}.${key} contains replacement character`);
    }
  }
});

test('donate.html and donate.js declare all 18 locale options in #langSelect', () => {
  const html = read('donate.html');
  const js = read('donate.js');
  for (const locale of EXPECTED_LOCALES) {
    assert.ok(html.includes(`<option value="${locale}">`), `donate.html missing option for ${locale}`);
    assert.ok(js.includes(`'${locale}'`), `donate.js missing option for ${locale}`);
  }
});

test('report.js defines complete 18-language intake UI packs while preserving safety status prefixes', () => {
  const reportJs = read('report.js');
  const match = reportJs.match(/const I18N=(\{[\s\S]*?\n \});/);
  assert.ok(match, 'report.js must contain I18N dictionary');
  const i18n = vm.runInNewContext('(' + match[1] + ')');
  const enKeys = Object.keys(i18n.en).sort();
  assert.ok(enKeys.length >= 30, 'report.js English pack must contain all form & ethics keys');

  for (const locale of EXPECTED_LOCALES) {
    assert.ok(i18n[locale], `report.js missing locale ${locale}`);
    assert.deepEqual(Object.keys(i18n[locale]).sort(), enKeys, `report.js ${locale} key mismatch`);
    for (const key of enKeys) {
      const val = i18n[locale][key];
      assert.equal(typeof val, 'string', `report.js ${locale}.${key} must be string`);
      assert.ok(val.trim().length > 0, `report.js ${locale}.${key} must not be empty`);
      assert.ok(!val.includes('\uFFFD'), `report.js ${locale}.${key} contains replacement character`);
    }
    assert.ok(i18n[locale].statusDraft.startsWith('LOCAL DRAFT MODE'), `${locale} statusDraft must preserve LOCAL DRAFT MODE prefix`);
    assert.ok(i18n[locale].statusActive.startsWith('PRIVATE INTAKE ACTIVE'), `${locale} statusActive must preserve PRIVATE INTAKE ACTIVE prefix`);
    assert.ok(i18n[locale].statusOffline.startsWith('INTAKE OFFLINE'), `${locale} statusOffline must preserve INTAKE OFFLINE prefix`);
  }
});

test('subpage-i18n.js defines all 18 locales with complete keys, ?lang= query support, and canonical SEO helpers', () => {
  const code = read('subpage-i18n.js');
  const match = code.match(/const packs=(\{[\s\S]*?\n \}),choices=/);
  assert.ok(match, 'subpage-i18n.js must define packs');
  const packs = vm.runInNewContext('(' + match[1] + ')');
  const enKeys = Object.keys(packs.en).sort();

  for (const locale of EXPECTED_LOCALES) {
    assert.ok(packs[locale], `subpage-i18n.js missing locale ${locale}`);
    assert.deepEqual(Object.keys(packs[locale]).sort(), enKeys, `subpage-i18n.js ${locale} key mismatch`);
    for (const key of enKeys) {
      const val = packs[locale][key];
      assert.ok(typeof val === 'string' && val.trim().length > 0, `subpage-i18n.js ${locale}.${key} empty`);
      assert.ok(!val.includes('\uFFFD'), `subpage-i18n.js ${locale}.${key} contains replacement character`);
    }
  }
  assert.ok(code.includes('new URLSearchParams(location.search).get("lang")'), 'subpage-i18n.js must support ?lang= parameter');
  assert.ok(code.includes('rel="canonical"') || code.includes('rel","canonical"'), 'subpage-i18n.js must manage canonical link');
});

test('ui-locales.js and world-atlas-labels.js cover all 18 locales without broken characters', () => {
  const uiCode = read('ui-locales.js');
  const packsMatch = uiCode.match(/const packs=(\{[\s\S]*?\});\n/);
  assert.ok(packsMatch, 'ui-locales.js must define packs');
  const uiPacks = vm.runInNewContext('(' + packsMatch[1] + ')');
  for (const locale of EXPECTED_LOCALES) {
    assert.ok(Array.isArray(uiPacks[locale]) && uiPacks[locale].length === 11, `ui-locales.js missing or incomplete ${locale}`);
    assert.ok(!JSON.stringify(uiPacks[locale]).includes('\uFFFD'), `ui-locales.js ${locale} has replacement char`);
  }

  const enAtlasKeys = Object.keys(atlasLabels.en).sort();
  for (const locale of EXPECTED_LOCALES) {
    assert.ok(atlasLabels[locale], `world-atlas-labels.js missing ${locale}`);
    assert.deepEqual(Object.keys(atlasLabels[locale]).sort(), enAtlasKeys, `world-atlas-labels.js ${locale} key mismatch`);
    assert.ok(!JSON.stringify(atlasLabels[locale]).includes('\uFFFD'), `world-atlas-labels.js ${locale} has replacement char`);
  }
});
