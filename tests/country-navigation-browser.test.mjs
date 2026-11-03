import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json',
 '.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{
 const route=new URL(req.url,'http://localhost').pathname;
 if(route.startsWith('/api/')){
  res.writeHead(503,{'Content-Type':'application/json'}).end('{"error":"database_unavailable"}');
  return;
 }
 const mapped=/^\/countries\/[A-Z]{2}$/.test(route)?'/country.html':
  /^\/archive\/[a-z0-9-]{3,90}$/.test(route)?'/dossier.html':
  route==='/'?'/index.html':route;
 const file=resolve(root,'.'+mapped);
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
 try{
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(bytes);
 }catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.AURORA_CHROMIUM_PATH?
  {executablePath:process.env.AURORA_CHROMIUM_PATH}:{})});
 await test('31 country archives show real file counts, search and 24-case pagination',async()=>{
  const ctx=await browser.newContext({viewport:{width:1280,height:800}});
  await ctx.addInitScript(()=>localStorage.setItem('aurora-lang','en'));
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try{
   await page.goto(base+'/countries.html');
   await page.waitForFunction(()=>document.querySelector('#sourcedCountryGrid')?.children.length>=20);
   assert.match(await page.locator('#sourcedCountryGrid a[href="/countries/US"]').textContent(),/7,361/);
   await page.locator('#sourceCountrySearch').fill('France');
   assert.equal(await page.locator('#sourcedCountryGrid a').count(),1);
   await page.goto(base+'/countries/US');
   await page.waitForFunction(()=>document.querySelector('#countryHistoryStatus')?.textContent.includes('7,361'));
   assert.equal(await page.locator('#countryHistoryGrid a').count(),24);
   assert.equal(await page.locator('#countryHistoryGrid img').count(),0,'no repeated stock images');
   await page.locator('#countryHistoryPager button').last().click();
   assert.match(await page.locator('#countryHistoryStatus').textContent(),/25–48 of 7,361/);
   await page.goto(base+'/countries/FR');
   await page.waitForFunction(()=>document.querySelector('#countryHistoryStatus')?.textContent.includes('2,713'));
   await page.locator('#countryHistorySearch').fill('MARTIGUES');
   assert.ok(await page.locator('#countryHistoryGrid a').count()>=1,'published French cases searchable by city');
   assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
 });
 await test('source geo circles open country dossiers without implicit zoom on desktop/mobile',async()=>{
  const ctx=await browser.newContext({viewport:{width:1280,height:850},reducedMotion:'reduce'});
  await ctx.addInitScript(()=>localStorage.setItem('aurora-lang','en'));
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try{
   await page.goto(base+'/');
   await page.waitForFunction(()=>document.querySelectorAll('#worldBulkPins a').length>=10,null,{timeout:20000});
   assert.equal(await page.locator('#worldZoomLevel').textContent(),'100%');
   assert.ok((await page.locator('#worldCountryLinks').textContent()).includes('2,715'));
   const link=page.locator('#worldBulkPins a[href="/countries/FR"]').first();
   assert.ok(await link.count());
   await link.click();
   await page.waitForURL(/\/countries\/FR$/);
   await page.waitForFunction(()=>document.querySelector('#countryHistoryStatus')?.textContent.includes('2,713'));
   assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
  await mobile.addInitScript(()=>localStorage.setItem('aurora-lang','en'));
  const mp=await mobile.newPage();
  try{
   await mp.goto(base+'/countries/US');
   await mp.waitForFunction(()=>document.querySelector('#countryHistoryStatus')?.textContent.includes('7,361'));
   const {scroll,client}=await mp.evaluate(()=>({scroll:document.documentElement.scrollWidth,
    client:document.documentElement.clientWidth}));
   assert.ok(scroll<=client+1,'country dossiers overflow narrow viewport');
  }finally{await mobile.close()}
 });
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r))}
