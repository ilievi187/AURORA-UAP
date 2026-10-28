import test from "node:test";
import assert from "node:assert/strict";
import {parseNewsRss,fetchHeadlines,onRequestGet as newsRoute} from "../functions/api/news.js";
import {normalizeTraffic,fetchTraffic,onRequestGet as trafficRoute} from "../functions/api/air-traffic.js";
const xml='<rss><channel><item><title>UAP briefing &amp; research</title><link>https://news.google.com/rss/articles/test</link><pubDate>'+new Date().toUTCString()+'</pubDate><source>Example Press</source></item></channel></rss>';
test("news RSS preserves attribution, validates URLs and date",()=>{
 const result=parseNewsRss(xml);assert.equal(result.length,1);assert.equal(result[0].title,"UAP briefing & research");
 assert.equal(result[0].source,"Example Press");
 assert.equal(parseNewsRss(xml.replace("https://news.google.com","javascript://news.google.com")).length,0);
});
test("news deduplicates across regions and refuses arbitrary editions",async()=>{
 const fetcher=async url=>{assert.ok(url.startsWith("https://news.google.com/rss/search?"));return {ok:true,text:async()=>xml}};
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
