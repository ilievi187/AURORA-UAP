import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+sep))return res.writeHead(403).end();
  try{const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(body);}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  await test('demo illustration does not error on startup and loads when opened',async()=>{
    const page=await browser.newPage({viewport:{width:390,height:800},reducedMotion:'reduce'});
    try{
      await page.addInitScript(()=>{window.__demoImageErrors=[];document.addEventListener('error',e=>{if(e.target?.id==='caseImage')window.__demoImageErrors.push(e.target.getAttribute('src'));},true)});
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      assert.notEqual(await page.locator('#caseImage').getAttribute('src'),'', 'demo image must not have an empty src');
      assert.deepEqual(await page.evaluate(()=>window.__demoImageErrors),[],'no failed demo image load at startup');
      await page.locator('#gateLanguageGrid button[data-language="en"]').click();
      await page.locator('#gateContinue').click();
      await page.locator('#controlCaseButtons button').first().click();
      assert.equal(await page.locator('#caseDialog').evaluate(el=>el.open),true);
      await page.locator('#caseImage').evaluate(img=>img.decode());
      assert.ok(await page.locator('#caseImage').evaluate(img=>img.naturalWidth>0));
      assert.deepEqual(await page.evaluate(()=>window.__demoImageErrors),[]);
    }finally{await page.close();}
  });
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
