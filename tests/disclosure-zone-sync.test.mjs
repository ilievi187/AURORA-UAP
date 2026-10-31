import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildArchive,normalizeCase,fetchSource,SOURCE_URL} from "../scripts/sync-disclosure-zone.mjs";

const row=(id="nuremberg-1561",override={})=>({
 id,url:"https://disclosure.zone/cases/"+id,date:"1561-04-14",country:"DE",
 lat:49.45,lon:11.08,status:"disputed",domain:"civil",
 sources:[
  {tier:"T1",url:"https://museum.example/print.pdf",label:{en:"Archival broadsheet"}},
  {tier:"T1",url:"https://museum.example/print.pdf",label:{en:"Repeat"}},
  {tier:"T5",url:null,label:{en:"Unlinked interpretation"}},
  {tier:"T2",url:"javascript:alert(1)",label:{en:"Unsafe"}}
 ],
 en:{
  title:"Nuremberg Phenomenon "+id,
  subtitle:"Historical public reporting context, not an instrument reading.",
  location:"Nuremberg, Germany",
  summary:"Sixteenth-century broadsheet describes objects in the sky. This is a historical report, not scientific proof of an extraordinary interpretation.",
  official:"No aviation or institutional investigation existed in 1561.",
  alternatives:["Atmospheric optics are proposed.","Historical woodcut iconography is proposed."]
 },
 witnesses:"Private information should never be copied into a dossier",
 email:"test-private-email@example.net",
 ...override
});
const source=(cases)=>({license:"CC BY 4.0",count:cases.length,cases});
const existing={schema_version:1,cases:[
 {id:"phoenix-1997",title:{en:"Phoenix Lights"},date:"1997-03-13",country:"US",source:{url:"https://nuforc.org/phoenix/"}},
 {id:"nimitz-2004",title:{en:"Nimitz"},date:"2004-11-14",country:"US",source:{url:"https://www.defense.gov/"}}
]};
test("source CC BY case becomes rich and attributed public dossier with APPROXIMATE coordinate anchor",()=>{
 const got=normalizeCase(row());
 assert.equal(got.id,"disclosure-nuremberg-1561");
 assert.equal(got.lat,49.45);
 assert.equal(got.lng,11.08);
 assert.match(got.location_precision,/NOT a measured/);
 assert.equal(got.date,"1561-04-14");
 assert.equal(got.date_precision,"day");
 assert.equal(got.country,"DE");
 assert.equal(got.source.url,"https://disclosure.zone/cases/nuremberg-1561");
 assert.match(got.provenance.license,/CC BY/);
 assert.equal(got.provenance.automated,true);
 assert.equal(got.publisher_assessment,"disputed");
 assert.equal(got.status,"reported");
 assert.ok(got.story.en.join(" ").length>350);
 assert.ok(got.story.bg.join(" ").length>350);
 assert.match(got.story.bg[1],/английски/);
 assert.equal(got.sources.length,1);
 assert.equal(got.media.length,1);
 assert.equal(got.media[0].type,"documents");
 assert.ok(!JSON.stringify(got).includes("test-private-email"));
 assert.ok(!JSON.stringify(got).includes("Private information should"));
});
test("publisher-only coordinates are never inferred or treated as precise event measurements",()=>{
 const unknown=normalizeCase(row("unknown-region",{lat:null,lon:null,country:"XX"}));
 assert.equal(unknown.lat,null);assert.equal(unknown.lng,null);assert.equal(unknown.country,"");
 assert.match(unknown.location_precision,/NOT geocoded/);
 for(const bad of [{lat:92,lon:0},{lat:"12.34",lon:15},{lat:4,lon:Infinity},{lat:0,lon:-181}]){
  const c=normalizeCase(row("bad-geodata",bad));
  assert.equal(c.lat,null);assert.equal(c.lng,null);
 }
 assert.equal(normalizeCase(row("bad-date",{date:"2026-02-30"})).date,"undated");
});
test("invalid URL, licensing, truncated totals and unsafe attributes fail closed",()=>{
 assert.equal(normalizeCase(row("bad-link",{url:"https://evil.example/cases/bad-link"})),null);
 assert.equal(normalizeCase(row("bad-slug",{id:"../etc"})),null);
 assert.equal(normalizeCase(row("bad-summary",{en:{title:"short",summary:"No."}})),null);
 assert.throws(()=>buildArchive(existing,source([])),/Invalid/);
 assert.throws(()=>buildArchive(existing,{license:"ARR",count:1,cases:[row()]}),/license/);
 assert.throws(()=>buildArchive(existing,{license:"CC BY 4.0",count:99,cases:[row()]}),/count mismatch/);
});
test("manual editorial aliases win; second fetch stays stable and does not duplicate source records",()=>{
 const rows=[row("phoenix-lights-1997",{date:"1997-03-13"}),
  row("nimitz-2004",{date:"2004-11-14"}),row("nuremberg-1561"),
  row("foo-fighters-1944",{date:"1944-12-14",country:"FR",lat:48.58,lon:7.75})];
 const first=buildArchive(existing,source(rows));
 assert.equal(first.archive.cases.length,4);
 assert.equal(first.report.skipped_duplicates,2);
 assert.equal(first.report.generated,2);
 assert.equal(first.archive.cases.find(x=>x.id==="nimitz-2004").source.url,"https://www.defense.gov/");
 const second=buildArchive(first.archive,source(rows));
 assert.deepEqual(second.archive,first.archive);
 assert.deepEqual(second.report,{...first.report,previous:2});
});
test("publisher changing or deleting most of a published corpus never destroys earlier entries",()=>{
 const rows=Array.from({length:12},(_,i)=>row("case-"+String(i+1).padStart(3,"0")));
 const first=buildArchive(existing,source(rows));
 assert.equal(first.report.generated,12);
 assert.throws(()=>buildArchive(first.archive,source(rows.slice(0,6))),/shrank/);
});
test("source fetch uses fixed endpoint with byte guard and schema integrity",async()=>{
 let requested="";
 const got=await fetchSource(async(url,options)=>{
  requested=url;
  assert.equal(options.headers.Accept,"application/json");
  return Response.json(source([row()]));
 });
 assert.equal(requested,SOURCE_URL);
 assert.equal(got.count,1);
 await assert.rejects(fetchSource(async()=>new Response("no",{status:403})),/HTTP 403/);
 await assert.rejects(fetchSource(async()=>new Response("[]",{headers:{"content-length":"9000000"}})),/size limit/);
 await assert.rejects(fetchSource(async()=>Response.json({license:"CC BY 4.0",count:20,cases:[row()]})),/count mismatch/);
});
test("archived reviewed records remain untouched in repository",()=>{
 const current=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8"));
 const result=buildArchive(current,source([row("nuremberg-1561")]));
 assert.ok(result.archive.cases.length>=current.cases.length);
 for(const c of current.cases){
  const original=result.archive.cases.find(x=>x.id===c.id);
  assert.deepEqual(original,c,c.id+" should not change");
 }
});


test("published official DVIDS source links become in-page playable video references, not copied footage",()=>{
 const url="https://www.dvidshub.net/video/1023397/dow-uap-pr135-unresolved-uap-report-middle-east-2025";
 const item=normalizeCase(row("six-spheres-2025",{sources:[
  {tier:"T1",url,label:{en:"Official AARO six spheres footage"}},
  {tier:"T1",url:"https://publisher.example/article",label:{en:"Separate article"}},
  {tier:"T2",url:"https://www.dvidshub.net/video/invalid",label:{en:"Invalid player URL"}}
 ]}));
 const video=item.media.find(m=>m.type==="video");
 assert.ok(video,"official video must be exposed in the case");
 assert.equal(video.url,url);
 assert.equal(video.playback.mode,"provider_embed");
 assert.equal(video.playback.provider,"dvids");
 assert.equal(video.playback.permission,"public_embed");
 assert.equal(video.playback.source_url,url);
 assert.equal(item.media.length,1,"articles are not falsely labeled playable video");
 assert.equal(item.sources.length,3,"all original public sources remain cited");
});
