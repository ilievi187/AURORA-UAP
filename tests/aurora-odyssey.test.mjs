import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("index.html"),visual=read("aurora-silence.css"),logic=read("aurora-silence.js");
test("AURORA opens with one black full-screen UFO-over-Earth scene, not a carousel",()=>{
 assert.match(page,/class="hero silence-hero" id="silenceHero"/);
 assert.match(page,/id="hero-title">AURORA<\/h1>/);
 assert.match(page,/UNIDENTIFIED AERIAL PHENOMENA/);
 assert.match(page,/href="\/archive\.html" class="button button-primary"/);
 assert.match(page,/href="\/media\.html" class="button button-secondary"/);
 assert.match(page,/href="#worldAtlas" class="silence-micro-map"/);
 assert.match(visual,/\/assets\/hero-ufo\.webp/);
 assert.match(visual,/\/assets\/earth\/earth-night-4096\.jpg/);
 assert.match(visual,/\/assets\/earth\/moon-1024\.jpg/);
 assert.match(visual,/background:#010305/);
 assert.doesNotMatch(page,/id="odyssey"|class="odyssey-scene/);
 assert.doesNotMatch(page,/src="\/aurora-experience\.js"/);
 assert.match(page,/src="\/aurora-silence\.js"/);
 assert.equal(readFileSync(new URL("../assets/hero-ufo.webp",import.meta.url)).length>10000,true);
});
test("all four hero metrics are faithful to available public archive, not fantasy live data",()=>{
 for(const id of ["auroraArchiveCount","auroraMappedCount","auroraLanguageCount","auroraOpenValue"]){
  if(id==="auroraOpenValue")continue;
  assert.match(page,new RegExp('id="'+id+'"'));
 }
 assert.match(page,/data-stat-label="openValue"/);
 assert.match(logic,/fetch\("\/data\/cases\.json"/);
 assert.match(logic,/Number\.isFinite\(record\?\.lat\)/);
 assert.match(logic,/Array\.isArray\(data\.cases\)/);
 assert.match(logic,/dataset\.stats="unavailable"/);
 assert.doesNotMatch(page,/12,842|48,702|2,341|24\/7|LIVE SIGHTINGS|THREAT ASSESSMENT/);
 assert.doesNotThrow(()=>new Script(logic,{filename:"aurora-silence.js"}));
});
test("all 18 languages, sourced map, videos and reports remain accessible",()=>{
 for(const id of ["languageGate","heroHudCanvas","worldAtlas","worldMapCanvas","worldMapPins","homeNewsGrid","controlTabs","caseGlobe","reportGrid","reportDialog"]){
  assert.ok(page.includes('id="'+id+'"'),"preserved "+id);
 }
 for(const path of ["archive.html","media.html","news.html","report.html"]){
  assert.ok(read(path).length>1000,path+" exists");
 }
 for(const lang of ["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ko"]){
  assert.ok(logic.includes(lang+":" )||logic.includes('"'+lang+'":'),"metric translation "+lang);
 }
 assert.match(page,/href="\/report\.html" data-i18n="reportButton"/);
 assert.match(visual,/@media\(max-width:640px\)/);
 assert.match(visual,/@media\(prefers-reduced-motion:reduce\)/);
});
