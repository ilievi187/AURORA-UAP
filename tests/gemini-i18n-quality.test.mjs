import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { labels as atlasLabels } from '../world-atlas-labels.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const EXPECTED_LOCALES = ['bg', 'en', 'de', 'ru', 'zh-CN', 'fr', 'es', 'it', 'pt', 'tr', 'ro', 'el', 'sr', 'uk', 'pl', 'ar', 'ja', 'ko'];

test('homepage translations (script.js + i18n-extra.js), editorialText, HOME_TITLES, and aurora-v1.js language gate cover all 18 locales', () => {
  const scriptJs = read('script.js');
  const transMatch = scriptJs.match(/const translations = (\{[\s\S]*?\n\});/);
  const donMatch = scriptJs.match(/const donationNav = (\{[\s\S]*?\n\});/);
  const editMatch = scriptJs.match(/const editorialText=(\{[\s\S]*?\n\});/);
  const titlesMatch = scriptJs.match(/const HOME_TITLES = (\{[\s\S]*?\n\});/);
  assert.ok(transMatch && donMatch && editMatch && titlesMatch, 'script.js must define translations, donationNav, editorialText, and HOME_TITLES');

  const ctx = { window: {} };
  vm.runInNewContext(read('i18n-extra.js'), ctx);
  const translations = vm.runInNewContext('(' + transMatch[1] + ')');
  const donationNav = vm.runInNewContext('(' + donMatch[1] + ')');
  const editorialText = vm.runInNewContext('(' + editMatch[1] + ')');
  const homeTitles = vm.runInNewContext('(' + titlesMatch[1] + ')');

  Object.assign(translations, ctx.window.AURORA_LOCALES);
  for (const [code, keys] of Object.entries(donationNav)) {
    Object.assign(translations[code], keys);
  }

  const enKeys = Object.keys(translations.en).sort();
  const enEditKeys = Object.keys(editorialText.en).sort();

  for (const locale of EXPECTED_LOCALES) {
    assert.ok(translations[locale], `Missing homepage locale in translations/i18n-extra.js: ${locale}`);
    assert.deepEqual(Object.keys(translations[locale]).sort(), enKeys, `Homepage locale ${locale} key mismatch`);
    for (const key of enKeys) {
      const val = translations[locale][key];
      assert.equal(typeof val, 'string', `Homepage ${locale}.${key} must be string`);
      assert.ok(val.trim().length > 0, `Homepage ${locale}.${key} must not be empty`);
      assert.ok(!val.includes('\uFFFD'), `Homepage ${locale}.${key} contains replacement character`);
    }

    assert.ok(editorialText[locale], `script.js editorialText missing locale ${locale}`);
    assert.deepEqual(Object.keys(editorialText[locale]).sort(), enEditKeys, `script.js editorialText ${locale} key mismatch`);
    for (const key of enEditKeys) {
      const val = editorialText[locale][key];
      assert.ok(typeof val === 'string' && val.trim().length > 0, `editorialText ${locale}.${key} must be non-empty string`);
      assert.ok(!val.includes('\uFFFD'), `editorialText ${locale}.${key} contains replacement character`);
    }

    assert.ok(typeof homeTitles[locale] === 'string' && homeTitles[locale].includes('AURORA'), `HOME_TITLES missing ${locale}`);
    assert.ok(!homeTitles[locale].includes('\uFFFD'), `HOME_TITLES.${locale} contains replacement character`);
  }

  const indexHtml = read('index.html');
  const htmlKeys = [...indexHtml.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)].map(m => m[1]);
  assert.ok(htmlKeys.length >= 60, 'index.html must contain data-i18n attributes');
  for (const key of htmlKeys) {
    assert.ok(enKeys.includes(key), `index.html data-i18n="${key}" is missing from homepage locale packs`);
  }

  const auroraV1 = read('aurora-v1.js');
  const gateTMatch = auroraV1.match(/const t=(\{[\s\S]*?\n  \});/);
  const statusMatch = auroraV1.match(/const selectedStatusLabel=(\{[\s\S]*?\n  \});/);
  const contMatch = auroraV1.match(/const continueTranslations=(\{[\s\S]*?\n  \});/);
  assert.ok(gateTMatch && statusMatch && contMatch, 'aurora-v1.js must define t, selectedStatusLabel, and continueTranslations');
  const gateT = vm.runInNewContext('(' + gateTMatch[1] + ')');
  const statusLabels = vm.runInNewContext('(' + statusMatch[1] + ')');
  const contLabels = vm.runInNewContext('(' + contMatch[1] + ')');
  for (const locale of EXPECTED_LOCALES) {
    assert.ok(Array.isArray(gateT[locale]) && gateT[locale].length === 3, `aurora-v1.js gate t missing ${locale}`);
    assert.ok(typeof statusLabels[locale] === 'string' && statusLabels[locale].length > 0, `aurora-v1.js selectedStatusLabel missing ${locale}`);
    assert.ok(typeof contLabels[locale] === 'string' && contLabels[locale].length > 0, `aurora-v1.js continueTranslations missing ${locale}`);
  }
});

test('mission-control.js defines complete 4-stage interactive workflow translations for all 18 locales', () => {
  const mcJs = read('mission-control.js');
  const match = mcJs.match(/const changes=(\{[\s\S]*?\n  \});/);
  assert.ok(match, 'mission-control.js must define changes dictionary');
  const changes = vm.runInNewContext('(' + match[1] + ')');
  const enKeys = Object.keys(changes.en).sort();

  for (const locale of EXPECTED_LOCALES) {
    assert.ok(changes[locale], `mission-control.js missing locale ${locale}`);
    assert.deepEqual(Object.keys(changes[locale]).sort(), enKeys, `mission-control.js ${locale} key mismatch`);
    assert.equal(Array.isArray(changes[locale].items), true, `mission-control.js ${locale}.items must be array`);
    assert.equal(changes[locale].items.length, 4, `mission-control.js ${locale}.items must have 4 stages`);
    for (const stage of changes[locale].items) {
      assert.equal(typeof stage[0], 'string');
      assert.equal(typeof stage[1], 'string');
      assert.equal(Array.isArray(stage[2]) && stage[2].length === 3, true);
    }
    assert.ok(!JSON.stringify(changes[locale]).includes('\uFFFD'), `mission-control.js ${locale} contains replacement character`);
  }
});

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

test('dossier.js defines 18-language case metadata, categoryName, statusName, confidence, and related-cases labels', () => {
  const dossierJs = read('dossier.js');
  const baseMatch = dossierJs.match(/const base=(\{[\s\S]*?\n \});/);
  const overMatch = dossierJs.match(/const overrides=(\{[\s\S]*?\n \});/);
  assert.ok(baseMatch && overMatch, 'dossier.js must define base and overrides');
  const base = vm.runInNewContext('(' + baseMatch[1] + ')');
  const overrides = vm.runInNewContext('(' + overMatch[1] + ')');
  const enCatKeys = Object.keys(base.en.categoryName).sort();
  const enStatusKeys = Object.keys(base.en.statusName).sort();
  const enConfKeys = Object.keys(base.en.confidence).sort();

  for (const locale of EXPECTED_LOCALES) {
    const pack = locale === 'bg' ? base.bg : locale === 'en' ? base.en : overrides[locale];
    assert.ok(pack, `dossier.js missing pack for ${locale}`);
    assert.ok(typeof pack.related === 'string' && pack.related.length > 0, `dossier.js ${locale} missing related heading`);
    assert.ok(typeof pack.openCase === 'string' && pack.openCase.length > 0, `dossier.js ${locale} missing openCase label`);
    assert.deepEqual(Object.keys(pack.categoryName || {}).sort(), enCatKeys, `dossier.js ${locale} categoryName keys mismatch`);
    assert.deepEqual(Object.keys(pack.statusName || {}).sort(), enStatusKeys, `dossier.js ${locale} statusName keys mismatch`);
    assert.deepEqual(Object.keys(pack.confidence || {}).sort(), enConfKeys, `dossier.js ${locale} confidence keys mismatch`);
    assert.ok(!JSON.stringify(pack).includes('\uFFFD'), `dossier.js ${locale} contains replacement character`);
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

test('news source disclosure names Google News and checked publisher feeds in all 18 locales', () => {
  const code = read('subpage-i18n.js');
  const match = code.match(/const packs=(\{[\s\S]*?\n \}),choices=/);
  assert.ok(match, 'subpage-i18n.js must define packs');
  const packs = vm.runInNewContext('(' + match[1] + ')');
  const markers = {
    bg: ['Google News', 'RSS', 'проверени', 'издател', 'не са потвърдени случаи'],
    en: ['Google News', 'RSS', 'checked', 'publisher', 'not verified UAP cases'],
    de: ['Google News', 'RSS', 'geprüfte', 'Verlagen', 'keine bestätigten UAP-Fälle'],
    ru: ['Google News', 'RSS', 'проверенные', 'издателей', 'не являются подтверждёнными случаями UAP'],
    'zh-CN': ['Google 新闻', 'RSS', '经核验', '媒体', '并非已核实的UAP案例'],
    fr: ['Google Actualités', 'RSS', 'vérifiés', 'médias', 'pas des cas UAP vérifiés'],
    es: ['Google Noticias', 'RSS', 'verificados', 'medios', 'no son casos UAP verificados'],
    it: ['Google News', 'RSS', 'verificati', 'editori', 'non sono casi UAP verificati'],
    pt: ['Google Notícias', 'RSS', 'verificados', 'editoras', 'não são casos UAP confirmados'],
    tr: ['Google Haberler', 'RSS', 'doğrulanmış', 'yayıncı', 'doğrulanmış UAP vakaları değildir'],
    ro: ['Google Știri', 'RSS', 'verificate', 'editorilor', 'nu sunt cazuri UAP verificate'],
    el: ['Google News', 'RSS', 'επαληθευμένες', 'εκδοτών', 'δεν είναι επιβεβαιωμένα περιστατικά UAP'],
    sr: ['Google вести', 'RSS', 'проверени', 'издавача', 'нису потврђени случајеви UAP'],
    uk: ['Google Новин', 'RSS', 'перевірені', 'видавців', 'не підтвердженими випадками UAP'],
    pl: ['Google News', 'RSS', 'sprawdzone', 'wydawców', 'nie są potwierdzonymi przypadkami UAP'],
    ar: ['أخبار Google', 'RSS', 'التي تم التحقق', 'للناشرين', 'ليست حالات UAP مؤكدة'],
    ja: ['Google ニュース', 'RSS', '確認済み', '出版社', '確認済みのUAP事例ではありません'],
    ko: ['Google 뉴스', 'RSS', '검증된', '언론사', '확인된 UAP 사례가 아닙니다']
  };
  for (const locale of EXPECTED_LOCALES) {
    const warning = packs[locale]?.newsWarning?.toLocaleLowerCase();
    assert.ok(warning, `subpage-i18n.js ${locale} must define newsWarning`);
    for (const marker of markers[locale]) {
      assert.ok(warning.includes(marker.toLocaleLowerCase()), `subpage-i18n.js ${locale}.newsWarning missing disclosure marker: ${marker}`);
    }
  }
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

test('media.js and media-player.js define complete 18-locale packs without replacement characters', () => {
  const mediaCode = read('media.js');
  const i18nMatch = mediaCode.match(/const PACKS=(\{[\s\S]*?\n \});/);
  assert.ok(i18nMatch, 'media.js must define PACKS dictionary');
  const mediaI18n = vm.runInNewContext('(' + i18nMatch[1] + ')');
  const enMediaKeys = Object.keys(mediaI18n.en).sort();

  const playerCode = read('media-player.js');
  const copyMatch = playerCode.match(/const COPY = (\{[\s\S]*?\n\});/);
  assert.ok(copyMatch, 'media-player.js must define COPY dictionary');
  const playerCopy = vm.runInNewContext('(' + copyMatch[1] + ')');
  const enPlayerKeys = Object.keys(playerCopy.en).sort();

  for (const locale of EXPECTED_LOCALES) {
    assert.ok(mediaI18n[locale], `media.js missing locale ${locale}`);
    assert.deepEqual(Object.keys(mediaI18n[locale]).sort(), enMediaKeys, `media.js ${locale} key mismatch`);
    assert.equal(typeof mediaI18n[locale].count, 'function', `media.js ${locale}.count must be function`);
    assert.ok(mediaI18n[locale].count(3).includes('3'), `media.js ${locale}.count(3) must format count`);
    assert.ok(!JSON.stringify(mediaI18n[locale]).includes('\uFFFD'), `media.js ${locale} contains replacement character`);

    assert.ok(playerCopy[locale], `media-player.js COPY missing locale ${locale}`);
    assert.deepEqual(Object.keys(playerCopy[locale]).sort(), enPlayerKeys, `media-player.js COPY ${locale} key mismatch`);
    assert.ok(!JSON.stringify(playerCopy[locale]).includes('\uFFFD'), `media-player.js COPY ${locale} contains replacement character`);
  }
});

