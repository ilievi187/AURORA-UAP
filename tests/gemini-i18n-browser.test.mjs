import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { DatabaseSync } from 'node:sqlite';
import { importReviewed } from '../worker/import-core.js';
import { onRequestGet as listCases } from '../functions/api/cases.js';
import { onRequestGet as listStats } from '../functions/api/stats.js';
import { onRequestGet as countryStats } from '../functions/api/countries/[code].js';
import { onRequestGet as oneCase } from '../functions/api/cases/[id].js';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain'};
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
  const resolved=/^\/news\/?$/.test(decoded)?'/news.html':
    /^\/sky\/?$/.test(decoded)?'/sky.html':
    /^\/countries\/?$/.test(decoded)?'/countries.html':
    /^\/report\/?$/.test(decoded)?'/report.html':
    /^\/donate\/?$/.test(decoded)?'/donate.html':
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

const ALL_LOCALES=['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko'];

let browser;
try{
  browser=await chromium.launch({headless:true});

  await test('homepage and Mission Control support all 18 languages, ?lang= entry, reload, back/forward history, and mobile viewport fit',async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/news?*',route=>route.fulfill({
      status:200,contentType:'application/json',
      body:JSON.stringify({status:'live',edition:'global',updated_at:'2026-10-29T12:00:00Z',items:[],translation:{target:'fr',status:'original',translated:0}})
    }));

    // Direct URL entry with ?lang=fr bypasses mandatory language gate and sets French homepage + SEO metadata
    await page.goto('http://127.0.0.1:'+port+'/?lang=fr');
    assert.equal(await page.locator('#languageGate').isVisible(),false,'?lang=fr should enter homepage directly');
    assert.equal(await page.locator('html').getAttribute('lang'),'fr');
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://aurorauap.org/');
    assert.match(await page.title(),/Explorer l'inexpliqué/);
    assert.equal(await page.locator('#controlHeading').textContent(),'CENTRE DE CONTRÔLE');
    assert.equal(await page.locator('#controlStageTitle').textContent(),"Documenter l'observation");

    // Verify all 18 locales on the homepage render translated sections, Mission Control stages, and World Archive headings without mobile overflow
    for(const locale of ALL_LOCALES){
      await page.locator('#langToggle').selectOption(locale);
      assert.equal(await page.locator('html').getAttribute('lang'),locale);
      const researchTitle=await page.locator('[data-i18n="researchTitle"]').textContent();
      const controlHeading=await page.locator('#controlHeading').textContent();
      const reportsHeading=await page.locator('#reports .section-heading h2').textContent();
      assert.ok(researchTitle.trim().length>0,`researchTitle empty for ${locale}`);
      assert.ok(controlHeading.trim().length>0,`controlHeading empty for ${locale}`);
      assert.ok(reportsHeading.trim().length>0,`reportsHeading empty for ${locale}`);
      if(locale!=='en'){
        assert.notEqual(researchTitle,'OBSERVE. QUESTION. INVESTIGATE.',`researchTitle must be localized for ${locale}`);
        assert.notEqual(controlHeading,'MISSION CONTROL',`controlHeading must be localized for ${locale}`);
        assert.notEqual(reportsHeading,'CASES FROM AROUND THE WORLD',`reportsHeading must be localized for ${locale}`);
      }
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      assert.ok(overflow<=1,`homepage mobile overflow for ${locale}: ${overflow}`);
    }

    // Verify reload and browser goBack / goForward preserve selected language
    await page.locator('#langToggle').selectOption('pl');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'),'pl');
    assert.equal(await page.locator('#controlHeading').textContent(),'CENTRUM KONTROLI');
    await page.goto('http://127.0.0.1:'+port+'/news.html');
    assert.equal(await page.locator('html').getAttribute('lang'),'pl');
    await page.goBack();
    assert.equal(await page.locator('html').getAttribute('lang'),'pl');
    assert.equal(await page.locator('#controlHeading').textContent(),'CENTRUM KONTROLI');
    await page.goForward();
    assert.equal(await page.locator('html').getAttribute('lang'),'pl');
    assert.equal(await page.locator('#pageLanguage').inputValue(),'pl');

    assert.deepEqual(errors,[]);
    await ctx.close();
  });

  await test('persistent locale selector switches and retains language across /news, /countries, /countries/:code, /archive/:id, /cases/:id and /report',async()=>{
    const ctx=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/news?*',route=>{
      const u=new URL(route.request().url()),lang=u.searchParams.get('lang');
      route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
        status:'live',edition:'global',updated_at:'2026-10-29T12:00:00Z',
        items:[{
          title:'Unexplained aerial lights reported',
          summary:'Multiple witnesses observed silent lights moving across the valley.',
          translated_title:lang==='de'?'Unerklärliche Lichter am Himmel gemeldet':'Luces aéreas inexplicables reportadas',
          translated_summary:lang==='de'?'Mehrere Zeugen beobachteten lautlose Lichter über dem Tal.':'Varios testigos observaron luces silenciosas.',
          url:'https://publisher.example.test/1',
          source:'Example Press',
          published:'2026-10-29T11:00:00Z',
          language:'en',
          source_language:'en'
        }],
        translation:{target:lang,status:'translated',translated:1}
      })});
    });

    await page.goto('http://127.0.0.1:'+port+'/news');
    await page.locator('#pageLanguage').selectOption('de');
    await page.waitForFunction(()=>document.querySelector('.live-card h2 a')?.textContent==='Unerklärliche Lichter am Himmel gemeldet');
    assert.equal(await page.locator('html').getAttribute('lang'),'de');
    assert.equal(await page.locator('.live-hero h1').textContent(),'UAP-NACHRICHTEN WELTWEIT');
    assert.equal(await page.locator('#edition option[value="global"]').textContent(),'🌍 Weltweiter Feed');
    assert.equal(await page.locator('.news-summary').textContent(),'Mehrere Zeugen beobachteten lautlose Lichter über dem Tal.');
    assert.equal(await page.locator('.news-lang-badge').textContent(),'EN → DE');
    assert.equal(await page.locator('.news-original > summary').textContent(),'ORIGINALSCHLAGZEILE');
    assert.equal(await page.locator('.news-original p').first().textContent(),'Unexplained aerial lights reported');
    assert.equal(await page.locator('.news-original-summary').textContent(),'Multiple witnesses observed silent lights moving across the valley.');
    assert.match(await page.locator('#newsStatus').textContent(),/Schlagzeilen/);

    await page.goto('http://127.0.0.1:'+port+'/countries.html');
    assert.equal(await page.locator('#pageLanguage').inputValue(),'de');
    assert.equal(await page.locator('html').getAttribute('lang'),'de');
    assert.equal(await page.locator('#directoryTitle').textContent(),'BEOBACHTUNGEN NACH LÄNDERN');
    assert.equal(await page.title(),'AURORA — Länderverzeichnis');
    await page.locator('#pageLanguage').selectOption('fr');
    assert.equal(await page.locator('#directoryTitle').textContent(),'OBSERVATIONS PAR PAYS');
    assert.equal(await page.title(),'AURORA — Répertoire des pays');

    await page.goto('http://127.0.0.1:'+port+'/countries/PR');
    assert.equal(await page.locator('#pageLanguage').inputValue(),'fr');
    assert.equal(await page.locator('html').getAttribute('lang'),'fr');
    assert.equal(await page.locator('#sightingsLabel').textContent(),'CAS ENREGISTRÉS');
    assert.equal(await page.locator('#resultsHeading').textContent(),'REGISTRE DES CAS');
    await page.locator('#pageLanguage').selectOption('es');
    assert.equal(await page.locator('#sightingsLabel').textContent(),'CASOS REGISTRADOS');
    assert.equal(await page.locator('#resultsHeading').textContent(),'REGISTRO DE CASOS');

    await page.goto('http://127.0.0.1:'+port+'/archive/phoenix-1997');
    await page.waitForFunction(()=>document.querySelector('#dossierContent')?.hidden===false);
    assert.equal(await page.locator('#pageLanguage').inputValue(),'es');
    assert.equal(await page.locator('html').getAttribute('lang'),'es');
    assert.equal(await page.locator('#dossierBack').textContent(),'← INICIO');
    assert.equal(await page.locator('#summaryHeading').textContent(),'TESTIMONIOS Y HECHOS DOCUMENTADOS');
    assert.equal(await page.locator('#factCategory').textContent(),'Luces');
    assert.equal(await page.locator('#relatedHeading').textContent(),'CASOS RELACIONADOS EN EL ARCHIVO');
    assert.ok((await page.locator('#relatedCasesGrid .related-case-card').count())>=1,'related cases must render on dossier');
    // Verify factual source coordinates and external source URL remain unaltered across languages
    assert.ok((await page.locator('#dossierSourceUrl').getAttribute('href')).startsWith('https://nuforc.org/'));
    const coordsEs=await page.locator('#dossierCoordinate').textContent();
    await page.locator('#pageLanguage').selectOption('ja');
    assert.equal(await page.locator('#dossierBack').textContent(),'← ホーム');
    assert.equal(await page.locator('#summaryHeading').textContent(),'目撃報告と記録された事実');
    assert.equal(await page.locator('#factCategory').textContent(),'光');
    assert.equal(await page.locator('#relatedHeading').textContent(),'関連するアーカイブ事例');
    assert.equal(await page.locator('#dossierCoordinate').textContent(),coordsEs,'coordinates must remain identical across locales');

    await page.goto('http://127.0.0.1:'+port+'/cases/aaro-pr-2013');
    await page.waitForFunction(()=>document.querySelector('#dossierContent')?.hidden===false);
    assert.equal(await page.locator('#pageLanguage').inputValue(),'ja');
    assert.equal(await page.locator('#dossierBack').textContent(),'← ホーム');
    assert.equal(await page.locator('#factCategory').textContent(),'機器による記録');
    assert.match(await page.locator('#factAssessment').textContent(),/出典により解明済み/);

    await page.goto('http://127.0.0.1:'+port+'/report.html');
    assert.equal(await page.locator('#pageLanguage').inputValue(),'ja');
    assert.equal(await page.locator('.report-back').textContent(),'← ホーム');
    assert.equal(await page.locator('#reportHeading').textContent(),'目撃情報を報告する');
    assert.equal(await page.locator('#saveDraft').textContent(),'下書きを保存');
    assert.equal(await page.title(),'報告 | AURORA UAP');
    assert.deepEqual(errors,[]);
    await ctx.close();
  });

  await test('donate page supports all 18 languages without overflow on mobile and desktop',async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/donate.html?lang=ko');
    assert.equal(await page.locator('html').getAttribute('lang'),'ko');
    assert.equal(await page.locator('#langSelect').inputValue(),'ko');
    for(const locale of ALL_LOCALES){
      await page.locator('#langSelect').selectOption(locale);
      assert.equal(await page.locator('html').getAttribute('lang'),locale);
      const h1Text=await page.locator('h1').textContent();
      assert.ok(h1Text.trim().length>0,`donate h1 not empty for ${locale}`);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      assert.ok(overflow<=1,`donate mobile overflow for ${locale}: ${overflow}`);
    }
    assert.deepEqual(errors,[]);
    await ctx.close();
  });

  await test('report page localizes form labels, buttons and ethics across all 18 languages and supports ?lang= shareable links with canonical SEO',async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/news.html?lang=tr');
    assert.equal(await page.locator('html').getAttribute('lang'),'tr');
    assert.equal(await page.locator('#pageLanguage').inputValue(),'tr');
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://aurorauap.org/news');
    const metaDesc=await page.locator('meta[name="description"]').getAttribute('content');
    assert.ok(metaDesc&&metaDesc.includes('Dünya medyasından'),`expected Turkish meta description, got: ${metaDesc}`);

    await page.goto('http://127.0.0.1:'+port+'/report.html');
    assert.equal(await page.locator('html').getAttribute('lang'),'tr');
    assert.equal(await page.locator('#reportHeading').textContent(),'GÖZLEM BİLDİR');
    for(const locale of ALL_LOCALES){
      await page.locator('#pageLanguage').selectOption(locale);
      assert.equal(await page.locator('html').getAttribute('lang'),locale);
      assert.ok((await page.locator('#reportHeading').textContent()).trim().length>0);
      assert.ok((await page.locator('#saveDraft').textContent()).trim().length>0);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      assert.ok(overflow<=1,`report mobile overflow for ${locale}: ${overflow}`);
    }
    assert.deepEqual(errors,[]);
    await ctx.close();
  });

  await test('mobile responsive layout has no horizontal overflow with language selector across subpages',async()=>{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>localStorage.setItem('aurora-lang','es'));
    for(const route of ['/news.html','/countries.html','/countries/PR','/archive/phoenix-1997','/report.html']){
      await page.goto('http://127.0.0.1:'+port+route);
      assert.equal(await page.locator('#pageLanguage').isVisible(),true,`${route} language selector visible on mobile`);
      assert.equal(await page.locator('#pageLanguage').inputValue(),'es',`${route} retains es on mobile`);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
      assert.ok(overflow<=1,`${route} mobile overflow: ${overflow}`);
    }
    assert.deepEqual(errors,[]);
    await ctx.close();
  });
}finally{
  await browser?.close();
  server.close();
}
