import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {join} from "node:path";
const base=new URL("../data/bulk/",import.meta.url);
const load=(p)=>JSON.parse(readFileSync(new URL(p,base),"utf8"));
test("all 2,715 original French GEIPAN sources have honest English display fields and preserved originals",()=>{
 const index=load("index.json"),ids=new Map();
 const shardNames=readdirSync(new URL("shards/",base)).filter(n=>/^\d\d\.json$/.test(n)).sort();
 assert.equal(shardNames.length,64);
 let n=0;
 for(const filename of shardNames){
  const shard=load("shards/"+filename);
  for(const record of shard.cases){
   if(record.original_language!=="fr")continue;
   n++;
   assert.match(record.id,/^geipan-\d+$/);
   assert.equal(record.translation?.source_language,"fr");
   assert.equal(record.translation?.target_language,"en");
   assert.equal(record.translation?.editorial_reviewed,false);
   assert.ok(["machine_translated","source_text_insufficient"].includes(record.translation.status));
   assert.ok(record.source?.url?.startsWith("https://www.cnes-geipan.fr/"));
   assert.ok(record.summary?.fr?.length>0);
   assert.ok(record.summary?.en?.length>20);
   assert.ok(record.summary.en.length<=320,"Summary length "+record.id);
   assert.ok(Array.isArray(record.story?.fr)&&record.story.fr.length===2);
   assert.ok(record.story.fr[1].includes(" GEIPAN classification "));
   assert.ok(Array.isArray(record.story?.en)&&record.story.en.length>=2);
   assert.doesNotMatch(record.summary.en,/^Original French account/);
   assert.doesNotMatch(record.story.en.join(" "),/^Original French account from GEIPAN:/);
   if(record.translation.status==="machine_translated"){
    assert.match(record.story.en[0],/Machine-translated/);
    assert.notEqual(record.summary.en,record.summary.fr);
    assert.ok(record.story.en[1].length>15);
   }else {
    assert.equal(record.translation.status,"source_text_insufficient");
    assert.match(record.story.en[0],/no usable eyewitness narrative/i);
    assert.match(record.summary.en,/fragment/i);
   }
   assert.ok(!ids.has(record.id));
   ids.set(record.id,record);
  }
 }
 assert.equal(n,2715);
 const statuses=[...ids.values()].reduce((acc,r)=>(acc[r.translation.status]=(acc[r.translation.status]||0)+1,acc),{});
 assert.deepEqual(statuses,{machine_translated:2713,source_text_insufficient:2});
 assert.equal(ids.get("geipan-2753").translation.status,"source_text_insufficient");
 assert.equal(ids.get("geipan-2792").translation.status,"source_text_insufficient");
 const inIndex=index.cases.filter(c=>c.original_language==="fr");
 assert.equal(inIndex.length,n);
 for(const c of inIndex){
  const full=ids.get(c.id);
  assert.ok(full,"Missing full record "+c.id);
  assert.equal(c.summary.en,full.summary.en);
  assert.equal(c.summary.fr,full.summary.fr);
  assert.equal(c.translation.status,full.translation.status);
  assert.equal(c.source.url,full.source.url);
  assert.equal(c.date,full.date);
 }
 assert.equal(index.cases.length,10032);
});
