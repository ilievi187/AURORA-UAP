import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html');

test('entry route includes full-viewport accessible language picker',()=>{
  assert.match(html,/id="languageGate"[^>]+role="dialog"[^>]+aria-modal="true"/);
  assert.match(html,/id="gateLanguageGrid"/);
  assert.match(html,/id="openLanguageGate"/);
  assert.match(html,/id="gateContinue"[^>]+disabled/);
  assert.match(html,/id="gateCanvas"/);
  assert.match(html,/id="heroHudCanvas"/);
  assert.match(read('aurora-v1.js'),/localStorage\.setItem\("aurora-lang"/);
});

test('cinematic visual assets load from repository',()=>{
  assert.match(html,/href="aurora-v1\.css"/);
  assert.match(html,/src="aurora-v1\.js"/);
  assert.match(html,/class="orbital-stage"/);
  for(const name of ['aurora-v1.css','aurora-v1.js','jarvis-hud.css','jarvis-hud.js','mission-control.css','mission-control.js','assets/hero-ufo.webp','assets/favicon.svg']){
    assert.ok(existsSync(new URL('../'+name,import.meta.url)),name+' missing');
  }
});

test('no duplicate HTML ids or broken in-page links',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length);
  const links=[...html.matchAll(/href="#([^"]+)"/g)].map(x=>x[1]);
  links.forEach(id=>assert.ok(ids.includes(id),'Missing #'+id));
});

test('Javascript syntax parses without external toolchain',()=>{
  for(const file of ['script.js','i18n-extra.js','aurora-v1.js','jarvis-hud.js','mission-control.js','globe.js','register.js','country.js','donate.js','donate-i18n.js','payment-config.js']){
    assert.doesNotThrow(()=>new Script(read(file),{filename:file}),file);
  }
});

test('visitors are never misled into thinking example cases are verified',()=>{
  assert.match(html,/Демонстрационни локации/);
  assert.match(html,/нищо не се изпраща към сървър/);
  assert.match(read('payment-config.js'),/AURORA_PAYMENT_LINK\s*=\s*null/);
});

test('motion respects reduced-motion accessibility preference',()=>{
  assert.match(read('aurora-v1.css'),/prefers-reduced-motion:reduce/);
  assert.match(read('aurora-v1.js'),/prefers-reduced-motion: reduce/);
});

test('Cloudflare Pages remains configured as a static site',()=>{
  assert.ok(existsSync(new URL('../index.html',import.meta.url)));
  assert.ok(existsSync(new URL('../_headers',import.meta.url)));
});

test('language gate is mandatory even when saved and Continue is a separate click',()=>{
  const source=read('aurora-v1.js');
  assert.match(source,/openGate\(true\)/);
  assert.match(source,/continueButton\.addEventListener\("click",continueToAurora\)/);
  assert.match(source,/function selectLanguage\(code\)/);
  assert.doesNotMatch(source,/if\(!stored\|\|!languages\.some\(x=>x\[0\]===stored\)\)openGate\(\)/);
});
test('real procedural HUD is present and honors OS reduced-motion',()=>{
  assert.match(html,/src="jarvis-hud\.js"/);
  assert.match(html,/href="jarvis-hud\.css"/);
  assert.match(read('jarvis-hud.js'),/requestAnimationFrame/);
  assert.match(read('jarvis-hud.js'),/prefers-reduced-motion: reduce/);
  assert.match(read('jarvis-hud.css'),/gate-scan-line/);
});

test('Mission Control v1.2 has working semantic navigation and progressive workflow controls',()=>{
  assert.match(html,/id="control"/);
  assert.match(html,/id="controlTabs" role="tablist"/);
  assert.match(html,/id="controlPanel" role="tabpanel"/);
  assert.match(html,/id="controlNext"/);
  assert.match(html,/id="controlCaseButtons"/);
  assert.match(html,/href="mission-control\.css"/);
  assert.match(html,/src="mission-control\.js"/);
  assert.match(read('mission-control.js'),/next\.addEventListener\("click"/);
  assert.match(read('mission-control.js'),/function activate\(index/);
  assert.match(read('mission-control.css'),/prefers-reduced-motion:reduce/);
  assert.match(read('mission-control.css'),/mc-pin-pulse/);
});

test('V1.3 globe is self-hosted and integrates a sourced case atlas',()=>{
  assert.match(html,/id="caseGlobe"/);
  assert.match(html,/id="globePins"/);
  assert.match(html,/id="globeCaseList"/);
  assert.match(html,/id="globeCaseSource"/);
  assert.match(html,/id="globeFilter"/);
  assert.match(html,/href="globe\.css"/);
  assert.match(html,/src="globe\.js"/);
  assert.ok(existsSync(new URL('../globe.css',import.meta.url)));
  assert.ok(existsSync(new URL('../data/cases.json',import.meta.url)));
  assert.ok(existsSync(new URL('../data/earth-land.json',import.meta.url)));
});
test('case data has sourced prose, conservative statuses and approximate map anchors',()=>{
  const raw=JSON.parse(read('data/cases.json'));
  const ids=new Set();
  assert.ok(raw.cases.length>=7);
  for(const c of raw.cases){
    assert.equal(ids.has(c.id),false,'duplicate case '+c.id);ids.add(c.id);
    assert.ok(Number.isFinite(c.lat)&&Math.abs(c.lat)<=90);
    assert.ok(Number.isFinite(c.lng)&&Math.abs(c.lng)<=180);
    assert.match(c.source.url,/^https:\/\//);
    assert.ok(c.summary.bg.length>=45&&c.summary.en.length>=45);
    assert.ok(['reported','official_record','explained'].includes(c.status));
    assert.ok(c.location_precision.length>=8,'location precision is explicit');
  }
});
test('globe respects reduced motion and links to external sources safely',()=>{
  assert.match(read('globe.js'),/prefers-reduced-motion: reduce/);
  assert.match(read('globe.js'),/target/); // source link target is in HTML
  assert.match(read('globe.css'),/prefers-reduced-motion:reduce/);
  assert.match(html,/target="_blank" rel="noopener noreferrer"/);
});

test('V1.4 static country template, D1 APIs and real register controls exist',()=>{
 for(const path of ['country.html','country.js','country.css','register.js','register.css',
 'migrations/0001_init.sql','data/imports/aaro-reviewed.json','functions/api/cases.js',
 'functions/api/stats.js','functions/api/cases/[id].js','functions/api/countries/[code].js',
 'functions/countries/[code].js','functions/_lib/public.js','worker/scheduled.js','worker/import-core.js']){
  assert.ok(existsSync(new URL('../'+path,import.meta.url)),'missing '+path);
 }
 assert.match(html,/id="registeredSightings"/);
 assert.match(html,/id="registeredCountries"/);
 assert.match(html,/id="lastSync"/);
 assert.match(html,/id="globeCountry"/);
 assert.match(html,/id="globeYear"/);
 assert.match(read('globe.js'),/fetch\("\/api\/cases\?limit=250"/);
 assert.doesNotMatch(read('globe.js'),/fetch\("data\/cases\.json"/);
 assert.match(read('register.js'),/includes_demo!==false/);
});
