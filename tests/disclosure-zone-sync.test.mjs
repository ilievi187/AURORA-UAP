import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyDisclosureZoneEditorialAnnotation} from "../scripts/disclosure-zone-editorial-annotations.mjs";
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
test("source refresh reapplies reviewed Bulgarian editorial copy without changing source facts or media",()=>{
 const catalog={schema_version:1,reviewed_at:"2026-11-01",source_access_notice:{
  bg:"При ограничена достъпност на архивните връзки препратките се запазват; наличността на документа може да се различава за посетителите и тази бележка не оценява достоверността на публикацията.",
  en:"When linked archive records are not fully accessible, references are retained; visitor access may differ, and this notice is not a judgment about the truth of the publication."
 },records:{
  "nuremberg-1561":{
   title_bg:"Нюрнбергската брошура от 1561 г.",
   summary_bg:"Печатна брошура от 1561 г. описва небесни знаци над Нюрнберг; тя е историческо свидетелство, а не инструментален запис.",
   story_bg:[
    "На 14 април 1561 г. в Нюрнберг е отпечатана брошура с текст и дърворезба за наблюдавани над града небесни форми.",
    "Документът предава описанието и тълкуването на печатницата от XVI век; сам по себе си той не установява физическата природа на видяното.",
    "Съвременният читател може да разгледа запазения екземпляр и да отдели първоизточника от по-късни обяснения и спекулации."
   ],
   story_en:[
    "A printed broadsheet dated 14 April 1561 describes and depicts signs seen above Nuremberg.",
    "The item preserves a sixteenth-century account and interpretation; it is not an instrument record and does not identify a physical cause.",
    "Readers can inspect the surviving print while distinguishing the historical source from later explanations and speculation."
   ],
   references:[{name:"U.S. Department of War UAP records portal",url:"https://www.war.gov/ufo/"}]
  }
 }};
 const prior=normalizeCase(row("nuremberg-1561"));
 const first=buildArchive(existing,source([row("nuremberg-1561")]),catalog).archive.cases.find(c=>c.id===prior.id);
 assert.equal(first.title.bg,catalog.records["nuremberg-1561"].title_bg);
 assert.equal(first.summary.bg,catalog.records["nuremberg-1561"].summary_bg);
 assert.deepEqual(first.story.bg,catalog.records["nuremberg-1561"].story_bg);
 assert.equal(first.content_depth,"source-reviewed");
 assert.deepEqual(first.editorial_review.source_access_note,catalog.source_access_notice);
 assert.equal(first.status,prior.status);
 assert.equal(first.date,prior.date);
 assert.equal(first.lat,prior.lat);
 assert.equal(first.lng,prior.lng);
 assert.deepEqual(first.media,prior.media);
 assert.deepEqual(first.sources.filter(s=>s.type!=="editorial-reference"),prior.sources,"existing publisher references remain intact");
 assert.ok(first.sources.some(s=>s.url==="https://www.war.gov/ufo/"));
 const second=buildArchive({schema_version:1,cases:[first]},source([row("nuremberg-1561")]),catalog).archive.cases.find(c=>c.id===prior.id);
 assert.deepEqual(second,first,"fresh source import must reapply, not erase, reviewed copy");
});
test("BG-only annotation preserves licensed English and uses its own source-access note without adding references",()=>{
 const sourceAccess={
  bg:"Бележка за преводаческата партида: достъпността на всяка препратка не е проверявана повторно; всички връзки от издателя са запазени. Това описва обхвата на редакционната работа, а не достоверността на сведенията.",
  en:"Translation-batch note: reachability of each citation was not rechecked; all publisher links are retained. This describes editorial scope, not the truth of the account."
 };
 const catalog={schema_version:1,reviewed_at:"2026-11-01",source_access_notice:{
  bg:"Обща пакетна бележка от първата редакционна партида не трябва да замества специфичното съобщение на този запис; всички източникови връзки се запазват, а наличността им не се предполага.",
  en:"This general access notice from the first editorial batch must not replace this record's own notice; source links remain, and link availability is not inferred."
 },records:{
  "nuremberg-1561":{
   reviewed_at:"2026-11-02",
   title_bg:"Нюрнбергската брошура от 1561 г.",
   summary_bg:"Печатната брошура от 1561 г. описва небесни знаци над Нюрнберг и запазва историческо свидетелство, а не инструментален запис.",
   story_bg:[
    "На 14 април 1561 г. в Нюрнберг е отпечатана брошура с текст и дърворезба за небесни форми над града.",
    "Този превод предава описанието и тълкуването, записани в английския източник, без да добавя ново обяснение за видяното.",
    "Читателят може да разгледа запазения исторически разказ, като отделя източника от по-късните интерпретации."
   ],
   references:[],source_access_note:sourceAccess
  }
 }};
 const prior=normalizeCase(row("nuremberg-1561"));
 const result=buildArchive(existing,source([row("nuremberg-1561")]),catalog).archive.cases.find(c=>c.id===prior.id);
 assert.deepEqual(result.story.en,prior.story.en);
 assert.deepEqual(result.sources,prior.sources);
 assert.equal(result.source.url,prior.source.url);
 assert.deepEqual(result.editorial_review.source_access_note,sourceAccess);
 assert.equal(result.editorial_review.existing_editorial_review,"licensed-secondary-summary; independent fact-check pending","existing editorial-review wording must survive the access-note overlay");
 assert.equal(result.editorial_review.reviewed_at,"2026-11-02","record date overrides the catalog's first-batch date");
 const invalidPublisherRecords=[
  {...prior,source:undefined,source_url:undefined},
  {...prior,source:{...prior.source,url:"https://example.org/cases/nuremberg-1561"}},
  {...prior,source:{...prior.source,url:"https://disclosure.zone/cases/different-record"}},
  {...prior,source:{...prior.source,url:"https://user:secret@disclosure.zone/cases/nuremberg-1561"}},
  {...prior,source:{...prior.source,url:"https://disclosure.zone:444/cases/nuremberg-1561"}},
  {...prior,source:{...prior.source,url:"https://disclosure.zone/cases/nuremberg-1561?redirect=1"}},
  {...prior,source:{...prior.source,url:"https://disclosure.zone/cases/nuremberg-1561#fragment"}}
 ];
 for(const invalid of invalidPublisherRecords)
  assert.throws(()=>applyDisclosureZoneEditorialAnnotation(invalid,catalog),/lacks its licensed publisher source/);
});
test("unmatched source IDs cannot resolve inherited annotation properties",()=>{
 const editorial=JSON.parse(readFileSync(new URL("../data/disclosure-zone-editorial-annotations.json",import.meta.url),"utf8"));
 const archive=buildArchive(existing,source([row("constructor")]),editorial).archive;
 const imported=archive.cases.find(c=>c.id==="disclosure-constructor");
 assert.ok(imported);
 assert.equal(imported.title.bg,imported.title.en);
 assert.equal(imported.content_depth,"source-linked");
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
test("archived reviewed records remain untouched while truncated imports fail closed",()=>{
 const current=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8"));
 // A single fixture is valid only against a baseline without already-imported
 // disclosure.zone records. Keep the real 76-record shrink safeguard intact.
 const curated={...current,cases:current.cases.filter(c=>c.provenance?.source_url!==SOURCE_URL)};
 const result=buildArchive(curated,source([row("nuremberg-1561")]));
 assert.ok(result.archive.cases.length>=curated.cases.length);
 for(const c of curated.cases){
  const original=result.archive.cases.find(x=>x.id===c.id);
  assert.deepEqual(original,c,c.id+" should not change");
 }
 if(current.cases.length-curated.cases.length>=10)
  assert.throws(()=>buildArchive(current,source([row("nuremberg-1561")])),/Source shrank unexpectedly/);
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
