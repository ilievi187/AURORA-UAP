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
const plane=(icao24,callsign,lat,lon)=>({
  icao24,callsign,latitude:lat,longitude:lon,
  altitude_m:9876,speed_ms:220,heading:90,on_ground:false
});
const JAPAN=plane('abc123','JPN001',5,6);
const BULGARIA=plane('def456','BGOLD1',7,4);
const finish=(request,source,aircraft=[])=>request.res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({
  status:'live',source,aircraft,observed_at:'2026-10-30T12:00:00Z',
  bounds:{lomin:0,lomax:10,lamin:0,lamax:10}
}));
const responseFor=(page,region)=>page.waitForResponse(r=>new URL(r.url()).pathname==='/api/air-traffic'&&new URL(r.url()).searchParams.get('region')===region);
// Network completion plus two rendering frames replaces timing-dependent sleeps.
// Test populated data and selected details, not just unchanged status text.
const settledFrame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const send=async(page,request,source,aircraft=[])=>{
  const done=responseFor(page,request.region);
  finish(request,source,aircraft);
  await done;
  await settledFrame(page);
};
const sendFailure=async(page,request)=>{
  const done=responseFor(page,request.region);
  request.res.writeHead(503).end();
  await done;
  await settledFrame(page);
};
const assertJapanVisible=async page=>{
  assert.equal(await page.locator('#skyRegion').inputValue(),'jp');
  assert.match(await page.locator('#skyStatus').textContent(),/^Japan · 1 aircraft/);
  assert.equal(await page.locator('#skyStatus').getAttribute('data-state'),'live');
  assert.deepEqual(await page.locator('#skyList button strong').allTextContents(),['JPN001']);
  assert.equal(await page.locator('#skyMap circle.plane').count(),1);
  assert.equal(await page.locator('#skyMap circle[aria-label="JPN001"]').count(),1);
  assert.equal(await page.locator('#skyList').getByText('BGOLD1').count(),0);
  assert.equal(await page.locator('#skyMap circle[aria-label="BGOLD1"]').count(),0);
};
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  await test('late previous success cannot replace current populated map, list or selected aircraft',async()=>{
    requests.length=0;
    const page=await browser.newPage();
    try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/sky.html');
      await received(1);
      await page.locator('#skyRegion').selectOption('jp');
      await received(2);
      assert.deepEqual(requests.map(r=>r.region),['bg','jp']);
      await send(page,requests[1],'Japan',[JAPAN]);
      await page.waitForFunction(()=>document.querySelector('#skyList button strong')?.textContent==='JPN001');
      await page.locator('#skyList button').first().click();
      assert.match(await page.locator('#skyDetail').textContent(),/JPN001/);
      await send(page,requests[0],'Bulgaria',[BULGARIA]);
      await assertJapanVisible(page);
      assert.match(await page.locator('#skyDetail').textContent(),/JPN001/);
      assert.equal(await page.locator('#skyList button').first().getAttribute('aria-pressed'),'true');
    }finally{await page.close();}
  });
  await test('late previous failure cannot erase current populated map, list or detail',async()=>{
    requests.length=0;
    const page=await browser.newPage();
    try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/sky.html');
      await received(1);
      await page.locator('#skyRegion').selectOption('jp');
      await received(2);
      await send(page,requests[1],'Japan',[JAPAN]);
      await page.waitForFunction(()=>document.querySelector('#skyList button strong')?.textContent==='JPN001');
      await page.locator('#skyMap circle[aria-label="JPN001"]').click();
      assert.match(await page.locator('#skyDetail').textContent(),/JPN001/);
      await sendFailure(page,requests[0]);
      await assertJapanVisible(page);
      assert.match(await page.locator('#skyDetail').textContent(),/JPN001/);
    }finally{await page.close();}
  });
  await test('stale completion never re-enables refresh while newer response is pending',async()=>{
    requests.length=0;
    const page=await browser.newPage();
    try{
      await page.goto('http://127.0.0.1:'+server.address().port+'/sky.html');
      await received(1);
      await page.locator('#skyRegion').selectOption('jp');
      await received(2);
      await send(page,requests[0],'Bulgaria',[BULGARIA]);
      assert.equal(await page.locator('#skyStatus').getAttribute('data-state'),'loading');
      assert.equal(await page.locator('#refreshSky').isDisabled(),true);
      assert.equal(await page.locator('#skyList').getByText('BGOLD1').count(),0);
      await send(page,requests[1],'Japan',[JAPAN]);
      await page.waitForFunction(()=>document.querySelector('#skyList button strong')?.textContent==='JPN001');
      await assertJapanVisible(page);
      assert.equal(await page.locator('#refreshSky').isEnabled(),true);
    }finally{await page.close();}
  });
}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
