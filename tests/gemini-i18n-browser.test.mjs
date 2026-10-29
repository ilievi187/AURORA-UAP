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

  await test('persistent locale selector switches and retains language across /news, /countries, /countries/:code, /archive/:id, /cases/:id and /report',async()=>{
    const ctx=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'});
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/api/news?*',route=>{
      const u=new URL(route.request().url()),lang=u.searchParams.get('lang');
      route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
        status:'live',edition:'global',updated_at:'2026-10-29T12:00:00Z',
        items:[{title:'Unexplained aerial lights reported',translated_title:lang==='de'?'Unerklärliche Lichter am Himmel gemeldet':'Luces aéreas inexplicables reportadas',url:'https://publisher.example.test/1',source:'Example Press',published:'2026-10-29T11:00:00Z',language:'en'}],
        translation:{target:lang,status:'translated',translated:1}
      })});
    });

    await page.goto('http://127.0.0.1:'+port+'/news');
    await page.locator('#pageLanguage').selectOption('de');
    await page.waitForFunction(()=>document.querySelector('.live-card h2 a')?.textContent==='Unerklärliche Lichter am Himmel gemeldet');
    assert.equal(await page.locator('html').getAttribute('lang'),'de');
    assert.equal(await page.locator('.live-hero h1').textContent(),'UAP-NACHRICHTEN WELTWEIT');
    assert.equal(await page.locator('#edition option[value="global"]').textContent(),'🌍 Weltweiter Feed');
    assert.equal(await page.locator('.news-original > summary').textContent(),'ORIGINALSCHLAGZEILE');
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
    await page.locator('#pageLanguage').selectOption('ja');
    assert.equal(await page.locator('#dossierBack').textContent(),'← ホーム');
    assert.equal(await page.locator('#summaryHeading').textContent(),'目撃報告と記録された事実');

    await page.goto('http://127.0.0.1:'+port+'/cases/aaro-pr-2013');
    await page.waitForFunction(()=>document.querySelector('#dossierContent')?.hidden===false);
    assert.equal(await page.locator('#pageLanguage').inputValue(),'ja');
    assert.equal(await page.locator('#dossierBack').textContent(),'← ホーム');

    await page.goto('http://127.0.0.1:'+port+'/report.html');
    assert.equal(await page.locator('#pageLanguage').inputValue(),'ja');
    assert.equal(await page.locator('.report-back').textContent(),'← ホーム');
    assert.equal(await page.title(),'報告 | AURORA UAP');
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
