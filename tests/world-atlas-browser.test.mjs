import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve, join, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
// The legacy atlas map behavior is exercised against the original editorial case
// fixtures, independently from the larger licensed source catalog.
const curatedArchive=(()=>{const {cases,...meta}=JSON.parse(readFileSync(new URL('../data/cases.json',import.meta.url)));return JSON.stringify({...meta,cases:cases.filter(c=>!c.provenance?.automated).sort((a,b)=>a.id==='phoenix-1997'?-1:b.id==='phoenix-1997'?1:0)});})();
const homepageIntegrityCases=(()=>{
  const cases=JSON.parse(readFileSync(new URL('../data/cases.json',import.meta.url))).cases;
  const wanted=new Set(['disclosure-virginia-2024','uap-archive-aaro-atmospheric-wakes-case']);
  return cases.filter(item=>wanted.has(item.id));
})();
const homepageIntegrityArchive=JSON.stringify({cases:homepageIntegrityCases});
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8'
};
const unknownLocation = {
  id: 'test-location-not-reported', date: '1986', category: 'other', status: 'reported', country: 'GB',
  city: { en: 'Eastern England (approximate area)', bg: 'Източна Англия (приблизителен район)' },
  title: { en: 'Test record without coordinates', bg: 'Тестов запис без координати' },
  summary: { en: 'The source describes eastern England but supplies no coordinates.', bg: 'Източникът посочва Източна Англия, но няма координати.' },
  source: { name: 'Fixture source', url: 'https://example.org/source' },
  lat: null, lng: null,
  media: [{ type: 'document', title: { en: 'Fixture record', bg: 'Тестов запис' }, url: 'https://example.org/record' }]
};

let approvedFixtures = [unknownLocation];
let failAtOffset = null;
let nullAtOffset = null;
let statsFailure = false;
let statsIncludesDemo = false;
const caseOffsets = [];
const server = createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  if(url.pathname==='/data/cases.json'){response.writeHead(200,{'content-type':'application/json'}).end(curatedArchive);return;}
  if (url.pathname === '/api/stats') {
    if (statsFailure) {
      response.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'database_unavailable' }));
      return;
    }
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ includes_demo: statsIncludesDemo, sightings: approvedFixtures.length, by_country: [{ country: 'GB', count: 1 }] }));
    return;
  }
  if (url.pathname === '/api/cases') {
    const limit = Number(url.searchParams.get('limit') || 100);
    const offset = Number(url.searchParams.get('offset') || 0);
    caseOffsets.push(offset);
    if (offset === failAtOffset) {
      response.writeHead(503, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'registry_page_unavailable' }));
      return;
    }
    if (offset === nullAtOffset) {
      response.writeHead(200, { 'content-type': 'application/json' }).end('null');
      return;
    }
    const cases = approvedFixtures.slice(offset, offset + limit);
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ cases, total: approvedFixtures.length, limit, offset, has_more: offset + limit < approvedFixtures.length }));
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ items: [] }));
    return;
  }
  let decoded;
  try { decoded = decodeURIComponent(url.pathname); }
  catch { response.writeHead(400).end('Bad path'); return; }
  const filename = resolve(join(root, decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '')));
  if (filename !== root && !filename.startsWith(root + sep)) { response.writeHead(403).end('Forbidden'); return; }
  try {
    const body = await readFile(filename);
    response.writeHead(200, { 'content-type': types[extname(filename)] || 'application/octet-stream' }).end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const port = server.address().port;
let browser;
try {
  const options = { headless: true };
  if (process.env.AURORA_CHROMIUM_PATH) options.executablePath = process.env.AURORA_CHROMIUM_PATH;
  browser = await chromium.launch(options);

  await test('world atlas searches and filters cases, zooms clusters, and handles unknown locations on mobile', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    let releaseCases;
    const caseGate = new Promise((resolveCases) => { releaseCases = resolveCases; });
    await page.route('**/data/cases.json', async (route) => { await caseGate; await route.continue(); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({ state: 'hidden' });
    assert.notEqual(await page.locator('#worldMapState').textContent(), 'No cases match these filters.', 'loading should not be announced as an empty result');
    releaseCases();
    await page.waitForFunction(() => document.querySelectorAll('#worldMapResults [data-world-case-id]').length === 10);
    await page.waitForFunction(() => document.querySelector('#worldMapCount')?.textContent === '16');

    assert.equal(await page.locator('#worldMapCount').textContent(), '16');
    assert.equal(await page.locator('#worldResultsHeading').textContent(), 'CASES');
    assert.equal(await page.locator('#worldCategory option[value="other"]').textContent(), 'OTHER');
    assert.equal(await page.locator('.world-map-controls').getAttribute('aria-label'), 'MAP CONTROLS');
    assert.equal(await page.locator('#worldMapPins').getAttribute('aria-label'), 'MAP MARKERS AND CLUSTERS');
    assert.match(await page.locator('#worldMapHelp').textContent(), /markers show reported areas, not measured trajectories/i);
    assert.match(await page.locator('#worldMapHelp').textContent(), /drag to pan/i);
    await page.locator('#langToggle').selectOption('bg');
    assert.equal(await page.locator('#worldResultsHeading').textContent(), 'ДОСИЕ(ТА)');
    assert.equal(await page.locator('#worldCategory option[value="other"]').textContent(), 'ДРУГИ');
    assert.equal(await page.locator('#worldMapPins').getAttribute('aria-label'), 'МАРКЕРИ И КЛЪСТЕРИ');
    assert.match(await page.locator('#worldMapHelp').textContent(), /Маркерите показват описани райони, а не измерени траектории/);
    assert.match(await page.locator('#worldMapSurface').getAttribute('aria-label'), /Маркерите показват описани райони, а не измерени траектории/);
    assert.match(await page.locator('#worldSearch').getAttribute('placeholder'), /Заглавие/);
    await page.locator('#langToggle').selectOption('en');
    const clusterCounts = await page.locator('#worldMapPins [data-cluster-count]').evaluateAll((items) => items.map((item) => Number(item.dataset.clusterCount)));
    assert.equal(clusterCounts.reduce((sum, count) => sum + count, 0), 15);
    assert.ok(clusterCounts.some((count) => count > 1));
    const alignment = await page.evaluate(() => {
      const marker = [...document.querySelectorAll('#worldMapPins button')].find((button) => button.title === 'Westall witnesses');
      const map = document.querySelector('#worldMapViewport').getBoundingClientRect();
      const pin = marker.getBoundingClientRect();
      const expectedX = map.left + ((145.14 + 180) / 360) * map.width;
      const expectedY = map.top + ((90 - -37.94) / 180) * map.height;
      return { dx: pin.left + pin.width / 2 - expectedX, dy: pin.top + pin.height / 2 - expectedY };
    });
    assert.ok(Math.abs(alignment.dx) <= 2 && Math.abs(alignment.dy) <= 2, `marker drift: ${JSON.stringify(alignment)}`);
    await page.locator('#worldMapPins button[title="Westall witnesses"]').focus();
    await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(() => ({
      insidePins: document.querySelector('#worldMapPins').contains(document.activeElement),
      caseId: document.activeElement.dataset.markerCaseId
    })), { insidePins: true, caseId: 'westall-1966' }, 'keyboard marker activation should retain map focus');
    assert.equal(await page.locator('#worldMapPins [aria-label*="test-location-not-reported"]').count(), 0);

    await page.locator('#worldSearch').fill('Australia');
    assert.deepEqual(await page.locator('#worldMapResults [data-world-case-id]').evaluateAll((items) => items.map((item) => item.dataset.worldCaseId)), ['westall-1966']);
    await page.locator('#worldSearch').fill('not-a-real-place-42');
    assert.equal(await page.locator('#worldMapCount').textContent(), '0');
    assert.match(await page.locator('#worldMapResults').textContent(), /No cases match/);

    await page.locator('#worldSearch').fill('');
    await page.locator('#worldCountry').selectOption('AU');
    await page.locator('#worldYear').selectOption('1966');
    await page.locator('#worldCategory').selectOption('object');
    assert.deepEqual(await page.locator('#worldMapResults [data-world-case-id]').evaluateAll((items) => items.map((item) => item.dataset.worldCaseId)), ['westall-1966']);

    await page.locator('#worldCountry').selectOption('');
    await page.locator('#worldYear').selectOption('');
    await page.locator('#worldCategory').selectOption('');
    await page.locator('#worldMapResults [data-world-case-id="test-location-not-reported"]').click();
    assert.equal(await page.locator('#worldCaseDetail h3').textContent(), 'Test record without coordinates');
    assert.match(await page.locator('#worldCaseDetail').textContent(), /Eastern England/);
    assert.match(await page.locator('#worldCaseDetail').textContent(), /Not mapped/);
    assert.doesNotMatch(await page.locator('#worldCaseDetail').textContent(), /Location not reported/);
    assert.equal(await page.locator('#worldCaseDetail .world-media-links a').getAttribute('rel'), 'noopener noreferrer');
    assert.equal(await page.locator('#worldMapPins [aria-label*="Test record without coordinates"]').count(), 0);

    await page.locator('#worldZoomReset').click();
    const clusterButton = page.locator('#worldMapPins button.is-cluster').first();
    await clusterButton.focus();
    await page.keyboard.press('Enter');
    assert.notEqual(await page.locator('#worldZoomLevel').textContent(), '100%');
    assert.equal(await page.evaluate(() => document.querySelector('#worldMapPins').contains(document.activeElement)), true, 'cluster zoom should preserve keyboard focus on the map');
    const selectedId = await page.locator('#worldMapResults [aria-current="true"]').getAttribute('data-world-case-id');
    assert.ok(selectedId, 'cluster zoom should select a case from that cluster');
    assert.equal(await page.locator('#worldCaseDetail h3').textContent(), await page.locator(`#worldMapResults [data-world-case-id="${selectedId}"] strong`).textContent());
    await page.locator('#worldZoomReset').click();
    assert.equal(await page.locator('#worldZoomLevel').textContent(), '100%');

    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      mapWidth: document.querySelector('#worldMapSurface').getBoundingClientRect().width,
      resultColumns: getComputedStyle(document.querySelector('#worldMapResults')).gridTemplateColumns
    }));
    assert.ok(mobile.scrollWidth - mobile.width <= 1, `mobile page overflow: ${mobile.scrollWidth - mobile.width}px`);
    assert.ok(mobile.mapWidth > 250, 'map remains usable on a narrow screen');
    assert.equal(await page.locator('#worldZoomIn').isVisible(), true);
    assert.deepEqual(errors, []);
    await context.close();
  });

  await test('M0 homepage cards use real source text and disclose English fallback in BG and DE', async () => {
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/data/cases.json',route=>route.fulfill({status:200,contentType:'application/json',body:homepageIntegrityArchive}));
    await page.route('**/api/stats',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.locator('#gateLanguageGrid button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden'});
    await page.waitForFunction(()=>document.querySelectorAll('#reportGrid a.report-card').length===2);

    const legacy=homepageIntegrityCases.find(item=>item.id==='disclosure-virginia-2024');
    const authored=homepageIntegrityCases.find(item=>item.id==='uap-archive-aaro-atmospheric-wakes-case');
    const legacyCard=page.locator('#reportGrid a[href="/archive/disclosure-virginia-2024"]');
    const authoredCard=page.locator('#reportGrid a[href="/archive/uap-archive-aaro-atmospheric-wakes-case"]');
    assert.equal(await legacyCard.locator('h3').textContent(),legacy.title.en);
    assert.equal(await legacyCard.locator('.desc').textContent(),legacy.summary.en);
    assert.equal(await legacyCard.locator('.archive-translation-disclosure').textContent(),
      'Оригинален текст на английски · автоматичният превод не е наличен');
    assert.doesNotMatch(await legacyCard.textContent(),/случай, описан в публичния каталог|Маркерът, ако има такъв/);
    assert.equal(await authoredCard.locator('h3').textContent(),authored.title.bg);
    assert.equal(await authoredCard.locator('.desc').textContent(),authored.summary.bg);
    assert.equal(await authoredCard.locator('.archive-translation-disclosure').count(),0,
      'an authored Bulgarian summary must remain Bulgarian without a false fallback warning');

    await page.locator('#langToggle').selectOption('de');
    await page.waitForFunction(()=>document.querySelector('#reportGrid a[href="/archive/disclosure-virginia-2024"] .archive-translation-disclosure')?.textContent===
      'Englischer Originaltext · Übersetzung nicht verfügbar');
    assert.equal(await legacyCard.locator('.desc').textContent(),legacy.summary.en);
    assert.equal(await authoredCard.locator('.desc').textContent(),authored.summary.en);
    assert.deepEqual(errors,[]);
    await context.close();
  });

  await test('M0 world atlas marks source-English case details and result previews in BG and DE', async () => {
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/data/cases.json',route=>route.fulfill({status:200,contentType:'application/json',body:homepageIntegrityArchive}));
    await page.route('**/api/stats',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.locator('#gateLanguageGrid button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden'});
    await page.locator('#worldMapResults [data-world-case-id="disclosure-virginia-2024"]').waitFor();
    await page.locator('#worldMapResults [data-world-case-id="disclosure-virginia-2024"]').click();

    const legacy=homepageIntegrityCases.find(item=>item.id==='disclosure-virginia-2024');
    const detail=page.locator('#worldCaseDetail');
    assert.equal(await detail.locator('h3').textContent(),legacy.title.en);
    assert.equal(await detail.locator('p').nth(1).textContent(),legacy.summary.en);
    assert.equal(await detail.locator('.world-translation-disclosure').count(),1);
    assert.equal(await detail.locator('.world-translation-disclosure').textContent(),
      'Оригинален текст на английски · автоматичният превод не е наличен');
    assert.equal(await page.locator('#worldMapResults [data-world-case-id="disclosure-virginia-2024"] .world-result-language').textContent(),
      'Оригинален текст на английски · автоматичният превод не е наличен');
    assert.doesNotMatch(await detail.textContent(),/случай, описан в публичния каталог|Маркерът, ако има такъв/);

    await page.locator('#langToggle').selectOption('de');
    await page.waitForFunction(()=>document.querySelector('#worldCaseDetail .world-translation-disclosure')?.textContent===
      'Englischer Originaltext · Übersetzung nicht verfügbar');
    assert.equal(await detail.locator('h3').textContent(),legacy.title.en);
    assert.equal(await detail.locator('p').nth(1).textContent(),legacy.summary.en);
    await page.locator('#langToggle').selectOption('en');
    await page.waitForFunction(()=>document.querySelector('#worldCaseDetail h3')?.textContent==='The Active Virginia Coast Case');
    assert.equal(await detail.locator('.world-translation-disclosure').count(),0);
    assert.deepEqual(errors,[]);
    await context.close();
  });

  await test('M0 language gate distinguishes interface language from dossier translation across all 18 locales', async () => {
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/`);
    const expected=[
      ['bg','ИНТЕРФЕЙС','Езикът на интерфейса се задава тук. Досиетата може да останат на английски, ако няма пълен превод.'],
      ['en','INTERFACE','This sets the interface language. Case files may remain in English when a complete translation is unavailable.'],
      ['de','OBERFLÄCHE','Hier wird die Sprache der Benutzeroberfläche festgelegt. Fallakten können auf Englisch bleiben, wenn keine vollständige Übersetzung verfügbar ist.'],
      ['ru','ИНТЕРФЕЙС','Здесь выбирается язык интерфейса. Досье может оставаться на английском, если полного перевода нет.'],
      ['zh-CN','界面','此选项设置界面语言。若没有完整译文，案例档案可能仍为英文。'],
      ['fr','INTERFACE','Cette option définit la langue de l’interface. Les dossiers peuvent rester en anglais lorsqu’aucune traduction complète n’est disponible.'],
      ['es','INTERFAZ','Esta opción establece el idioma de la interfaz. Los expedientes pueden seguir en inglés si no hay una traducción completa.'],
      ['it','INTERFACCIA','Questa scelta imposta la lingua dell’interfaccia. I dossier possono restare in inglese se non è disponibile una traduzione completa.'],
      ['pt','INTERFACE','Esta opção define o idioma da interface. Os dossiês podem permanecer em inglês quando não houver uma tradução completa.'],
      ['tr','ARAYÜZ','Bu seçim arayüz dilini belirler. Tam çeviri yoksa dosyalar İngilizce kalabilir.'],
      ['ro','INTERFAȚĂ','Această opțiune stabilește limba interfeței. Dosarele pot rămâne în engleză dacă nu este disponibilă o traducere completă.'],
      ['el','ΔΙΕΠΑΦΗ','Αυτή η επιλογή ορίζει τη γλώσσα διεπαφής. Οι φάκελοι μπορεί να παραμείνουν στα αγγλικά όταν δεν υπάρχει πλήρης μετάφραση.'],
      ['sr','ИНТЕРФЕЈС','Овде се бира језик интерфејса. Досијеи могу остати на енглеском ако пун превод није доступан.'],
      ['uk','ІНТЕРФЕЙС','Тут обирається мова інтерфейсу. Досьє можуть залишатися англійською, якщо повного перекладу немає.'],
      ['pl','INTERFEJS','Ten wybór ustawia język interfejsu. Akta mogą pozostać po angielsku, gdy pełne tłumaczenie nie jest dostępne.'],
      ['ar','الواجهة','يحدد هذا الخيار لغة الواجهة. قد تبقى ملفات القضايا باللغة الإنجليزية عند عدم توفر ترجمة كاملة.'],
      ['ja','インターフェース','この設定はインターフェースの言語を選びます。完全な翻訳がない場合、事例ファイルは英語のまま表示されることがあります。'],
      ['ko','인터페이스','이 설정은 인터페이스 언어를 선택합니다. 완전한 번역이 없으면 사례 기록은 영어로 표시될 수 있습니다.']
    ];
    const actualCodes=await page.locator('#gateLanguageGrid button').evaluateAll(buttons=>buttons.map(button=>button.dataset.language));
    assert.deepEqual(actualCodes,expected.map(([code])=>code));
    const mismatches=[];
    for(const [code,badge,disclaimer] of expected){
      const button=page.locator(`#gateLanguageGrid button[data-language="${code}"]`);
      const actualBadge=await button.locator('small').textContent();
      if(actualBadge!==badge)mismatches.push(`${code} badge: ${actualBadge}`);
      await button.click();
      const actualDisclaimer=await page.locator('#gateDisclaimer').textContent();
      if(actualDisclaimer!==disclaimer)mismatches.push(`${code} disclaimer: ${actualDisclaimer}`);
    }
    assert.deepEqual(mismatches,[],'language choices must describe interface localization, not claim full dossier translation');
    await context.close();
  });

  await test('world atlas follows approved D1 pagination beyond the first 250 cases', async () => {
    approvedFixtures = Array.from({ length: 251 }, (_, index) => ({
      id: `test-d1-${String(index).padStart(3, '0')}`,
      date: '2020-05-01', category: 'other', status: 'reported', country: 'GB',
      city: { en: `Fixture area ${index}`, bg: `Тестов район ${index}` },
      title: { en: index === 250 ? 'D1 page two sentinel' : `D1 fixture ${index}`, bg: `Тестов запис ${index}` },
      summary: { en: 'Test-only approved registry row.', bg: 'Само тестов запис от регистъра.' },
      source: { name: 'Fixture source', url: `https://example.org/source/${index}` },
      lat: null, lng: null
    }));
    caseOffsets.length = 0;
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('#worldMapCount')?.textContent === '266');
    assert.equal(await page.locator('#worldMapCount').textContent(), '266');
    assert.equal(await page.locator('#worldMapResults [data-world-case-id]').count(), 10, 'the result window should show ten cases');
    assert.equal(await page.locator('#worldMapResults button[data-page="2"]').count(),1,'numbered navigation exists');
    for (let pageNumber = 0; pageNumber < 4; pageNumber++) {
      await page.locator('#worldResultsNext').focus();
      await page.keyboard.press('Enter');
      assert.ok(await page.locator('#worldMapResults [data-world-case-id]').count() <= 10);
      const expectedFocus = 'worldResultsNext';
      assert.equal(await page.evaluate(() => document.activeElement.id), expectedFocus, 'pager keyboard focus should survive page replacement');
    }
    assert.equal(await page.locator('#worldMapResults [data-world-case-id]').count(), 10,'page four remains ten cases');
    await page.locator('#worldResultsPrevious').focus();
    await page.keyboard.press('Enter');
    assert.ok(await page.locator('#worldMapResults [data-world-case-id]').count() <= 10);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'worldResultsPrevious');
    assert.ok(caseOffsets.includes(250), `expected a second page request; offsets were ${caseOffsets.join(',')}`);
    await page.locator('#worldSearch').fill('D1 page two sentinel');
    assert.deepEqual(await page.locator('#worldMapResults [data-world-case-id]').evaluateAll((items) => items.map((item) => item.dataset.worldCaseId)), ['test-d1-250']);
    assert.deepEqual(errors, []);
    await context.close();
  });

  await test('world atlas flags an incomplete D1 page sequence instead of implying completion', async () => {
    approvedFixtures = Array.from({ length: 251 }, (_, index) => ({
      id: `test-d1-${String(index).padStart(3, '0')}`,
      date: '2020-05-01', category: 'other', status: 'reported', country: 'GB',
      city: { en: `Fixture area ${index}`, bg: `Тестов район ${index}` },
      title: { en: index === 250 ? 'D1 page two sentinel' : `D1 fixture ${index}`, bg: `Тестов запис ${index}` },
      summary: { en: 'Test-only approved registry row.', bg: 'Само тестов запис от регистъра.' },
      source: { name: 'Fixture source', url: `https://example.org/source/${index}` },
      lat: null, lng: null
    }));
    failAtOffset = 250;
    caseOffsets.length = 0;
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('#worldMapCount')?.textContent === '265');
    assert.match(await page.locator('#worldMapState').textContent(), /registry load is incomplete/i);
    assert.ok(caseOffsets.includes(250));
    await page.locator('#worldSearch').fill('D1 fixture 249');
    assert.deepEqual(await page.locator('#worldMapResults [data-world-case-id]').evaluateAll((items) => items.map((item) => item.dataset.worldCaseId)), ['test-d1-249']);
    assert.deepEqual(errors, []);
    await context.close();
    failAtOffset = null;
  });

  await test('world atlas preserves successful D1 pages when a later page payload is null', async () => {
    approvedFixtures = Array.from({ length: 251 }, (_, index) => ({
      id: `test-d1-${String(index).padStart(3, '0')}`,
      date: '2020-05-01', category: 'other', status: 'reported', country: 'GB',
      city: { en: `Fixture area ${index}`, bg: `Тестов район ${index}` },
      title: { en: index === 250 ? 'D1 page two sentinel' : `D1 fixture ${index}`, bg: `Тестов запис ${index}` },
      summary: { en: 'Test-only approved registry row.', bg: 'Само тестов запис от регистъра.' },
      source: { name: 'Fixture source', url: `https://example.org/source/${index}` },
      lat: null, lng: null
    }));
    failAtOffset = null;
    nullAtOffset = 250;
    caseOffsets.length = 0;
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${port}/`);
      await page.locator('button[data-language="en"]').click();
      await page.locator('#gateContinue').click();
      await page.locator('#languageGate').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.querySelector('#worldMapState')?.textContent.includes('registry load is incomplete'));
      assert.equal(await page.locator('#worldMapCount').textContent(), '265');
      assert.ok(caseOffsets.includes(250));
      await page.locator('#worldSearch').fill('D1 fixture 249');
      assert.deepEqual(await page.locator('#worldMapResults [data-world-case-id]').evaluateAll((items) => items.map((item) => item.dataset.worldCaseId)), ['test-d1-249']);
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
      nullAtOffset = null;
    }
  });

  await test('world atlas flags unknown registry completeness while preserving sourced archive data', async () => {
    approvedFixtures = [unknownLocation];
    failAtOffset = null;
    statsFailure = true;
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('#worldMapCount')?.textContent === '15');
    assert.match(await page.locator('#worldMapState').textContent(), /registry load is incomplete/i);
    assert.equal(await page.locator('#worldMapResults [data-world-case-id="phoenix-1997"]').count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
    statsFailure = false;
  });

  await test('world atlas preserves focused results across late registry enrichment', async () => {
    approvedFixtures = [unknownLocation];
    failAtOffset = null;
    nullAtOffset = null;
    statsFailure = false;
    statsIncludesDemo = false;
    let releaseStats;
    const statsGate = new Promise((resolveStats) => { releaseStats = resolveStats; });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      const errors = [];
      await page.route('**/api/stats', async (route) => { await statsGate; await route.continue(); });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${port}/`);
      await page.locator('button[data-language="en"]').click();
      await page.locator('#gateContinue').click();
      await page.locator('#languageGate').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.querySelector('#worldMapCount')?.textContent === '15');
      await page.locator('#worldMapResults [data-world-case-id="phoenix-1997"]').focus();
      assert.equal(await page.evaluate(() => document.activeElement.dataset.worldCaseId), 'phoenix-1997');
      releaseStats();
      await page.waitForFunction(() => document.querySelector('#worldMapCount')?.textContent === '16');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.worldCaseId), 'phoenix-1997');
      assert.deepEqual(errors, []);
    } finally {
      releaseStats();
      await context.close();
    }
  });

  await test('world atlas falls back to the results list when late records move a focused case outside the window', async () => {
    approvedFixtures = Array.from({ length: 61 }, (_, index) => ({
      id: `test-d1-focus-${String(index).padStart(3, '0')}`,
      date: '2099-01-01', category: 'other', status: 'reported', country: 'GB',
      city: { en: `Late fixture area ${index}`, bg: `Късен тестов район ${index}` },
      title: { en: `Late D1 focus fixture ${index}`, bg: `Късен тестов запис ${index}` },
      summary: { en: 'Test-only approved registry row.', bg: 'Само тестов запис от регистъра.' },
      source: { name: 'Fixture source', url: `https://example.org/focus/${index}` },
      lat: null, lng: null
    }));
    failAtOffset = null;
    nullAtOffset = null;
    statsFailure = false;
    statsIncludesDemo = false;
    let releaseStats;
    const statsGate = new Promise((resolveStats) => { releaseStats = resolveStats; });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      const errors = [];
      await page.route('**/api/stats', async (route) => { await statsGate; await route.continue(); });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${port}/`);
      await page.locator('button[data-language="en"]').click();
      await page.locator('#gateContinue').click();
      await page.locator('#languageGate').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.querySelector('#worldMapCount')?.textContent === '15');
      await page.locator('#worldMapResults [data-world-case-id="phoenix-1997"]').focus();
      releaseStats();
      await page.waitForFunction(() => document.querySelector('#worldMapCount')?.textContent === '76');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'worldMapResults');
      assert.equal(await page.locator('#worldMapResults').getAttribute('tabindex'), '-1');
      assert.deepEqual(errors, []);
    } finally {
      releaseStats();
      await context.close();
    }
  });

  await test('world atlas signals unknown completeness when D1 stats include demo records', async () => {
    approvedFixtures = [unknownLocation];
    failAtOffset = null;
    nullAtOffset = null;
    statsFailure = false;
    statsIncludesDemo = true;
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${port}/`);
      await page.locator('button[data-language="en"]').click();
      await page.locator('#gateContinue').click();
      await page.locator('#languageGate').waitFor({ state: 'hidden' });
      await page.waitForFunction(() => document.querySelector('#worldMapCount')?.textContent === '15');
      assert.match(await page.locator('#worldMapState').textContent(), /registry load is incomplete/i);
      assert.equal(await page.locator('#worldMapResults [data-world-case-id="phoenix-1997"]').count(), 1);
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
      statsIncludesDemo = false;
    }
  });
} finally {
  if (browser) await browser.close();
  await new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose()));
}
