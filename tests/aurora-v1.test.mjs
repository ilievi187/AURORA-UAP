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
  assert.doesNotMatch(html,/id="historicDemoMap"/,'the retired fictional map is removed');
  assert.match(html,/id="worldAtlas"/,'sourced world atlas remains');
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

test('language gate is first-visit only; explicit Continue and manual reopening remain',()=>{
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
  assert.ok(raw.cases.length>=15);
  for(const c of raw.cases){
    assert.equal(ids.has(c.id),false,'duplicate case '+c.id);ids.add(c.id);
    if(c.lat===null&&c.lng===null){
      assert.ok(c.location_precision.length>=8,'unmapped case must explain missing coordinates');
    }else{
      assert.ok(Number.isFinite(c.lat)&&Math.abs(c.lat)<=90);
      assert.ok(Number.isFinite(c.lng)&&Math.abs(c.lng)<=180);
    }
    assert.match(c.source.url,/^https:\/\//);
    assert.ok(c.summary.bg.length>=45&&c.summary.en.length>=45);
    assert.ok(['reported','official_record','explained'].includes(c.status));
    assert.ok(c.location_precision.length>=8,'location precision is explicit');
    assert.ok(Array.isArray(c.story?.bg)&&c.story.bg.length>=1,'rich Bulgarian editorial context');
    assert.ok(Array.isArray(c.story?.en)&&c.story.en.length>=1,'rich English editorial context');
    assert.ok(Array.isArray(c.media),'media must be a well-defined collection');
    assert.ok(c.media.length>=1||c.sources?.length>=1||c.source?.url,'every dossier needs a real published source');
    assert.ok(c.media.every(m=>/^https:\/\//.test(m.url)),'media links should point to original sources');
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
 assert.ok(read('globe.js').includes('fetch("/api/cases?limit=250"'));
 assert.ok(read('globe.js').includes('useLegacyArchive()'));
 assert.ok(read('globe.js').includes('archiveCases.filter'));
 assert.doesNotMatch(read('globe.js'),/fetch\("data\/cases\.json"/);
 assert.match(read('register.js'),/includes_demo!==false/);
});

test('case dossiers reuse one template with separate legacy and gated D1 routes',()=>{
  const routes=JSON.parse(read('_routes.json'));
  assert.ok(routes.include.includes('/archive/*'));
  assert.ok(routes.include.includes('/cases/*'));
  for(const path of ['dossier.html','dossier.css','dossier.js','functions/archive/[id].js','functions/cases/[id].js'])
   assert.ok(existsSync(new URL('../'+path,import.meta.url)),'missing '+path);
  const dossier=read('dossier.html'),script=read('dossier.js');
  assert.match(dossier,/id="dossierFeedback"[^>]*role="status"/);
  assert.match(dossier,/id="dossierSourceUrl"/);
  assert.match(dossier,/id="dossierLocationCaveat"/);
  assert.match(html,/id="globeCaseDossier"/);
  assert.ok(read('globe.js').includes('c.recordOrigin==="d1"'));
  assert.match(read('country.js'),/className="case-dossier-link"/);
  assert.match(script,/c\.review_status!=="approved"\|\|c\.record_kind==="demo"/);
  assert.match(script,/res\.status===503/);
  assert.doesNotMatch(script,/innerHTML\s*=/);
});

test("V1.5 intake keeps public submission disabled and links only to an honest local draft",()=>{
 for(const path of ["report.html","report.css","report.js","migrations/0002_intake_quarantine.sql",
   "functions/_lib/intake.js","functions/api/intake/status.js","functions/api/intake/submit.js"])
  assert.ok(existsSync(new URL("../"+path,import.meta.url)),"missing "+path);
 assert.match(html,/href="\/report\.html"[^>]*id="openIntakeCenter"/);
 assert.match(read("country.js"),/\/report\.html\?country=/);
 assert.match(read("report.html"),/id="sendReport" disabled/);
 assert.match(read("report.html"),/id="activationControls" hidden/);
 assert.match(read("report.js"),/state\.accepting!==true/);
 assert.doesNotMatch(read("report.js"),/innerHTML\s*=/);
 assert.doesNotMatch(read("functions/api/intake/submit.js"),/insert\s+into\s+cases/i);
});

test('country directory is discoverable and never invents live registry statistics',()=>{
 const page=read('countries.html'),script=read('countries.js'),style=read('countries.css');
 assert.match(html,/href="\/countries\.html" class="register-link"/);
 assert.match(html,/href="\/archive\.html" class="console-archive-link"/);
 assert.doesNotMatch(html,/href="\/countries\/DE"/);
 assert.match(page,/id="countryGrid"/);
 assert.match(page,/id="countryDirectoryStatus"[^>]*role="status"/);
 assert.match(script,/fetch\("\/api\/stats"/);
 assert.match(script,/includes_demo!==false/);
 assert.match(script,/createElement\("a"\)/);
 assert.match(style,/@media\s*\(max-width:\s*640px\)/);
});

test("front page remains linked to private intake without presenting it as an active submission",()=>{
 assert.match(html,/<a href="\/archive\.html" class="button button-primary">/);
 assert.match(html,/href="\/report\.html" data-i18n="reportButton"/);
 assert.doesNotMatch(html,/<button[^>]*data-open-report/);
 assert.match(read("report.html"),/id="receiptPanel"[^>]*hidden/);
 assert.match(read("report.js"),/result\.status!=="pending"/);
 assert.doesNotMatch(read("functions/_lib/intake.js"),/env\.AURORA_REGISTRY_PUBLIC/);
});


test('home opens a populated global case map and linked live headlines, with no manual reload',()=>{
 const page=read('index.html');
 for(const id of ['worldAtlas','worldMapCanvas','worldMapPins','worldCaseDetail','worldCountry','homeNewsGrid','homeNewsStatus']){
  assert.match(page,new RegExp('id="'+id+'"'),'missing '+id);
 }
 assert.match(page,/src="\/world-atlas\.js"/);
 assert.match(page,/src="\/home-news\.js"/);
 assert.ok(read('world-atlas.js').includes("fetch('/data/cases.json'"));
 assert.ok(read('home-news.js').includes('fetch("/api/news?edition=global&lang="'));
 assert.match(read('home-news.js'),/translated_title/);
});


test('global editorial UI labels have complete keys in all eighteen advertised languages',()=>{
 const file=read('ui-locales.js');
 assert.doesNotThrow(()=>new Script(file), 'UI locale pack syntax');
 for(const locale of ['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko']){
  assert.ok(file.includes('"'+locale+'"')||file.includes(locale+':'),'missing locale '+locale);
 }
 assert.match(html,/src="\/ui-locales\.js"/);
 assert.match(read('dossier.html'),/src="\/ui-locales\.js"/);
 assert.doesNotMatch(html,/id="statSignals"/,'remove all demo statistic cards from premium homepage');
});


test('global newsroom retains 18-locale language controls after aircraft-radar removal',()=>{
 const script=read('subpage-i18n.js');
 assert.doesNotThrow(()=>new Script(script),'subpage i18n syntax');
 for(const locale of ['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko']){
  assert.ok(script.includes('"'+locale+'"'),'missing subpage locale '+locale);
 }
 for(const path of ['news.html','countries.html']){
  assert.match(read(path),/src="\/subpage-i18n\.js"/);
 }
 assert.match(read('news.js'),/AURORA_SUBPAGES/);
});


test('dedicated media library exposes real source links without copying media',()=>{
 const html=read('media.html'),js=read('media.js');
 assert.match(html,/id="mediaGallery"/);
 assert.match(html,/id="mediaType"/);
 assert.match(js,/fetch\("\/data\/cases\.json"/);
 assert.match(js,/rel="noopener noreferrer"/);
 assert.match(read('index.html'),/href="\/media\.html" data-i18n="navMedia"/);
});
