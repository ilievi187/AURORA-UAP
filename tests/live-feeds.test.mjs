import test from "node:test";
import assert from "node:assert/strict";
import {parseNewsRss,fetchHeadlines,fetchHeadlinesWithDiagnostics,onRequestGet as newsRoute} from "../functions/api/news.js";
import {normalizeTraffic,normalizeAdsb,fetchTraffic,fetchAdsbTraffic,onRequestGet as trafficRoute} from "../functions/api/air-traffic.js";
import {SOURCE_CATALOG} from "../functions/_lib/source-catalog.js";
import {selectDiscoveryFeeds} from "../functions/_lib/discovery.js";
const xml='<rss><channel><item><title>UAP briefing &amp; research</title><link>https://news.google.com/rss/articles/test</link><pubDate>'+new Date().toUTCString()+'</pubDate><source>Example Press</source></item></channel></rss>';
const textResponse=text=>new Response(text,{headers:{"Content-Type":"application/rss+xml; charset=utf-8"}});
const globalPublisherSources=selectDiscoveryFeeds(SOURCE_CATALOG,"all");
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
 const data={time:Math.floor(Date.now()/1000),states:[
 ["abc123","TEST123","BG",0,0,24.2,42.8,1234,false,100,180],
 ["bad","BAD","US",0,0,-50,20,0,false,100,0],
 ["n","NAN","BG",0,0,24.2,NaN,0,false,100,0]
 ]};
 const got=normalizeTraffic(data,"bg");assert.equal(got.count,1);assert.equal(got.aircraft[0].callsign,"TEST123");
 assert.equal(got.aircraft[0].latitude,42.8);
});
test("traffic uses fixed region query and fails for arbitrary region",async()=>{
 const fetcher=async url=>{const p=new URL(url);assert.equal(p.hostname,"opensky-network.org");assert.equal(p.searchParams.get("lamin"),"41.1");return Response.json({time:Math.floor(Date.now()/1000),states:[]})};
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
  const response=await newsRoute({request:new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0"),fetcher,catalogFetcher:async()=>{throw new TypeError("private-catalog-failure")}});
  assert.equal(response.status,503);
  const body=await response.json();
  assert.equal(body.status,"unavailable");
  assert.equal(body.diagnostics.configured_sources,10);
  assert.equal(body.diagnostics.http_successes,8);
  assert.equal(body.diagnostics.invalid_sources,8);
  assert.equal(body.diagnostics.network_errors,1);
  assert.deepEqual(body.diagnostics.http_errors,{"429":1});
  assert.equal(body.diagnostics.publisher_status,"unavailable");
  assert.equal(body.diagnostics.publisher_sources_failed,globalPublisherSources.length);
  assert.equal(globalCalls,0,"the injected source adapter should be used by the route");
  assert.doesNotMatch(JSON.stringify(body),/private-upstream-exception|private-catalog-failure|unexpected_global_fetch/);
 }finally{globalThis.fetch=originalFetch}
});
test("one healthy source still serves live headlines with degraded-source counts",async()=>{
 const fetcher=async url=>new URL(url).searchParams.get("gl")==="US"
  ?textResponse(xml)
  :{ok:false,status:503};
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async()=>{throw new Error("unexpected_global_fetch")};
 try{
  const response=await newsRoute({request:new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0"),fetcher,catalogFetcher:async()=>{throw new TypeError("private-catalog-failure")}});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.status,"live");
  assert.equal(body.count,1);
  assert.equal(body.items[0].source,"Example Press");
  assert.equal(body.diagnostics.parsed_sources,1);
  assert.deepEqual(body.diagnostics.http_errors,{"503":9});
 }finally{globalThis.fetch=originalFetch}
});
test("global news merges checked publisher matches and prefers direct links to Google wrappers",async()=>{
 const debrief=SOURCE_CATALOG.find(source=>source.id==="the-debrief");
 const directUrl=`https://${debrief.link_hosts[0]}/newsroom-test`;
 const publisherXml='<rss><channel><item><title>UAP briefing &amp; research</title><link>'+directUrl+'</link><pubDate>'+new Date().toUTCString()+'</pubDate></item></channel></rss>';
 let publisherCalls=0,active=0,maximum=0;
 const publisherUrls=[];
 const catalogFetcher=async url=>{
  publisherCalls++;publisherUrls.push(url);active++;maximum=Math.max(maximum,active);
  await new Promise(resolve=>setTimeout(resolve,5));
  active--;
  return textResponse(url===debrief.feed_url?publisherXml:'<rss><channel></channel></rss>');
 };
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async()=>{throw new Error("unexpected_global_fetch")};
 try{
  const response=await newsRoute({
   request:new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0"),
   fetcher:async()=>{
    active++;maximum=Math.max(maximum,active);
    await new Promise(resolve=>setTimeout(resolve,5));
    active--;
    return textResponse(xml);
   },catalogFetcher
  });
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.status,"live");
  assert.equal(body.count,1);
  assert.equal(body.items[0].url,directUrl);
  assert.equal(body.items[0].source,debrief.publisher);
  assert.equal(body.items[0].source_id,debrief.id);
  assert.equal(body.items[0].language,debrief.language);
  assert.equal(body.diagnostics.publisher_sources_checked,globalPublisherSources.length);
  assert.equal(body.diagnostics.publisher_matches,1);
  assert.equal(publisherCalls,globalPublisherSources.length);
  assert.ok(publisherUrls.includes(SOURCE_CATALOG.find(source=>source.id==="scientific-american").feed_url),"specialist feeds outside the 12-item preview must be part of global newsroom requests");
  assert.ok(maximum<=5,`combined newsroom fetch concurrency must remain within five; observed ${maximum}`);
 }finally{globalThis.fetch=originalFetch}
});
test("checked publisher headlines keep the news endpoint live during a Google News outage",async()=>{
 const debrief=SOURCE_CATALOG.find(source=>source.id==="the-debrief");
 const directUrl=`https://${debrief.link_hosts[0]}/newsroom-fallback-test`;
 const publisherXml='<rss><channel><item><title>UAP briefing &amp; research</title><link>'+directUrl+'</link><pubDate>'+new Date().toUTCString()+'</pubDate></item></channel></rss>';
 const response=await newsRoute({
  request:new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0"),
  fetcher:async()=>{throw new TypeError("private-upstream-exception")},
  catalogFetcher:async url=>textResponse(url===debrief.feed_url?publisherXml:'<rss><channel></channel></rss>')
 });
 assert.equal(response.status,200);
 const body=await response.json();
 assert.equal(body.status,"live");
 assert.equal(body.items[0].url,directUrl);
 assert.equal(body.diagnostics.network_errors,10);
 assert.equal(body.diagnostics.publisher_status,"live");
 assert.doesNotMatch(JSON.stringify(body),/private-upstream-exception/);
});
test("official and Bulgarian editions query only their matching checked publishers",async()=>{
 const official=SOURCE_CATALOG.filter(source=>source.role==="official-institution"||["the-debrief","guardian-science","space-com"].includes(source.id));
 const bulgarian=SOURCE_CATALOG.filter(source=>source.country==="BG");
 const calls=[];
 const catalogFetcher=async url=>{calls.push(url);return textResponse('<rss><channel></channel></rss>')};
 const fetcher=async()=>textResponse(xml);
 const officialResponse=await newsRoute({
  request:new Request("https://aurorauap.org/api/news?edition=official&lang=en&offset=0"),fetcher,catalogFetcher
 });
 assert.equal(officialResponse.status,200);
 assert.equal(calls.length,official.length);
 assert.ok(calls.every(url=>official.some(source=>source.feed_url===url)));
 assert.equal((await officialResponse.json()).diagnostics.publisher_sources_checked,official.length);
 calls.length=0;
 const bulgariaResponse=await newsRoute({
  request:new Request("https://aurorauap.org/api/news?edition=bulgaria&lang=bg&offset=0"),fetcher,catalogFetcher
 });
 assert.equal(bulgariaResponse.status,200);
 assert.equal(calls.length,bulgarian.length);
 assert.ok(calls.every(url=>bulgarian.some(source=>source.feed_url===url)));
 assert.equal((await bulgariaResponse.json()).diagnostics.publisher_sources_checked,bulgarian.length);
});
test("official and Bulgarian editions supplement with checked specialist UAP feeds when Google News and regional feeds return zero items",async()=>{
 const debrief=SOURCE_CATALOG.find(source=>source.id==="the-debrief");
 const directUrl=`https://${debrief.link_hosts[0]}/supplemental-uap-report`;
 const publisherXml='<rss><channel><item><title>New Pentagon UAPs report released</title><link>'+directUrl+'</link><pubDate>'+new Date().toUTCString()+'</pubDate></item></channel></rss>';
 const headersSeen=[];
 const fetcher=async(_url,init)=>{headersSeen.push(init?.headers?.["User-Agent"]||"");return {ok:false,status:503}};
 const catalogFetcher=async url=>textResponse(url===debrief.feed_url?publisherXml:'<rss><channel></channel></rss>');
 const officialRes=await newsRoute({
  request:new Request("https://aurorauap.org/api/news?edition=official&lang=en&offset=0"),fetcher,catalogFetcher
 });
 assert.equal(officialRes.status,200);
 const officialBody=await officialRes.json();
 assert.equal(officialBody.status,"live");
 assert.equal(officialBody.items[0].url,directUrl);
 assert.ok(headersSeen.every(ua=>ua.includes("AURORA-UAP-newsroom/1.0")));
});
test("publisher integration bypasses the pre-integration fresh cache key",async()=>{
 const staleKey="https://aurora-cache.invalid/news/fresh/global";
 const stale={status:"live",edition:"global",updated_at:new Date().toISOString(),count:1,items:[{title:"Old Google-only cache",url:"https://news.google.com/rss/articles/stale",source:"Google News",published:new Date().toISOString()}]};
 const entries=new Map([[staleKey,Response.json(stale)]]);
 const originalCaches=globalThis.caches;
 let googleCalls=0,publisherCalls=0;
 globalThis.caches={default:{
  async match(request){return entries.get(typeof request==="string"?request:request.url)?.clone()||null},
  async put(request,response){entries.set(typeof request==="string"?request:request.url,response.clone())}
 }};
 try{
  const response=await newsRoute({
   request:new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0"),
   fetcher:async()=>{googleCalls++;return textResponse(xml)},
   catalogFetcher:async()=>{publisherCalls++;return textResponse('<rss><channel></channel></rss>')}
  });
  assert.equal(response.status,200);
  const body=await response.json();
  assert.ok(googleCalls>0);
  assert.equal(publisherCalls,globalPublisherSources.length);
  assert.notEqual(body.items[0].title,"Old Google-only cache");
 }finally{
  if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches;
 }
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
  const response=await newsRoute({request:new Request("https://aurorauap.org/api/news?edition=global&lang=en&offset=0"),fetcher:async()=>{throw new TypeError("private-network-failure")},catalogFetcher:async()=>{throw new TypeError("private-catalog-failure")} });
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
test("underfilled live refresh uses last-good without losing current headlines or provenance",async()=>{
 const key="https://aurora-cache.invalid/news/last-good/global";
 const backup={status:"live",edition:"global",updated_at:new Date().toISOString(),count:1,items:[{
  title:"Previously sourced headline",url:"https://publisher.test/story/0",source:"Example Press",published:new Date().toISOString()
 }]};
 const entries=new Map([[key,Response.json(backup)]]),pending=[];
 const originalCaches=globalThis.caches,originalFetch=globalThis.fetch;
 globalThis.caches={default:{
  async match(request){return entries.get(typeof request==="string"?request:request.url)?.clone()||null},
  async put(request,response){entries.set(typeof request==="string"?request:request.url,response.clone())}
 }};
 globalThis.fetch=async()=>{throw new Error("unexpected_global_fetch")};
 const ctx={waitUntil(promise){pending.push(promise)}};
 try{
  const response=await newsRoute({
   request:new Request("https://aurorauap.org/api/news?edition=global&lang=bg&offset=0"),ctx,
   fetcher:async url=>new URL(url).searchParams.get("gl")==="US"?textResponse(xml):{ok:false,status:503},
   catalogFetcher:async()=>{throw new TypeError("private-catalog-failure")}
  });
  assert.equal(response.status,200);
  assert.equal(response.headers.get("cache-control"),"no-store");
  const body=await response.json();
  assert.equal(body.status,"cached");
  assert.equal(body.count,1);
  assert.equal(body.items[0].url,"https://publisher.test/story/0");
  assert.equal(body.items[0].source,"Example Press");
  assert.equal(body.last_attempt.status,"degraded");
  assert.equal(body.last_attempt.count,1);
  assert.equal(body.last_attempt.items[0].url,"https://news.google.com/rss/articles/test");
  assert.equal(body.last_attempt.diagnostics.items_returned,1);
 }finally{
  globalThis.fetch=originalFetch;
  if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches;
 }
});
test("last-good newsroom response is returned before a slow refresh completes",async()=>{
 const key="https://aurora-cache.invalid/news/last-good/global";
 const saved={status:"live",edition:"global",updated_at:new Date().toISOString(),count:2,items:[
  {title:"Sourced headline one",url:"https://publisher.test/one",source:"Example Press",published:new Date().toISOString()},
  {title:"Sourced headline two",url:"https://publisher.test/two",source:"Example Press",published:new Date().toISOString()}
 ]};
 const entries=new Map([[key,Response.json(saved)]]),pending=[];
 const originalCaches=globalThis.caches,originalFetch=globalThis.fetch;
 globalThis.caches={default:{
  async match(request){return entries.get(typeof request==="string"?request:request.url)?.clone()||null},
  async put(request,response){entries.set(typeof request==="string"?request:request.url,response.clone())}
 }};
 globalThis.fetch=async()=>{throw new Error("unexpected_global_fetch")};
 const ctx={waitUntil(promise){pending.push(promise)}};
 const stall=async(_url,{signal})=>{
  if(signal.aborted)throw signal.reason;
  return new Promise((_,reject)=>signal.addEventListener("abort",()=>reject(signal.reason),{once:true}));
 };
 const keepAlive=setTimeout(()=>{},1000);
 try{
  const start=performance.now();
  const response=await newsRoute({request:new Request("https://aurorauap.org/api/news?edition=global"),ctx,timeoutMs:300,
   fetcher:stall,catalogFetcher:stall});
  const elapsed=performance.now()-start;
  assert.ok(elapsed<100,`last-good response should not await upstream timeout; observed ${Math.round(elapsed)}ms`);
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.status,"cached");
  assert.equal(body.count,2);
  assert.equal(body.items[0].url,"https://publisher.test/one");
  assert.equal(body.last_attempt.status,"refreshing");
  assert.equal(pending.length,1,"refresh should continue through the request lifecycle waitUntil hook");
  await Promise.all(pending.splice(0));
 }finally{
  clearTimeout(keepAlive);
  globalThis.fetch=originalFetch;
  if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches;
 }
});
test("healthy live coverage replaces the last-good news snapshot",async()=>{
 const key="https://aurora-cache.invalid/news/last-good/global";
 const backup={status:"live",edition:"global",updated_at:new Date().toISOString(),count:1,items:[{title:"Old sourced headline",url:"https://publisher.test/old",source:"Example Press",published:new Date().toISOString()}]};
 const entries=new Map([[key,Response.json(backup)]]),pending=[];
 const originalCaches=globalThis.caches,originalFetch=globalThis.fetch;
 globalThis.caches={default:{
  async match(request){return entries.get(typeof request==="string"?request:request.url)?.clone()||null},
  async put(request,response){entries.set(typeof request==="string"?request:request.url,response.clone())}
 }};
 globalThis.fetch=async()=>{throw new Error("unexpected_global_fetch")};
 const ctx={waitUntil(promise){pending.push(promise)}};
 const sixItems='<rss><channel>'+Array.from({length:6},(_,i)=>'<item><title>Verified story '+i+' today</title><link>https://news.google.com/rss/articles/'+i+'</link><source>Example Press</source><pubDate>'+new Date().toUTCString()+'</pubDate></item>').join('')+'</channel></rss>';
 try{
  const response=await newsRoute({request:new Request("https://aurorauap.org/api/news?edition=global"),ctx,
   fetcher:async()=>textResponse(sixItems),catalogFetcher:async()=>({ok:false,status:503})});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.status,"live");
  assert.equal(body.count,6);
  await Promise.all(pending.splice(0));
  const refreshed=await entries.get(key).json();
  assert.equal(refreshed.count,6,"a healthy refresh must become the new last-good snapshot");
  assert.notEqual(refreshed.items[0].url,"https://publisher.test/old");
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
  const first=await newsRoute({request,ctx,fetcher,catalogFetcher:async()=>{throw new TypeError("private-catalog-failure")}});
  assert.equal(first.headers.get("cache-control"),"no-store");
  const firstBody=await first.json();
  assert.equal(firstBody.last_attempt.diagnostics.network_errors,10);
  await Promise.all(pending.splice(0));
  failure="http";
  const second=await newsRoute({request,ctx,fetcher,catalogFetcher:async()=>{throw new TypeError("private-catalog-failure")}});
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
test("publisher requests overlap the Google lane while combined request concurrency remains bounded",async()=>{
 let googleCompleted=0,firstPublisherAfterGoogle=null,active=0,maximum=0;
 const track=async(fn)=>{active++;maximum=Math.max(maximum,active);try{return await fn()}finally{active--}};
 const response=await newsRoute({
  request:new Request("https://aurorauap.org/api/news?edition=global"),
  fetcher:async()=>track(async()=>{await new Promise(resolve=>setTimeout(resolve,60));googleCompleted++;return textResponse(xml)}),
  catalogFetcher:async()=>track(async()=>{if(firstPublisherAfterGoogle===null)firstPublisherAfterGoogle=googleCompleted;await new Promise(resolve=>setTimeout(resolve,3));return textResponse("<rss><channel></channel></rss>")})
 });
 assert.equal(response.status,200);
 assert.ok(firstPublisherAfterGoogle<10,"publisher feed requests should start before all Google News queries finish");
 assert.ok(maximum<=5,`combined upstream concurrency must remain at most five; observed ${maximum}`);
});

test("one request deadline bounds both news lanes when upstreams stall",async()=>{
 let googleStarted=0,publisherStarted=0,active=0,maximum=0;
 const stall=async(_url,{signal})=>{
  active++;maximum=Math.max(maximum,active);
  try{
   if(signal.aborted)throw signal.reason;
   await new Promise((_,reject)=>signal.addEventListener("abort",()=>reject(signal.reason),{once:true}));
  }finally{active--}
 };
 const keepAlive=setTimeout(()=>{},1000);
 try{
  const start=performance.now();
  const response=await newsRoute({
   request:new Request("https://aurorauap.org/api/news?edition=global"),
   timeoutMs:120,
   fetcher:async(...args)=>{googleStarted++;return stall(...args)},
   catalogFetcher:async(...args)=>{publisherStarted++;return stall(...args)}
  });
  const elapsed=performance.now()-start;
  assert.ok(elapsed<500,`shared endpoint deadline should cap both lanes; observed ${Math.round(elapsed)}ms`);
  assert.equal(response.status,503);
  assert.ok(googleStarted>0&&googleStarted<=10);
  assert.ok(publisherStarted>0&&publisherStarted<=globalPublisherSources.length);
  assert.ok(maximum<=5,`combined upstream concurrency must remain at most five; observed ${maximum}`);
 }finally{clearTimeout(keepAlive)}
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


test("cold Cloudflare edge serves explicit dated source-backed snapshot when both feed lanes fail",async()=>{
 const stamp=new Date().toISOString().slice(0,10);
 const payload={schema_version:1,checked_on:stamp,editions:{global:[
  {title:"Sourced UAP article one",source:"Publisher One",url:"https://publisher.example/one",published:stamp,language:"en"},
  {title:"Sourced UAP article two",source:"Publisher Two",url:"https://publisher.example/two",published:stamp,language:"en"}
 ]}};
 let requested=0;
 const ASSETS={async fetch(request){requested++;assert.match(request.url,/\/data\/news-last-good\.json$/);return Response.json(payload)}};
 const response=await newsRoute({
  request:new Request("https://aurorauap.org/api/news?edition=global&lang=bg&offset=0"),
  env:{ASSETS},
  fetcher:async()=>{throw new TypeError("Google blocked")},
  catalogFetcher:async()=>{throw new TypeError("Publisher feeds blocked")}
 });
 assert.equal(response.status,200);
 assert.equal(response.headers.get("cache-control"),"no-store");
 const data=await response.json();
 assert.equal(requested,1);
 assert.equal(data.status,"cached");
 assert.equal(data.cache_source,"dated_publisher_snapshot");
 assert.equal(data.count,2);
 assert.equal(data.items[0].url,"https://publisher.example/one");
 assert.equal(data.items[1].source,"Publisher Two");
 assert.equal(data.last_attempt.status,"unavailable");
 assert.equal(data.translation.status,"unavailable","unavailable AI must not fabricate translations");
 assert.equal(data.items[0].translated_title,undefined);
});

test("cold edge snapshot is never served if stale, invalid, mixed-content or wrong edition",async()=>{
 const stamp=new Date(Date.now()-16*24*3600000).toISOString().slice(0,10);
 const newer=new Date().toISOString().slice(0,10);
 const base={schema_version:1,checked_on:stamp,editions:{global:[
  {title:"Historic UAP one",source:"Publisher One",url:"https://publisher.example/one",published:newer},
  {title:"Historic UAP two",source:"Publisher Two",url:"https://publisher.example/two",published:newer}
 ]}};
 const failures=[
  base,
  {...base,checked_on:newer,editions:{global:base.editions.global.map((x,i)=>i?{...x,url:"http://insecure.example/"}:x)}},
  {...base,checked_on:newer,editions:{official:base.editions.global}},
  {...base,checked_on:newer,editions:{global:[base.editions.global[0]]}}
 ];
 for(const fixture of failures){
  const response=await newsRoute({
   request:new Request("https://aurorauap.org/api/news?edition=global"),
   env:{ASSETS:{async fetch(){return Response.json(fixture)}}},
   fetcher:async()=>{throw new Error("blocked")},
   catalogFetcher:async()=>{throw new Error("blocked")}
  });
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,"news_source_unavailable");
 }
});

test("live source success takes precedence over historical asset snapshot",async()=>{
 let assetsRead=0;
 const response=await newsRoute({
  request:new Request("https://aurorauap.org/api/news?edition=global"),
  env:{ASSETS:{async fetch(){assetsRead++;return Response.json({})}}},
  fetcher:async()=>textResponse(xml),
  catalogFetcher:async()=>textResponse("<rss><channel></channel></rss>")
 });
 assert.equal(response.status,200);
 assert.equal(assetsRead,0,"static fallback must never override live publisher data");
 assert.equal((await response.json()).status,"live");
});

test("airspace fallback maps genuine ADS-B fields, units, bounds and attribution",()=>{
 const got=normalizeAdsb({now:Date.now(),ac:[
  {hex:"abc123",flight:"WZZ123",lat:42.70,lon:23.30,alt_baro:33000,gs:400,track:91,seen_pos:2},
  {hex:"far",flight:"OUT",lat:10,lon:100,alt_baro:15000,gs:500},
  {hex:"old",flight:"OLD",lat:42,lon:23,alt_baro:10000,seen_pos:360}
 ]},"bg");
 assert.equal(got.count,1);
 assert.equal(got.source,"adsb.lol");
 assert.equal(got.license,"ODbL 1.0");
 assert.equal(got.aircraft[0].callsign,"WZZ123");
 assert.equal(got.aircraft[0].altitude_m,10058);
 assert.equal(got.aircraft[0].speed_ms,206);
 assert.equal(got.aircraft[0].latitude,42.7);
 assert.equal(normalizeAdsb({now:Date.now()-31*60*1000,ac:[]},"bg"),null);
});
test("OpenSky throttling falls back to bounded ADS-B region and never invents aircraft",async()=>{
 let open=0,adsb=0;
 const fetcher=async url=>{
  if(url.includes("opensky-network.org")){open++;return new Response("rate limit",{status:429})}
  if(url.includes("api.adsb.lol")){adsb++;assert.match(url,/\/v2\/lat\/\d+\.\d{3}\/lon\/\d+\.\d{3}\/dist\/\d+$/);return Response.json({now:Date.now(),ac:[{hex:"aabbcc",flight:"TEST BG",lat:42.5,lon:23.5,alt_baro:12000,gs:220,seen_pos:1}]})}
  throw Error("Unexpected host");
 };
 const response=await trafficRoute({request:new Request("https://aurorauap.org/api/air-traffic?region=bg"),fetcher});
 assert.equal(response.status,200);
 const data=await response.json();
 assert.equal(data.count,1);
 assert.equal(data.source,"adsb.lol");
 assert.equal(data.aircraft[0].callsign,"TEST BG");
 assert.equal(open,1);
 assert.equal(adsb,1);
});
test("if both flight sources fail, the API returns 503 with no synthetic plane positions",async()=>{
 const response=await trafficRoute({
  request:new Request("https://aurorauap.org/api/air-traffic?region=bg"),
  fetcher:async()=>new Response("blocked",{status:429})
 });
 assert.equal(response.status,503);
 const body=await response.json();
 assert.equal(body.error,"traffic_source_unavailable");
 assert.equal(body.aircraft,undefined);
});
test("disable fallback option respects restricted provider setups",async()=>{
 let adsbRequested=false;
 const response=await trafficRoute({
  request:new Request("https://aurorauap.org/api/air-traffic?region=bg"),
  env:{AURORA_ADSB_FALLBACK_DISABLED:"true"},
  fetcher:async url=>{if(url.includes("adsb.lol"))adsbRequested=true;return new Response("failure",{status:503})}
 });
 assert.equal(response.status,503);
 assert.equal(adsbRequested,false);
});
test("ADS-B region queries stay bounded to 250 nautical miles",async()=>{
 const got=await fetchAdsbTraffic("eu",async url=>{
  const radius=Number(url.split("/dist/")[1]);assert.ok(radius>0&&radius<=250);
  return Response.json({now:Date.now(),ac:[]});
 });
 assert.equal(got.source,"adsb.lol");
 assert.equal(got.count,0);
});
