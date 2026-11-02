import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {isLegacyPlaceholder} from "../archive-localization.js";
import {applyDisclosureZoneEditorialAnnotations,validateDisclosureZoneEditorialAnnotations} from "../scripts/disclosure-zone-editorial-annotations.mjs";
const cases=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8")).cases;
const catalogPath=new URL("../data/disclosure-zone-editorial-annotations.json",import.meta.url);
const LEGACY_EDITORIAL_REVIEW="licensed-secondary-summary; independent fact-check pending";
const BATCH_ONE_IDS=[
 "disclosure-test-site-2023","disclosure-ghost-rockets-1946","disclosure-mantell-1948",
 "disclosure-lubbock-lights-1951","disclosure-tremonton-1952","disclosure-socorro-1964",
 "disclosure-himalaya-1968","disclosure-conde-1963","disclosure-newfoundland-1955","disclosure-russell-1955"
];
const BATCH_TWO_IDS=[
 "disclosure-virginia-2024","disclosure-east-coast-drones-2024","disclosure-western-us-2023",
 "disclosure-balloon-2023","disclosure-colorado-drones-2019","disclosure-mosul-orb-2016",
 "disclosure-stephenville-2008","disclosure-aguadilla-2013","disclosure-ladakh-2012","disclosure-hangzhou-2010"
];

test("M1 batch one preserves ten BG narratives and prior editorial metadata",()=>{
 assert.equal(BATCH_ONE_IDS.length,10);
 assert.ok(existsSync(catalogPath),"durable disclosure.zone editorial sidecar exists");
 const catalog=validateDisclosureZoneEditorialAnnotations(JSON.parse(readFileSync(catalogPath,"utf8")));
 assert.deepEqual(Object.keys(catalog.source_access_notice).sort(),["bg","en"],"batch-level access notice is localized");
 assert.ok(catalog.source_access_notice.bg.includes("403"),"Bulgarian notice identifies the observed HTTP access failure");
 assert.ok(catalog.source_access_notice.en.includes("403"),"English notice identifies the observed HTTP access failure");
 assert.match(catalog.source_access_notice.bg,/пакет от десет досиета/);
 assert.match(catalog.source_access_notice.bg,/не установява кои конкретни връзки са засегнати/);
 assert.match(catalog.source_access_notice.en,/Batch-wide note for the ten dossiers/);
 assert.match(catalog.source_access_notice.en,/does not identify which individual links were affected/);
 const enrichedCases=applyDisclosureZoneEditorialAnnotations({schema_version:1,cases},catalog).cases;
 assert.equal(cases.filter(c=>isLegacyPlaceholder(c,"bg")).length,48,"main has 48 legacy placeholders after both batches");
 for(const id of BATCH_ONE_IDS){
  const original=cases.find(c=>c.id===id);
  assert.ok(original,id+" exists in the public archive");
  assert.equal(isLegacyPlaceholder(original,"bg"),false,id+" no longer presents boilerplate as native BG");
  const sourceId=original.provenance?.source_record_id;
  const note=catalog.records[sourceId];
  assert.ok(note,id+" has a durable editorial note matched by source record ID");
  assert.equal(note.existing_editorial_review,LEGACY_EDITORIAL_REVIEW,id+" records the prior editorial caveat verbatim");
  const enriched=enrichedCases.find(c=>c.id===id);
  assert.deepEqual(enriched,original,id+" remains unchanged when the sidecar is applied a second time");
  assert.equal(isLegacyPlaceholder(enriched,"bg"),false,id+" receives authored BG prose");
  assert.equal(enriched.title.bg,note.title_bg,id+" has a translated title");
  assert.equal(enriched.summary.bg,note.summary_bg,id+" has a substantive BG summary");
  assert.deepEqual(enriched.story.bg,note.story_bg,id+" stores the exact reviewed BG narrative");
  assert.deepEqual(enriched.story.en,note.story_en,id+" stores the exact edited EN narrative");
  assert.deepEqual(enriched.editorial_review.source_access_note,catalog.source_access_notice,id+" carries the batch-level access caveat");
  assert.equal(enriched.editorial_review.existing_editorial_review,LEGACY_EDITORIAL_REVIEW,id+" preserves the existing editorial caveat");
  assert.ok(enriched.story.bg.length>=3&&enriched.story.bg.every(p=>p.trim().length>=75),id+" has substantive BG paragraphs");
  assert.ok(enriched.story.en.length>=3&&enriched.story.en.every(p=>p.trim().length>=75),id+" retains a substantive EN narrative");
  for(const field of ["date","date_precision","lat","lng","location_precision","country","city","category","status","media","source","provenance"])
   assert.deepEqual(enriched[field],original[field],id+" preserves source-owned "+field);
  for(const ref of note.references)assert.ok(enriched.sources.some(s=>s.url===ref.url),id+" attributes "+ref.url);
 }
});

test("M1 batch two keeps ten BG narratives source-preserving and idempotent",()=>{
 assert.equal(BATCH_TWO_IDS.length,10);
 const catalog=validateDisclosureZoneEditorialAnnotations(JSON.parse(readFileSync(catalogPath,"utf8")));
 assert.equal(cases.filter(c=>isLegacyPlaceholder(c,"bg")).length,48,"main has 48 placeholders after two batches");
 const sharedAccessNote=catalog.records["virginia-2024"]?.source_access_note;
 assert.ok(sharedAccessNote,"batch two has a localized translation-scope notice");
 assert.match(sharedAccessNote.bg,/преводаческата партида/);
 assert.match(sharedAccessNote.bg,/не е проверявана повторно/);
 assert.doesNotMatch(sharedAccessNote.bg,/403|недостъп/i,"the translation batch does not claim a specific link failed");
 assert.match(sharedAccessNote.en,/Translation-batch note/);
 assert.match(sharedAccessNote.en,/not rechecked/);
 assert.doesNotMatch(sharedAccessNote.en,/403|inaccessible/i,"the translation batch does not claim a specific link failed");
 const enrichedCases=applyDisclosureZoneEditorialAnnotations({schema_version:1,cases},catalog).cases;
 for(const id of BATCH_TWO_IDS){
  const original=cases.find(c=>c.id===id);
  assert.ok(original,id+" exists in the public archive");
  assert.equal(isLegacyPlaceholder(original,"bg"),false,id+" no longer presents boilerplate as native BG");
  const sourceId=original.provenance?.source_record_id,note=catalog.records[sourceId];
  assert.ok(note,id+" has a durable editorial note matched by source record ID");
  assert.equal(note.existing_editorial_review,LEGACY_EDITORIAL_REVIEW,id+" records the prior editorial caveat verbatim");
  assert.deepEqual(note.source_access_note,sharedAccessNote,id+" shares the batch-level notice without per-link claims");
  assert.equal(Object.hasOwn(note,"story_en"),false,id+" leaves the licensed English story untouched");
  assert.deepEqual(note.references,[],id+" does not invent or duplicate source references");
  const enriched=enrichedCases.find(c=>c.id===id);
  assert.deepEqual(enriched,original,id+" remains unchanged when the sidecar is applied a second time");
  assert.equal(isLegacyPlaceholder(enriched,"bg"),false,id+" receives authored BG prose");
  assert.deepEqual(enriched.story.bg,note.story_bg,id+" stores the reviewed BG narrative");
  assert.deepEqual(enriched.story.en,original.story.en,id+" preserves the original EN story");
  assert.deepEqual(enriched.sources,original.sources,id+" preserves all original citations");
  assert.deepEqual(enriched.source,original.source,id+" preserves the licensed publisher link");
  assert.deepEqual(enriched.editorial_review.source_access_note,note.source_access_note,id+" carries its own batch access note");
  assert.equal(enriched.editorial_review.existing_editorial_review,LEGACY_EDITORIAL_REVIEW,id+" preserves the prior editorial caveat");
  assert.equal(note.reviewed_at,"2026-11-02",id+" records the BG editorial review date");
  assert.equal(enriched.editorial_review.reviewed_at,note.reviewed_at,id+" materializes its own editorial review date");
  for(const field of ["date","date_precision","lat","lng","location_precision","country","city","category","status","media","provenance"])
   assert.deepEqual(enriched[field],original[field],id+" preserves source-owned "+field);
 }
 assert.equal(enrichedCases.filter(c=>isLegacyPlaceholder(c,"bg")).length,48,"batch two leaves 48 of 68 placeholders");
});

test("disclosure.zone editorial validator rejects unsafe references and source-fact overrides",()=>{
 assert.ok(existsSync(catalogPath),"durable disclosure.zone editorial sidecar exists");
 const catalog=JSON.parse(readFileSync(catalogPath,"utf8"));
 const id=Object.keys(catalog.records)[0],note=catalog.records[id];
 const missingAccessNotice={...catalog};delete missingAccessNotice.source_access_notice;
 assert.throws(()=>validateDisclosureZoneEditorialAnnotations(missingAccessNotice),/source-access notice/);
 const unsafe={...catalog,records:{[id]:{...note,references:[{name:"Injected source",url:"https://example.org/report.pdf"}]}}};
 assert.throws(()=>validateDisclosureZoneEditorialAnnotations(unsafe),/unsafe disclosure.zone editorial source/);
 const invalidReview={...catalog,records:{[id]:{...note,existing_editorial_review:17}}};
 assert.throws(()=>validateDisclosureZoneEditorialAnnotations(invalidReview),/preserved editorial-review text/);
 const impossibleRecordDate={...catalog,records:{[id]:{...note,reviewed_at:"2026-02-30"}}};
 assert.throws(()=>validateDisclosureZoneEditorialAnnotations(impossibleRecordDate),/per-record review date/);
 const impossibleCatalogDate={...catalog,reviewed_at:"2026-02-30"};
 assert.throws(()=>validateDisclosureZoneEditorialAnnotations(impossibleCatalogDate),/Invalid disclosure.zone editorial catalog/);
 const tampered={...catalog,records:{[id]:{...note,lat:1,lng:2}}};
 assert.throws(()=>validateDisclosureZoneEditorialAnnotations(tampered),/cannot override/);
});
