import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applySourceCaseAnnotations,validateSourceCaseAnnotations} from "../scripts/source-case-annotations.mjs";
import {buildArchive,normalizeCase,SOURCE_URL} from "../scripts/sync-open-case-archive.mjs";
const read=name=>JSON.parse(readFileSync(new URL("../data/"+name,import.meta.url),"utf8"));
const catalog=read("source-case-annotations.json");
const cases=read("cases.json").cases;
const annotations=validateSourceCaseAnnotations(catalog);
const target=Object.keys(catalog.records);

test("every one of the 101 publicly sourced dossiers has substantive BG/EN narrative",()=>{
 assert.equal(cases.length,101);
 assert.equal(new Set(cases.map(x=>x.id)).size,101);
 assert.equal(target.length,10);
 for(const c of cases){
  assert.match(c.source?.url||"",/^https:\/\//,c.id);
  for(const lang of ["bg","en"]){
   assert.ok(Array.isArray(c.story?.[lang])&&c.story[lang].length>=3,c.id+" missing "+lang);
   assert.ok(c.story[lang].join(" ").length>=600,c.id+" thin "+lang);
  }
 }
});
test("all source-reviewed imported stories match their durable sidecar and have official attribution",()=>{
 for(const id of target){
  const c=cases.find(x=>x.id===id),note=catalog.records[id];
  assert.ok(c&&note,id);
  assert.equal(c.provenance.source_url,SOURCE_URL);
  assert.deepEqual(c.story.bg,note.story_bg);
  assert.deepEqual(c.story.en,note.story_en);
  assert.equal(c.summary.bg,note.summary_bg);
  assert.equal(c.title.bg,note.title_bg);
  assert.equal(c.content_depth,"source-reviewed");
  assert.ok(c.sources.length>=1);
  for(const ref of note.references)assert.ok(c.sources.some(s=>s.url===ref.url),id+" citation "+ref.url);
 }
});
test("importer reapplies the published narrative on fresh source refresh without changing evidence data",()=>{
 const id="aaro-eglin-uap-case",asset="https://www.uap-archive.org/uap/records/aaro-eglin-uap/";
 const source={license:"Creative Commons Attribution 4.0 (CC BY 4.0)",cases:[{
  id,designation:"Eglin UAP",kind:"aaro-resolved",
  incidentDates:["2023-01-26"],incidentLocations:["Florida, U.S."],
  card:{en:{apparent:"A test-only short description of a pilot's observation near Eglin Air Force Base.",assessed:"Very likely a balloon."}},
  assets:[{type:"archive",label:"Archived report",url:asset}]
 }]};
 const existing={schema_version:1,cases:[]};
 const once=buildArchive(existing,source).archive.cases[0];
 const twice=buildArchive({schema_version:1,cases:[once]},source).archive.cases[0];
 assert.deepEqual(twice,once,"no loss of editorial copy on repeated source sync");
 assert.deepEqual(once.story.bg,catalog.records["uap-archive-"+id].story_bg);
 assert.deepEqual(once.story.en,catalog.records["uap-archive-"+id].story_en);
 assert.equal(once.media.length,1);
 assert.equal(once.media[0].url,asset);
 assert.ok(once.date==="2023-01-26");
 assert.equal(once.provenance.source_record_id,id);
 const generated=normalizeCase(source.cases[0]);
 assert.equal(once.lat,generated.lat,"editorial overlay preserves source-only location handling");
 assert.equal(once.lng,generated.lng,"editorial overlay preserves source-only location handling");
 assert.deepEqual(once.map_anchor,generated.map_anchor);
 assert.equal(once.status,"explained");
 assert.equal(once.content_depth,"source-reviewed");
});
test("annotations cannot replace reports from another source or private reports",()=>{
 const input={id:"uap-archive-aaro-eglin-uap-case",private:true,
  source:{url:"https://example.org"},provenance:{source_url:SOURCE_URL,source_record_id:"aaro-eglin-uap-case"}};
 assert.equal(applySourceCaseAnnotations(input,annotations),input);
 const mismatched={...input,private:false,provenance:{source_url:"https://example.org",source_record_id:"aaro-eglin-uap-case"}};
 assert.equal(applySourceCaseAnnotations(mismatched,annotations),mismatched);
 const changed={...input,private:false,provenance:{source_url:SOURCE_URL,source_record_id:"another-id"}};
 assert.equal(applySourceCaseAnnotations(changed,annotations),changed);
});
test("curation sidecar rejects unsafe source URLs and attempts to override incident facts",()=>{
 const original=catalog.records[target[0]];
 const changed={...catalog,records:{[target[0]]:{...original,references:[{name:"Untrusted resource",url:"https://example.com/injected"}]}}};
 assert.throws(()=>validateSourceCaseAnnotations(changed),/Unattributed or unsafe/);
 const tampered={...catalog,records:{[target[0]]:{...original,lat:1,lng:2}}};
 assert.throws(()=>validateSourceCaseAnnotations(tampered),/Annotations cannot override/);
});

test("unchanged official video URLs retain already verified on-site playback after source refresh",()=>{
 const prior=cases.find(c=>c.id==="uap-archive-northeastern-orb-sightings");
 const original=prior.media.find(m=>m.type==="video"&&m.playback?.rights_status==="verified");
 assert.ok(original,"fixture must contain a source-verified video");
 const entry={id:"northeastern-orb-sightings",designation:"Northeastern Orb Sighting",kind:"pursue-cluster",
  incidentDates:["2026"],incidentLocations:["Northeastern United States"],
  card:{en:{apparent:"A sample source description for the published northeastern orb reports."}},
  assets:[{type:"video",label:"Approved clip",url:original.url},
   {type:"video",label:"New unreviewed clip",url:"https://media.uap-archive.org/pursue/new-clip.mp4"}]};
 const src={license:"Creative Commons Attribution 4.0 (CC BY 4.0)",cases:[entry]};
 const refreshed=buildArchive({schema_version:1,cases:[prior]},src).archive.cases[0];
 const retained=refreshed.media.find(m=>m.url===original.url);
 const newlyAdded=refreshed.media.find(m=>m.url.includes("new-clip"));
 assert.deepEqual(retained.playback,original.playback,"reviewed source permission must survive sync");
 assert.equal(newlyAdded.playback,undefined,"new media is link-only pending rights review");
 assert.equal(refreshed.media.length,2);
 const changed={...entry,assets:[{type:"video",label:"Changed URL",url:"https://media.uap-archive.org/pursue/changed-clip.mp4"}]};
 const changedResult=buildArchive({schema_version:1,cases:[prior]},{...src,cases:[changed]}).archive.cases[0];
 assert.equal(changedResult.media[0].playback,undefined,"changed source URL loses prior authorization");
});
test("unverified or unrelated playback data never propagates during import",()=>{
 const prior=cases.find(c=>c.id==="uap-archive-northeastern-orb-sightings");
 const original=prior.media.find(m=>m.type==="video"&&m.playback);
 const invalid={...prior,media:[{...original,playback:{...original.playback,rights_status:"pending"}}]};
 const source={license:"Creative Commons Attribution 4.0 (CC BY 4.0)",cases:[{
   id:"northeastern-orb-sightings",designation:"Northeastern Orb Sighting",kind:"pursue-cluster",
   card:{en:{apparent:"Test source record with a single published video URL for safe playback verification."}},
   assets:[{type:"video",label:"Source video",url:original.url}]
 }]};
 const refreshed=buildArchive({schema_version:1,cases:[invalid]},source).archive.cases[0];
 assert.equal(refreshed.media[0].playback,undefined,"rights_status=pending is insufficient");
});
