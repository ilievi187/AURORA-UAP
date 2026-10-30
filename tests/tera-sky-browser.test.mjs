import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const requests=[];
let notify=()=>{};
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/air-traffic'){
    requests.push({region:url.searchParams.get('region'),res}); notify(); return;
  }
  const file=resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+sep))return res.writeHead(403).end();
  try{res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(await readFile(url.pathname==='/sky.js' && process.env.SKY_JS_OVERRIDE || file));}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const received=async(count)=>{
  while(requests.length<count)await new Promise(resolve=>{notify=resolve});
  notify=()=>{};
};
const finish=(request,source)=>request.res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({
  status:'live',source,aircraft:[],observed_at:'2026-10-30T12:00:00Z',
  bounds:{lomin:0,lomax:10,lamin:0,lamax:10}
}));
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  await test('late previous region success cannot replace the selected region',async()=>{
    requests.length=0;
    const page=await browser.newPage();
    try{
      await page.goto(`http://127.0.0.1:${server.address().port}/sky.html`);
      await received(1);
      await page.locator('#skyRegion').selectOption('jp');
      await received(2);
      assert.deepEqual(requests.map(r=>r.region),['bg','jp']);
      finish(requests[1],'Japan');
      await page.waitForFunction(()=>document.querySelector('#skyStatus').textContent.startsWith('Japan'));
      finish(requests[0],'Bulgaria');
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#skyRegion').inputValue(),'jp');
      assert.match(await page.locator('#skyStatus').textContent(),/^Japan/);
      assert.equal(await page.locator('#skyStatus').getAttribute('data-state'),'live');
    }finally{await page.close();}
  });
  await test('late previous failure does not erase newer region results',async()=>{
    requests.length=0;
    const page=await browser.newPage();
    try{
      await page.goto(`http://127.0.0.1:${server.address().port}/sky.html`);
      await received(1);
      await page.locator('#skyRegion').selectOption('jp');
      await received(2);
      finish(requests[1],'Japan');
      await page.waitForFunction(()=>document.querySelector('#skyStatus').textContent.startsWith('Japan'));
      requests[0].res.writeHead(503).end();
      await page.waitForTimeout(100);
      assert.match(await page.locator('#skyStatus').textContent(),/^Japan/);
      assert.equal(await page.locator('#skyStatus').getAttribute('data-state'),'live');
      assert.ok(await page.locator('#skyMap rect').count());
    }finally{await page.close();}
  });
  await test('earlier request completion cannot re-enable refresh while newer request loads',async()=>{
    requests.length=0;
    const page=await browser.newPage();
    try{
      await page.goto(`http://127.0.0.1:${server.address().port}/sky.html`);
      await received(1);
      await page.locator('#skyRegion').selectOption('jp');
      await received(2);
      finish(requests[0],'Bulgaria');
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#skyStatus').getAttribute('data-state'),'loading');
      assert.equal(await page.locator('#refreshSky').isDisabled(),true);
      finish(requests[1],'Japan');
      await page.waitForFunction(()=>document.querySelector('#skyStatus').textContent.startsWith('Japan'));
      assert.equal(await page.locator('#refreshSky').isEnabled(),true);
    }finally{await page.close();}
  });
}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
