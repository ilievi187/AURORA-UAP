import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildArchive,normalizeCase,sourceCountry,sourceDate,SOURCE_URL} from "../scripts/sync-open-case-archive.mjs";

const raw=(id,name="Colorado Springs UAP Incident")=>({
 id,designation:name,kind:"pursue-cluster",
 card:{status:"open",en:{apparent:"Documents describing a published observation; no further findings are provided."}},
 assets:[{type:"document",label:"Original release",url:"https://media.uap-archive.org/pursue-docs/example.pdf"}],
 incidentDates:["February, 2022"],incidentLocations:["Colorado Springs, Colorado, U.S."]
});
const source={license:"U.S. government works; Creative Commons Attribution 4.0 (CC BY 4.0)",cases:[
 raw("colorado-springs-2022"),raw("western-us-event","Western US Event")
]};
const curated={schema_version:1,cases:[{id:"nimitz-2004",title:{en:"Nimitz Encounter"},source:{url:"https://www.defense.gov/"}}]};

test("publisher case metadata maps to a sourced archive entry without inventing coordinates",()=>{
 const c=normalizeCase(raw("colorado-springs-2022"));
 assert.equal(c.id,"uap-archive-colorado-springs-2022");
 assert.equal(c.country,"US");
 assert.equal(c.date,"2022");
 assert.equal(c.date_precision,"year");
 assert.equal(c.lat,null);
 assert.equal(c.lng,null);
 assert.equal(c.provenance.source_url,SOURCE_URL);
 assert.equal(c.provenance.license,"CC BY 4.0");
 assert.ok(c.summary.bg.length>=45&&c.summary.en.length>=45);
 assert.ok(c.media.every(x=>x.url.startsWith("https://")));
 assert.ok(c.story.bg.length&&c.story.en.length);
});

test("source-only location data determines country; ambiguous global case remains unmapped",()=>{
 assert.equal(sourceCountry(raw("s","Western US Event")), "US");
 assert.equal(sourceCountry({incidentLocations:["Unknown area"]}),"");
 assert.equal(sourceCountry({incidentLocations:["Near Mt. Etna, Italy"]}),"IT");
 assert.equal(sourceDate({incidentDates:[]}).date,"undated");
 assert.equal(sourceDate({incidentDates:["2022-08-16"]}).date,"2022-08-16");
 const c=normalizeCase({...raw("missing-location"),incidentLocations:[],incidentDates:[]});
 assert.equal(c.country,"");
 assert.equal(c.date,"undated");
 assert.equal(c.lat,null);
});

test("existing editorial archive is never removed, and repeated sync is idempotent",()=>{
 const first=buildArchive(curated,source);
 assert.equal(first.archive.cases.length,3);
 assert.equal(first.report.existing_curated,1);
 const second=buildArchive(first.archive,source);
 assert.deepEqual(second.archive,first.archive);
 assert.deepEqual(second.report,first.report);
});

test("alias-based dedup removes known AARO case without altering curated version",()=>{
 const input={...source,cases:[...source.cases,raw("aaro-gofast-case","Go Fast")]};
 const current={...curated,cases:[...curated.cases,{id:"gofast-2015",title:{en:"GOFAST"},source:{url:"https://www.aaro.mil/"}}]};
 const output=buildArchive(current,input);
 assert.equal(output.archive.cases.filter(x=>x.id==="gofast-2015").length,1);
 assert.equal(output.archive.cases.some(x=>x.id==="uap-archive-aaro-gofast-case"),false);
});

test("license and suspicious upstream data are rejected closed",()=>{
 assert.throws(()=>buildArchive(curated,{license:"private",cases:source.cases}),/license/);
 assert.throws(()=>buildArchive(curated,{license:source.license,cases:[]}),/source case/);
 assert.throws(()=>buildArchive(curated,{license:source.license,cases:[{designation:"invalid"}]}),/No importable/);
 const first=buildArchive(curated,{...source,cases:[...source.cases,raw("third-case","Third event"),raw("fourth-case","Fourth event"),raw("fifth-case","Fifth event"),raw("sixth-case","Sixth event"),raw("seventh-case","Seventh event"),raw("eighth-case","Eighth event"),raw("ninth-case","Ninth event"),raw("tenth-case","Tenth event"),raw("eleventh-case","Eleventh event"),raw("twelfth-case","Twelfth event")]});
 assert.throws(()=>buildArchive(first.archive,{...source,cases:[source.cases[0]]}),/shrank/);
});

test("unsafe media are rejected; local paths only resolve against the approved archive host",()=>{
 const item=normalizeCase({...raw("blocked-media"),assets:[
  {type:"video",label:"bad",url:"javascript:alert(1)"},
  {type:"document",label:"rogue",url:"https://other.example/file"},
  {type:"video",label:"ok",url:"/uap/docs/sample.pdf"}
 ]});
 assert.equal(item.media.length,1);
 assert.equal(item.media[0].url,"https://www.uap-archive.org/uap/docs/sample.pdf");
});

test("repository baseline is compatible with generated records and public display views",()=>{
 const dataset=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8"));
 const {archive,report}=buildArchive(dataset,source);
 assert.equal(archive.cases.length,dataset.cases.length+2);
 assert.equal(report.generated,2);
 for(const c of archive.cases.filter(x=>x.provenance?.source_url===SOURCE_URL)){
  assert.equal(c.lat,null);
  assert.equal(c.lng,null);
  assert.ok(c.source?.url?.startsWith("https://"));
 }
});