import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import "../dossier-document-preview.js";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const cases=JSON.parse(read("data/cases.json")).cases;
const featured=[
 "disclosure-six-spheres-2025",
 "disclosure-eastern-mediterranean-2024",
 "disclosure-north-aegean-2023",
 "disclosure-iraq-2022",
 "disclosure-colorado-springs-2022",
 "disclosure-persian-gulf-2020",
 "disclosure-san-diego-drones-2019"
];

test("seven archival investigations have substantial factual Bulgarian narratives, not generic filler",()=>{
 assert.equal(cases.length,101);
 assert.deepEqual(cases.filter(c=>c.content_depth==="sourced-feature").map(c=>c.id).sort(),featured.slice().sort());
 for(const id of featured){
  const c=cases.find(x=>x.id===id);
  assert.ok(c,id);
  assert.equal(c.story.bg.length,7,id+" seven coherent chapters");
  assert.ok(c.story.bg.every(p=>p.length>=155),id+" no one-line filler");
  assert.ok(c.story.bg.join(" ").length>=1700,id+" genuinely long-form source story");
  assert.ok(c.summary.bg.length>=250,id+" complete source-attributed Bulgarian abstract");
  assert.ok(c.title.bg.length>12&&c.title.bg!==c.title.en,id+" has a meaningful BG title");
  assert.ok(!c.story.bg.some(p=>/^EN\s*[·:]/.test(p)||/не доказва извънземен/i.test(p)),id+" must not use legacy EN/BG boilerplate");
  assert.ok(c.story.en.length>=5,id+" original source English remains intact");
  assert.ok(c.timeline.length>=2,id+" chronological source trail");
  const known=new Set([c.source.url,...(c.sources||[]).map(x=>x.url),...(c.media||[]).map(x=>x.url)]);
  for(const t of c.timeline){
   assert.ok(t.title.bg&&t.title.en&&t.description.bg&&t.description.en,id+" chronology bilingual");
   assert.ok(/^\d{4}(?:-\d{2}){0,2}$/.test(t.date),id+" date original granularity");
   assert.ok(known.has(t.source_url),id+" every timeline event links to an actual listed source");
  }
 }
});

test("featured stories preserve the original place, source videos and redactions",()=>{
 const unknown=cases.find(c=>c.id==="disclosure-six-spheres-2025");
 assert.equal(unknown.lat,null);
 assert.equal(unknown.lng,null);
 const withVideos=featured.map(id=>cases.find(c=>c.id===id))
  .filter(c=>c.media.some(m=>m.type==="video"));
 assert.ok(withVideos.length>=5,"substantial portion has playable source material");
 const original15=cases.filter(c=>c.content_depth==="editorial");
 assert.equal(original15.length,15,"keep the 15 prior curated originals unchanged");
});

test("in-page PDF reader accepts only official published PDF sources with click-to-load",()=>{
 const p=globalThis.AURORA_DOCUMENT_PREVIEW;
 assert.ok(p&&typeof p.open==="function"&&typeof p.close==="function");
 assert.equal(p.sourcePdf("https://www.war.gov/medialink/ufo/release_1/example.pdf"),
  "https://www.war.gov/medialink/ufo/release_1/example.pdf");
 assert.equal(p.sourcePdf("https://www.secnav.navy.mil/foia/readingroom/file.pdf"),
  "https://www.secnav.navy.mil/foia/readingroom/file.pdf");
 for(const unsafe of ["javascript:alert(1)","http://www.war.gov/secret.pdf",
  "https://evil.example/hidden.pdf","https://www.war.gov.evil.example/report.pdf",
  "https://www.war.gov/report.html","https://www.war.gov:444/report.pdf"]){
  assert.equal(p.sourcePdf(unsafe),null,"reader must reject "+unsafe);
 }
 for(const lang of ["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ko"])
  assert.ok(p.words(lang)[0]&&p.words(lang)[2],lang+" source reader labels");
 const html=read("dossier.html"),js=read("dossier.js");
 assert.match(html,/dossier-document-preview\.js/);
 assert.match(html,/id="caseDocumentFrameHost"/);
 assert.doesNotMatch(html,/<iframe\b/,"no iframe exists until visitor clicks");
 assert.match(js,/AURORA_DOCUMENT_PREVIEW/);
 assert.match(js,/case-media-preview/);
 assert.match(read("dossier-document-preview.js"),/host\.replaceChildren\(iframe\)/);
 assert.match(read("dossier-document-preview.js"),/host\.replaceChildren\(\)/);
});
