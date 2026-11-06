import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
const testImage=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl4ZhQAAAAASUVORK5CYII=','base64');
let server,port,browser;
before(async()=>{
 server=createServer(async(req,res)=>{
  const url=new URL(req.url||'/', 'http://127.0.0.1');
  const relative=url.pathname.replace(/^\/+/, '')||'index.html';
  const path=resolve(ROOT,relative);
  if(!path.startsWith(ROOT+'/'))return res.writeHead(403).end();
  try{
   const data=await readFile(path);
   res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream'}).end(data);
  }catch{res.writeHead(404).end('Missing fixture')}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));port=server.address().port;
 browser=await chromium.launch({headless:true,...(process.env.AURORA_CHROMIUM_PATH?{executablePath:process.env.AURORA_CHROMIUM_PATH}:{})});
});
after(async()=>{await browser?.close();await new Promise(done=>server.close(done))});
for(const width of [390,1440])test(`DVIDS original video stills load and a single inline player opens/closes at ${width}px`,async()=>{
 const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
 const page=await context.newPage();let errors=[];const imgs=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('aurora-lang','en'));
 await page.route('https://d1ldvf68ux039x.cloudfront.net/**',route=>{
   imgs.push(route.request().url());route.fulfill({status:200,contentType:'image/png',body:testImage});
 });
 await page.route('https://www.dvidshub.net/video/embed/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>DVIDS embed stub</title>'}));
 await page.goto(`http://127.0.0.1:${port}/media.html`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#mediaGallery article').length>=85&&document.querySelectorAll('.media-inline-play').length>=19);
 const cards=page.locator('#mediaGallery article');
 const dvids=cards.filter({has:page.locator('img[src*="d1ldvf68ux039x.cloudfront.net"]')});
 assert.equal(await dvids.count(),13);
 assert.equal(await page.locator('.media-source-preview-credit').filter({hasText:'DVIDS publisher video still'}).count(),13);
 const original=await dvids.first().locator('.media-entry-links a[target="_blank"]').first().getAttribute('href');
 assert.match(original,/^https:\/\/www\.dvidshub\.net\/video\//);
 assert.equal(await dvids.first().locator('.media-entry-image img').isVisible(),true);
 await dvids.first().locator('.media-entry-image img').evaluate(img=>{img.loading='eager'});
 await page.waitForFunction(()=>[...document.querySelectorAll('#mediaGallery .media-entry img[src*="d1ldvf68ux039x.cloudfront.net"]')].some(x=>x.naturalWidth>0));
 assert.ok(imgs.length>=1);
 await dvids.first().locator('.media-inline-play').click();
 assert.equal(await page.locator('#mediaGallery .media-inline-player-stage iframe').count(),1);
 assert.equal(await page.locator('#mediaGallery .media-inline-active').count(),1);
 await dvids.first().locator('.media-inline-close').click();
 assert.equal(await page.locator('#mediaGallery .media-inline-player-stage iframe').count(),0);
 assert.equal(await page.locator('#mediaGallery .media-inline-active').count(),0);
 assert.equal(await dvids.first().locator('.media-entry-image img').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0);
 assert.deepEqual(errors,[]);
 await context.close();
});
