import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {isLegacyPlaceholder} from "../archive-localization.js";
import {applyDisclosureZoneEditorialAnnotations,validateDisclosureZoneEditorialAnnotations} from "../scripts/disclosure-zone-editorial-annotations.mjs";
const cases=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8")).cases;
const catalogPath=new URL("../data/disclosure-zone-editorial-annotations.json",import.meta.url);
const BATCH_ONE_IDS=[
 "disclosure-test-site-2023","disclosure-ghost-rockets-1946","disclosure-mantell-1948",
 "disclosure-lubbock-lights-1951","disclosure-tremonton-1952","disclosure-socorro-1964",
 "disclosure-himalaya-1968","disclosure-conde-1963","disclosure-newfoundland-1955","disclosure-russell-1955"
];

test("M1 batch one replaces ten identified BG placeholders and preserves source-owned fields",()=>{
 assert.equal(BATCH_ONE_IDS.length,10);
 assert.ok(existsSync(catalogPath),"durable disclosure.zone editorial sidecar exists");
 const catalog=validateDisclosureZoneEditorialAnnotations(JSON.parse(readFileSync(catalogPath,"utf8")));
 const enrichedCases=applyDisclosureZoneEditorialAnnotations({schema_version:1,cases},catalog).cases;
 assert.equal(cases.filter(c=>isLegacyPlaceholder(c,"bg")).length,58,"batch one removes exactly ten of 68 legacy placeholders");
 for(const id of BATCH_ONE_IDS){
  const original=cases.find(c=>c.id===id);
  assert.ok(original,id+" exists in the public archive");
  assert.equal(isLegacyPlaceholder(original,"bg"),false,id+" no longer presents boilerplate as native BG");
  const sourceId=original.provenance?.source_record_id;
  const note=catalog.records[sourceId];
  assert.ok(note,id+" has a durable editorial note matched by source record ID");
  const enriched=enrichedCases.find(c=>c.id===id);
  assert.deepEqual(enriched,original,id+" remains unchanged when the sidecar is applied a second time");
  assert.equal(isLegacyPlaceholder(enriched,"bg"),false,id+" receives authored BG prose");
  assert.equal(enriched.title.bg,note.title_bg,id+" has a translated title");
  assert.equal(enriched.summary.bg,note.summary_bg,id+" has a substantive BG summary");
  assert.deepEqual(enriched.story.bg,note.story_bg,id+" stores the exact reviewed BG narrative");
  assert.deepEqual(enriched.story.en,note.story_en,id+" stores the exact edited EN narrative");
  assert.ok(enriched.story.bg.length>=3&&enriched.story.bg.every(p=>p.trim().length>=75),id+" has substantive BG paragraphs");
  assert.ok(enriched.story.en.length>=3&&enriched.story.en.every(p=>p.trim().length>=75),id+" retains a substantive EN narrative");
  for(const field of ["date","date_precision","lat","lng","location_precision","country","city","category","status","media","source","provenance"])
   assert.deepEqual(enriched[field],original[field],id+" preserves source-owned "+field);
  for(const ref of note.references)assert.ok(enriched.sources.some(s=>s.url===ref.url),id+" attributes "+ref.url);
 }
});

test("disclosure.zone editorial validator rejects unsafe references and source-fact overrides",()=>{
 assert.ok(existsSync(catalogPath),"durable disclosure.zone editorial sidecar exists");
 const catalog=JSON.parse(readFileSync(catalogPath,"utf8"));
 const id=Object.keys(catalog.records)[0],note=catalog.records[id];
 const unsafe={...catalog,records:{[id]:{...note,references:[{name:"Injected source",url:"https://example.org/report.pdf"}]}}};
 assert.throws(()=>validateDisclosureZoneEditorialAnnotations(unsafe),/unsafe disclosure.zone editorial source/);
 const tampered={...catalog,records:{[id]:{...note,lat:1,lng:2}}};
 assert.throws(()=>validateDisclosureZoneEditorialAnnotations(tampered),/cannot override/);
});
