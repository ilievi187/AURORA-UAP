import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(f)=>readFileSync(new URL("../"+f,import.meta.url),"utf8");
const pages=["index.html","archive.html","countries.html","country.html","donate.html","dossier.html","media.html","news.html","report.html","sources.html"];
test("all public pages load the same shared style after local CSS",()=>{
 const css=read("aurora-design-refresh.css");assert.match(css,/--aurora-border/);assert.match(css,/prefers-reduced-motion:reduce/);
 for(const page of pages){const html=read(page);const styles=[...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(m=>m[1]);assert.equal(styles.at(-1),page==="index.html"?"/aurora-silence.css":"/aurora-black-pages.css",page);
  assert.ok(styles.includes("/aurora-design-refresh.css"),page+" must preserve shared tokens");}
});
test("retired demo UI removed while approved archive, globe, media and language remain",()=>{
 const html=read("index.html");
 for(const key of ['id="historicDemoMap"','id="mapPins"','class="prototype-notice"','class="data-hub"','class="feature-grid"','class="signal-ribbon"'])assert.ok(!html.includes(key),key+" removed");
 for(const key of ['id="worldAtlas"','id="worldMapPins"','id="homeNewsGrid"','id="controlTabs"','id="caseGlobe"','id="reportGrid"','id="languageGate"','id="reportDialog"','id="caseDialog"'])assert.ok(html.includes(key),key+" kept");
});
test("homepage archive-first CTA, navigation labels, and abandoned demo guard",()=>{
 const html=read("index.html"),script=read("script.js");
 assert.match(html,/href="\/archive\.html" class="button button-primary"/);
 assert.match(html,/href="\/media\.html" class="button button-secondary"/);
 assert.match(html,/data-i18n="heroArchiveCTA"/);assert.match(script,/premiumNavLabels/);
 assert.match(script,/if\(!container\)return/);assert.match(script,/\$\('#tooltipRead'\)\?\.addEventListener/);
 for(const key of ["navArchive","navMedia","heroArchiveCTA"])assert.match(script,new RegExp(key+":"));
});
