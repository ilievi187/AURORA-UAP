import test from "node:test";
import assert from "node:assert/strict";
import {parseNewsRss,fetchHeadlines,fetchHeadlinesWithDiagnostics,onRequestGet as newsRoute} from "../functions/api/news.js";
import {normalizeTraffic,fetchTraffic,onRequestGet as trafficRoute} from "../functions/api/air-traffic.js";
const xml='<rss><channel><item><title>UAP briefing &amp; research</title><link>https://news.google.com/rss/articles/test</link><pubDate>'+new Date().toUTCString()+'</pubDate><source>Example Press</source></item></channel></rss>';
const textResponse=text=>new Response(text,{headers:{"Content-Type":"application/rss+xml; charset=utf-8"}});
test("news RSS preserves attribution, validates URLs and date",()=>{
 const result=parseNewsRss(xml);assert.equal(result.length,1);assert.equal(result[0].title,"UAP briefing & research");
 assert.equal(result[0].source,"Example Press");
 assert.equal(parseNewsRss(xml.replace("https://news.google.com","javascript://news.google.com")).length,0);
});
test("RSS parser ignores item-like markup inside comments and CDATA",()=>{
 const item='<item><title>UAP briefing &amp; research</title><link>https://news.google.com/rss/articles/test</link><pubDate>'+new Date().toUTCString()+'</pubDate><source>Example Press</source></item>';
 const decoy='<rss><channel><!--'+item+'--><![CDATA['+item+']]></channel></rss>';
 assert.deepEqual(parseNewsRss(decoy),[]);
});
test("RSS parser ignores item-like markup inside processing instructions",()=>{
 const item='<item><title>Forged PI headline</title><link>https://publisher.test/fake</link><pubDate>'+new Date().toUTCString()+'</pubDate></item>';
 assert.deepEqual(parseNewsRss('<rss><channel><?feed '+item+'?></channel></rss>'),[]);
});
test("RSS parser does not treat markup inside an item's CDATA as metadata",()=>{
 const cdataOnly='<rss><channel><item><![CDATA[<title>Forged headline</title><link>https://publisher.test/fake</link><pubDate>'+new Date().toUTCString()+'</pubDate>]]></item></channel></rss>';
 assert.deepEqual(parseNewsRss(cdataOnly),[]);
 const cdataTitle='<rss><channel><item><title><![CDATA[UAP & sightings]]></title><link>https://publisher.test/story</link><pubDate>'+new Date().toUTCString()+'</pubDate></item></channel></rss>';
 assert.equal(parseNewsRss(cdataTitle)[0]?.title,"UAP & sightings");
 const cdataCommentText='<rss><channel><item><title><![CDATA[UAP <!-- literal title text --> report]]></title><link>https://publisher.test/story</link><pubDate>'+new Date().toUTCString()+'</pubDate></item></channel></rss>';
 assert.equal(parseNewsRss(cdataCommentText)[0]?.title,"UAP <!-- literal title text --> report");
});
test("RSS parser rejects raw control codepoints that could spoof a CDATA marker",()=>{
 const spoof='<rss><channel><![CDATA[Forged headline]]><item><title>\u0000AURORA_CDATA_0\u0000</title><link>https://publisher.test/fake</link><pubDate>'+new Date().toUTCString()+'</pubDate></item></channel></rss>';
 assert.deepEqual(parseNewsRss(spoof),[]);
});
test("news deduplicates across regions and refuses arbitrary editions",async()=>{
 const fetcher=async url=>{assert.ok(url.startsWith("https://news.google.com/rss/search?"));return textResponse(xml)};
 const a=await fetchHeadlines("global",fetcher);assert.equal(a.length,1);
 const invalid=await newsRoute({request:new Request("https://aurorauap.org/api/news?edition=https://evil.test")});
 assert.equal(invalid.status,400);
});
test("traffic keeps only sanitized finite in-region points",()=>{
 const data={time:1782810000,states:[
 ["abc123","TEST123","BG",0,0,24.2,42.8,1234,false,100,180],
 ["bad","BAD","US",0,0,-50,20,0,false,100,0],
 ["n","NAN","BG",0,0,24.2,NaN,0,false,100,0]
 ]};
 const got=normalizeTraffic(data,"bg");assert.equal(got.count,1);assert.equal(got.aircraft[0].callsign,"TEST123");
 assert.equal(got.aircraft[0].latitude,42.8);
});
test("traffic uses fixed region query and fails for arbitrary region",async()=>{
 const fetcher=async url=>{const p=new URL(url);assert.equal(p.hostname,"opensky-network.org");assert.equal(p.searchParams.get("lamin"),"41.1");return {ok:true,json:async()=>({time:1782810000,states:[]})}};
 const got=await fetchTraffic("bg",fetcher);assert.equal(got.region,"bg");
 const invalid=await trafficRoute({request:new Request("https://aurorauap.org/api/air-traffic?region=all")});
 assert.equal(invalid.status,400);
});
test("upstream failures never masquerade as live data",async()=>{
 const fetcher=async()=>{throw Error("network")};
 const items=await fetchHeadlines("official",fetcher);assert.deepEqual(items,[]);
 assert.equal(normalizeTraffic({time:0}, "bg"),null);
});
test("unavailable news API reports sanitized per-source diagnostics",async()=>{
 const fetcher=async url=>{
  const region=new URL(url).searchParams.get("gl");
  if(region==="US")throw new TypeError("private-upstream-exception");
  if(region==="GB")return {ok:false,status:429};
  return textResponse("<html>temporarily unavailable</html>");
 };
 const originalFetch=globalThis.fetch;
 let globalCalls=0;
 globalThis.fetch=async()=>{globalCalls++;throw new Error("unexpected_global_fetch")};
 try{
  const response=await newsRoute({request:new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0"),fetcher});
  assert.equal(response.status,503);
  const body=await response.json();
  assert.equal(body.status,"unavailable");
  assert.equal(body.diagnostics.configured_sources,10);
  assert.equal(body.diagnostics.http_successes,8);
  assert.equal(body.diagnostics.invalid_sources,8);
  assert.equal(body.diagnostics.network_errors,1);
  assert.deepEqual(body.diagnostics.http_errors,{"429":1});
  assert.equal(globalCalls,0,"the injected source adapter should be used by the route");
  assert.doesNotMatch(JSON.stringify(body),/private-upstream-exception|unexpected_global_fetch/);
 }finally{globalThis.fetch=originalFetch}
});
test("one healthy source still serves live headlines with degraded-source counts",async()=>{
 const fetcher=async url=>new URL(url).searchParams.get("gl")==="US"
  ?textResponse(xml)
  :{ok:false,status:503};
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async()=>{throw new Error("unexpected_global_fetch")};
 try{
  const response=await newsRoute({request:new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0"),fetcher});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.status,"live");
  assert.equal(body.count,1);
  assert.equal(body.items[0].source,"Example Press");
  assert.equal(body.diagnostics.parsed_sources,1);
  assert.deepEqual(body.diagnostics.http_errors,{"503":9});
 }finally{globalThis.fetch=originalFetch}
});
test("non-OK upstream responses have their bodies canceled",async()=>{
 let canceled=0;
 const fetcher=async()=>new Response(new ReadableStream({
  start(controller){controller.enqueue(new Uint8Array([1]))},
  cancel(){canceled++}
 }),{status:429});
 const result=await fetchHeadlinesWithDiagnostics("global",fetcher);
 assert.deepEqual(result.diagnostics.http_errors,{"429":10});
 assert.equal(canceled,10);
});
test("news diagnostics separate parser failures from network failures",async()=>{
 const result=await fetchHeadlinesWithDiagnostics("global",async()=>(textResponse(xml)),()=>{throw new Error("private-parser-error")});
 assert.equal(result.diagnostics.http_successes,10);
 assert.equal(result.diagnostics.parse_errors,10);
 assert.equal(result.diagnostics.network_errors,0);
 assert.doesNotMatch(JSON.stringify(result.diagnostics),/private-parser-error/);
});
test("malformed RSS is invalid while no-article responses stay unverified",async()=>{
 for(const malformed of ["<rss","<rss><channel></rss></channel>","<rss><channel><item><title>truncated</title></channel></rss>"]){
  const result=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse(malformed));
  assert.equal(result.diagnostics.invalid_sources,10);
  assert.equal(result.diagnostics.unverified_sources,0);
 }
 const badEntity=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse("<rss><channel>&bogus;</channel></rss>"));
 assert.equal(badEntity.diagnostics.invalid_sources,10);
 assert.equal(badEntity.diagnostics.unverified_sources,0);
 const duplicateAttribute=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse("<rss version='2.0' version='2.0'><channel></channel></rss>"));
 assert.equal(duplicateAttribute.diagnostics.invalid_sources,10);
 assert.equal(duplicateAttribute.diagnostics.unverified_sources,0);
 const item=xml.slice(xml.indexOf("<item"),xml.indexOf("</channel>"));
 const invalidXmlWhitespace=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse("<?xml\u00a0version=\"1.0\"?><rss><channel>"+item+"</channel></rss>"));
 assert.equal(invalidXmlWhitespace.diagnostics.invalid_sources,10);
 assert.equal(invalidXmlWhitespace.diagnostics.parsed_sources,0);
 for(const malformedAttributes of [
  "<rss version='2.0'other='x'><channel></channel></rss>",
  "<rss xmlns:a='urn:shared' xmlns:b='urn:shared'><channel a:id='1' b:id='2'></channel></rss>"
 ]){
  const invalidAttributes=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse(malformedAttributes));
  assert.equal(invalidAttributes.diagnostics.invalid_sources,10);
  assert.equal(invalidAttributes.diagnostics.unverified_sources,0);
 }
 for(const nonRss of [
  "<RSS><CHANNEL>"+item+"</CHANNEL></RSS>",
  "<rss xmlns='urn:not-rss'><channel>"+item+"</channel></rss>",
  "<rss><channel></channel><channel>"+item+"</channel></rss>"
 ]){
  const result=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse(nonRss));
  assert.equal(result.diagnostics.invalid_sources,10);
  assert.equal(result.diagnostics.parsed_sources,0);
 }
 for(const outsideWhitespace of ["\u00a0"+xml,"\u2003"+xml]){
  const result=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse(outsideWhitespace));
  assert.equal(result.diagnostics.invalid_sources,10);
  assert.equal(result.diagnostics.parsed_sources,0);
 }
 const empty=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse("<rss version='2.0'><channel></channel></rss>"));
 assert.equal(empty.diagnostics.invalid_sources,0);
 assert.equal(empty.diagnostics.unverified_sources,10);
 assert.equal("empty_sources" in empty.diagnostics,false);
});
test("RSS tokenization bounds element count and nesting depth",async()=>{
 const excessiveNodes="<rss><channel>"+"<extension/>".repeat(10001)+"</channel></rss>";
 const excessiveDepth="<rss><channel>"+"<extension>".repeat(64)+"x"+"</extension>".repeat(64)+"</channel></rss>";
 for(const oversized of [excessiveNodes,excessiveDepth]){
  const result=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse(oversized));
  assert.equal(result.diagnostics.invalid_sources,10);
  assert.equal(result.diagnostics.parsed_sources,0);
 }
 const inherited=Array.from({length:64},(_,index)=>`xmlns:p${index}='urn:p${index}'`).join(" ");
 const siblingNamespaces=Array.from({length:257},(_,index)=>`<extension xmlns:local${index}='urn:local${index}'/>`).join("");
 const namespaceHeavy=`<rss ${inherited}><channel>${siblingNamespaces}</channel></rss>`;
 const boundedNamespaces=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse(namespaceHeavy));
 assert.equal(boundedNamespaces.diagnostics.invalid_sources,10);
 assert.equal(boundedNamespaces.diagnostics.parsed_sources,0);
 const oversizedTag="<rss "+Array.from({length:65},(_,index)=>`xmlns:a${index}='urn:a${index}'`).join(" ")+"><channel/></rss>";
 const boundedAttributes=await fetchHeadlinesWithDiagnostics("global",async()=>textResponse(oversizedTag));
 assert.equal(boundedAttributes.diagnostics.invalid_sources,10);
 assert.equal(boundedAttributes.diagnostics.parsed_sources,0);
});
test("RSS response reader bounds byte and chunk budgets without a text fallback",async()=>{
 let cancelled=0;
 const oversized=new Uint8Array(800001);
 const fetcher=async()=>new Response(new ReadableStream({
  start(controller){controller.enqueue(oversized);const timer=setTimeout(()=>{try{controller.close()}catch{}},50);this.timer=timer},
  cancel(){cancelled++;clearTimeout(this.timer)}
 }));
 const result=await fetchHeadlinesWithDiagnostics("global",fetcher);
 assert.equal(result.diagnostics.invalid_sources,10);
 assert.equal(result.diagnostics.network_errors,0);
 assert.equal(cancelled,10);
 let tinyCancelled=0;
 const tinyFetcher=async()=>new Response(new ReadableStream({
  pull(controller){controller.enqueue(new Uint8Array(1))},
  cancel(){tinyCancelled++}
 }));
 const tinyChunks=await fetchHeadlinesWithDiagnostics("global",tinyFetcher);
 assert.equal(tinyChunks.diagnostics.invalid_sources,10);
 assert.equal(tinyCancelled,10);
 let textFallbackCalls=0;
 const bodyless=await fetchHeadlinesWithDiagnostics("global",async()=>({ok:true,text:async()=>{textFallbackCalls++;return xml}}));
 assert.equal(bodyless.diagnostics.invalid_sources,10);
 assert.equal(textFallbackCalls,0);
});
test("last-good news is marked cached and includes the failed refresh diagnostics",async()=>{
 const key="https://aurora-cache.invalid/news/last-good/global";
 const body={status:"live",edition:"global",updated_at:new Date().toISOString(),count:1,items:[{title:"Sourced prior headline",url:"https://publisher.test/story",source:"Example Press",published:new Date().toISOString()}]};
 const entries=new Map([[key,Response.json(body)]]);
 const originalCaches=globalThis.caches,originalFetch=globalThis.fetch;
 globalThis.caches={default:{
  async match(request){return entries.get(typeof request==="string"?request:request.url)?.clone()||null},
  async put(request,response){entries.set(typeof request==="string"?request:request.url,response.clone())}
 }};
 globalThis.fetch=async()=>{throw new TypeError("private-network-failure")};
 try{
  const response=await newsRoute({request:new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0"),fetcher:async()=>{throw new TypeError("private-network-failure")} });
  assert.equal(response.status,200);
  assert.equal(response.headers.get("cache-control"),"no-store");
  const fallback=await response.json();
  assert.equal(fallback.status,"cached");
  assert.equal(fallback.items[0].title,"Sourced prior headline");
  assert.equal(fallback.last_attempt.status,"unavailable");
  assert.equal(fallback.last_attempt.diagnostics.network_errors,10);
 }finally{
  globalThis.fetch=originalFetch;
  if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches;
 }
});
test("translated cached fallback reports diagnostics from the latest failed refresh",async()=>{
 const key="https://aurora-cache.invalid/news/last-good/global";
 const body={status:"live",edition:"global",updated_at:new Date().toISOString(),count:1,items:[{title:"Sourced prior headline",url:"https://publisher.test/story",source:"Example Press",published:new Date().toISOString()}]};
 const entries=new Map([[key,Response.json(body)]]),pending=[];
 const originalCaches=globalThis.caches,originalFetch=globalThis.fetch;
 globalThis.caches={default:{
  async match(request){return entries.get(typeof request==="string"?request:request.url)?.clone()||null},
  async put(request,response){entries.set(typeof request==="string"?request:request.url,response.clone())}
 }};
 globalThis.fetch=async()=>{throw new TypeError("private-network-failure")};
 const ctx={waitUntil(promise){pending.push(promise)}};
 let failure="network";
 const fetcher=async()=>failure==="network"?Promise.reject(new TypeError("private-network-failure")):{ok:false,status:429};
 const request=new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0");
 try{
  const first=await newsRoute({request,ctx,fetcher});
  assert.equal(first.headers.get("cache-control"),"no-store");
  const firstBody=await first.json();
  assert.equal(firstBody.last_attempt.diagnostics.network_errors,10);
  await Promise.all(pending.splice(0));
  failure="http";
  const second=await newsRoute({request,ctx,fetcher});
  assert.equal(second.headers.get("cache-control"),"no-store");
  const secondBody=await second.json();
  assert.deepEqual(secondBody.last_attempt.diagnostics.http_errors,{"429":10});
  assert.equal(secondBody.last_attempt.diagnostics.network_errors,0);
 }finally{
  globalThis.fetch=originalFetch;
  if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches;
 }
});

test("Unicode deduplication preserves distinct Bulgarian, Chinese and Japanese titles",async()=>{
 const titles=["НЛО над Шумен днес","НЛО над Варна днес","日本でUFO発見","中国发现不明飞行物"];
 const rss='<rss><channel>'+titles.map((title,i)=>'<item><title>'+title+'</title><link>https://news.google.com/rss/articles/'+i+'</link><source>World Press</source><pubDate>'+new Date().toUTCString()+'</pubDate></item>').join('')+'</channel></rss>';
 const mock=async()=>textResponse(rss);
 const result=await fetchHeadlines("global",mock);
 assert.equal(result.length,4,"non-Latin titles must not collapse to the same empty deduplication key");
 assert.deepEqual(new Set(result.map(x=>x.title)),new Set(titles));
});
test("global headlines query multiple regions without trusting arbitrary URLs",async()=>{
 let regions=new Set;
 const feed=async url=>{const u=new URL(url);assert.equal(u.hostname,"news.google.com");regions.add(u.searchParams.get("gl"));return textResponse(xml)};
 await fetchHeadlines("global",feed);
 assert.ok(regions.size>=7,"global edition must cover multiple regions");
});
test("global RSS fan-out stays within a five-request concurrency budget",async()=>{
 let active=0,maximum=0;
 const feed=async()=>{
  active++;maximum=Math.max(maximum,active);
  await new Promise(resolve=>setTimeout(resolve,10));
  active--;
  return textResponse(xml);
 };
 const items=await fetchHeadlines("global",feed);
 assert.equal(items.length,1);
 assert.ok(maximum<=5,"expected at most five simultaneous feed requests, observed "+maximum);
});
test("global RSS batches share one total fetch deadline",async()=>{
 const signals=new Set;
 const feed=async(_url,options)=>{signals.add(options.signal);return textResponse(xml)};
 const result=await fetchHeadlinesWithDiagnostics("global",feed);
 assert.equal(result.items.length,1);
 assert.equal(signals.size,1,"all feed requests must share one total deadline");
});
test("shared feed deadline aborts stalled sources and classifies every timeout",async()=>{
 const keepAlive=setTimeout(()=>{},1000);
 try{
  const started=Date.now();
  const stalled=async(_url,{signal})=>{
   if(signal.aborted)throw signal.reason;
   await new Promise((_,reject)=>signal.addEventListener("abort",()=>reject(signal.reason),{once:true}));
  };
  const result=await fetchHeadlinesWithDiagnostics("global",stalled,undefined,25);
  assert.ok(Date.now()-started<500,"all source work must stop at the shared deadline");
  assert.equal(result.diagnostics.timeouts,10);
  assert.equal(result.diagnostics.network_errors,0);
 }finally{clearTimeout(keepAlive)}
});

import {NEWS_LANGUAGES,PAGE_SIZE,translateNewsPage} from "../functions/_lib/news-translation.js";
test("translation changes headlines, not source publisher URL or original text",async()=>{
 const calls=[],ai={async run(model,args){calls.push({model,args});return {translated_text:"ПРЕВОД "+args.text}}};
 const items=[
  {title:"UAP over the sea",language:"en",url:"https://publisher.test/a",source:"Example Press",published:"2026-10-28"},
  {title:"НЛО над Шумен",language:"bg",url:"https://publisher.test/b",source:"Example Press",published:"2026-10-28"}
 ];
 const answer=await translateNewsPage(items,"bg",0,ai);
 assert.equal(answer.items[0].translated_title,"ПРЕВОД UAP over the sea");
 assert.equal(answer.items[0].title,items[0].title);
 assert.equal(answer.items[0].url,items[0].url);
 assert.equal(answer.items[1].translated_title,undefined);
 assert.equal(answer.translation.status,"translated");
 assert.equal(calls.length,1);
 assert.equal(calls[0].args.source_lang,"en");
 assert.equal(calls[0].args.target_lang,"bg");
 assert.ok(calls[0].model.endsWith("/m2m100-1.2b"));
});
test("AI translation handles 18 locales, bounds calls and fails open",async()=>{
 assert.equal(NEWS_LANGUAGES.size,18);
 let calls=0;
 const ai={async run(){calls++;return {translated_text:"مرحبا"}}};
 const items=Array.from({length:40},(_,i)=>({title:"Title "+i,language:"en",url:"https://publisher.test/"+i}));
 const data=await translateNewsPage(items,"ar",0,ai);
 assert.equal(calls,PAGE_SIZE);
 assert.equal(data.items.filter(x=>x.translated_title).length,PAGE_SIZE);
 assert.equal(items[0].translated_title,undefined);
 const missing=await translateNewsPage(items,"de",0,undefined);
 assert.equal(missing.translation.status,"unavailable");
 assert.equal(missing.items[0].title,items[0].title);
});
