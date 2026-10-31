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
  assert.match(await video.getAttribute("src"),/^https:\/\/upload\.wikimedia\.org\/.*\.webm$/);
  assert.equal(await video.getAttribute("controls"),"");
  assert.equal(await video.getAttribute("preload"),"metadata");
  assert.equal(await video.getAttribute("autoplay"),null);
  assert.equal(await page.locator("#caseHeroClose").isVisible(),true);
  assert.equal(await page.locator("#caseHeroPlay").isHidden(),true);
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});
test("the small Play below never redirects: in-site player and separate source link",async()=>{
 const{page,ctx,errors}=await pageFor("nimitz-2004");
 try{
  // Keep the media request pending: the test verifies the *real DOM player*
  // without depending on external CDN connectivity or codec support.
  await page.route("https://upload.wikimedia.org/**",()=>{});
  const btn=page.locator("#caseMediaGrid .case-media-play-tile");
  await btn.waitFor({state:"visible"});
  assert.equal(await page.locator("#caseMediaGrid .case-media-source-link").count(),1);
  assert.match(await page.locator("#caseMediaGrid .case-media-source-link").getAttribute("href"),/^https:\/\/www\.defense\.gov\//);
  assert.doesNotMatch(await page.locator("#caseMediaGrid .case-media-source-link .case-media-icon").innerText(),/▶/);
  await btn.click();
  const lower=page.locator("#caseMediaGrid video");
  await lower.waitFor({state:"attached",timeout:5000});
  assert.equal(await lower.count(),1,"clicking lower play should mount a real video");
  assert.match(await lower.getAttribute("src"),/FLIR1.*\.webm$/);
  assert.equal(new URL(page.url()).pathname,"/archive/nimitz-2004","must stay on AURORA");
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});

test("a failed lower player reports an error while preserving publisher link",async()=>{
 const{page,ctx,errors}=await pageFor("nimitz-2004");
 try{
  await page.locator("#caseMediaGrid .case-media-play-tile").click();
  await page.waitForFunction(()=>document.querySelector("#caseMediaGrid .case-video-status")?.textContent.includes("източник"));
  assert.equal(await page.locator("#caseMediaGrid .case-media-source-link").isVisible(),true);
  assert.equal(new URL(page.url()).pathname,"/archive/nimitz-2004");
  assert.deepEqual(errors,[]);
 }finally{await ctx.close()}
});
test("Westall publisher landing page has no fake playable video target",async()=>{
 const{page,ctx,errors}=await pageFor("westall-1966");
 try{
  await page.waitForFunction(()=>document.querySelector("#caseHeroStatus")?.textContent.includes("издател"));
  assert.equal(await page.locator("#caseHeroPlay").isVisible(),false);
  assert.equal(await page.locator("#caseVisualImage").isHidden(),true);
  assert.equal(await page.locator("#caseHeroSource").isVisible(),true);
  assert.equal(await page.locator("#caseMediaGrid .case-media-play-tile").count(),0);
  assert.ok((await page.locator("#caseMediaGrid .case-media-link").count())>=2);
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
