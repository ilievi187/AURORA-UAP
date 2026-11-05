import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {buildBulk,normalizeRow,shardFor,wouldEraseEnglishTranslatedGeipan} from "../scripts/import-uapdrop-records.mjs";
const read=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const manifest=read("data/bulk/manifest.json");
const index=read("data/bulk/index.json").cases;
const curated=read("data/cases.json").cases;
test("large license-attributed archive contains thousands of nonduplicated records",()=>{
 assert.equal(manifest.license,"CC BY 4.0");
 assert.equal(manifest.imported,index.length);
 assert.ok(index.length>9000);
 assert.equal(manifest.archive_total,index.length+curated.length);
 assert.ok(manifest.by_source.GEIPAN>2500&&manifest.by_source.NARA_Blue_Book>7000);
 assert.equal(new Set(index.map(x=>x.id)).size,index.length);
 assert.equal(new Set(index.map(x=>x.source.url)).size,index.length);
 assert.equal(new Set(index.map(x=>x.id)).size,index.length);
 assert.ok(index.every(x=>x.source.url.startsWith("https://")&&/^\d{4}/.test(x.date)));
 assert.ok(index.every(x=>x.status==="reported"),"never infer unexplained or explained");
 assert.ok(index.every(x=>Array.isArray(x.media)&&x.media.length===0),"no scraped or unlicensed media");
});
test("shards contain every full dossier exactly once, with source and no invented evidence",()=>{
 const seen=new Set();let count=0;
 for(let i=0;i<64;i++){
  const code=String(i).padStart(2,"0"),rows=read("data/bulk/shards/"+code+".json").cases;
  assert.ok(rows.length>50&&rows.length<500);
  for(const r of rows){
   assert.equal(shardFor(r.id),code);
   assert.ok(!seen.has(r.id));seen.add(r.id);
   assert.equal(r.provenance.license,"CC BY 4.0");
   assert.equal(r.sources[0].url,"https://www.uapdrop.com/data.html");
   assert.ok(r.story.en[0].length>25);
   assert.ok(r.media.length===0);
   if(r.id.startsWith("geipan-")){
    assert.equal(r.original_language,"fr");
    assert.ok(r.summary.fr.length>4,"Original French text must remain available");
    assert.equal(r.translation?.target_language,"en");
    assert.doesNotMatch(r.summary.en,/^Original French account/,"English display is not French");
   }else{
    assert.equal(r.original_language,"en");
    assert.equal(r.lat,null,"NARA's non-precision geocodes are not displayed as measured positions");
    assert.equal(r.date_precision,"month","NARA source dates are month-level");
   }
   count++;
  }
 }
 assert.equal(count,index.length);
 assert.ok(index.every(r=>seen.has(r.id)));
});
test("source adapter rejects spoofed official URLs and malformed record IDs",()=>{
 const template={sourceKey:"us_nara_bluebook",externalId:"US-BB-NAID-302584194",
  title:"Round Lake, Illinois, December 1969",summary:"Historical file unit from the US National Archives catalog, including a separate date and documented incident metadata.",locationName:"Round Lake, Illinois",observedAt:"1969-12-01",sourceUrl:"https://catalog.archives.gov/id/302584194"};
 assert.ok(normalizeRow(template));
 assert.equal(normalizeRow({...template,sourceUrl:"https://catalog.archives.gov.attacker.example/id/302584194"}),null);
 assert.equal(normalizeRow({...template,externalId:"../../secrets"}),null);
 assert.equal(normalizeRow({...template,observedAt:null}),null);
 assert.equal(normalizeRow({...template,summary:""}),null);
});
test("public browser shard hash matches Node build; invalid IDs never fetch",async()=>{
 const js=readFileSync(new URL("../bulk-archive.js",import.meta.url),"utf8");
 const sandbox={globalThis:{},fetch:()=>{throw Error("Unexpected fetch")}};
 runInNewContext(js,sandbox,{timeout:1000});
 const api=sandbox.globalThis.AURORA_BULK_ARCHIVE;
 for(const id of ["geipan-4851","geipan-4799","bluebook-302584194","bluebook-302584191"]){
  assert.equal(api.shardFor(id),shardFor(id));
 }
 assert.equal(await api.load("../../secret"),null);
 assert.equal(await api.load("geipan-abc"),null);
 const id="geipan-4851";
 const record=read("data/bulk/shards/"+shardFor(id)+".json").cases.find(c=>c.id===id);
 const resolved=await api.load(id,async url=>{
  assert.equal(url,"/data/bulk/shards/"+shardFor(id)+".json");
  return {ok:true,json:async()=>({cases:[record]})};
 });
 assert.equal(resolved.id,id);
 assert.equal(resolved.source.url,record.source.url);
});

test("future raw French imports cannot silently erase already translated GEIPAN content",()=>{
 assert.equal(wouldEraseEnglishTranslatedGeipan({cases:[{
  original_language:"fr",translation:{target_language:"en",status:"machine_translated"}}]}),true);
 assert.equal(wouldEraseEnglishTranslatedGeipan({cases:[{original_language:"fr"}]}),false);
 assert.equal(wouldEraseEnglishTranslatedGeipan({cases:[{original_language:"en"}]}),false);
});
