import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const url=p=>new URL("../"+p,import.meta.url);
const read=p=>readFileSync(url(p),"utf8");
const retired=[
 "sky.html","sky.js","functions/api/air-traffic.js",
 "tests/tera-sky-browser.test.mjs",".github/workflows/tera-sky-tests.yml"
];

test("aircraft radar page, API, polling code and radar-only CI are removed",()=>{
 for(const path of retired)assert.equal(existsSync(url(path)),false,path+" should be retired");
});

test("no public UI links to retired plane tracking and all surviving case/news links work",()=>{
 const html=["index.html","news.html","sources.html","countries.html","media.html","report.html","donate.html"];
 for(const path of html){
  const source=read(path);
  assert.doesNotMatch(source,/href\s*=\s*["']\/sky(?:\.html|\/)?["']/i,path+" links to retired radar");
  assert.doesNotMatch(source,/Авиационен радар|AIRCRAFT RADAR|OpenSky Network|adsb\.lol/i,path+" promotes retired radar");
 }
 const homepage=read("index.html");
 assert.match(homepage,/href="\/archive\.html" data-i18n="navArchive"/);
 assert.match(homepage,/id="worldAtlas"/);
 assert.match(homepage,/href="\/news\.html"/);
 const translation=read("subpage-i18n.js");
 assert.doesNotMatch(translation,/refreshSky|skyTitle|skyIntro|\/sky\.html/);
 for(const id of ["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ko"])
  assert.ok(translation.includes('"'+id+'"'),id+" remains translated");
});

test("bookmarked radar URLs redirect permanently to real sourced UAP country archive",()=>{
 const lines=read("_redirects").split("\n").map(x=>x.trim());
 for(const old of ["/sky","/sky/","/sky.html"])
  assert.ok(lines.some(x=>new RegExp("^"+old.replace(".","\\.")+"\\s+/countries\\.html\\s+301$").test(x)),old+" missing redirect");
 assert.match(read("_routes.json"),/"\/api\/\*"/);
});

test("standalone flight tests are not imported from surviving news tests",()=>{
 const feeds=read("tests/live-feeds.test.mjs");
 assert.doesNotMatch(feeds,/air-traffic\.js|fetchAdsbTraffic|normalizeTraffic|trafficRoute|adsb\.lol|OpenSky/);
 const workflow=read(".github/workflows/aurora-v1-checks.yml");
 assert.match(workflow,/tests\/retired-aircraft-radar\.test\.mjs/);
});
