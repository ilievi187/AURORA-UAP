import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain'};
const server=createServer(async(req,res)=>{
  const path=(req.url||'/').split('?')[0];
  const decoded=decodeURIComponent(path);
  const filename=resolve(join(root,decoded==='/'?'index.html':decoded.replace(/^\/+/,'')));
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
  await test('language must be selected then explicitly continued, and gate reappears on reload',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    assert.equal(await page.locator('#languageGate').isVisible(),true,'welcome must be visible');
    assert.equal(await page.locator('#gateContinue').isDisabled(),true,'continue locked before selection');
    await page.locator('button[data-language="bg"]').click();
    assert.equal(await page.locator('#languageGate').isVisible(),true,'language click must not enter site');
    assert.equal(await page.locator('#gateContinue').isEnabled(),true);
    assert.equal(await page.locator('button[data-language="bg"]').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#gateContinueLabel').textContent(),'ПРОДЪЛЖИ');
    const hasCanvas=await page.locator('#gateCanvas').evaluate(el=>{
      const {data}=el.getContext('2d').getImageData(0,0,el.width,el.height);
      for(let i=3;i<data.length;i+=4)if(data[i]>0)return true;
      return false;
    });
    assert.equal(hasCanvas,true,'gate must render actual HUD pixels');
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:2500});
    assert.equal(await page.locator('html').getAttribute('lang'),'bg');
    assert.equal(await page.locator('.site-shell').getAttribute('inert'),null);
    await page.reload();
    assert.equal(await page.locator('#languageGate').isVisible(),true,'welcome even with saved preference');
    assert.equal(await page.locator('#gateContinue').isEnabled(),true,'saved language preselected');
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:2500});
    await page.locator('#openLanguageGate').click();
    assert.equal(await page.locator('#languageGate').isVisible(),true);
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:2500});
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.deepEqual(errors,[],'no unhandled JavaScript errors');
    await context.close();
  });
  await test('mobile and reduced-motion entry remain functional',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    assert.equal(await page.locator('#languageGate').isVisible(),true);
    await page.locator('button[data-language="fr"]').click();
    assert.equal(await page.locator('#gateContinue').isEnabled(),true);
    assert.equal(await page.locator('#gateContinueLabel').textContent(),'CONTINUER');
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1000});
    assert.equal(await page.locator('html').getAttribute('lang'),'fr');
    assert.equal(await page.locator('#heroHudCanvas').count(),1);
    const animation=await page.locator('.gate-scanner-beam').evaluate(el=>getComputedStyle(el,'::before').animationName);
    assert.equal(animation,'none');
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('Mission Control demo tabs, localized steps and case shortcuts work in a real browser',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1500});

    assert.equal(await page.locator('a[href="#control"]').count(),3,'desktop, mobile and footer navigation');
    assert.equal(await page.locator('#controlHeading').textContent(),'MISSION CONTROL');
    assert.equal(await page.locator('#controlTabs [role="tab"]').count(),4);
    assert.equal(await page.locator('#controlTab0').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Document the observation');
    await page.locator('#controlTab1').click();
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Check known explanations');
    assert.equal(await page.locator('#controlTab1').getAttribute('aria-selected'),'true');
    assert.equal(await page.locator('#controlPanel').getAttribute('aria-labelledby'),'controlTab1');
    await page.locator('#controlNext').click();
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Analyze the evidence');
    await page.locator('#controlTab2').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Communicate conclusions');
    await page.locator('#controlTab3').focus();
    await page.keyboard.press('Home');
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Document the observation');
    assert.equal(await page.locator('#controlCaseButtons button').count(),3);
    await page.locator('#controlCaseButtons button').first().click();
    assert.equal(await page.locator('#caseDialog').evaluate(el=>el.open),true,'demo case dialog is opened');
    await page.locator('#caseClose').click();

    await page.locator('input[name="mapFilter"][value="light"]').check();
    assert.equal(await page.locator('#visibleCount').textContent(),'4');
    assert.deepEqual(errors,[]);
    await context.close();
  });

  await test('mobile Mission Control fits viewport and works with translated controls',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1000});
    assert.equal(await page.locator('#controlHeading').textContent(),'КОМАНДЕН ЦЕНТЪР');
    await page.locator('#controlTab3').click();
    assert.equal(await page.locator('#controlStageTitle').textContent(),'Публикуване на заключение');
    assert.equal(await page.locator('#controlVisualStage').textContent(),'4');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,'no unintended horizontal overflow: '+overflow);
    const animation=await page.locator('.console-sweep').evaluate(el=>getComputedStyle(el).animationName);
    assert.equal(animation,'none','respects reduced-motion preference');
    assert.deepEqual(errors,[]);
    await context.close();
  });

  await test('V1.3 Earth globe renders sourced cases and case selection rotates to location',async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="bg"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1000});
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===8);
    assert.equal(await page.locator('#globeCount').textContent(),'8 случая');
    assert.equal(await page.locator('#globeCaseList button').count(),8);
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Светлините над Финикс');
    const opaque=await page.locator('#caseGlobe').evaluate(canvas=>{
      const c=canvas.getContext('2d'),p=c.getImageData(220,220,1,1).data;return p[3]>0;
    });
    assert.equal(opaque,true,'center of globe must be rendered');
    await page.locator('#globeCaseList button[data-case-id="westall-1966"]').click();
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Свидетелствата от Уестол');
    assert.ok((await page.locator('#globeCaseSource').getAttribute('href')).startsWith('https://www.abc.net.au/'));
    assert.equal(await page.locator('#globeCaseSource').getAttribute('rel'),'noopener noreferrer');
    const lon=await page.locator('#globeHeading').textContent();
    assert.match(lon,/^\d{3}°$/);
    await page.locator('#globeFilter').selectOption('instrument');
    assert.equal(await page.locator('#globeCaseList button').count(),3);
    await page.locator('#globeFilter').selectOption('explained');
    assert.equal(await page.locator('#globeCaseList button').count(),1);
    assert.equal(await page.locator('#globeCaseTitle').textContent(),'Случаят „Розуел“');
    await page.locator('#globeRotate').click();
    assert.equal(await page.locator('#globeRotate').getAttribute('aria-pressed'),'true');
    await page.locator('#globeLeft').click();
    await page.locator('#globeRight').click();
    assert.deepEqual(errors,[]);
    await context.close();
  });
  await test('V1.3 mobile globe has accessible atlas and no horizontal overflow',async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+port+'/');
    await page.locator('button[data-language="en"]').click();
    await page.locator('#gateContinue').click();
    await page.locator('#languageGate').waitFor({state:'hidden',timeout:1200});
    await page.waitForFunction(()=>document.querySelectorAll('#globeCaseList button').length===8);
    assert.equal(await page.locator('#atlasHeading').textContent(),'DOCUMENTED CASES');
    assert.equal(await page.locator('#globeFilter option').count(),6);
    await page.locator('#globeFilter').selectOption('lights');
    assert.equal(await page.locator('#globeCaseList button').count(),3);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,'mobile layout overflow: '+overflow);
    assert.deepEqual(errors,[]);
    await context.close();
  });
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
