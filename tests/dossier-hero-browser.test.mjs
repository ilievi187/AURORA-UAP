import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const mime={".html":"text/html",".js":"application/javascript",".css":"text/css",".json":"application/json",".webp":"image/webp",".svg":"image/svg+xml"};
let server,browser,port;
before(async()=>{
 server=createServer(async(request,response)=>{
  const url=new URL(request.url||"/","http://localhost");
  const path=url.pathname.startsWith("/archive/")?"/dossier.html":url.pathname;
  const filename=resolve(root,"."+path);
  if(!filename.startsWith(root+sep)){response.writeHead(403).end();return}
  try{const bytes=await readFile(filename);response.writeHead(200,{"Content-Type":mime[extname(filename)]||"application/octet-stream"}).end(bytes)}
  catch{response.writeHead(404).end()}
 });
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 port=server.address().port;
 browser=await chromium.launch({headless:true,...(process.env.AURORA_CHROMIUM_PATH?{executablePath:process.env.AURORA_CHROMIUM_PATH}:{})});
});
after(async()=>{await browser?.close();server?.closeAllConnections();if(server)await new Promise(resolve=>server.close(resolve))});
async function pageFor(id,viewport={width:1280,height:860}){
 const ctx=await browser.newContext({viewport,reducedMotion:"reduce"});
 const page=await ctx.newPage();
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem("aurora-lang","bg"));
 await page.route("https://upload.wikimedia.org/**",route=>route.abort("failed"));
 await page.goto("http://127.0.0.1:"+port+"/archive/"+id);
 await page.locator("#dossierContent").waitFor({state:"visible"});
 return{page,ctx,errors};
}
test("FLIR1 hero replaces misleading stock screenshot with real source-verified HTML5 Play",async()=>{
 const{page,ctx,errors}=await pageFor("nimitz-2004");
 try{
  await page.locator("#caseHeroPlay").waitFor({state:"visible"});
  assert.equal(await page.locator("#caseVisualImage").isHidden(),true);
  assert.equal(await page.locator("#caseHeroStage video").count(),0,"video must be lazy-loaded on click");
  assert.match(await page.locator("#caseHeroSource").getAttribute("href"),/^https:\/\/www\.defense\.gov\//);
  await page.locator("#caseHeroPlay").click();
  const video=page.locator("#caseHeroStage video");
  assert.match(await video.getAttribute("src"),/^https:\/\/(?:upload\.wikimedia\.org\/.*\.webm|www\.navair\.navy\.mil\/foia\/.*FLIR\.mp4)$/,"must use verified public-domain original or authorized official backup");
  assert.equal(await video.getAttribute("controls"),"");
  assert.equal(await video.getAttribute("preload"),"metadata");
  assert.equal(await video.getAttribute("autoplay"),null);
  assert.equal(await page.locator("#caseHeroClose").isVisible(),true);
  assert.equal(await page.locator("#caseHeroPlay").isHidden(),true);
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});
test("legacy Bulgarian source catalog narratives remain readable and are not passed off as translations",async()=>{
 const {page,ctx,errors}=await pageFor("disclosure-virginia-2024");
 try{
  assert.match(await page.locator("#dossierSummary").textContent(),/US Navy reported approximately 100 aerial objects/);
  assert.doesNotMatch(await page.locator("#dossierSummary").textContent(),/е случай, описан/);
  assert.match(await page.locator("#dossierStory").textContent(),/Around a hundred aerial objects and two surface systems/);
  assert.doesNotMatch(await page.locator("#dossierStory").textContent(),/Следва оригиналното описание/);
  assert.equal(await page.locator("#dossierTranslationDisclosure").isVisible(),true);
  assert.match(await page.locator("#dossierTranslationDisclosure").textContent(),/на английски/);
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});
test("related case previews disclose English source titles when Bulgarian translation is missing",async()=>{
 const {page,ctx,errors}=await pageFor("disclosure-iraq-2022");
 try{
  const related=page.locator('#relatedCasesGrid a[href="/archive/disclosure-mosul-orb-2016"]');
  await related.waitFor({state:"visible"});
  assert.equal(await related.locator('strong').textContent(),'The Mosul Orb');
  assert.equal(await related.locator('.related-case-translation-disclosure').count(),1);
  assert.equal(await related.locator('.related-case-translation-disclosure').textContent(),
   'Оригиналният разказ е на английски. Преводът не е наличен или е частичен.');
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});
test("source-authored Bulgarian dossiers remain displayed without English-fallback warning",async()=>{
 const {page,ctx,errors}=await pageFor("disclosure-harare-2008");
 try{
  assert.match(await page.locator("#dossierStory").textContent(),/[а-яА-Я]{5}/);
  assert.equal(await page.locator("#dossierTranslationDisclosure").isVisible(),false);
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});
test("secondary-attributed dossier visibly discloses status and does not label its compilation as primary",async()=>{
 const {page,ctx,errors}=await pageFor("disclosure-test-site-2023");
 try{
  const notice=page.locator("#dossierSourceVerification");
  await notice.waitFor({state:"visible"});
  assert.equal(await page.locator("#dossierSourceVerificationStatus").textContent(),"ВТОРИЧНО АТРИБУТИРАНО ДОСИЕ");
  assert.match(await page.locator("#dossierSourceVerificationNote").textContent(),/лицензиран вторичен източник/);
  const sourceKinds=await page.locator("#dossierSourcesList small").allTextContents();
  assert.ok(sourceKinds.some(x=>x.includes("ВТОРИЧЕН ИЗТОЧНИК")));
  assert.ok(sourceKinds.every(x=>!x.includes("ПЪРВИЧЕН ИЗТОЧНИК")));
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});
test("single-player rule: top FLIR1 video only; lower archive and second video removed",async()=>{
 const{page,ctx,errors}=await pageFor("nimitz-2004");
 try{
  await page.locator("#caseHeroPlay").waitFor({state:"visible"});
  assert.equal(await page.locator("#caseMediaSection").isHidden(),true,"video-only section must not duplicate main player");
  assert.equal(await page.locator("#caseMediaGrid video,#caseMediaGrid iframe").count(),0);
  await page.locator("#caseHeroPlay").click();
  assert.equal(await page.locator("#caseHeroStage video").count(),1);
  assert.equal(await page.locator("video,iframe").count(),1,"dossier has exactly one embedded player");
  assert.match(await page.locator("#caseHeroSource").getAttribute("href"),/^https:\/\/www\.defense\.gov\//);
  assert.equal(new URL(page.url()).pathname,"/archive/nimitz-2004");
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});

for(const [caseId,expectedKind] of [["gimbal-2015","video"],["gofast-2015","video"],["al-taqaddum-2017","iframe"]]){
 test("only one embedded video across dossier "+caseId,async()=>{
  const{page,ctx,errors}=await pageFor(caseId);
  try{
   await page.locator("#caseHeroPlay").waitFor({state:"visible"});
   assert.equal(await page.locator("#caseMediaGrid video,#caseMediaGrid iframe").count(),0);
   await page.locator("#caseHeroPlay").click();
   const target=page.locator("#caseHeroStage "+expectedKind);
   await target.waitFor({state:"attached"});
   assert.equal(await page.locator("video,iframe").count(),1);
   if(expectedKind==="iframe")assert.match(await target.getAttribute("src"),/dvidshub\.net\/video\/embed\/960331/);
   assert.ok((await page.locator("#dossierSourcesList a").count())>=1,"video stays attributed under sources");
   assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
 });
}
test("Westall publisher landing page has no fake playable video target",async()=>{
 const{page,ctx,errors}=await pageFor("westall-1966");
 try{
  await page.waitForFunction(()=>document.querySelector("#caseHeroStatus")?.textContent.includes("издател"));
  assert.equal(await page.locator("#caseHeroPlay").isVisible(),false);
  assert.equal(await page.locator("#caseVisualImage").isHidden(),true);
  assert.equal(await page.locator("#caseHeroSource").isVisible(),true);
  assert.equal(await page.locator("#caseMediaGrid video,#caseMediaGrid iframe,#caseMediaGrid .case-media-play-tile").count(),0);
  assert.equal(await page.locator("#caseMediaSection").isHidden(),true);
  assert.ok((await page.locator("#dossierSourcesList a").count())>=2,"both ABC video links remain in the sources list");
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});
test("mobile hero fits, close unloads video and restores real Play",async()=>{
 const{page,ctx,errors}=await pageFor("gimbal-2015",{width:390,height:844});
 try{
  await page.locator("#caseHeroPlay").waitFor({state:"visible"});
  await page.locator("#caseHeroPlay").click();
  assert.equal(await page.locator("#caseHeroStage video").count(),1);
  await page.locator("#caseHeroClose").click();
  assert.equal(await page.locator("#caseHeroStage video").count(),0);
  assert.equal(await page.locator("#caseHeroPlay").isVisible(),true);
  assert.equal(await page.locator("#caseHeroPlay").evaluate(node=>document.activeElement===node),true);
  const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(widths.scroll<=widths.client+1,"horizontal overflow: "+JSON.stringify(widths));
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});


test("three official PURSUE recordings share a SINGLE hero player with selectable thumbnails",async()=>{
 const {page,ctx,errors}=await pageFor("uap-archive-northeastern-orb-sightings",{width:390,height:844});
 try{
  await page.locator("#caseHeroPlay").waitFor({state:"visible"});
  assert.equal(await page.locator("#caseHeroPlaylist .case-hero-clip").count(),3);
  assert.equal(await page.locator("#caseHeroPlaylist .case-hero-clip[aria-pressed='true']").count(),1);
  assert.equal(await page.locator("#caseHeroPoster").isVisible(),true);
  const poster=await page.locator("#caseHeroPoster").getAttribute("src");
  assert.equal(poster,"/assets/media-ufo-earth-preview.svg","AURORA artwork is still not an original incident frame");
  const before=page.url();
  await page.locator("#caseHeroPlay").click();
  const first=await page.locator("#caseHeroStage video").getAttribute("src");
  assert.match(first,/DOD_111764142\.mp4$/);
  assert.equal(await page.locator("video,iframe").count(),1);
  await page.locator("#caseHeroPlaylist .case-hero-clip").nth(1).click();
  assert.equal(await page.locator("#caseHeroStage video").count(),0,"switching clip unloads original");
  await page.locator("#caseHeroPlay").click();
  const second=await page.locator("#caseHeroStage video").getAttribute("src");
  assert.match(second,/DOD_111764148\.mp4$/);
  assert.equal(await page.locator("video,iframe").count(),1);
  assert.equal(page.url(),before,"AURORA playback never redirects to video host");
  await page.locator("#caseHeroClose").click();
  assert.equal(await page.locator("video,iframe").count(),0);
  const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(widths.scroll<=widths.client+1,"playlist creates mobile overflow "+JSON.stringify(widths));
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});


test("multi-record dossier video playlist is translated and remains one click-to-load player",async()=>{
 const {page,ctx,errors}=await pageFor("uap-archive-northeastern-orb-sightings");
 try{
  await page.locator("#caseHeroPlay").waitFor({state:"visible"});
  for(const lang of ["ja","ar","de","bg"]){
   await page.evaluate(language=>window.dispatchEvent(new CustomEvent("aurora:language-changed",{detail:{language}})),lang);
   await page.locator("#caseHeroPlay").waitFor({state:"visible"});
   const ui=await page.evaluate(language=>window.AURORA_VIDEO_UI[language],lang);
   assert.equal(await page.locator("#caseHeroPlaylist p").first().textContent(),ui.choose,lang);
   assert.equal(await page.locator("#caseHeroPoster").getAttribute("alt"),ui.preview,lang);
   assert.equal(await page.locator("#caseHeroPlaylist img").first().getAttribute("alt"),ui.preview,lang);
   assert.equal(await page.locator("#caseHeroSource").textContent(),ui.original,lang);
   assert.equal(await page.locator("video,iframe").count(),0,"changing language must not start a stream");
  }
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});

test("two official DVIDS clips reuse ONE mobile hero iframe without redirect",async()=>{
 const {page,ctx,errors}=await pageFor("disclosure-eastern-mediterranean-2024",{width:390,height:844});
 try{
  await page.route("https://www.dvidshub.net/**",route=>route.fulfill({status:200,contentType:"text/html",body:"<!doctype html><title>Official video embed fixture</title>"}));
  await page.locator("#caseHeroPlay").waitFor({state:"visible"});
  const playlist=page.locator("#caseHeroPlaylist .case-hero-clip");
  assert.equal(await playlist.count(),2,"two official source clips must share one hero player");
  const origin=page.url();
  await page.locator("#caseHeroPlay").click();
  const frame=page.locator("#caseHeroStage iframe");
  await frame.waitFor({state:"attached"});
  assert.equal(await frame.getAttribute("src"),"https://www.dvidshub.net/video/embed/1006073");
  assert.equal(await page.locator("video,iframe").count(),1);
  await playlist.nth(1).click();
  assert.equal(await page.locator("video,iframe").count(),0,"source switch must unload previous iframe");
  assert.match(await page.locator("#caseHeroSource").getAttribute("href"),/\/1006074\//);
  await page.locator("#caseHeroPlay").click();
  await frame.waitFor({state:"attached"});
  assert.equal(await frame.getAttribute("src"),"https://www.dvidshub.net/video/embed/1006074");
  assert.equal(await page.locator("video,iframe").count(),1);
  assert.equal(await page.locator("#caseMediaGrid video,#caseMediaGrid iframe").count(),0,"no lower duplicate");
  assert.equal(page.url(),origin,"inline Play must never navigate to the publisher");
  await page.locator("#caseHeroClose").click();
  assert.equal(await page.locator("video,iframe").count(),0);
  const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(widths.scroll<=widths.client+1,"mobile playlist overflow: "+JSON.stringify(widths));
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});

test("government source PDFs open inside dossier only on click and unload on close",async()=>{
 const {page,ctx,errors}=await pageFor("disclosure-colorado-springs-2022",{width:390,height:844});
 try{
  await page.route("https://www.war.gov/**",route=>route.fulfill({
   status:200,contentType:"text/html",
   body:"<!doctype html><html><body>Original source reader fixture</body></html>"
  }));
  assert.equal(await page.locator("#caseDocumentFrameHost iframe").count(),0,"never preload publisher PDFs");
  assert.equal(await page.locator("#caseDocumentViewer").isHidden(),true);
  const buttons=page.locator("#caseMediaGrid .case-media-preview");
  assert.ok(await buttons.count()>=3,"government source PDFs receive inline preview controls");
  assert.match(await buttons.first().textContent(),/ПРОЧЕТИ ДОКУМЕНТА ТУК/);
  const origin=page.url();
  await buttons.first().click();
  await page.locator("#caseDocumentFrameHost iframe").waitFor({state:"attached"});
  assert.equal(await page.locator("#caseDocumentViewer").isVisible(),true);
  assert.match(await page.locator("#caseDocumentFrameHost iframe").getAttribute("src"),/^https:\/\/www\.war\.gov\/.*\.pdf$/);
  assert.match(await page.locator("#caseDocumentSource").getAttribute("href"),/^https:\/\/www\.war\.gov\/.*\.pdf$/);
  assert.equal(page.url(),origin,"the reader never leaves AURORA");
  await page.locator("#caseDocumentClose").click();
  assert.equal(await page.locator("#caseDocumentFrameHost iframe").count(),0,"closing unloads the remote document");
  assert.equal(await page.locator("#caseDocumentViewer").isHidden(),true);
  const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(widths.scroll<=widths.client+1,"PDF reader overflow on mobile");
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});
