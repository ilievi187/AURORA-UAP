import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {importReviewed,validateManifest,monthlyAudit} from "../worker/import-core.js";
import {getCases,getCase,getStats,countryStats} from "../functions/_lib/public.js";
import {onRequestGet as listHandler} from "../functions/api/cases.js";
import {onRequestGet as statsHandler} from "../functions/api/stats.js";
import {onRequestGet as countryHandler} from "../functions/api/countries/[code].js";
import {onRequestGet as detailHandler} from "../functions/api/cases/[id].js";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
export function localDatabase(){
 const sql=new DatabaseSync(":memory:");
 sql.exec(read("migrations/0001_init.sql"));
 const db={prepare(query){const stmt=sql.prepare(query);
 const statement=(args=[])=>({
  bind(...values){return statement(values)},
  async run(){return stmt.run(...args)},
  async first(){return stmt.get(...args)||null},
  async all(){return {results:stmt.all(...args)}}
 });
 return statement();
}};
 return {db,sql};
}
const {db,sql}=localDatabase();
const manifest=JSON.parse(read("data/imports/aaro-reviewed.json"));
test("migration creates source, case, provenance, moderation, media and sync tables",()=>{
 const tables=sql.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);
 for(const name of ["sources","cases","case_sources","moderation_events","import_runs","media_assets"])assert.ok(tables.includes(name),name);
});
test("rights-checked official source: first import inserts exactly 3 unique real cases",async()=>{
 const result=await importReviewed(db,manifest);
 assert.equal(result.inserted,3);assert.equal(result.updated,0);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM case_sources").get().n,3);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM sources WHERE approved_for_ingest=1").get().n,1);
 assert.equal((await getStats(db)).sightings,3);
});
test("idempotent import updates existing rows with no duplicates",async()=>{
 const result=await importReviewed(db,manifest,"weekly_import");
 assert.equal(result.inserted,0);assert.equal(result.updated,3);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM cases").get().n,3);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM case_sources").get().n,3);
 const stats=await getStats(db);
 assert.equal(stats.sightings,3);assert.equal(stats.countries,3);
 assert.ok(stats.last_successful_sync);
});
test("country code, region, year, type and search filters use real D1 SQL",async()=>{
 for(const c of ["US","IQ","PR"])assert.equal((await countryStats(db,c)).total,1,c);
 assert.equal((await countryStats(db,"DE")).total,0);
 const pr=await getCases(db,new URLSearchParams({country:"PR",year:"2013",type:"instrument",q:"lantern",limit:"20"}));
 assert.equal(pr.total,1);assert.equal(pr.cases[0].country,"PR");
 assert.equal(pr.cases[0].lat,18.49485);
 assert.equal((await getCases(db,new URLSearchParams({country:"DE"}))).total,0);
 assert.equal((await getCases(db,new URLSearchParams({country:"PR",year:"2020"}))).total,0);
 assert.ok((await getCase(db,"aaro-iraq-2017")).source_url.includes("aaro.mil"));
 await assert.rejects(()=>getCases(db,new URLSearchParams({country:"US';DROP TABLE cases;--"})),/Invalid country/);
});
test("demo, pending, rejected or withdrawn cases never contribute to public counts",async()=>{
 sql.prepare("INSERT INTO cases(id,record_kind,title,description,date,date_precision,country_code,location,location_precision,category,review_status,publication_status,source_name,source_url,license) VALUES('demo-hidden','demo','DEMO','This is only a demo test fixture','2020','year','US','Demo','inaccurate', 'lights','approved','published','demo','https://example.org','none')").run();
 assert.equal((await getStats(db)).sightings,3);
 sql.prepare("UPDATE cases SET publication_status='withdrawn' WHERE id='aaro-pr-2013'").run();
 assert.equal((await getStats(db)).sightings,2);
 assert.equal((await countryStats(db,"PR")).total,0);
 await importReviewed(db,manifest,"weekly_import");
 assert.equal((await countryStats(db,"PR")).total,0,"cron must not republish withdrawn case");
 sql.prepare("UPDATE cases SET publication_status='published' WHERE id='aaro-pr-2013'").run();
 sql.prepare("DELETE FROM cases WHERE id='demo-hidden'").run();
});
test("rights and editor review are mandatory; poisoned source cannot import",async()=>{
 const noReview=structuredClone(manifest);noReview.cases[0].curation_status="pending";
 assert.throws(()=>validateManifest(noReview),/Not editor-approved/);
 const thirdParty=structuredClone(manifest);thirdParty.cases[0].source_url="https://unverified.example/story";
 assert.throws(()=>validateManifest(thirdParty),/Unapproved source URL/);
 const wrongCoords=structuredClone(manifest);wrongCoords.cases[1].longitude=null;
 assert.throws(()=>validateManifest(wrongCoords),/Partial coordinates/);
});
test("public Pages Functions exercise actual SQLite data and fail closed without binding",async()=>{
 const list=await listHandler({env:{DB:db},request:new Request("https://aurorauap.org/api/cases?country=IQ")});
 assert.equal(list.status,200);assert.equal((await list.json()).total,1);
 const stats=await statsHandler({env:{DB:db}});
 assert.equal((await stats.json()).sightings,3);
 const country=await countryHandler({env:{DB:db},params:{code:"DE"}});
 assert.equal((await country.json()).total,0);
 const item=await detailHandler({env:{DB:db},params:{id:"aaro-pr-2013"}});
 assert.equal(item.status,200);
 assert.equal((await item.json()).country_code,"PR");
 const unbound=await statsHandler({env:{}});
 assert.equal(unbound.status,503);
 assert.equal((await unbound.json()).error,"database_unavailable");
 const invalid=await listHandler({env:{DB:db},request:new Request("https://aurorauap.org/api/cases?year=notayear")});
 assert.equal(invalid.status,400);
});
test("monthly audit records success after clean state",async()=>{
 assert.equal((await monthlyAudit(db)).status,"success");
 assert.ok(sql.prepare("SELECT COUNT(*) AS n FROM import_runs WHERE status='success'").get().n>=3);
});
