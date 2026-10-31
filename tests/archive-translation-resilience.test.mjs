import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {onRequestGet,translatePublishedCase} from "../functions/api/archive-translation.js";
import {isFullTranslation,translatePublicCase} from "../archive-localization.js";

const baseCase=()=>({
 id:"translation-fixture-archive",
 source:{name:"Source archive",url:"https://example.org/published-case"},
 title:{en:"Published source report"},
 summary:{en:"A published source report of the original observation."},
 story:{en:[
  "The original first paragraph provides the publicly reported observations and event context.",
  "The second paragraph describes which documents the publisher actually released.",
  "The third paragraph explains that the available material is not proof of an extraordinary origin.",
  "The fourth paragraph records the source's published assessment and remaining uncertainties."
 ]}
});
const provider=(options={})=>{
 const calls=[];let active=0,maxConcurrent=0;
 const ai={async run(model,input){
  calls.push({...input});
  active++;maxConcurrent=Math.max(maxConcurrent,active);
  try{
   await Promise.resolve();
   if(options.fail?.(input))throw Error("temporary downstream failure");
   return {translated_text:"TR: "+input.text};
  }finally{active--}
 }};
 return {ai,calls,get maxConcurrent(){return maxConcurrent}};
};
test("the dossier translation is complete, sourced and bounded to three simultaneous model calls",async()=>{
 const record=baseCase(),{ai,calls,maxConcurrent}=provider();
 const result=await translatePublishedCase(record,"de",ai,{detail:true});
 assert.equal(result.status,"translated");
 assert.equal(result.source_language,"en");
 assert.equal(result.target_language,"de");
 assert.equal(result.story.length,record.story.en.length);
 assert.ok(result.story.every(x=>x.startsWith("TR: ")));
 assert.equal(calls.length,record.story.en.length+2);
 assert.ok(maxConcurrent<=3,"bounded in-flight Workers AI calls");
 assert.deepEqual(record.story.en,baseCase().story.en,"source narrative is unchanged");
});
test("a single failed paragraph yields partial rather than a false fully-translated dossier",async()=>{
 const record=baseCase(),p=provider({fail:x=>x.text.includes("second paragraph")});
 const result=await translatePublishedCase(record,"ru",p.ai,{detail:true});
 assert.equal(result.status,"partial");
 assert.equal(result.story.length,4);
 assert.equal(result.story[1],null);
 assert.equal(result.story.filter(x=>typeof x==="string").length,3);
});
test("missing AI produces unavailable; an overlong paragraph is never silently shortened",async()=>{
 const record=baseCase();
 assert.equal((await translatePublishedCase(record,"fr",null,{detail:true})).status,"unavailable");
 record.story.en[2]="Original source passage ".repeat(230);
 const out=await translatePublishedCase(record,"fr",provider().ai,{detail:true});
 assert.equal(out.status,"partial");
 assert.equal(out.story[2],null);
 assert.equal(out.story.length,4);
});
test("a valid source-matched cached summary prevents translating title and summary again",async()=>{
 const record=baseCase(),p=provider();
 const earlier=await translatePublishedCase(record,"de",p.ai);
 assert.equal(earlier.status,"translated");
 assert.equal(p.calls.length,2);
 const detailed=await translatePublishedCase(record,"de",p.ai,{detail:true,seed:earlier});
 assert.equal(detailed.status,"translated");
 assert.equal(p.calls.length,6,"only four paragraphs translated for detail");
 const crossLocale=await translatePublishedCase(record,"ja",p.ai,{detail:true,seed:earlier});
 assert.equal(crossLocale.status,"translated");
 assert.equal(crossLocale.target_language,"ja");
 assert.equal(p.calls.length,12,"translation from another language cannot be reused");
});
test("a native full translation needs no AI; a truncated authored story is not complete",async()=>{
 const record=baseCase();record.title.bg="Публикуван доклад";record.summary.bg="Описание на публикувания доклад";
 record.story.bg=record.story.en.map(x=>"Български: "+x);
 const original=await translatePublishedCase(record,"bg",null,{detail:true});
 assert.equal(original.status,"original");
 assert.deepEqual(original.story,record.story.bg);
 assert.equal(isFullTranslation(record,"bg",true),true);
 record.story.bg.pop();
 assert.equal(isFullTranslation(record,"bg",true),false);
 record.story.bg=[];
 assert.equal(isFullTranslation(record,"bg",true),false);
});
test("Cloudflare edge cache stores only fully translated detail and reuses summary on subsequent requests",async()=>{
 const record=baseCase(),p=provider(),saved=new Map(),pending=[];
 const oldCache=globalThis.caches;
 globalThis.caches={default:{
  async match(key){return saved.get(key.url)?.clone()},
  async put(key,response){saved.set(key.url,response.clone())}
 }};
 const env={ASSETS:{async fetch(){return Response.json({cases:[record]})}},AI:p.ai};
 const ctx={waitUntil(promise){pending.push(promise)}};
 const url=(detail)=>new Request("https://aurorauap.org/api/archive-translation?id="+record.id+"&lang=de&detail="+Number(detail));
 try{
  const list=await onRequestGet({request:url(false),env,ctx});
  assert.equal((await list.json()).status,"translated");
  await Promise.all(pending.splice(0));
  assert.equal(saved.size,1);
  const dossier=await onRequestGet({request:url(true),env,ctx});
  assert.equal((await dossier.json()).story.length,4);
  await Promise.all(pending.splice(0));
  assert.equal(p.calls.length,6,"seed skips two repeat model jobs");
  assert.equal(saved.size,2);
  const hit=await onRequestGet({request:url(true),env,ctx});
  assert.equal((await hit.json()).status,"translated");
  assert.equal(p.calls.length,6,"edge cache hit avoids model work");
 }finally{
  if(oldCache===undefined)delete globalThis.caches;
  else globalThis.caches=oldCache;
 }
});
test("partial detail is never edge-cached; private or missing case identifiers are rejected",async()=>{
 const record=baseCase(),p=provider({fail:x=>x.text.includes("third paragraph")});
 const saved=new Map(),oldCache=globalThis.caches,waiting=[];
 globalThis.caches={default:{async match(k){return saved.get(k.url)?.clone()},async put(k,v){saved.set(k.url,v.clone())}}};
 const ctx={waitUntil(x){waiting.push(x)}};
 const request=new Request("https://aurorauap.org/api/archive-translation?id="+record.id+"&lang=de&detail=1");
 try{
  const env={ASSETS:{async fetch(){return Response.json({cases:[record]})}},AI:p.ai};
  const response=await onRequestGet({request,env,ctx});
  assert.equal((await response.json()).status,"partial");
  assert.equal(response.headers.get("cache-control"),"no-store");
  assert.equal(saved.size,0);
  assert.equal(waiting.length,0);
  const invalid=await onRequestGet({request:new Request("https://aurorauap.org/api/archive-translation?id=bad&lang=de"),env,ctx});
  assert.equal(invalid.status,400);
  const denied=await onRequestGet({request,env:{...env,ASSETS:{async fetch(){return Response.json({cases:[{...record,private:true}]})}}},ctx});
  assert.equal(denied.status,404);
 }finally{
  if(oldCache===undefined)delete globalThis.caches;
  else globalThis.caches=oldCache;
 }
});
test("browser client deduplicates in-flight work, rejects mismatched responses and retries a partial story",async()=>{
 const oldFetch=globalThis.fetch,record=baseCase();let calls=0;
 const bad={id:record.id,target_language:"fr",status:"translated",title:"Wrong language",summary:"Wrong response",story:record.story.en};
 const partial={id:record.id,target_language:"de",status:"partial",title:"Deutscher Bericht",summary:"Deutsche Zusammenfassung",story:["Translated first",null,null,null]};
 const whole={...partial,status:"translated",story:record.story.en.map(x=>"DE "+x)};
 globalThis.fetch=async()=>{
  calls++;
  return Response.json(calls===1?bad:calls===2?partial:whole);
 };
 try{
  const [first,duplicate]=await Promise.all([
   translatePublicCase(record,"de",{detail:true}),
   translatePublicCase(record,"de",{detail:true})
  ]);
  assert.equal(first,null);
  assert.equal(duplicate,null);
  assert.equal(calls,1);
  assert.equal(record.title.de,undefined);
  await translatePublicCase(record,"de",{detail:true});
  assert.equal(calls,2);
  assert.equal(isFullTranslation(record,"de",true),false);
  assert.equal(record.story.de,undefined);
  assert.equal(record.translationStatus,"partial");
  await translatePublicCase(record,"de",{detail:true});
  assert.equal(calls,3);
  assert.equal(isFullTranslation(record,"de",true),true);
  assert.equal(record.story.de.length,4);
  assert.equal(record.source.url,"https://example.org/published-case");
 }finally{globalThis.fetch=oldFetch}
});
test("dossier releases its in-page lock after completion so language toggles can retry",()=>{
 const source=readFileSync(new URL("../dossier.js",import.meta.url),"utf8");
 assert.match(source,/translationRequested\.delete\(key\)/);
 assert.match(source,/translatePublicCase\(record,lang,\{detail:true\}\)/);
});
