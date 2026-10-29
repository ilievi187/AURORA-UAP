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
  await test('mandatory language dialog wraps focus before a selection',async()=>{
    const page=await browser.newPage({viewport:{width:390,height:800},reducedMotion:'reduce'});
    try{
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      const options=page.locator('#gateLanguageGrid button');
      assert.equal(await page.locator('#gateContinue').isDisabled(),true);
      assert.equal(await page.locator('#gateCancel').isHidden(),true);
      await options.last().focus();
      await page.keyboard.press('Tab');
      assert.equal(await options.first().evaluate(el=>el===document.activeElement),true,'Tab wraps from last enabled option to first');
      await page.keyboard.press('Shift+Tab');
      assert.equal(await options.last().evaluate(el=>el===document.activeElement),true,'Shift+Tab wraps to last enabled option, not disabled Continue');
      assert.equal(await page.locator('#languageGate').isVisible(),true);
    }finally{await page.close();}
  });
  await test('selected and optional dialogs wrap around their enabled controls',async()=>{
    const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
    try{
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      const first=page.locator('#gateLanguageGrid button').first();
      await first.click();
      assert.equal(await page.locator('#gateContinue').isEnabled(),true);
      assert.equal(await page.locator('#gateContinue').evaluate(el=>el===document.activeElement),true);
      await page.keyboard.press('Tab');
      assert.equal(await first.evaluate(el=>el===document.activeElement),true);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.locator('#gateContinue').evaluate(el=>el===document.activeElement),true);
      await page.keyboard.press('Enter');
      await page.locator('#languageGate').waitFor({state:'hidden'});
      await page.locator('#openLanguageGate').click();
      assert.equal(await page.locator('#gateCancel').isVisible(),true);
      await first.focus();
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.locator('#gateCancel').evaluate(el=>el===document.activeElement),true);
      await page.keyboard.press('Tab');
      assert.equal(await first.evaluate(el=>el===document.activeElement),true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#languageGate').isHidden(),true);
      assert.equal(await page.locator('#openLanguageGate').evaluate(el=>el===document.activeElement),true);
    }finally{await page.close();}
  });
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
