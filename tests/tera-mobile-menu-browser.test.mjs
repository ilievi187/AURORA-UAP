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
  await test('Escape closes mobile navigation and returns focus from a link',async()=>{
    const page=await browser.newPage({viewport:{width:390,height:800},isMobile:true,reducedMotion:'reduce'});
    try{
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('#gateLanguageGrid button[data-language="en"]').click();
      await page.locator('#gateContinue').click();
      const toggle=page.locator('#menuToggle'), nav=page.locator('#mobileNav');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'),'true');
      assert.equal(await nav.isVisible(),true);
      await nav.locator('a').first().focus();
      await page.keyboard.press('Escape');
      assert.equal(await nav.isHidden(),true);
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);
      await toggle.click();
      await toggle.focus();
      await page.keyboard.press('Escape');
      assert.equal(await nav.isHidden(),true);
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    }finally{await page.close();}
  });
  await test('mobile menu has a stable accurate accessible name in both states',async()=>{
    const page=await browser.newPage({viewport:{width:390,height:800},isMobile:true,reducedMotion:'reduce'});
    try{
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('#gateLanguageGrid button[data-language="en"]').click();
      await page.locator('#gateContinue').click();
      const toggle=page.getByRole('button',{name:'Меню / Menu',exact:true});
      assert.equal(await toggle.getAttribute('aria-expanded',{timeout:2000}),'false');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'),'true');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
    }finally{await page.close();}
  });
  await test('mobile link selection and toggle continue to close navigation',async()=>{
    const page=await browser.newPage({viewport:{width:390,height:800},isMobile:true,reducedMotion:'reduce'});
    try{
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.locator('#gateLanguageGrid button[data-language="en"]').click();
      await page.locator('#gateContinue').click();
      const toggle=page.locator('#menuToggle'), nav=page.locator('#mobileNav');
      await toggle.click(); await toggle.click();
      assert.equal(await nav.isHidden(),true);
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      await toggle.click();
      await nav.locator('a[href="#worldAtlas"]').click();
      assert.equal(await nav.isHidden(),true);
      assert.equal(await toggle.getAttribute('aria-expanded'),'false');
      assert.equal(new URL(page.url()).hash,'#worldAtlas');
    }finally{await page.close();}
  });
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
