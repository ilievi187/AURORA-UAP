import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(file)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("homepage replaces fictional case cards and dialogs with one sourced archive route",()=>{
  const html=read("index.html");
  const script=read("script.js");
  const mission=read("mission-control.js");
  const feed=html.match(/<div class="console-feed">([\s\S]*?)<\/div>\s*<\/section>/)?.[1];
  assert.ok(feed,"Mission Control keeps a small archive-navigation region");
  assert.match(feed,/id="controlCaseButtons"/);
  assert.match(feed,/href="\/archive\.html"/);
  assert.doesNotMatch(feed,/DEMO|ДЕМО|ПРИМЕРНИ ДОСИЕТА|href="#reports"/i);
  assert.doesNotMatch(html,/<dialog[^>]+id="(?:reportDialog|caseDialog)"/);
  assert.doesNotMatch(script,/const cases\s*=\s*\[/,"fictional sample records and coordinates are removed");
  assert.doesNotMatch(script,/report-(?:triangle|ocean|infrared|orbs)\.webp/);
  assert.doesNotMatch(mission,/function renderFeed|typeof cases|feedLabel|feedIntro/);
});

test("country report route uses the canonical local-draft page without enabling intake",()=>{
  const country=read("country.html");
  const countryScript=read("country.js");
  const report=read("report.html");
  const reportScript=read("report.js");
  const home=read("index.html");
  assert.match(country,/id="reportLink"[^>]+href="\/report\.html"/);
  assert.match(countryScript,/el\("reportLink"\)\.href="\/report\.html\?country="\+code/);
  assert.match(home,/href="\/report\.html" data-i18n="reportButton" id="openIntakeCenter"/);
  assert.match(home,/class="footer-report-note" data-i18n="reportDraftNote"/);
  const notes=read("script.js").match(/const reportDraftNotes=\{([\s\S]*?)\};/)?.[1]||"";
  const locales=[...notes.matchAll(/^\s*(?:"([^"]+)"|([a-z]{2})):\s*/gm)].map(match=>match[1]||match[2]);
  assert.equal(new Set(locales).size,18,"the safe local-draft disclosure covers all 18 locales");
  assert.match(report,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(report,/id="sendReport" disabled/);
  assert.match(reportScript,/state\.accepting!==true/);
});
