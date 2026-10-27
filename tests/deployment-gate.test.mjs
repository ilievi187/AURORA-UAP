import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {DatabaseSync} from "node:sqlite";
import {verifyDeployment,validateTarget} from "../scripts/verify-registry.mjs";
const manifest=JSON.parse(readFileSync(new URL("../data/imports/aaro-reviewed.json",import.meta.url),"utf8"));
const cases=manifest.cases.map(c=>({
 id:c.id,title:{en:c.title,bg:c.title_bg},summary:{en:c.description,bg:c.description_bg},
 source_url:c.source_url,source_name:manifest.source.name,
 country_code:c.country_code,review_status:"approved",assessment_status:c.assessment_status,
 record_kind:"historical_import"
}));
const respond=(status,body)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json"}});
function simulation(mode,{fakeDemo=false,brokenCounts=false,brokenRoute=false}={}){
 const stats={source:"D1",includes_demo:false,sightings:3,countries:3,
  by_country:[{code:"PR",count:1},{code:"IQ",count:1},{code:"US",count:1}],
  by_year:[{year:"2013",count:1},{year:"2017",count:1},{year:"2021",count:1}],
  last_successful_sync:new Date().toISOString()};
 if(brokenCounts)stats.sightings=32;
 return async url=>{
  const {pathname,searchParams}=new URL(url);
  if(pathname==="/countries/DE")return new Response(brokenRoute?"HOME":'<h1 id="countryName">Germany</h1>',{status:200});
  if(mode==="staged"){
   if(pathname==="/data/cases.json")return respond(200,{cases:Array.from({length:8},(_,i)=>({id:"legacy-"+i,source:{url:"https://nuforc.org/"}}))});
   return respond(503,{error:"database_unavailable"});
  }
  if(pathname==="/api/stats")return respond(200,stats);
  if(pathname==="/api/cases"&&searchParams.get("country")==="PR")return respond(200,{total:1,cases:[cases[0]]});
  if(pathname==="/api/cases")return respond(200,{total:3,cases:fakeDemo?[{...cases[0],record_kind:"demo"},...cases.slice(1)]:cases});
  if(pathname.startsWith("/api/cases/")){
   const item=cases.find(c=>c.id===pathname.split("/").pop());
   return item?respond(200,item):respond(404,{error:"not_found"});
  }
  if(pathname.startsWith("/api/countries/")){
   const c=pathname.split("/").pop();
   return respond(200,{country_code:c,total:cases.filter(x=>x.country_code===c).length});
  }
  return respond(404,{error:"not_found"});
 };
}
test("restrict health-check targets to AURORA public domains",()=>{
 assert.equal(validateTarget("https://aurorauap.org"),"https://aurorauap.org");
 assert.equal(validateTarget("https://abc123.aurora-uap.pages.dev/"),"https://abc123.aurora-uap.pages.dev");
 for(const base of ["http://aurorauap.org/","https://aurorauap.org.attacker.tld/","https://127.0.0.1/",
  "https://aurorauap.org:8443/","https://bad.aurora-uap.pages.dev.attacker.org/","https://aurorauap.org/foo",
  "https://user:password@aurorauap.org/","https://aurorauap.org/?leak=1"]){
   assert.throws(()=>validateTarget(base),/Refusing/);
 }
});
test("staged release passes only when D1 stays closed and legacy sourced archive remains",async()=>{
 const r=await verifyDeployment({base:"https://aurorauap.org",mode:"staged",fetcher:simulation("staged")});
 assert.equal(r.sightings,null);
 assert.equal(r.results.length,6);
 assert.ok(r.results.some(x=>x.includes("8 sourced")));
});
test("active release cross-checks D1 stats, all mandatory seed cases and country filters",async()=>{
 const r=await verifyDeployment({base:"https://abc123.aurora-uap.pages.dev",mode:"active",fetcher:simulation("active")});
 assert.equal(r.sightings,3);
 assert.equal(r.countries,3);
 assert.ok(r.results.some(x=>x.includes("aaro-iraq-2017")));
});
test("active verification refuses DEMO contamination and inflated counts",async()=>{
 await assert.rejects(()=>verifyDeployment({base:"https://aurorauap.org",mode:"active",fetcher:simulation("active",{fakeDemo:true})}),/demo or unapproved/);
 await assert.rejects(()=>verifyDeployment({base:"https://aurorauap.org",mode:"active",fetcher:simulation("active",{brokenCounts:true})}),/year facet totals/);
});
test("staged gate refuses accidental public D1 activation",async()=>{
 await assert.rejects(()=>verifyDeployment({base:"https://aurorauap.org",mode:"staged",fetcher:simulation("active")}),/must stay closed/);
});
test("release checker catches broken dynamic Pages country routing",async()=>{
 await assert.rejects(()=>verifyDeployment({base:"https://aurorauap.org",mode:"staged",fetcher:simulation("staged",{brokenRoute:true})}),/country route/);
});
test("Wrangler seed SQL omits BEGIN and COMMIT but stays idempotent in SQLite",()=>{
 const binary=fileURLToPath(new URL("../scripts/build-seed.mjs",import.meta.url));
 const sql=execFileSync(process.execPath,[binary],{encoding:"utf8"});
 assert.doesNotMatch(sql,/^\s*(?:BEGIN|COMMIT)(?:\s+TRANSACTION)?\s*;/im);
 const storage=new DatabaseSync(":memory:");
 storage.exec(readFileSync(new URL("../migrations/0001_init.sql",import.meta.url),"utf8"));
 storage.exec(sql);storage.exec(sql);
 assert.equal(storage.prepare("SELECT COUNT(*) AS n FROM cases").get().n,3);
 assert.equal(storage.prepare("SELECT COUNT(*) AS n FROM case_sources").get().n,3);
 storage.close();
});
