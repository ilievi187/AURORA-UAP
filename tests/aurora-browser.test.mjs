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
const fullArchive=readFileSync(new URL('../data/cases.json',import.meta.url),'utf8');
const curatedArchive=(()=>{const {cases,...meta}=JSON.parse(fullArchive);return JSON.stringify({...meta,cases:cases.filter(c=>!c.provenance?.automated).sort((a,b)=>a.id==='phoenix-1997'?-1:b.id==='phoenix-1997'?1:0)});})();
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
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
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
    await page.locator("#nextNews").click();
    await page.waitForFunction(()=>[...document.querySelectorAll(".live-card h2 a")]
      .some(link=>link.textContent==="ПРЕВОД Special sighting 39"));
    assert.equal(await page.locator(".live-card").count(),12);
    assert.equal(await page.locator("#newsPageStatus").textContent(),"Страница 2 / 3");
    assert.ok(offsets.includes(36),"filtered page navigation must translate the matching source page");
    assert.equal(await page.locator(".live-card h2 a").last().getAttribute("href"),
      "https://publisher.example.test/story/39");
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test("news source-type filters and previous/next pagination operate on real result windows",async()=>{
    const ctx=await browser.newContext({viewport:{width:1180,height:850},reducedMotion:"reduce"});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    const entries=Array.from({length:25},(_,index)=>({
      title:(index%2===0?"Official source item ":"Specialist source item ")+index,
      url:"https://publisher.example.test/story/"+index,
      source:index%2===0?"Agency Desk":"Research Journal",
      source_role:index%2===0?"official-institution":"specialist-press",
      category:index%7===0?"research":undefined,
      published:new Date(Date.now()-index*60000).toISOString(),language:"en"
    }));
    await page.route("**/api/news?*",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
      status:"live",edition:"global",updated_at:new Date().toISOString(),count:entries.length,items:entries,
      translation:{target:"bg",status:"unavailable",translated:0}
    })}));
    await page.goto("http://127.0.0.1:"+port+"/news.html");
    await page.waitForFunction(()=>document.querySelectorAll(".live-card").length===12);
    await page.locator("#newsTopicCategory").selectOption("research");
    await page.waitForFunction(()=>document.querySelectorAll(".live-card").length===4&&document.querySelector("#newsPageStatus")?.textContent==="Страница 1 / 1");
    assert.deepEqual(await page.locator(".live-card h2").allTextContents(),["Official source item 0","Specialist source item 7","Official source item 14","Specialist source item 21"]);
    await page.locator("#newsTopicCategory").selectOption("all");
    await page.waitForFunction(()=>document.querySelectorAll(".live-card").length===12);
    await page.locator("#newsSourceType").selectOption("official-institution");
    await page.waitForFunction(()=>document.querySelectorAll(".live-card").length===12&&document.querySelector("#newsPageStatus")?.textContent==="Страница 1 / 2");
    assert.equal(await page.locator(".live-card h2").first().textContent(),"Official source item 0");
    await page.locator("#nextNews").click();
    await page.waitForFunction(()=>document.querySelectorAll(".live-card").length===1&&document.querySelector("#newsPageStatus")?.textContent==="Страница 2 / 2");
    assert.equal(await page.locator(".live-card h2").textContent(),"Official source item 24");
    assert.equal(await page.locator("#nextNews").isDisabled(),true);
    await page.locator("#previousNews").click();
    await page.waitForFunction(()=>document.querySelectorAll(".live-card").length===12&&document.querySelector("#newsPageStatus")?.textContent==="Страница 1 / 2");
    assert.equal(await page.locator("#previousNews").isDisabled(),true);
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('durable fallback records are visibly labeled as archived source records',async()=>{
    const ctx=await browser.newContext({viewport:{width:1180,height:850},reducedMotion:"reduce"});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.route("**/api/news?*",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
      status:"cached",edition:"global",updated_at:"2026-11-02T10:00:00.000Z",count:1,cache_source:"news_history_db",
      items:[{title:"Preserved source-reported UAP bulletin",url:"https://publisher.example.test/archive/story-1",source:"Example Press",published:"2026-11-01T10:00:00.000Z",language:"en",source_role:"news-search",archival:true}],
      translation:{target:"bg",status:"translated",translated:1}
    })}));
    await page.goto("http://127.0.0.1:"+port+"/news.html");
    await page.waitForFunction(()=>document.querySelector(".news-archive-record")?.textContent==="Запазен архивен запис");
    assert.equal(await page.locator(".news-archive-record").count(),1);
    assert.equal(await page.locator("#newsStatus").getAttribute("data-state"),"cached");
    assert.equal(await page.locator(".live-card h2 a").getAttribute("href"),"https://publisher.example.test/archive/story-1");
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
  await test('localized report entry replaces four demo steps',async()=>{
    const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden'});
    assert.equal(await page.locator('#control').count(),0);
    assert.equal(await page.locator('#caseGlobe').count(),0);
    assert.equal(await page.locator('#worldAtlas').count(),1);
    for(const locale of ['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko']){
      await page.locator('#langToggle').selectOption(locale);
      const title=await page.locator('#homeReportTitle').textContent();
      const cta=await page.locator('.home-report-cta-link [data-i18n="reportButton"]').textContent();
      assert.ok(title.trim().length>0,'report '+locale);
      assert.equal(title,cta,'locale '+locale);
      assert.ok((await page.locator('.home-report-note').textContent()).trim().length>0);
    }
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('mobile report entry and sourced map fit without console',async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden'});
    assert.equal(await page.locator('#homeReportTitle').textContent(),'Подай сигнал');
    assert.equal(await page.locator('#worldMapCanvas').count(),1);
    assert.equal(await page.locator('.home-report-cta-link').getAttribute('href'),'/report.html');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,'mobile overflow: '+overflow);
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test('real world atlas retains sourced cases instead of duplicate globe',async()=>{
    const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden'});
    await page.waitForFunction(()=>Number(document.querySelector('#worldMapCount')?.textContent)>=15);
    assert.ok(await page.locator('#worldMapResults [data-world-case-id]').count()>0);
    await page.locator('#worldSearch').fill('westall-1966');
    await page.locator('#worldMapResults [data-world-case-id="westall-1966"]').click();
    assert.equal(await page.locator('#worldCaseDetail a[href="/archive/westall-1966"]').count(),1);
    assert.deepEqual(errors,[]);
    await ctx.close();
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
    await page.locator('#reportLink').click();
    await page.waitForURL('**/report.html?country=PR');
    await page.waitForFunction(()=>document.querySelector('#country')?.value==='PR');
    assert.equal(await page.locator('#sendReport').isDisabled(),true,'public intake remains disabled');
    assert.equal(await page.locator('#reportAgeNotice').isVisible(),true);
    assert.equal(await page.locator('#adultConfirm').isVisible(),false,"18+ checkbox is only needed for active submission");
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('malformed canonical storage does not hide a legacy local homepage draft',async()=>{
    const context=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'});
    const page=await context.newPage(),submissions=[];
    page.on('request',request=>{
      if(request.method()==='POST'&&new URL(request.url()).pathname==='/api/intake/submit')submissions.push(request.url());
    });
    await context.addInitScript(()=>{
      localStorage.setItem('aurora-demo-draft',JSON.stringify({
        country:'BG',place:'Shumen',date:'2026-10-31T19:20',type:'light',
        description:'A locally saved observation draft with enough detail to preserve the original notes.'
      }));
      localStorage.setItem('aurora-private-text-report-draft-v1','{malformed canonical JSON');
    });
    await page.goto('http://127.0.0.1:'+port+'/report.html');
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('aurora-private-text-report-draft-v1')||'null')?.location==='Shumen');
    assert.equal(await page.locator('#country').inputValue(),'BG');
    assert.equal(await page.locator('#location').inputValue(),'Shumen');
    assert.equal(await page.locator('#occurred').inputValue(),'2026-10-31T19:20');
    assert.equal(await page.locator('#category').inputValue(),'lights');
    assert.equal(await page.locator('#description').inputValue(),'A locally saved observation draft with enough detail to preserve the original notes.');
    assert.equal(await page.evaluate(()=>localStorage.getItem('aurora-demo-draft')),null);
    assert.equal(await page.locator('#sendReport').isDisabled(),true);
    assert.deepEqual(submissions,[]);
    await context.close();
  });
  await test('V1.4 mobile country explorer and sourced world atlas do not overflow',async()=>{
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
    await page.waitForFunction(()=>Number(document.querySelector('#worldMapCount')?.textContent)>=15);
    assert.equal(await page.locator('#caseGlobe').count(),0,'retired duplicate globe stays absent');
    await page.locator('#worldCountry').selectOption('US');
    assert.equal(await page.locator('#worldMapResults [data-world-case-id="nimitz-2004"]').count(),1,'sourced Nimitz dossier remains discoverable');
    const atlasOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(atlasOverflow<=1,'atlas mobile overflow: '+atlasOverflow);
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
    await page.waitForFunction(()=>Number(document.querySelector('#worldMapCount')?.textContent)===15);
    assert.equal(await page.locator('#globalRegister').isVisible(),false);
    assert.equal(await page.locator('#worldMapResults [data-world-case-id]').count(),10,'atlas paginates sourced cases without losing them');
    await page.locator('#worldSearch').fill('roswell-1947');
    await page.locator('#worldMapResults [data-world-case-id="roswell-1947"]').click();
    assert.equal(await page.locator('#worldCaseDetail a[href="/archive/roswell-1947"]').count(),1);
    await page.locator('#worldSearch').fill('');
    await page.locator('#worldCountry').selectOption('US');
    assert.ok((await page.locator('#worldMapResults [data-world-case-id]').count())>=1);
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
    await page.waitForFunction(()=>Number(document.querySelector('#worldMapCount')?.textContent)===15);
    assert.equal(await page.locator('#caseGlobe').count(),0,'no retired globe for partial locales');
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
  await test('homepage previews six sourced cases and full search remains available',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.waitForFunction(()=>document.querySelectorAll('#reportGrid a.report-card').length===6);
    assert.equal(await page.locator('#reportGrid a.report-card').count(),6);
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
    assert.match(await page.locator('#dossierKind').textContent(),/HISTORICAL CASE FILE/);
    assert.match(await page.locator('#factPublication').textContent(),/ИСТОРИЧЕСКИ АРХИВ/);
    assert.equal(await page.locator('#dossierCountry').isVisible(),false);
    assert.ok((await page.locator('#dossierStory p').count())>=1);
    assert.equal(await page.locator('#caseVisualImage').isVisible(),true,'sourced dossier without video has an illustrated reading cover');
     assert.equal(await page.locator('#caseVisualImage').getAttribute('src'),'/assets/media-ufo-earth-preview.svg');
     assert.match(await page.locator('#caseVisualCaption').textContent(),/Илюстрация на AURORA/,'not represented as real incident footage');
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
    assert.match(await page.locator('#dossierKind').textContent(),/PUBLIC CASE FILE/);
    assert.match(await page.locator('#factPublication').textContent(),/ПУБЛИКУВАНО СЛЕД РЕДАКЦИОНЕН ПРЕГЛЕД/);
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
  await test('World atlas dossier action links to the selected historical record',async()=>{
    const ctx=await browser.newContext({viewport:{width:1300,height:900},reducedMotion:'reduce'});
    const page=await ctx.newPage();
    await page.route('**/api/stats',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"database_unavailable"}'}));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1500});
    await page.waitForFunction(()=>Number(document.querySelector('#worldMapCount')?.textContent)===15);
    await page.locator('#worldSearch').fill('phoenix-1997');
    await page.locator('#worldMapResults [data-world-case-id="phoenix-1997"]').click();
    assert.equal(await page.locator('#worldCaseDetail a[href="/archive/phoenix-1997"]').count(),1);
    await page.locator('#worldSearch').fill('westall-1966');
    await page.locator('#worldMapResults [data-world-case-id="westall-1966"]').click();
    assert.equal(await page.locator('#worldCaseDetail a[href="/archive/westall-1966"]').count(),1);
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
  await test('verified account controls remain available while report submission is closed',async()=>{
    const context=await browser.newContext({viewport:{width:1150,height:820},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],posts=[],privacyViews=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/intake/status',route=>route.fulfill({status:200,contentType:'application/json',
     body:JSON.stringify({accepting:false,mode:'local_draft_only',
      auth_required:true,auth_url:'https://aurora-test.supabase.co',
      auth_key:'sb_publishable_testing_public_key_123456789',auth_providers:['email']})}));
    await page.route('**/api/account/privacy',route=>{
     privacyViews.push({method:route.request().method(),auth:route.request().headers().authorization});
     return route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({receipts:[{receipt_id:'aur-int-123e4567-e89b-42d3-a456-426614174000',
       status:'pending',created_at:'2026-11-04T12:00:00.000Z'}],
       next_offset:null,published:false,deletion_process:'manual_owner_review'})});
    });
    await page.route('**/report-auth.bundle.js',route=>route.fulfill({status:200,contentType:'application/javascript',
     body:`window.__testSignedIn=true;window.AURORAReportAuth={create:()=>({auth:{
      getUser:async()=>({data:{user:window.__testSignedIn?{id:"123e4567-e89b-42d3-a456-426614174000",email:"verified@example.com",email_confirmed_at:"2026-01-01T00:00:00Z"}:null}}),
      getSession:async()=>({data:{session:{access_token:"verified_test_token_123456789012345678901"}}}),
      onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
      signOut:async()=>{window.__testSignedIn=false;return {error:null}},
      signInWithOtp:async()=>({error:null})}})};`}));
    await page.route('**/api/intake/submit',route=>{posts.push(1);return route.abort()});
    await page.goto('http://127.0.0.1:'+port+'/report.html');
    await page.locator('#reportAuthLogout').waitFor({state:'visible',timeout:4000});
    assert.equal((await page.locator('#reportAuthFeedback').textContent()).includes('verified@example.com'),true);
    assert.equal(await page.locator('#reportAuthButtons').isVisible(),false,'signed-in account must not show the email sign-in form');
    assert.equal(await page.locator('#reportAuthEmailBox').isVisible(),false);
    assert.ok(['YOUR VERIFIED ACCOUNT','ПОТВЪРДЕН АКАУНТ'].includes(await page.locator('#reportAuthHeading').textContent()));
    assert.equal(await page.locator('#sendReport').isDisabled(),true);
    assert.equal(await page.locator('#activationControls').isVisible(),false);
    assert.ok(['Описание','Description'].includes(await page.locator('[data-report-label="description"]').textContent()));
    assert.equal(await page.locator('#reportPrivacyTools').isVisible(),true);
    assert.match(await page.locator('#reportDeleteRequest').getAttribute('href'),/^mailto:blizzard9011@gmail.com\?subject=/);
    await page.locator('#reportPrivacyList').click();
    await page.waitForFunction(()=>document.querySelector('#reportPrivateReceipts li')!==null);
    assert.equal(await page.locator('#reportPrivateReceipts li').count(),1);
    assert.match(await page.locator('#reportPrivateReceipts li').first().textContent(),/aur-int-123e4567-e89b-42d3-a456-426614174000 — pending/);
    assert.equal(privacyViews.length,1);
    assert.equal(privacyViews[0].method,'GET');
    assert.match(privacyViews[0].auth||'',/^Bearer verified_test_token_/);
    await page.locator('#reportPrivacyList').click();
    await page.waitForFunction(()=>document.querySelector('#reportPrivacyList')?.disabled===false);
    assert.equal(await page.locator('#reportPrivateReceipts li').count(),1,'refresh must not duplicate private receipts');
    await page.locator('#reportAuthLogout').click();
    await page.locator('#reportAuthLogout').waitFor({state:'hidden'});
    assert.equal(await page.locator('#reportPrivacyTools').isVisible(),false,'private report controls must disappear on logout');
    assert.equal(await page.locator('#reportPrivateReceipts li').count(),0,'private receipts must be removed on logout');
    assert.equal(await page.locator('#reportAuthButtons').isVisible(),true,'sign-in form should return after logout');
    assert.equal(await page.locator('#reportAuthEmailBox').isVisible(),true);
    assert.equal(await page.locator('#reportAuthEmailSend').isVisible(),true);
    assert.ok(['VERIFY YOUR EMAIL','ПОТВЪРДИ ИМЕЙЛА СИ'].includes(await page.locator('#reportAuthHeading').textContent()));
    assert.equal(await page.locator('#sendReport').isDisabled(),true);
    assert.deepEqual(posts,[]);
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('Supabase invitation hash on homepage transfers to the report callback only',async()=>{
    const ctx=await browser.newContext({viewport:{width:1024,height:768},reducedMotion:'reduce'});
    const page=await ctx.newPage();
    const hash='#access_token=test-token&refresh_token=test-refresh&type=invite';
    await page.goto('http://127.0.0.1:'+port+'/'+hash);
    await page.waitForURL('**/report.html#*',{timeout:4000});
    assert.ok(page.url().endsWith('/report.html'+hash));
    await ctx.close();
  });

  await test('owner moderation overview, receipt lookup and audit history render as private text',async()=>{
    const context=await browser.newContext({viewport:{width:1080,height:820},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const id='aur-int-123e4567-e89b-42d3-a456-426614174000';
    const report={id,description:'Witness text <img src=x onerror=alert(1)>',status:'pending',
     country_code:'BG',region:'Shumen',approximate_location:'Shumen area',occurred_local:'2026-10-20T21:00',
     time_zone:'Europe/Sofia',category:'lights',created_at:'2026-11-01T11:00:00Z'};
    await page.route('**/api/moderation/*',route=>{
     const url=new URL(route.request().url());
     const query=url.searchParams;
     if(route.request().method()==='POST')
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'approved'})});
     if(query.get('view')==='overview')
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
       counts:{pending:1,needs_clarification:0,approved:0,rejected:0},total:1,
       due:{rejected_expired:0,awaiting_review:1,approved_reassessment:0}})});
     if(query.get('receipt')===id)
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
       submission:report,events:[{id:1,action:'received',actor_type:'system',previous_status:null,
        new_status:'pending',rationale:'Kept private for review <script>alert(9)</script>',created_at:'2026-11-01T11:00:00Z'}],
       events_truncated:false})});
     if(query.get('offset')==='0')
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
       offset:0,limit:50,has_more:false,next_offset:null,submissions:[report]})});
     return route.fulfill({status:404,body:'{}'});
    });
    await page.goto('http://127.0.0.1:'+port+'/moderation.html');
    // Cloudflare Pages caches shared CSS for four hours. Version the moderator
    // asset URL so newly released panels do not inherit stale report.css.
    const sheet=await page.locator('link[rel="stylesheet"]').getAttribute('href');
    assert.match(sheet,/^\/report\.css\?v=mod-20261103-r138$/);
    const layout=await page.locator('.moderation-overview dl').evaluate(el=>({
      display:getComputedStyle(el).display,
      border:getComputedStyle(el.closest('.moderation-overview')).borderTopWidth
    }));
    assert.equal(layout.display,'grid');
    assert.equal(layout.border,'1px');
    await page.waitForFunction(()=>document.querySelector('#moderationSummary')?.textContent.includes('180 дни'));
    assert.equal(await page.locator('#moderationSummary dd').first().textContent(),'1');
    assert.equal(await page.locator('#queue article').count(),1);
    assert.equal(await page.locator('#queue img').count(),0,'reported HTML is never interpreted');
    await page.locator('#queue button').first().click();
    await page.waitForFunction(()=>document.querySelector('.moderation-audit-entry')?.textContent.includes('Kept private'));
    assert.equal(await page.locator('.moderation-audit-entry script').count(),0);
    await page.locator('#queue button').first().click();
    await page.waitForFunction(()=>document.querySelector('#notice')?.textContent.includes('страница'));
    await page.locator('#receiptQuery').fill(id);
    await page.locator('#receiptLookup button[type=submit]').click();
    await page.waitForFunction(()=>document.querySelector('.moderation-audit-entry')!==null);
    assert.equal(await page.locator('a[href*="moderation"]').count(),0);
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('V1.5 simulated fully-approved private intake submits a text-only pending report',async()=>{
    const context=await browser.newContext({viewport:{width:1250,height:950},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],sent=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/intake/status',route=>route.fulfill({status:200,contentType:'application/json',
      body:JSON.stringify({accepting:true,mode:'text_only_quarantine',site_key:'testing-site-key',
       policy_version:'intake-v1-reviewed',policy_url:'https://aurorauap.org/privacy',automatic_publication:false,
       auth_required:true,auth_url:'https://aurora-test.supabase.co',
       auth_key:'sb_publishable_testing_public_key_123456789',auth_providers:['email','google','apple','x']})}));
    await page.route('**/report-auth.bundle.js',route=>route.fulfill({status:200,contentType:'application/javascript',
     body:'window.AURORAReportAuth={create:()=>({auth:{getUser:async()=>({data:{user:{id:"123e4567-e89b-42d3-a456-426614174000",email:"verified@example.com",email_confirmed_at:"2026-01-01T00:00:00Z"}}}),getSession:async()=>({data:{session:{access_token:"test_verified_access_token_12345678901234567890"}}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null})}})};' }));

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
    assert.equal(await page.locator('#sendReport').isDisabled(),true,"cannot submit without explicit 18+ declaration");
    await page.locator('#adultConfirm').check();
    await page.waitForFunction(()=>!document.querySelector('#sendReport').disabled);
    await page.locator('#sendReport').click();
    await page.waitForFunction(()=>document.querySelector('#formFeedback')?.textContent.includes('aur-int-123e4567-e89b-42d3-a456-426614174000'));
    assert.equal(await page.locator('#receiptPanel').isVisible(),true);
    assert.equal(await page.locator('#receiptValue').textContent(),'aur-int-123e4567-e89b-42d3-a456-426614174000');
    assert.equal(sent.length,1);
    assert.equal((await page.locator('#reportAuthFeedback').textContent()).includes('verified@example.com'),true);
    assert.equal(sent[0].country_code,'BG');
    assert.equal(sent[0].consent,true);
    assert.equal(sent[0].adult_confirmed,true);
    assert.equal(sent[0].consent_version,'intake-v1-reviewed');
    assert.equal(sent[0].turnstile_token,'fake-widget-token');
    assert.equal('contact_email' in sent[0],false);
    assert.equal('birth_date' in sent[0],false);
    assert.equal('identity_document' in sent[0],false);
    assert.equal('media' in sent[0],false);
    assert.equal('latitude' in sent[0],false);
    assert.deepEqual(errors,[]);
    await context.close();
  });

  await test("AURORA black saucer hero matches reference hierarchy on desktop with sourced numbers",async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:"no-preference"});
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto("http://127.0.0.1:"+port+"/");
    await page.locator('#gateLanguageGrid button[data-language="en"]').click();
    await page.locator("#gateContinue").click();
    await page.locator("#languageGate").waitFor({state:"hidden"});
    assert.equal(await page.locator("#silenceHero h1").textContent(),"AURORA");
    assert.ok(await page.locator("#silenceHero h1").isVisible());
    assert.equal(await page.locator("#odyssey").count(),0,"the abandoned multi-scroll scene is gone");
    const hero=page.locator("#silenceHero");
    assert.ok((await hero.boundingBox()).height<=1050,"hero must fit first viewport; no 3-screen prologue");
    await page.waitForFunction(()=>["sourced","unavailable"].includes(document.querySelector("#silenceHero")?.dataset.stats));
    assert.equal(await hero.getAttribute("data-stats"),"sourced");
    const expected=await page.evaluate(async()=>{
      const data=await (await fetch("/data/cases.json")).json();
      const cases=data.cases.filter(x=>x&&typeof x.id==="string");
      const bulk=await fetch("/data/bulk/manifest.json").then(r=>r.ok?r.json():null).catch(()=>null);
      const geo=await fetch("/data/bulk/countries.json").then(r=>r.ok?r.json():null).catch(()=>null);
      return [cases.length+(bulk?.imported||0),
        cases.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng)&&Math.abs(x.lat)<=90&&Math.abs(x.lng)<=180).length+(geo?.geo_anchors||0)];
    });
    assert.deepEqual([
      Number((await page.locator("#auroraArchiveCount").textContent()).replace(/[^0-9]/g,"")),
      Number((await page.locator("#auroraMappedCount").textContent()).replace(/[^0-9]/g,""))
    ],expected);
    assert.equal(await page.locator("#auroraLanguageCount").textContent(),"18");
    assert.equal(await page.locator(".silence-actions a[href='/archive.html']").count(),1);
    assert.equal(await page.locator(".silence-actions a[href='/media.html']").count(),1);
    assert.equal(await page.locator("#worldMapCanvas").count(),1);
    const background=await page.locator(".silence-ship").evaluate(el=>getComputedStyle(el).backgroundImage);
    assert.match(background,/hero-ufo\.webp/);
    mkdirSync("artifacts",{recursive:true});
    await page.screenshot({path:"artifacts/aurora-silence-desktop.png",fullPage:false,animations:"disabled"});
    // Visual evidence for the satellite atlas, captured with real data and rendered local textures.
    await page.waitForFunction(()=>Number(document.querySelector("#worldMapCount")?.textContent)>0);
    await page.evaluate(async()=>{const image=new Image();image.src="/assets/earth/earth-night-4096.jpg";await image.decode()});
    await page.locator("#worldAtlas").screenshot({path:"artifacts/aurora-orbital-atlas.png",animations:"disabled"});
    assert.ok((await page.locator("#worldMapPins button").count())>0,"satellite atlas retains sourced markers");
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test("black saucer homepage stays legible on mobile and reduced motion",async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:"reduce"});
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto("http://127.0.0.1:"+port+"/");
    await page.locator('#gateLanguageGrid button[data-language="bg"]').click();
    await page.locator("#gateContinue").click();
    await page.locator("#languageGate").waitFor({state:"hidden"});
    assert.equal(await page.locator("#hero-title").textContent(),"AURORA");
    assert.ok(await page.locator(".silence-actions a[href='/archive.html']").isVisible());
    await page.waitForFunction(()=>document.querySelector("#silenceHero")?.dataset.stats==="sourced");
    const columns=await page.locator(".silence-stats").evaluate(el=>getComputedStyle(el).gridTemplateColumns);
    assert.equal(columns.split(" ").length,2,"mobile displays two metric columns");
    const statGeometry=await page.locator(".silence-stat").evaluateAll(items=>items.map(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})));
    assert.equal(statGeometry.length,4);
    const layout=await page.evaluate(()=>{
      const get=selector=>{const el=document.querySelector(selector);const r=el.getBoundingClientRect(),style=getComputedStyle(el);return {x:r.left,y:r.top,width:r.width,height:r.height,position:style.position,display:style.display,columns:style.gridTemplateColumns,transform:style.transform,overflow:style.overflow};};
      return {hero:get("#silenceHero"),copy:get(".silence-copy"),bottom:get(".silence-bottom"),grid:get(".silence-stats"),cards:[...document.querySelectorAll(".silence-stat")].map((e,i)=>({index:i,x:e.getBoundingClientRect().left,y:e.getBoundingClientRect().top,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))};
    });
    assert.ok(layout.cards.every(x=>x.w>=120&&x.x>=10&&x.x+x.w<=391),"stats must have usable widths: "+JSON.stringify(layout));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,"homepage overflow: "+overflow);
    const heroWidth=await page.locator("#silenceHero").evaluate(el=>el.getBoundingClientRect().width);
    assert.ok(heroWidth<=391,"full-width hero within mobile viewport");
    mkdirSync("artifacts",{recursive:true});
    await page.screenshot({path:"artifacts/aurora-silence-mobile.png",fullPage:true,animations:"disabled"});
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test("short laptop hero preserves spacing between archive CTAs and metric cards",async()=>{
    const context=await browser.newContext({viewport:{width:1366,height:700},reducedMotion:"reduce"});
    const page=await context.newPage();
    await page.addInitScript(()=>localStorage.setItem("aurora-lang","bg"));
    await page.goto("http://127.0.0.1:"+port+"/");
    for(const viewport of [
      {width:1366,height:700},
      {width:1440,height:768},
      {width:900,height:700},
      {width:768,height:650},
      {width:390,height:844}
    ]){
      await page.setViewportSize(viewport);
      const geometry=await page.evaluate(()=>{
        const box=selector=>{
          const r=document.querySelector(selector).getBoundingClientRect();
          return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};
        };
        return {
          buttons:box(".silence-actions"),
          stats:box(".silence-stats"),
          hero:box("#silenceHero"),
          cards:[...document.querySelectorAll(".silence-stat")].map(el=>{
            const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom};
          })
        };
      });
      assert.ok(geometry.stats.top-geometry.buttons.bottom>=24,
        "CTA and metrics overlap at "+JSON.stringify(viewport)+": "+JSON.stringify(geometry));
      assert.ok(geometry.hero.bottom>=geometry.stats.bottom,
        "metric cards escape hero at "+JSON.stringify(viewport)+": "+JSON.stringify(geometry));
      assert.equal(geometry.cards.length,4,"four sourced stats must remain visible");
    }
    await page.setViewportSize({width:1366,height:700});
    mkdirSync("artifacts",{recursive:true});
    await page.screenshot({path:"artifacts/aurora-silence-laptop.png",animations:"disabled"});
    await context.close();
  });
  await test("homepage discovery portal localizes its routes and remains usable on desktop and mobile",async()=>{
    const desktop=await browser.newContext({viewport:{width:1366,height:900},reducedMotion:"reduce"});
    const page=await desktop.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.addInitScript(()=>{if(!sessionStorage.getItem('aurora-test-language-seeded')){localStorage.setItem('aurora-lang','bg');sessionStorage.setItem('aurora-test-language-seeded','1')}});
    await page.route("**/data/cases.json",route=>route.fulfill({status:200,contentType:"application/json",body:fullArchive}));
    await page.route("**/api/stats",route=>route.fulfill({status:503,contentType:"application/json",body:'{"error":"database_unavailable"}'}));
    await page.route("**/api/cases?*",route=>route.fulfill({status:503,contentType:"application/json",body:'{"error":"database_unavailable"}'}));
    await page.goto("http://127.0.0.1:"+port+"/");
    await page.waitForFunction(()=>document.querySelectorAll(".portal-card[data-portal]").length===8&&document.querySelector("#worldMapCount")?.textContent==="101");
    assert.equal(await page.locator("#portalHeading").textContent(),"Открий AURORA");
    assert.equal(await page.locator("#portalSubmitNews").getAttribute("href"),"/news.html#newsTips");
    assert.equal(await page.locator("#portalSubmitNews").textContent(),"Изпрати новина");
    const desktopEntry=await page.locator(".portal-grid").evaluate(grid=>({viewport:innerHeight,top:grid.getBoundingClientRect().top,fullyVisible:[...grid.querySelectorAll('.portal-card')].filter(card=>card.getBoundingClientRect().top>=0&&card.getBoundingClientRect().bottom<=innerHeight).length}));
    assert.ok(desktopEntry.top<desktopEntry.viewport&&desktopEntry.fullyVisible===8,"all discovery destinations should be visible on the first desktop screen: "+JSON.stringify(desktopEntry));
    const destinations=await page.locator(".portal-card").evaluateAll(cards=>cards.map(card=>[card.dataset.portal,card.getAttribute("href")]));
    assert.deepEqual(destinations,[
      ["news","/news.html"],["map","#worldAtlas"],["archive","/archive.html"],["media","/media.html"],
      ["report","/report.html"],["about","#mission"],["support","/donate.html"],["search","/archive.html#archiveSearch"]
    ]);
    await page.locator("#openLanguageGate").click();
    await page.locator('#gateLanguageGrid button[data-language="es"]').click();
    await page.locator("#gateContinue").click();
    await page.waitForFunction(()=>document.documentElement.lang==="es"&&document.querySelector("[data-portal=\"news\"] [data-portal-title]")?.textContent==="Últimas noticias");
    assert.equal(await page.locator("#portalHeading").textContent(),"Explora AURORA");
    assert.equal(await page.locator("#portalSubmitNews").textContent(),"Enviar una noticia");
    assert.equal(await page.locator(".desktop-nav [data-portal-nav=\"support\"]").textContent(),"Apoyar");
    await page.reload();
    assert.equal(await page.locator("html").getAttribute("lang"),"es","selected locale persists after reload");
    assert.equal(await page.locator("[data-portal=\"archive\"] [data-portal-title]").textContent(),"Archivo UAP");
    await page.locator("#exploreAURORA").scrollIntoViewIfNeeded();
    mkdirSync("artifacts",{recursive:true});
    await page.screenshot({path:"artifacts/aurora-final-portal-desktop-section.png",animations:"disabled"});
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:"artifacts/aurora-final-home-desktop.png",animations:"disabled"});
    await desktop.close();

    const tablet=await browser.newContext({viewport:{width:768,height:1024},isMobile:true,reducedMotion:"reduce"});
    const tabletPage=await tablet.newPage(),tabletErrors=[];
    tabletPage.on("pageerror",error=>tabletErrors.push(error.message));
    await tabletPage.addInitScript(()=>localStorage.setItem("aurora-lang","fr"));
    await tabletPage.route("**/data/cases.json",route=>route.fulfill({status:200,contentType:"application/json",body:fullArchive}));
    await tabletPage.route("**/api/stats",route=>route.fulfill({status:503,contentType:"application/json",body:'{"error":"database_unavailable"}'}));
    await tabletPage.route("**/api/cases?*",route=>route.fulfill({status:503,contentType:"application/json",body:'{"error":"database_unavailable"}'}));
    await tabletPage.goto("http://127.0.0.1:"+port+"/");
    await tabletPage.waitForFunction(()=>document.querySelectorAll(".portal-card[data-portal]").length===8&&document.querySelector("#worldMapCount")?.textContent==="101");
    const tabletLayout=await tabletPage.evaluate(()=>({width:document.documentElement.scrollWidth-document.documentElement.clientWidth,portalTop:document.querySelector(".portal-grid").getBoundingClientRect().top,viewport:innerHeight}));
    assert.ok(tabletLayout.width<=1,"tablet layout has no horizontal overflow");
    assert.ok(tabletLayout.portalTop<tabletLayout.viewport,"tablet shows the discovery dashboard in the first viewport");
    assert.equal(await tabletPage.locator("#portalSubmitNews").textContent(),"Proposer une actualité");
    await tabletPage.screenshot({path:"artifacts/aurora-final-home-tablet.png",animations:"disabled"});
    assert.deepEqual(tabletErrors,[]);
    await tablet.close();

    const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:"reduce"});
    const mobilePage=await mobile.newPage();
    mobilePage.on("pageerror",error=>errors.push(error.message));
    await mobilePage.addInitScript(()=>localStorage.setItem("aurora-lang","ar"));
    await mobilePage.route("**/data/cases.json",route=>route.fulfill({status:200,contentType:"application/json",body:fullArchive}));
    await mobilePage.route("**/api/stats",route=>route.fulfill({status:503,contentType:"application/json",body:'{"error":"database_unavailable"}'}));
    await mobilePage.route("**/api/cases?*",route=>route.fulfill({status:503,contentType:"application/json",body:'{"error":"database_unavailable"}'}));
    await mobilePage.goto("http://127.0.0.1:"+port+"/");
    await mobilePage.waitForFunction(()=>document.querySelectorAll(".portal-card[data-portal]").length===8&&document.documentElement.dir==="rtl"&&document.querySelector("#worldMapCount")?.textContent==="101");
    assert.equal(await mobilePage.locator("[data-portal=\"news\"] [data-portal-title]").textContent(),"أحدث الأخبار");
    assert.equal(await mobilePage.locator("#portalSubmitNews").textContent(),"أرسل خبراً");
    const mobileEntry=await mobilePage.locator(".portal-grid").evaluate(grid=>({viewport:innerHeight,top:grid.getBoundingClientRect().top,visible:[...grid.querySelectorAll('.portal-card')].filter(card=>card.getBoundingClientRect().top<innerHeight&&card.getBoundingClientRect().bottom>0).length,fullyVisible:[...grid.querySelectorAll('.portal-card')].filter(card=>card.getBoundingClientRect().top>=0&&card.getBoundingClientRect().bottom<=innerHeight).length}));
    assert.ok(mobileEntry.top<mobileEntry.viewport&&mobileEntry.fullyVisible===8,"all discovery destinations should fit the first mobile screen: "+JSON.stringify(mobileEntry));
    await mobilePage.locator("#menuToggle").click();
    assert.equal(await mobilePage.locator("#mobileNav a").count(),8);
    assert.equal(await mobilePage.locator("#mobileNav a[href=\"/donate.html\"]").textContent(),"الدعم");
    await mobilePage.locator("#menuToggle").click();
    await mobilePage.locator("#exploreAURORA").scrollIntoViewIfNeeded();
    const overflow=await mobilePage.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,"mobile portal and RTL navigation do not overflow horizontally");
    mkdirSync("artifacts",{recursive:true});
    await mobilePage.screenshot({path:"artifacts/aurora-final-portal-mobile-section.png",animations:"disabled"});
    await mobilePage.evaluate(()=>window.scrollTo(0,0));
    await mobilePage.screenshot({path:"artifacts/aurora-final-home-mobile.png",animations:"disabled"});
    assert.deepEqual(errors,[]);
    await mobile.close();
  });
  await test("newsroom UI previews, saves, localizes and explicitly publishes an article",async()=>{
    const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:"reduce"});
    const page=await context.newPage(),errors=[],actions=[];
    let tipReviewed=false;
    page.on("pageerror",error=>errors.push(error.message));
    await page.route("**/api/news-editor*",async route=>{
      const request=route.request();
      if(request.method()==="GET"){
        const url=new URL(request.url()),kind=url.searchParams.get("kind")||"articles";
        if(kind==="translation")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({source_language:"en",translation:null})});
        if(kind==="tips")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({tips:tipReviewed?[]:[{id:"aur-tip-12345678-1234-1234-1234-123456789abc",title:"A new source-backed UAP report",source_url:"https://publisher.example/story/456",status:"pending",submitted_at:"2026-10-30T12:00:00Z"}],offset:0,has_more:false})});
        return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({articles:[],offset:0,has_more:false})});
      }
      const payload=request.postDataJSON();actions.push(payload.action);
      if(payload.action==="save_article")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({id:"aur-news-12345678-1234-1234-1234-123456789abc",status:payload.article.id?"updated":"draft",published:false})});
      if(payload.action==="save_translation")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({status:"localized",language:payload.translation.language_code})});
      if(payload.action==="publish_article")return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({status:"published",published:true})});
      if(payload.action==="review_tip"){tipReviewed=true;return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({status:payload.decision,published:false})})}
      return route.fulfill({status:400,contentType:"application/json",body:'{"error":"unsupported_test_action"}'});
    });
    await page.goto("http://127.0.0.1:"+port+"/news-editor.html");
    assert.equal(await page.locator("#publishArticle").isDisabled(),true,"cannot publish an incomplete article");
    await page.locator("#articleLanguage").selectOption("en");
    await page.locator("#articleTitle").fill("A source-reviewed UAP policy update");
    await page.locator("#articleSummary").fill("An attributed summary with context and explicit uncertainty for readers.");
    await page.locator("#articleBody").fill("The source reports a policy update. AURORA preserves the publisher's account, context and uncertainty, and does not describe the claim as scientifically established. This longer body satisfies editorial minimum length.");
    await page.locator("#articleSourceName").fill("Example Research Desk");
    await page.locator("#articleSourceUrl").fill("https://publisher.example/story/123");
    await page.locator("#previewArticle").click();
    assert.equal(await page.locator("#articlePreview").isVisible(),true);
    assert.equal(await page.locator("#articlePreview h2").textContent(),"A source-reviewed UAP policy update");
    await page.locator("#saveArticle").click();
    await page.waitForFunction(()=>document.querySelector("#newsEditorStatus")?.textContent==="Черновата е запазена.");
    await page.locator("#translationLanguage").selectOption("es");
    await page.locator("#translationTitle").fill("Actualización de política sobre UAP");
    await page.locator("#translationSummary").fill("Resumen editorial revisado que atribuye claramente la información a su fuente.");
    await page.locator("#translationBody").fill("El texto original se conserva, se atribuye al editor y distingue el informe de las conclusiones verificadas. Esta traducción fue redactada por una persona y revisada antes de publicarse.");
    await page.locator("#saveTranslation").click();
    await page.waitForFunction(()=>document.querySelector("#newsEditorStatus")?.textContent==="Редакторският превод е запазен.");
    await page.locator("#publishArticle").click();
    await page.waitForFunction(()=>document.querySelector("#newsEditorStatus")?.textContent==="Статията е публикувана в публичния новинарски поток.");
    await page.locator("#showTips").click();
    await page.waitForFunction(()=>document.querySelectorAll(".news-tip-review-card").length===1);
    await page.locator(".news-tip-review-actions textarea").fill("Source is relevant for editorial verification.");
    await page.getByRole("button",{name:"Одобри за редакционен преглед"}).click();
    await page.waitForFunction(()=>document.querySelector("#newsEditorStatus")?.textContent==="Предложението е одобрено само за редакционна употреба.");
    assert.equal(await page.locator(".news-tip-review-card").count(),0,"review approval does not publish a visitor-submitted article");
    assert.deepEqual(actions,["save_article","save_translation","save_article","publish_article","review_tip"]);
    await page.setViewportSize({width:390,height:844});
    const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(mobileOverflow<=1,"private newsroom form fits a mobile viewport");
    assert.equal(await page.locator("#articleForm").isVisible(),true);
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test("all nine inner pages use the same real black skin, not old cyan layouts",async()=>{
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    const page=await context.newPage();
    await page.addInitScript(()=>localStorage.setItem("aurora-lang","de"));
    mkdirSync("artifacts",{recursive:true});
    for(const uri of ["/archive.html","/countries.html","/country.html","/dossier.html","/media.html","/news.html","/report.html","/sources.html","/donate.html"]){
      await page.goto("http://127.0.0.1:"+port+uri);
      const results=await page.evaluate(()=>{
        const bodyStyle=getComputedStyle(document.body);
        return {
          bg:bodyStyle.backgroundColor,
          css:[...document.styleSheets].some(s=>s.href?.endsWith("/aurora-black-pages.css")),
          height:document.body.scrollHeight,
          width:document.documentElement.scrollWidth-document.documentElement.clientWidth
        };
      });
      assert.equal(results.css,true,uri+" must load shared black visual system");
      assert.match(results.bg,/rgb\(1, 3, 5\)/,uri+" body should be true near-black");
      assert.ok(results.width<=1,uri+" should have no horizontal overflow");
      if(uri==="/archive.html")await page.screenshot({path:"artifacts/aurora-black-archive.png",animations:"disabled"});
      if(uri==="/media.html")await page.screenshot({path:"artifacts/aurora-black-media.png",animations:"disabled"});
      if(uri==="/dossier.html")await page.screenshot({path:"artifacts/aurora-black-dossier.png",animations:"disabled"});
    }
    await context.close();
  });
  await test("Black Edition mobile pages preserve French and never overflow",async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:"reduce"});
    const page=await ctx.newPage();
    await page.addInitScript(()=>localStorage.setItem("aurora-lang","fr"));
    for(const uri of ["/archive.html","/countries.html","/country.html","/media.html","/news.html","/report.html","/sources.html","/donate.html"]){
      await page.goto("http://127.0.0.1:"+port+uri);
      const result=await page.evaluate(()=>({
        delta:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        width:document.body.getBoundingClientRect().width,
        lang:document.documentElement.lang
      }));
      assert.ok(result.delta<=1,uri+" horizontal overflow "+JSON.stringify(result));
      assert.ok(result.width<=391,uri+" body exceeds viewport");
      assert.equal(result.lang,"fr",uri+" must persist chosen locale");
      if(uri==="/archive.html")
        assert.match(await page.locator(".archive-hero h1").textContent(),/ARCHIVES UAP MONDIALES/);
      if(uri==="/sources.html")
        assert.match(await page.locator(".live-hero h1").textContent(),/SOURCES INTERNATIONALES/);
    }
    await ctx.close();
  });
  await test("Translated dossier retains one original verified embedded player",async()=>{
    const ctx=await browser.newContext({viewport:{width:1280,height:850}});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.addInitScript(()=>localStorage.setItem("aurora-lang","de"));
    await page.route("**/data/cases.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({cases:[{
      id:"mock-case-video",date:"2026-10-05",country:"US",category:"lights",status:"undetermined",
      title:{en:"Witness-recorded sighting",bg:"Свидетелски запис"},
      summary:{en:"A sourced report with an original video.",bg:"Сигнал с оригинално видео."},
      story:{en:["Several witnesses saw lights above the city."]},
      source:{name:"Public Publisher",url:"https://example.org/record"},
      media:[{type:"video",url:"https://www.youtube.com/watch?v=aqz-KE-bpKQ",title:{en:"Original footage",bg:"Оригинален запис"}}]
    }]})}));
    await page.goto("http://127.0.0.1:"+port+"/archive/mock-case-video");
    await page.waitForFunction(()=>document.querySelector("#dossierContent")?.hidden===false);
    assert.equal(await page.locator("#dossierTitle").textContent(),"Witness-recorded sighting");
    assert.ok(await page.locator("#dossierTranslationDisclosure").isVisible());
    await page.locator("#caseHeroPlay").waitFor({state:"visible"});
    assert.match(await page.locator("#caseHeroPlay").textContent(),/AURORA ANSEHEN/i,"German video controls must honor the selected language");
    assert.match(await page.locator("#caseHeroSource").textContent(),/Originalquelle/i);
    await page.locator("#caseHeroPlay").click();
    assert.match(await page.locator("#caseHeroClose").textContent(),/Player schließen/i);
    const frame=page.locator("#caseHeroStage iframe.case-hero-media");
    await frame.waitFor({state:"attached"});
    assert.match(await frame.getAttribute("src"),/youtube-nocookie\.com\/embed\/aqz-KE-bpKQ/);
    assert.equal(await page.locator("#caseHeroStage iframe").count(),1);
    await page.screenshot({path:"artifacts/aurora-black-real-dossier.png",animations:"disabled"});
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
  await test("Media page offers one playable embedded source recording without redirecting away",async()=>{
    const ctx=await browser.newContext({viewport:{width:1240,height:800}});
    const page=await ctx.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/data/cases.json",route=>route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({cases:[{
      id:"test-media-case",date:"2026-10-05",country:"US",city:{en:"Arizona",bg:"Аризона"},
      title:{en:"Source-linked video test",bg:"Тестово видео"},
      summary:{en:"An original published recording for the case.",bg:"Оригинално публикувано видео."},
      source:{name:"Original Publisher",url:"https://example.org/case"},
      media:[{type:"video",url:"https://www.youtube.com/watch?v=aqz-KE-bpKQ",title:{en:"Published recording",bg:"Публикувано видео"}}]
    }]})}));
    await page.goto("http://127.0.0.1:"+port+"/media.html");
    await page.waitForFunction(()=>document.querySelectorAll("#mediaGallery .media-entry").length===1&&!!document.querySelector(".media-inline-play"));
    const button=page.locator(".media-inline-play");
    assert.equal(await button.isVisible(),true);
    await button.click();
    const player=page.locator("#mediaGallery .media-inline-player-stage iframe");
    await player.waitFor({state:"attached"});
    assert.match(await player.getAttribute("src"),/youtube-nocookie\.com\/embed\/aqz-KE-bpKQ/);
    assert.equal(await page.locator("#mediaGallery .media-entry-links a[target=\"_blank\"]").count(),1);
    assert.equal(await page.locator("#mediaGallery .archive-video-box, #mediaGallery .aurora-player-button").count(),0);
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
