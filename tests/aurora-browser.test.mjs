import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { DatabaseSync } from 'node:sqlite';
import { importReviewed } from '../worker/import-core.js';
import {onRequestGet as listCases} from '../functions/api/cases.js';
import {onRequestGet as listStats} from '../functions/api/stats.js';
import {onRequestGet as countryStats} from '../functions/api/countries/[code].js';
import {onRequestGet as oneCase} from '../functions/api/cases/[id].js';


const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
// Legacy globe/navigation suites intentionally use the 15 curated editorial fixtures.
// The full licensed multi-provider archive is verified in archive-directory tests.
const curatedArchive=(()=>{const {cases,...meta}=JSON.parse(readFileSync(new URL('../data/cases.json',import.meta.url)));return JSON.stringify({...meta,cases:cases.filter(c=>!c.provenance?.automated).sort((a,b)=>a.id==='phoenix-1997'?-1:b.id==='phoenix-1997'?1:0)});})();
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain'};
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(await readFile(join(root,'migrations/0001_init.sql'),'utf8'));
const db={
 prepare(query){
  const stmt=sqlite.prepare(query);
  const statement=(args=[])=>({
   bind(...values){return statement(values)},
   async run(){return stmt.run(...args)},
   async first(){return stmt.get(...args)||null},
   async all(){return {results:stmt.all(...args)}}
  });
  return statement();
 },
 async batch(statements){
  sqlite.exec("BEGIN IMMEDIATE TRANSACTION");
  try{
   const results=[];
   for(const stmt of statements)results.push(await stmt.run());
   sqlite.exec("COMMIT");
   return results;
  }catch(error){
   sqlite.exec("ROLLBACK");
   throw error;
  }
 }
};
await importReviewed(db,JSON.parse(await readFile(join(root,'data/imports/aaro-reviewed.json'),'utf8')));

const server=createServer(async(req,res)=>{
  const path=(req.url||'/').split('?')[0];
  if(path==='/data/cases.json'){res.writeHead(200,{'Content-Type':'application/json'}).end(curatedArchive);return;}
  const decoded=decodeURIComponent(path);
  if(decoded.startsWith('/api/')){
    const url=new URL(req.url,'http://127.0.0.1');
    let response;
    if(decoded==='/api/stats')response=await listStats({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"}});
    else if(decoded==='/api/cases')response=await listCases({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"},request:new Request(url)});
    else if(/^\/api\/countries\/[A-Za-z]{2}$/.test(decoded))response=await countryStats({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"},params:{code:decoded.slice(-2)}});
    else if(decoded.startsWith('/api/cases/'))response=await oneCase({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"},params:{id:decoded.split('/').at(-1)}});
    else response=new Response('Not found',{status:404});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
  }
  const resolved=/^\/news\/?$/.test(decoded)?'/news.html':
    /^\/countries\/[A-Za-z]{2}$/.test(decoded)?'/country.html':
    /^\/(?:cases|archive)\/[a-z0-9-]{3,90}$/.test(decoded)?'/dossier.html':decoded;
  const filename=resolve(join(root,resolved==='/'?'index.html':resolved.replace(/^\/+/,'')));
  if(filename!==root&&!filename.startsWith(root+sep)){res.writeHead(403).end();return}
  try{
    const data=await readFile(filename);
    res.writeHead(200,{'Content-Type':mime[filename.slice(filename.lastIndexOf('.'))]||'application/octet-stream'}).end(data);
  }catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
let browser;
try{
  browser=await chromium.launch({headless:true});
  await test("news automatically renders generated language text and exposes original title",async()=>{
    const ctx=await browser.newContext({viewport:{width:1200,height:800},reducedMotion:"reduce"});
    const page=await ctx.newPage(),errors=[],queryLanguages=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/api/news?*",route=>{
      const u=new URL(route.request().url()),lang=u.searchParams.get("lang");
      queryLanguages.push(lang);
      route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
       status:"live",edition:"global",updated_at:new Date().toISOString(),
       items:[{title:"UFO recorded in the sky",translated_title:lang==="es"?"OVNI grabado en el cielo":"НЛО заснето в небето",
       url:"https://publisher.example.test/story",source:"Example Press",published:new Date().toISOString(),language:"en"}],
       translation:{target:lang,status:"translated",translated:1}
      })});
    });
    await page.goto("http://127.0.0.1:"+port+"/news.html");
    await page.waitForFunction(()=>document.querySelector(".live-card h2 a")?.textContent==="НЛО заснето в небето");
    assert.equal(await page.locator(".news-original p").textContent(),"UFO recorded in the sky");
    await page.locator("#pageLanguage").selectOption("es");
    await page.waitForFunction(()=>document.querySelector(".live-card h2 a")?.textContent==="OVNI grabado en el cielo");
    assert.equal(await page.locator(".live-card h2 a").getAttribute("href"),"https://publisher.example.test/story");
    assert.ok(queryLanguages.includes("bg")&&queryLanguages.includes("es"));
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test("search translates matching headlines outside the initial page, including Show More",async()=>{
    const ctx=await browser.newContext({viewport:{width:1200,height:800},reducedMotion:"reduce"});
    const page=await ctx.newPage(),errors=[],offsets=[];
    const entries=Array.from({length:48},(_,i)=>({
      title:i<16?"Routine coverage "+i:"Special sighting "+i,
      url:"https://publisher.example.test/story/"+i,
      source:"Example Press",published:new Date().toISOString(),language:"en"
    }));
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/api/news?*",route=>{
      const u=new URL(route.request().url()),offset=Number(u.searchParams.get("offset")||"0");
      offsets.push(offset);
      const items=entries.map((item,i)=>i>=offset&&i<offset+12?
        {...item,translated_title:"ПРЕВОД "+item.title}:item);
      return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
        status:"live",edition:"global",updated_at:"2026-10-28T12:00:00Z",items,
        translation:{target:"bg",status:"translated",translated:12}
      })});
    });
    await page.goto("http://127.0.0.1:"+port+"/news.html");
    await page.locator("#newsSearch").fill("Special sighting");
    await page.waitForFunction(()=>document.querySelector(".live-card h2 a")?.textContent==="ПРЕВОД Special sighting 16");
    assert.equal(await page.locator(".live-card").count(),12);
    assert.ok(offsets.includes(12)&&offsets.includes(24),"search must translate matching source pages, not filtered positions");
    await page.locator("#showMoreNews").click();
    await page.waitForFunction(()=>[...document.querySelectorAll(".live-card h2 a")]
      .some(link=>link.textContent==="ПРЕВОД Special sighting 39"));
    assert.equal(await page.locator(".live-card").count(),24);
    assert.ok(offsets.includes(36),"filtered Show More must translate subsequent source pages");
    assert.equal(await page.locator(".live-card h2 a").last().getAttribute("href"),
      "https://publisher.example.test/story/39");
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('localized news and country archive keep language across navigation without reopening the welcome gate',async()=>{
    const ctx=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/news');
    await page.locator('#pageLanguage').selectOption('es');
    assert.equal(await page.locator('html').getAttribute('lang'),'es');
    assert.equal(await page.locator('.live-hero h1').textContent(),'NOTICIAS UAP DEL MUNDO');
    assert.equal(await page.title(),'NOTICIAS UAP DEL MUNDO | AURORA UAP');
    await page.goto('http://127.0.0.1:'+port+'/countries.html');
    assert.equal(await page.locator('#pageLanguage').inputValue(),'es');
    assert.equal(await page.locator('html').getAttribute('lang'),'es');
    await page.goto('http://127.0.0.1:'+port+'/');
    assert.equal(await page.locator('#languageGate').isVisible(),false,'home must remember language after subpage');
    assert.equal(await page.locator('html').getAttribute('lang'),'es');
    await page.locator('#openLanguageGate').click();
    assert.equal(await page.locator('#languageGate').isVisible(),true,'manual language selection remains available');
    assert.deepEqual(errors,[],'no page errors during cross-page language navigation');
    await ctx.close();
  });
  await test('first visit asks once and returning visitors enter with saved language',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    assert.equal(await page.locator('#languageGate').isVisible(),true,'welcome must be visible');
    assert.equal(await page.locator('#gateContinue').isDisabled(),true,'continue locked before selection');
    await page.locator('button[data-language="bg"]').click();
    assert.equal(await page.locator('#languageGate').isVisible(),true,'language click must not enter site');
    assert.equal(await page.locator('#gateContinue').isEnabled(),true);
    assert.equal(await page.locator('button[data-language="bg"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#gateContinueLabel').textContent(),'ПРОДЪЛЖИ');
    const hasCanvas=await page.locator('#gateCanvas').evaluate(el=>{
      const {data}=el.getContext('2d').getImageData(0,0,el.width,el.height);
      for(let i=3;i<data.length;i+=4)if(data[i]>0)return true;
      return false;
    });
    assert.equal(hasCanvas,true,'gate must render actual HUD pixels');
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:2500});
    assert.equal(await page.locator('html').getAttribute('lang'),'bg');
    assert.equal(await page.locator('.site-shell').getAttribute('inert'),null);
    await page.reload();
    assert.equal(await page.locator('#languageGate').isVisible(),false,'welcome must not reappear after choosing language');
    assert.equal(await page.locator('html').getAttribute('lang'),'bg');
    await page.goto('http://127.0.0.1:'+port+'/news.html');
    await page.goBack();
    assert.equal(await page.locator('#languageGate').isVisible(),false,'returning from another page must not prompt again');
    await page.locator('#openLanguageGate').click();
    assert.equal(await page.locator('#languageGate').isVisible(),true);
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:2500});
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.deepEqual(errors,[],'no unhandled JavaScript errors');
    await context.close();
  });
  await test('mobile and reduced-motion entry remain functional',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    assert.equal(await page.locator('#languageGate').isVisible(),true);
    await page.locator('button[data-language="fr"]').click();
    assert.equal(await page.locator('#gateContinue').isEnabled(),true);
    assert.equal(await page.locator('#gateContinueLabel').textContent(),'CONTINUER');
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1000});
    assert.equal(await page.locator('html').getAttribute('lang'),'fr');
    assert.equal(await page.locator('#heroHudCanvas').count(),1);
    const animation=await page.locator('.gate-scanner-beam').evaluate(el=>getComputedStyle(el,'::before').animationName);
    assert.equal(animation,'none');
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('Mission Control demo tabs, localized steps and case shortcuts work in a real browser',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1500});

    assert.equal(await page.locator('a[href="#control"]').count(),2,'mobile and footer retain Mission Control navigation; cinematic desktop header is deliberately minimal');
    assert.equal(await page.locator('#controlHeading').textContent(),'MISSION CONTROL');
    assert.equal(await page.locator('#controlTabs [role="tab"]').count(),4);
    assert.equal(await page.locator('#controlTab0').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Document the observation');
    await page.locator('#controlTab1').click();
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Check known explanations');
    assert.equal(await page.locator('#controlTab1').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('#controlPanel').getAttribute('aria-labelledby'),'controlTab1');
    await page.locator('#controlNext').click();
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Analyze the evidence');
    await page.locator('#controlTab2').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Communicate conclusions');
    await page.locator('#controlTab3').focus();
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Document the observation');
    assert.equal(await page.locator('#controlCaseButtons button').count(),3);
    await page.locator('#controlCaseButtons button').first().click();
    assert.equal(await page.locator('#caseDialog').evaluate(el=>el.open),true,'demo case dialog is opened');
    await page.locator('#caseClose').click();

    assert.equal(await page.locator('#historicDemoMap').count(),0);
    assert.equal(await page.locator('.prototype-notice').count(),0);
    assert.equal(await page.locator('#worldMapCanvas').count(),1,'sourced atlas stays visible');
    assert.equal(await page.locator('a[href="/archive.html"].button-primary').count(),1);
    assert.deepEqual(errors,[]);
    await context.close();
  });

  await test('mobile Mission Control fits viewport and works with translated controls',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1000});
    assert.equal(await page.locator('#controlHeading').textContent(),'КОМАНДЕН ЦЕНТЪР');
    await page.locator('#controlTab3').click();
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Публикуване на заключение');
    assert.equal(await page.locator('#controlVisualStage').textContent(),'4');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,'no unintended horizontal overflow: '+overflow);
    const animation=await page.locator('.globe-shell').evaluate(el=>getComputedStyle(el,'::before').animationName);
    assert.equal(animation,'none','respects reduced-motion preference');
    assert.deepEqual(errors,[]);
    await context.close();
  });

  await test('world globe shows sourced 15-case archive plus published D1 entries',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1200});
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length>=15);
    await page.waitForFunction(()=>!!document.querySelector('#globeCaseList button[data-case-id="aaro-pr-2013"]'));
    await page.waitForFunction(()=>document.querySelector('#registeredSightings')?.textContent==='3');
    assert.equal(await page.locator('#registeredCountries').textContent(),'3');
    assert.equal(await page.locator('#globeCountry option[value="PR"]').count(),1);
    assert.equal(await page.locator('#globeYear option[value="2013"]').count(),1);
    assert.ok((await page.locator('#globeCaseStatus').textContent()).length>0);
    assert.ok((await page.locator('#globeCaseList button').count())>=15);
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Светлините над Финикс');
    await page.locator('#globeCaseList button[data-case-id="aaro-pr-2013"]').click();
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Инфрачервени обекти над Пуерто Рико');
    assert.equal(await page.locator('#globeCaseSource').getAttribute('rel'),'noopener noreferrer');
    assert.ok((await page.locator('#globeCaseSource').getAttribute('href')).includes('aaro.mil/'));
    assert.equal(await page.locator('#globeCaseCountry').getAttribute('href'),'/countries/PR');
    const opaque=await page.locator('#caseGlobe').evaluate(canvas=>canvas.getContext('2d').getImageData(220,220,1,1).data[3]>0);
    assert.equal(opaque,true);
    await page.locator('#globeFilter').selectOption('lights');
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length>=1);
    await page.locator('#globeFilter').selectOption('all');
    await page.locator('#globeCountry').selectOption('IQ');
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length>=1 && !!document.querySelector('#globeCaseList button[data-case-id="aaro-iraq-2017"]'));
    await page.locator('#globeCaseList button[data-case-id="aaro-iraq-2017"]').click();
    assert.equal(await page.locator('#globeCaseCountry').getAttribute('href'),'/countries/IQ');
    await page.locator('#globeRotate').click();
    assert.equal(await page.locator('#globeRotate').getAttribute('aria-pressed'),'true');
    await page.locator('#globeLeft').click();
    await page.locator('#globeRight').click();
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('country directory uses approved D1 stats, filters and fits small screens',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/countries.html');
    await page.locator('#countryGrid a[href="/countries/PR"]').waitFor();
    assert.equal(await page.locator('#countryDirectoryStatus').getAttribute('data-state'),'ready');
    assert.equal(await page.locator('#countryGrid a[href="/countries/PR"]').count(),1);
    await page.locator('#countrySearch').fill('PR');
    assert.equal(await page.locator('#countryGrid a').count(),1);
    assert.equal(await page.locator('#countryGrid a').first().getAttribute('href'),'/countries/PR');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,'country directory must not overflow mobile viewport: '+overflow);
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('V1.4 desktop country route and Germany empty state use real SQLite backend',async()=>{
    const context=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/countries/DE');
    await page.waitForFunction(()=>document.querySelector('#countryTotal')?.textContent==='0');
    assert.equal(await page.locator('#countryCases .case-card').count(),0);
    assert.ok((await page.locator('#countryName').textContent()).length>0);
    await page.locator('#chooseCountry').selectOption('PR');
    await page.waitForURL('**/countries/PR');
    await page.waitForFunction(()=>document.querySelector('#countryTotal')?.textContent==='1');
    assert.equal(await page.locator('#countryCases .case-card').count(),1);
    await page.locator('#countryCases .case-card').click();
    assert.equal(await page.locator('.case-details').isVisible(),true);
    assert.equal(await page.locator('.case-details .case-dossier-link').getAttribute('href'),'/cases/aaro-pr-2013');
    assert.ok((await page.locator('.case-details a[target="_blank"]').getAttribute('href')).startsWith('https://www.aaro.mil/'));
    assert.equal(await page.locator('#reportLink').getAttribute('href'),'/report.html?country=PR');
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('V1.4 mobile country explorer and globe do not overflow or expose DEMO totals',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/countries/IQ');
    await page.waitForFunction(()=>document.querySelector('#countryTotal')?.textContent==='1');
    assert.equal(await page.locator('#countryCases .case-card').count(),1);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,'country overflow: '+overflow);
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1000});
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length>=15);
    await page.waitForFunction(()=>!!document.querySelector('#globeCaseList button[data-case-id="aaro-pr-2013"]'));
    await page.locator('#globeFilter').selectOption('instrument');
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length>=6);
    assert.equal(await page.locator('#globeCaseList button[data-case-id="nimitz-2004"]').count(),1,'historic documented footage remains visible with live records');
    assert.equal(await page.locator('#registeredSightings').textContent(),'3');
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('V1.4 country search cancels stale filter requests instead of showing outdated rows',async()=>{
    const context=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/countries/PR');
    await page.waitForFunction(()=>document.querySelector('#countryTotal')?.textContent==='1');
    let slowRequests=0;
    await page.route('**/api/cases?*',async route=>{
      const url=new URL(route.request().url());
      if(url.searchParams.get('type')==='lights'){
        slowRequests++;
        await new Promise(resolve=>setTimeout(resolve,320));
      }
      try{await route.continue()}catch{/* aborted superseded request */}
    });
    await page.locator('#typeFilter').selectOption('lights');
    await page.locator('#typeFilter').selectOption('instrument');
    await page.waitForFunction(()=>document.querySelectorAll('#countryCases .case-card').length===1 &&
      document.querySelector('#countryCases .case-title')?.textContent==='Инфрачервени обекти над Пуерто Рико');
    await page.waitForTimeout(460);
    assert.ok(slowRequests>=1,'delayed older filter must have occurred');
    assert.equal(await page.locator('#countryCases .case-card').count(),1);
    assert.equal(await page.locator('#typeFilter').inputValue(),'instrument');
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('Staged rollout always displays 15 sourced historical cases when D1 is unavailable',async()=>{
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/stats',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1500});
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===15);
    assert.equal(await page.locator('#globalRegister').isVisible(),false);
    assert.match(await page.locator('#atlasHeading').textContent(),/СПРАВОЧЕН АРХИВ/);
    assert.match(await page.locator('.atlas-footer').textContent(),/извън D1/);
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Светлините над Финикс');
    assert.equal(await page.locator('#globeCaseCountry').isVisible(),false);
    await page.locator('#globeFilter').selectOption('resolved');
    assert.ok((await page.locator('#globeCaseList button').count())>=3);
    await page.locator('#globeCaseList button[data-case-id="roswell-1947"]').click();
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Случаят „Розуел“');
    await page.locator('#globeCountry').selectOption('US');
    assert.ok((await page.locator('#globeCaseList button').count())>=1);
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('V1.4 partial locale uses English fallback for offline D1 and country filters',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/stats',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="fr"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1500});
    await page.waitForFunction(()=>document.querySelector('#registerHealth')?.textContent==='D1 / NOT CONNECTED');
    assert.match(await page.locator('#registerNotice').textContent(),/Database not connected/);
    assert.match(await page.locator('.atlas-footer').textContent(),/outside D1/);
    await page.goto('http://127.0.0.1:'+port+'/countries/DE');
    await page.waitForFunction(()=>document.querySelector('#countryTotal')?.textContent==='0');
    assert.equal(await page.locator('#typeFilter option[value="lights"]').textContent(),'Lights');
    assert.equal(await page.locator('#statusFilter option[value="resolved"]').textContent(),'Resolved');
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('global flat atlas displays all sourced markers before optional D1 enrichment',async()=>{
    const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/stats',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.waitForFunction(()=>document.querySelector('#worldMapCount')?.textContent==='15' && document.querySelectorAll('#worldMapPins button').length>0);
    assert.equal(await page.locator('#worldMapCount').textContent(),'15');
    const represented=await page.locator('#worldMapPins [data-cluster-count]').evaluateAll(items=>items.reduce((sum,item)=>sum+Number(item.dataset.clusterCount),0));
    assert.equal(represented,15,'cluster counts must represent every sourced mapped case');
    assert.ok(await page.locator('#worldMapPins button.is-cluster').count()>0,'nearby locations should be grouped');
    await page.locator('#worldCountry').selectOption('BR');
    assert.equal(await page.locator('#worldMapPins button').count(),1);
    assert.equal(await page.locator('#worldCaseDetail a').first().getAttribute('href'),'/archive/colares-1977');
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('homepage lists the real 15-case archive rather than eight demo case cards',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.waitForFunction(()=>document.querySelectorAll('#reportGrid a.report-card').length===15);
    assert.equal(await page.locator('#reportGrid a.report-card').count(),15);
    assert.equal(await page.locator('#reportGrid .report-badge').allTextContents().then(x=>x.includes('DEMO')),false);
    assert.equal(await page.locator('#reportGrid a[href="/archive/al-taqaddum-2017"]').count(),1);
    await page.locator('#reportSearch').fill('Техеран');
    assert.equal(await page.locator('#reportGrid a.report-card').count(),1);
    assert.equal(await page.locator('#reportGrid a.report-card').first().getAttribute('href'),'/archive/tehran-1976');
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('country directory and country explorer show source-linked archives with D1 offline',async()=>{
    const ctx=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/stats',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.route('**/api/countries/US',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.route('**/api/cases?*',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto('http://127.0.0.1:'+port+'/countries.html');
    await page.waitForFunction(()=>document.querySelector('#sourcedCountryGrid')?.children.length>=5);
    assert.equal(await page.locator('#sourcedCountryGrid a[href="/countries/US"]').count(),1);
    assert.equal(await page.locator('#directoryMetrics').isVisible(),false,'D1 metrics must not contain historical counts');
    await page.goto('http://127.0.0.1:'+port+'/countries/US');
    await page.waitForFunction(()=>document.querySelector('#countryHistoryGrid')?.children.length>=6);
    assert.equal(await page.locator('#countryHistoryGrid a[href="/archive/phoenix-1997"]').count(),1);
    assert.equal(await page.locator('#countryTotal').textContent(),'—','D1 statistics remain unavailable, not invented');
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('standalone media library shows original source links and supports video filter',async()=>{
    const context=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.goto('http://127.0.0.1:'+port+'/media.html');
    await page.waitForFunction(()=>document.querySelectorAll('#mediaGallery article').length>=15);
    assert.ok((await page.locator('#mediaGallery article').count())>=15,'source media gallery should have substantial content');
    assert.ok((await page.locator('#mediaGallery a[target="_blank"][rel="noopener noreferrer"]').count())>=15);
    await page.locator('#mediaType').selectOption('video');
    assert.ok((await page.locator('#mediaGallery article').count())>=5,'video filter should include documented recordings');
    assert.ok((await page.locator('#mediaGallery a[href*="dvidshub.net/video/960331"]').count())>=1);
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('Permanent historical dossiers are sourced, shareable and excluded from D1',async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:'+port+'/archive/phoenix-1997');
    await page.waitForFunction(()=>document.querySelector('#dossierContent')?.hidden===false);
    assert.equal(await page.locator('#dossierTitle').textContent(),'Светлините над Финикс');
    assert.match(await page.locator('#dossierKind').textContent(),/REFERENCE/);
    assert.match(await page.locator('#factPublication').textContent(),/извън D1|Не е потребителски сигнал/);
    assert.equal(await page.locator('#dossierCountry').isVisible(),false);
    assert.ok((await page.locator('#dossierStory p').count())>=1);
    assert.equal(await page.locator('#caseVisualImage').isVisible(),false,'stock artwork with baked-in fake Play must not impersonate a video');
    assert.equal(await page.locator('#caseHeroPlay').isVisible(),false,'no video published for Phoenix');
    assert.ok((await page.locator('#caseMediaGrid a').count())>=1);
    assert.equal(await page.locator('#dossierSourceUrl').getAttribute('rel'),'noopener noreferrer');
    assert.ok((await page.locator('#dossierSourceUrl').getAttribute('href')).startsWith('https://nuforc.org/'));
    assert.match(await page.locator('#dossierLocationCaveat').textContent(),/ориентировъчна/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,'dossier mobile overflow: '+overflow);
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('premium dossier offers original video only after click; labels are localized',async()=>{
    const ctx=await browser.newContext({viewport:{width:1200,height:800},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.route('https://www.dvidshub.net/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<html><body>Video source</body></html>'}));
    await page.goto('http://127.0.0.1:'+port+'/archive/al-taqaddum-2017');
    await page.waitForFunction(()=>document.querySelector('#dossierContent')?.hidden===false);
    assert.equal(await page.locator('#caseMediaGrid video,#caseMediaGrid iframe,.case-watch-button').count(),0);
    assert.ok((await page.locator('#dossierSourcesList a[href*="dvidshub.net/video/960331"]').count())>=1);
    await page.locator('#caseHeroPlay').waitFor({state:'visible'});
    await page.locator('#caseHeroPlay').click();
    assert.equal(await page.locator('#caseHeroStage iframe').getAttribute('src'),'https://www.dvidshub.net/video/embed/960331');
    assert.equal(await page.locator('iframe,video').count(),1,'only the hero embeds video');
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('Live D1 case page displays editorial review, source finding and exact provenance separately',async()=>{
    const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:'+port+'/cases/aaro-pr-2013');
    await page.waitForFunction(()=>document.querySelector('#dossierContent')?.hidden===false);
    assert.equal(await page.locator('#dossierTitle').textContent(),'Инфрачервени обекти над Пуерто Рико');
    assert.match(await page.locator('#dossierKind').textContent(),/GLOBAL REGISTER/);
    assert.match(await page.locator('#factPublication').textContent(),/Одобрено за публично показване/);
    assert.match(await page.locator('#factAssessment').textContent(),/Обяснено според/);
    assert.equal(await page.locator('#factIdentifier').textContent(),'aaro-pr-2013');
    assert.match(await page.locator('#dossierAssessmentAuthority').textContent(),/AARO/);
    assert.equal(await page.locator('#dossierCountry').getAttribute('href'),'/countries/PR');
    assert.ok((await page.locator('#dossierSourceUrl').getAttribute('href')).includes('aaro.mil/'));
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('Inactive D1 cannot reveal a case dossier or silently fall back to legacy archive',async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.route('**/api/cases/aaro-pr-2013',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto('http://127.0.0.1:'+port+'/cases/aaro-pr-2013');
    await page.waitForFunction(()=>document.querySelector('#dossierFeedback')?.textContent?.includes('не е активиран'));
    assert.equal(await page.locator('#dossierContent').isVisible(),false);
    assert.equal(await page.locator('#dossierSourceUrl').isVisible(),false);
    await page.goto('http://127.0.0.1:'+port+'/archive/not-a-real-case');
    await page.waitForFunction(()=>document.querySelector('#dossierFeedback')?.textContent?.includes('не е налично'));
    assert.equal(await page.locator('#dossierContent').isVisible(),false);
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('Globe dossier action links to the selected historical record',async()=>{
    const ctx=await browser.newContext({viewport:{width:1300,height:900},reducedMotion:'reduce'});
    const page=await ctx.newPage();
    await page.route('**/api/stats',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1500});
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===15);
    assert.equal(await page.locator('#globeCaseDossier').getAttribute('href'),'/archive/phoenix-1997');
    await page.locator('#globeCaseList button[data-case-id="westall-1966"]').click();
    assert.equal(await page.locator('#globeCaseDossier').getAttribute('href'),'/archive/westall-1966');
    await ctx.close();
  });
  await test('main report CTA reaches the real intake page',async()=>{
    const context=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:2500});
    assert.equal(await page.locator('.footer a[href="/report.html"]').count(),1);
    await page.locator('.footer a[href="/report.html"]').click();
    await page.waitForURL('**/report.html');
    assert.equal(await page.locator('#observationForm').isVisible(),true);
    assert.equal(await page.locator('#sendReport').isDisabled(),true);
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('V1.5 mobile intake remains local-only when policy and D1 are not activated',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],posts=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/intake/submit',async route=>{posts.push(route.request().postData());await route.fulfill({status:503,body:'{"error":"intake_disabled"}',contentType:'application/json'})});
    await page.goto('http://127.0.0.1:'+port+'/report.html?country=DE');
    await page.waitForFunction(()=>document.querySelector('#reportStatus')?.textContent.includes('INTAKE OFFLINE'));
    assert.equal(await page.locator('#country').inputValue(),'DE');
    assert.equal(await page.locator('#sendReport').isDisabled(),true);
    assert.equal(await page.locator('#activationControls').isVisible(),false);
    await page.locator('#region').fill('Bavaria');
    await page.locator('#location').fill('Munich area');
    await page.locator('#description').fill('A group of unusual silent lights moved in formation above the town for several minutes under clear skies.');
    await page.locator('#saveDraft').click();
    await page.reload();
    await page.waitForFunction(()=>document.querySelector('#reportStatus')?.textContent.includes('INTAKE OFFLINE'));
    assert.equal(await page.locator('#region').inputValue(),'Bavaria');
    assert.equal(await page.locator('#description').inputValue(),'A group of unusual silent lights moved in formation above the town for several minutes under clear skies.');
    assert.equal(posts.length,0);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,'mobile report overflow: '+overflow);
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('V1.5 simulated fully-approved private intake submits a text-only pending report',async()=>{
    const context=await browser.newContext({viewport:{width:1250,height:950},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],sent=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/intake/status',route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({accepting:true,mode:'text_only_quarantine',site_key:'testing-site-key',
       policy_version:'intake-v1-reviewed',policy_url:'https://aurorauap.org/privacy',automatic_publication:false})}));
    await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',route=>
      route.fulfill({status:200,contentType:'application/javascript',
       body:'window.turnstile={render:function(s,opts){queueMicrotask(()=>opts.callback("fake-widget-token"));return 1},reset:function(){}}'}));
    await page.route('**/api/intake/submit',async route=>{
      sent.push(route.request().postDataJSON());
      await route.fulfill({status:202,contentType:'application/json',
       body:JSON.stringify({receipt_id:'aur-int-123e4567-e89b-42d3-a456-426614174000',status:'pending',published:false})});
    });
    await page.goto('http://127.0.0.1:'+port+'/report.html?country=BG');
    await page.waitForFunction(()=>document.querySelector('#reportStatus')?.textContent.includes('PRIVATE INTAKE ACTIVE'));
    await page.locator('#region').fill('Shumen');
    await page.locator('#location').fill('Shumen area');
    await page.locator('#occurred').fill('2025-11-21T20:30');
    await page.locator('#timezone').fill('Europe/Sofia');
    await page.locator('#description').fill('Several silent moving lights were visible above the region for more than three minutes before they disappeared.');
    await page.locator('#consent').check();
    await page.locator('#sendReport').waitFor({state:'visible'});
    await page.waitForFunction(()=>!document.querySelector('#sendReport').disabled);
    await page.locator('#sendReport').click();
    await page.waitForFunction(()=>document.querySelector('#formFeedback')?.textContent.includes('aur-int-123e4567-e89b-42d3-a456-426614174000'));
    assert.equal(await page.locator('#receiptPanel').isVisible(),true);
    assert.equal(await page.locator('#receiptValue').textContent(),'aur-int-123e4567-e89b-42d3-a456-426614174000');
    assert.equal(sent.length,1);
    assert.equal(sent[0].country_code,'BG');
    assert.equal(sent[0].consent,true);
    assert.equal(sent[0].consent_version,'intake-v1-reviewed');
    assert.equal(sent[0].turnstile_token,'fake-widget-token');
    assert.equal('contact_email' in sent[0],false);
    assert.equal('media' in sent[0],false);
    assert.equal('latitude' in sent[0],false);
    assert.deepEqual(errors,[]);
    await context.close();
  });

  await test("AURORA 4K Earth scene renders pixels and changes through all three scroll chapters",async()=>{
    const ctx=await browser.newContext({viewport:{width:1365,height:900},reducedMotion:"no-preference"});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto("http://127.0.0.1:"+port+"/");
    await page.locator('#gateLanguageGrid button[data-language="en"]').click();
    await page.locator("#gateContinue").click();
    await page.locator("#languageGate").waitFor({state:"hidden"});
    const mode=page.locator("#odyssey");
    await page.waitForFunction(()=>["webgl","fallback"].includes(document.querySelector("#odyssey")?.dataset.renderer));
    mkdirSync("artifacts",{recursive:true});
    await page.screenshot({path:"artifacts/aurora-earth-desktop.png",fullPage:false,animations:"disabled"});
    assert.equal(await page.locator("#auroraSceneCanvas").count(),1);
    if(await mode.getAttribute("data-renderer")==="webgl"){
      await page.waitForFunction(()=>document.querySelector("#odyssey")?.dataset.scenePixels,{timeout:10000});
      const values=(await mode.getAttribute("data-scene-pixels")).split("|").map(x=>x.split(",").map(Number));
      assert.ok(values.some(row=>row.some(v=>v>12)),"GPU must render visibly non-black pixel values");
      await page.waitForFunction(()=>["4096","fallback"].includes(document.querySelector("#odyssey")?.dataset.earthTexture),{timeout:10000});
      const tex=await mode.getAttribute("data-earth-texture");
      assert.equal(tex,"4096","public land vector texture must be 4K in browser");
    }
    await page.evaluate(()=>{
      const el=document.querySelector("#odyssey"),r=el.getBoundingClientRect();
      window.scrollTo({top:window.scrollY+r.top+(r.height-window.innerHeight)*.42,behavior:"instant"});
    });
    await page.waitForFunction(()=>document.querySelector("#odyssey")?.dataset.chapter==="1");
    assert.equal(await page.locator(".odyssey-chapter").getAttribute("aria-hidden"),"false");
    await page.screenshot({path:"artifacts/aurora-earth-story-chapter.png",fullPage:false,animations:"disabled"});
    await page.evaluate(()=>{
      const el=document.querySelector("#odyssey"),r=el.getBoundingClientRect();
      window.scrollTo({top:window.scrollY+r.top+(r.height-window.innerHeight)*.84,behavior:"instant"});
    });
    await page.waitForFunction(()=>document.querySelector("#odyssey")?.dataset.chapter==="2");
    assert.equal(await page.locator(".odyssey-archive-chapter").getAttribute("aria-hidden"),"false");
    await page.screenshot({path:"artifacts/aurora-earth-archive-chapter.png",fullPage:false,animations:"disabled"});
    assert.equal(await page.locator("#worldMapCanvas").count(),1);
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test("AURORA Earth renders a still accessible mobile view for reduced motion",async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:"reduce"});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto("http://127.0.0.1:"+port+"/");
    await page.locator('#gateLanguageGrid button[data-language="bg"]').click();
    await page.locator("#gateContinue").click();
    await page.locator("#languageGate").waitFor({state:"hidden"});
    assert.equal(await page.locator("#odyssey").getAttribute("data-chapter"),"1");
    mkdirSync("artifacts",{recursive:true});
    await page.screenshot({path:"artifacts/aurora-earth-mobile.png",fullPage:false,animations:"disabled"});
    assert.equal(await page.locator(".odyssey-chapter").getAttribute("aria-hidden"),"false");
    assert.equal(await page.locator(".odyssey-chapter .hero-content").isVisible(),true,"reduced-motion mobile must show its heading and navigation");
    assert.equal(await page.locator(".odyssey-chapter .hero-content h1").isVisible(),true);
    assert.equal(await page.locator(".odyssey-archive-chapter").isVisible(),false);
    assert.equal(await page.locator('.hero-buttons a[href="/archive.html"]').count(),1);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,"mobile viewport overflows by "+overflow);
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('news API outage is shown as an explicit offline state, not a blank loading feed',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/api/news?*',route=>route.fulfill({status:503,contentType:'application/json',
      body:JSON.stringify({status:'unavailable',error:'news_source_unavailable',items:[],diagnostics:{network_errors:10}})}));
    await page.goto('http://127.0.0.1:'+port+'/news');
    await page.waitForFunction(()=>document.querySelector('#newsStatus')?.dataset.state==='error');
    const status=await page.locator('#newsStatus').textContent();
    assert.ok(status&&status.trim().length>0);
    assert.doesNotMatch(status,/Loading|Зареждане/);
    assert.equal(await page.locator('.live-card').count(),0);
    assert.deepEqual(errors,[]);
    await context.close();
  });
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
