import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("home retains sourced atlas and archive, with no duplicate demo Mission Control",()=>{
  const html=read("index.html");
  for(const id of ["control","controlTabs","caseGlobe","globeCaseList","globePins"]){
    assert.doesNotMatch(html,new RegExp('id="'+id+'"'));
  }
  assert.doesNotMatch(html,/data-control-nav|mission-control\.js|mission-control\.css|src="globe\.js"|href="globe\.css"/);
  for(const id of ["worldAtlas","worldMapCanvas","worldMapPins","homeNewsGrid","reportGrid","submitObservation"]){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/href="\/archive\.html" class="button button-primary"/);
  assert.doesNotMatch(html,/<dialog[^>]+id="(?:reportDialog|caseDialog)"/);
  assert.doesNotMatch(read("script.js"),/const cases\s*=\s*\[/);
});

test("report action is prominent and truthful while submit stays gated",()=>{
  const home=read("index.html"),report=read("report.html"),js=read("report.js");
  assert.match(home,/id="homeReportTitle" data-i18n="reportButton"/);
  assert.match(home,/class="home-report-note" data-i18n="reportDraftNote"/);
  assert.match(home,/class="home-report-cta-link"/);
  assert.match(home,/id="openIntakeCenter"/);
  const notes=read("script.js").match(/const reportDraftNotes=\{([\s\S]*?)\};/)?.[1]||"";
  const langs=[...notes.matchAll(/^\s*(?:"([^"]+)"|([a-z]{2})):\s*/gm)].map(x=>x[1]||x[2]);
  assert.equal(new Set(langs).size,18);
  assert.match(report,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(report,/id="sendReport" disabled/);
  assert.match(js,/state\.accepting!==true/);
});

test("country-specific reports route to same safe draft form",()=>{
  assert.match(read("country.html"),/id="reportLink"[^>]+href="\/report\.html"/);
  assert.match(read("country.js"),/el\("reportLink"\)\.href="\/report\.html\?country="\+code/);
  assert.match(read("index.html"),/href="\/report\.html" data-i18n="reportButton" id="openIntakeCenter"/);
});
