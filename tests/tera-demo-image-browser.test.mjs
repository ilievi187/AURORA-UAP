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
  await test('homepage exposes sourced archive navigation, not fictional case artwork or dialogs',async()=>{
    const page=await browser.newPage({viewport:{width:390,height:800},reducedMotion:'reduce'});
    try{
      const demoAssets=[];
      page.on('request',request=>{
        if(/\/assets\/report-(?:triangle|ocean|infrared|orbs)\.webp(?:$|\?)/.test(request.url()))demoAssets.push(request.url());
      });
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('#gateLanguageGrid button[data-language="en"]').click();
      await page.locator('#gateContinue').click();
      await page.locator('#languageGate').waitFor({state:'hidden',timeout:1500});
      await page.locator('#controlHeading').waitFor();
      assert.equal(await page.locator('#reportDialog').count(),0);
      assert.equal(await page.locator('#caseDialog').count(),0);
      assert.equal(await page.locator('#controlCaseButtons button').count(),0);
      assert.equal(await page.locator('#controlCaseButtons a[href="/archive.html"]').count(),1);
      assert.doesNotMatch(await page.locator('#controlCaseButtons').innerText(),/DEMO|fictional|примерни|демо/i);
      assert.equal(await page.locator('#caseImage').count(),0);
      assert.deepEqual(demoAssets,[]);
    }finally{await page.close();}
  });
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
