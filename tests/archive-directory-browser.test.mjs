import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,readFileSync} from "node:fs";
import {readFile as read} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const original=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8")).cases;
const navy=original.find(c=>c.id==="nimitz-2004");
const records=[...Array.from({length:104},(_,i)=>({
 id:"case-fixture-"+String(i+1).padStart(3,"0"),
 date:"2025-01-"+String(i%28+1).padStart(2,"0"),country:i%2?"FR":"US",
 status:"reported",lat:null,lng:null,location_precision:"Not reported",
 title:{en:"Historical fixture "+(i+1),bg:"Исторически случай "+(i+1)},
 city:{en:"Test town",bg:"Тестов град"},
 summary:{en:"Public source linked historical observation, synthetic browser fixture only, no claim about reality.",
 bg:"Тестово описание, което не е реално наблюдение и служи само за браузърния тест."},
 story:{en:["Original source context for deterministic browser fixtures."],bg:["Тестов контекст за браузърната проверка."]},
 source:{name:"Test-only source",url:"https://example.org/case/"+(i+1)},
 media:[{type:"documents",url:"https://example.org/document/"+(i+1),title:{en:"Fixture document"}}]
})),navy];
const fixtures={schema_version:1,cases:records};
const mime={".html":"text/html",".js":"application/javascript",".css":"text/css",".json":"application/json",".svg":"image/svg+xml",".webp":"image/webp"};
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,"http://localhost");
 if(u.pathname==="/data/cases.json"){
  res.writeHead(200,{"Content-Type":"application/json"}).end(JSON.stringify(fixtures));return;
 }
 const file=resolve(root,"."+u.pathname);
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return}
 try{
  res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"}).end(await read(file))
 }catch{res.writeHead(404).end()}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.AURORA_CHROMIUM_PATH?{executablePath:process.env.AURORA_CHROMIUM_PATH}:{})});
 await test("a 105-case sourced archive has 11 numbered pages of exactly 10 cards",async()=>{
  const ctx=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:"reduce"});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.addInitScript(()=>localStorage.setItem("aurora-lang","bg"));
   await page.goto("http://127.0.0.1:"+server.address().port+"/archive.html");
   await page.waitForFunction(()=>document.querySelector("#archiveCount")?.textContent==="105");
   assert.equal(await page.locator("#archivePageCount").textContent(),"11");
   assert.equal(await page.locator(".archive-card").count(),10);
   assert.equal(await page.locator(".archive-pages").count(),1);
   assert.equal(await page.locator("#archivePagination button[data-page='11']").count(),1);
   await page.locator("#archivePagination button[data-page='11']").click();
   assert.equal(await page.locator(".archive-card").count(),5);
   assert.equal(new URL(page.url()).searchParams.get("page"),"11");
   assert.equal(await page.locator("#archivePagination button[aria-current='page']").textContent(),"11");
   await page.locator("#archivePagination button[data-page='1']").click();
   assert.equal(await page.locator(".archive-card").count(),10);
   assert.ok((await page.locator(".case-open").first().getAttribute("href")).startsWith("/archive/"));
   assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
 });
 await test("country, searchable narrative, media and active-language filters preserve real links",async()=>{
  const ctx=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:"reduce"});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.addInitScript(()=>localStorage.setItem("aurora-lang","en"));
   await page.goto("http://127.0.0.1:"+server.address().port+"/archive.html");
   await page.waitForFunction(()=>document.querySelector("#archiveCount")?.textContent==="105");
   await page.locator("#archiveMedia").selectOption("video");
   assert.equal(await page.locator(".archive-card").count(),1);
   assert.match(await page.locator(".card-title").textContent(),/Nimitz/i);
   assert.match(await page.locator(".tag-video").textContent(),/PLAYABLE VIDEO/);
   assert.equal(await page.locator(".case-open").getAttribute("href"),"/archive/nimitz-2004");
   await page.locator("#archiveMedia").selectOption("");
   await page.locator("#archiveSearch").fill("Historical fixture 87");
   assert.equal(await page.locator(".archive-card").count(),1);
   await page.locator("#archiveSearch").fill("");
   await page.locator("#archiveCountry").selectOption("FR");
   assert.equal(await page.locator(".archive-card").count(),10);
   assert.ok((await page.locator("#archiveStatus").textContent()).includes("52"));
   await page.locator("#archiveLanguage").selectOption("bg");
   assert.equal(await page.locator(".case-open").first().textContent(),"ОТВОРИ ПЪЛНОТО ДОСИЕ ↗");
   assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
 });
 await test("real Play on an archive thumbnail mounts inline video without leaving the page",async()=>{
  const ctx=await browser.newContext({viewport:{width:1180,height:850},reducedMotion:"reduce"});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.addInitScript(()=>localStorage.setItem("aurora-lang","bg"));
   await page.route("https://upload.wikimedia.org/**",route=>route.abort("failed"));
   await page.goto("http://127.0.0.1:"+server.address().port+"/archive.html");
   await page.waitForFunction(()=>document.querySelector("#archiveCount")?.textContent==="105");
   await page.locator("#archiveMedia").selectOption("playable");
   assert.equal(await page.locator(".archive-card").count(),1);
   const card=page.locator(".archive-card").first();
   assert.equal(await card.locator(".archive-video-play").count(),1);
   assert.equal(await card.locator(".archive-video-thumb").count(),1);
   assert.equal(await page.locator("video,iframe").count(),0,"never load video before click");
   const before=page.url();
   await card.locator(".archive-video-play").click();
   assert.equal(await card.locator("video").count(),1);
   assert.match(await card.locator("video").getAttribute("src"),/(?:FLIR1_Official_UAP_Footage|www\.navair\.navy\.mil\/foia\/.*FLIR\.mp4)/);
   assert.equal(await card.locator("video").getAttribute("controls"),"");
   assert.equal(await card.locator("video").getAttribute("autoplay"),null);
   assert.equal(page.url(),before,"watch in AURORA instead of redirecting");
   await card.locator(".archive-video-close").click();
   assert.equal(await card.locator("video").count(),0,"closing unloads the actual media stream");
   assert.equal(await card.locator(".archive-video-thumb").isVisible(),true);
   assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
 });
 await test("mobile case pages remain responsive, include no fake video controls and preserve 18 languages",async()=>{
  const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const page=await ctx.newPage(),errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:"+server.address().port+"/archive.html?page=4");
   await page.waitForFunction(()=>document.querySelector("#archiveCount")?.textContent==="105");
   assert.equal(await page.locator(".archive-card").count(),10);
   assert.equal(await page.locator("#archiveLanguage option").count(),18);
   assert.equal(await page.locator("video,iframe,.media-inline-play").count(),0,"index cards cannot claim to play unsourced videos");
   const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(widths.scroll<=widths.client+1,"mobile horizontal overflow "+JSON.stringify(widths));
   assert.deepEqual(errors,[]);
  }finally{await ctx.close()}
 });
}finally{
 await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
