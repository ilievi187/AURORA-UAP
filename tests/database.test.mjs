import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {importReviewed,validateManifest,monthlyAudit} from "../worker/import-core.js";
import {getCases,getCase,getStats,countryStats} from "../functions/_lib/public.js";
import {onRequestGet as listHandler} from "../functions/api/cases.js";
import {onRequestGet as statsHandler} from "../functions/api/stats.js";
import {onRequestGet as countryHandler} from "../functions/api/countries/[code].js";
import {onRequestGet as detailHandler} from "../functions/api/cases/[id].js";
import {onRequestGet as serveCountry} from "../functions/countries/[code].js";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
export function localDatabase(){
 const sql=new DatabaseSync(":memory:");
 sql.exec(read("migrations/0001_init.sql"));
 const db={
 prepare(query){
  const stmt=sql.prepare(query);
  const statement=(args=[])=>({
   bind(...values){return statement(values)},
   async run(){return stmt.run(...args)},
   async first(){return stmt.get(...args)||null},
   async all(){return {results:stmt.all(...args)}}
  });
  return statement();
 },
 async batch(statements){
  sql.exec("BEGIN IMMEDIATE TRANSACTION");
  try{
   const results=[];
   for(const stmt of statements)results.push(await stmt.run());
   sql.exec("COMMIT");
   return results;
  }catch(error){
   sql.exec("ROLLBACK");
   throw error;
  }
 }
};
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
 assert.deepEqual(stats.by_year.map(x=>x.year),["2021","2017","2013"]);
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
 const list=await listHandler({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"},request:new Request("https://aurorauap.org/api/cases?country=IQ")});
 assert.equal(list.status,200);assert.equal((await list.json()).total,1);
 const stats=await statsHandler({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"}});
 assert.equal((await stats.json()).sightings,3);
 const country=await countryHandler({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"},params:{code:"DE"}});
 assert.equal((await country.json()).total,0);
 const item=await detailHandler({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"},params:{id:"aaro-pr-2013"}});
 assert.equal(item.status,200);
 assert.equal((await item.json()).country_code,"PR");
 const unbound=await statsHandler({env:{}});
 assert.equal(unbound.status,503);
 assert.equal((await unbound.json()).error,"database_unavailable");
 const invalid=await listHandler({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"},request:new Request("https://aurorauap.org/api/cases?year=notayear")});
 assert.equal(invalid.status,400);
});
test("D1 public API requires an explicit release flag even when DB binding exists",async()=>{
 const blocked=await statsHandler({env:{DB:db}});
 assert.equal(blocked.status,503);
 assert.equal((await blocked.json()).error,"database_unavailable");
 const active=await statsHandler({env:{DB:db,AURORA_REGISTRY_PUBLIC:"enabled"}});
 assert.equal(active.status,200);
});
test("monthly audit records success after clean state",async()=>{
 assert.equal((await monthlyAudit(db)).status,"success");
 assert.ok(sql.prepare("SELECT COUNT(*) AS n FROM import_runs WHERE status='success'").get().n>=3);
});

test("manual seed SQL generator applies real reviewed cases and is idempotent",()=>{
 const generator=fileURLToPath(new URL("../scripts/build-seed.mjs",import.meta.url));
 const seed=execFileSync(process.execPath,[generator],{encoding:"utf8"});
 const sqlite=new DatabaseSync(":memory:");
 sqlite.exec(read("migrations/0001_init.sql"));
 sqlite.exec(seed);
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM cases").get().n,3);
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM case_sources").get().n,3);
 sqlite.exec(seed);
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM cases").get().n,3,"no duplicate records after repeated seed");
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM import_runs WHERE status='success'").get().n,1);
 sqlite.close();
});

test("dynamic Pages country route serves shared extensionless country asset",async()=>{
 let seen="";
 const response=await serveCountry({
  request:new Request("https://aurorauap.org/countries/DE"),
  params:{code:"DE"},
  env:{ASSETS:{fetch:async request=>{seen=new URL(request.url).pathname;return new Response("country fixture",{status:200})}}}
 });
 assert.equal(response.status,200);
 assert.equal(seen,"/country");
 const invalid=await serveCountry({request:new Request("https://aurorauap.org/countries/INVALID"),params:{code:"INVALID"},env:{}});
 assert.equal(invalid.status,400);
});

test("source finding is separate from editorial publication approval",async()=>{
 const item=await getCase(db,"aaro-pr-2013");
 assert.equal(item.review_status,"approved");
 assert.equal(item.assessment_status,"resolved");
 assert.equal(item.assessment_confidence,"moderate");
 assert.equal(item.assessment_authority,"All-domain Anomaly Resolution Office (AARO)");
 assert.equal((await getCases(db,new URLSearchParams({assessment:"resolved"}))).total,3);
 assert.equal((await getCases(db,new URLSearchParams({assessment:"unresolved"}))).total,0);
 await assert.rejects(()=>getCases(db,new URLSearchParams({assessment:"bogus"})),/Invalid assessment/);
 const seed=execFileSync(process.execPath,[fileURLToPath(new URL("../scripts/build-seed.mjs",import.meta.url))],{encoding:"utf8"});
 const storage=new DatabaseSync(":memory:");
 storage.exec(read("migrations/0001_init.sql"));storage.exec(seed);
 assert.equal(storage.prepare("SELECT COUNT(*) AS n FROM cases WHERE assessment_status='resolved' AND review_status='approved'").get().n,3);
 storage.close();
});

test("country/year facets and API filters work beyond the first 250 globally paginated results",async()=>{
 const {db,sql}=localDatabase();
 await importReviewed(db,manifest);
 const insert=sql.prepare("INSERT INTO cases(id,record_kind,title,description,date,date_precision,country_code,region,location,location_precision,category,review_status,publication_status,source_name,source_url,license) VALUES(?,'historical_import','Data test','Only synthetic test row','2026','year','DE','Berlin','Berlin','Region anchor','lights','approved','published','Test Fixture','https://example.org/test','fixture')");
 for(let i=0;i<260;i++)insert.run("fixture-de-"+String(i).padStart(4,"0"));
 const first=await getCases(db,new URLSearchParams({limit:"250"}));
 assert.equal(first.total,263);
 assert.equal(first.has_more,true);
 assert.equal(first.cases.some(x=>x.country==="PR"),false);
 const global=await getStats(db);
 assert.equal(global.by_country.some(x=>x.code==="PR"&&x.count===1),true);
 assert.equal(global.by_year.some(x=>x.year==="2013"&&x.count===1),true);
 const puertoRico=await getCases(db,new URLSearchParams({country:"PR",limit:"250"}));
 assert.equal(puertoRico.total,1);
 assert.equal(puertoRico.cases[0].id,"aaro-pr-2013");
 const oldYear=await getCases(db,new URLSearchParams({year:"2013",limit:"250"}));
 assert.equal(oldYear.total,1);
 sql.close();
});

test("atomic D1-style batch rolls back every case and provenance write after a mid-import failure",async()=>{
 const {db:isolated,sql:sqlite}=localDatabase();
 // The second case fails *after* the first case insert; no public case should remain.
 sqlite.exec("CREATE TRIGGER fail_second_case BEFORE INSERT ON cases WHEN NEW.id='aaro-iraq-2017' BEGIN SELECT RAISE(ABORT, 'injected midway failure'); END;");
 await assert.rejects(()=>importReviewed(isolated,manifest),/injected midway failure/);
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM cases").get().n,0,"first case rolled back");
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM case_sources").get().n,0,"provenance rolled back too");
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM import_runs WHERE status='success'").get().n,0,"no false successful sync timestamp");
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM import_runs WHERE status='failed'").get().n,1,"durable failed import audit");
 sqlite.exec("DROP TRIGGER fail_second_case");
 const recovered=await importReviewed(isolated,manifest);
 assert.equal(recovered.inserted,3);
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM cases").get().n,3);
 sqlite.close();
});
test("scheduled import refuses a D1 adapter without atomic batch support",async()=>{
 const {db:isolated,sql:sqlite}=localDatabase();
 const old=isolated.batch;isolated.batch=undefined;
 await assert.rejects(()=>importReviewed(isolated,manifest),/Atomic D1 batch API is required/);
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM cases").get().n,0);
 isolated.batch=old;sqlite.close();
});

test("import allowlist rejects lookalike hostnames, HTTP and stolen embedded media",()=>{
 const spoofed=structuredClone(manifest);
 spoofed.cases[0].source_url="https://www.aaro.mil.evil.example/Portals/136/PDFs/case_resolution_reports/thing.pdf";
 assert.throws(()=>validateManifest(spoofed),/Unapproved source URL/);
 const ftp=structuredClone(manifest);
 ftp.cases[0].source_url="http://www.aaro.mil/Portals/136/PDFs/case_resolution_reports/thing.pdf";
 assert.throws(()=>validateManifest(ftp),/Unapproved source URL/);
 const spoofedLicense=structuredClone(manifest);
 spoofedLicense.source.license_url="https://www.copyright.gov.evil.example/title17/92chap1.html";
 assert.throws(()=>validateManifest(spoofedLicense),/Rights review missing/);
 const media=structuredClone(manifest);
 media.cases[0].media=[{url:"https://some-site.example/photo.jpg"}];
 assert.throws(()=>validateManifest(media),/Uncertain location or unapproved media/);
});

test("source-record provenance collision stops import instead of generating duplicate sightings",async()=>{
 const {db:isolated,sql:sqlite}=localDatabase();
 const one=structuredClone(manifest);one.cases=one.cases.slice(0,1);
 await importReviewed(isolated,one);
 sqlite.prepare("INSERT INTO cases(id,record_kind,title,description,date,date_precision,country_code,location,location_precision,category,review_status,publication_status,source_name,source_url,license) VALUES('fixture-alt-case','historical_import','Collision fixture','Source collision test','2024','year','PR','Aguadilla','test','lights','approved','published','Fixture','https://example.org','test')").run();
 sqlite.prepare("UPDATE case_sources SET case_id='fixture-alt-case' WHERE source_record_id='puerto-rico-object-2013'").run();
 await assert.rejects(()=>importReviewed(isolated,manifest),/Provenance collision/);
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM cases").get().n,2,"no other reviewed cases imported");
 assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM case_sources").get().n,1);
 sqlite.close();
});
