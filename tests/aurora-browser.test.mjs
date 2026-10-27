import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
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
  const resolved=/^\/countries\/[A-Za-z]{2}$/.test(decoded)?'/country.html':decoded;
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
  await test('language must be selected then explicitly continued, and gate reappears on reload',async()=>{
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
    assert.equal(await page.locator('#languageGate').isVisible(),true,'welcome even with saved preference');
    assert.equal(await page.locator('#gateContinue').isEnabled(),true,'saved language preselected');
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:2500});
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

    assert.equal(await page.locator('a[href="#control"]').count(),3,'desktop, mobile and footer navigation');
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

    await page.locator('input[name="mapFilter"][value="light"]').check();
    assert.equal(await page.locator('#visibleCount').textContent(),'4');
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

  await test('V1.4 globe renders only imported D1 cases and source links',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1200});
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===3);
    await page.waitForFunction(()=>document.querySelector('#registeredSightings')?.textContent==='3');
    assert.equal(await page.locator('#registeredCountries').textContent(),'3');
    assert.equal(await page.locator('#globeCountry option[value="PR"]').count(),1);
    assert.equal(await page.locator('#globeYear option[value="2013"]').count(),1);
    assert.equal(await page.locator('#globeCaseStatus').textContent(),'ИЗВЕСТНО ОБЯСНЕНИЕ');
    assert.equal(await page.locator('#globeCaseList button').count(),3);
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Светлини над западните САЩ');
    await page.locator('#globeCaseList button[data-case-id="aaro-pr-2013"]').click();
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Инфрачервени обекти над Пуерто Рико');
    assert.equal(await page.locator('#globeCaseSource').getAttribute('rel'),'noopener noreferrer');
    assert.ok((await page.locator('#globeCaseSource').getAttribute('href')).includes('aaro.mil/'));
    assert.equal(await page.locator('#globeCaseCountry').getAttribute('href'),'/countries/PR');
    const opaque=await page.locator('#caseGlobe').evaluate(canvas=>canvas.getContext('2d').getImageData(220,220,1,1).data[3]>0);
    assert.equal(opaque,true);
    await page.locator('#globeFilter').selectOption('lights');
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===1);
    await page.locator('#globeFilter').selectOption('all');
    await page.locator('#globeCountry').selectOption('IQ');
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===1 && document.querySelector('#globeCaseTitle')?.textContent?.includes('Ал Таккадум'));
    await page.locator('#globeCaseList button[data-case-id="aaro-iraq-2017"]').click();
    assert.equal(await page.locator('#globeCaseCountry').getAttribute('href'),'/countries/IQ');
    await page.locator('#globeRotate').click();
    assert.equal(await page.locator('#globeRotate').getAttribute('aria-pressed'),'true');
    await page.locator('#globeLeft').click();
    await page.locator('#globeRight').click();
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
    assert.ok((await page.locator('.case-details a').getAttribute('href')).startsWith('https://www.aaro.mil/'));
    assert.equal(await page.locator('#reportLink').getAttribute('href'),'/?report=draft&country=PR');
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
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===3);
    await page.locator('#globeFilter').selectOption('instrument');
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===2);
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
  await test('Staged rollout preserves eight sourced historical cases when D1 is unavailable',async()=>{
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/stats',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1500});
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===8);
    assert.equal(await page.locator('#globalRegister').isVisible(),false);
    assert.match(await page.locator('#atlasHeading').textContent(),/СПРАВОЧЕН АРХИВ/);
    assert.match(await page.locator('.atlas-footer').textContent(),/извън D1/);
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Светлините над Финикс');
    assert.equal(await page.locator('#globeCaseCountry').isVisible(),false);
    await page.locator('#globeFilter').selectOption('resolved');
    assert.equal(await page.locator('#globeCaseList button').count(),1);
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Случаят „Розуел“');
    await page.locator('#globeCountry').selectOption('US');
    assert.equal(await page.locator('#globeCaseList button').count(),1);
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
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
