import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(f)=>readFileSync(new URL("../"+f,import.meta.url),"utf8");
const pages=["index.html","archive.html","countries.html","country.html","donate.html","dossier.html","media.html","news.html","news-editor.html","report.html","sources.html"];
const finalSkin=page=>page==="index.html"?"/atlas-density.css?v=density-20261105":["donate.html","report.html"].includes(page)?"/launch-cta-spotlight.css?v=launch-20261105":page==="news.html"?"/news-portal.css":page==="news-editor.html"?"/news-editor.css":"/aurora-editorial-interiors.css";
test("all pages share base tokens and interiors layer their unique editorial skin",()=>{
 const css=read("aurora-design-refresh.css");assert.match(css,/--aurora-border/);assert.match(css,/prefers-reduced-motion:reduce/);
 for(const page of pages){const html=read(page);const styles=[...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(m=>m[1]);assert.equal(styles.at(-1),finalSkin(page),page);
  if(page==="index.html"){
   assert.ok(styles.indexOf("/aurora-silence.css")<styles.indexOf("/home-portal.css"),"portal layer follows the approved homepage art direction");
   assert.equal(styles.at(-2),"/launch-cta-spotlight.css?v=launch-20261105","existing hero action design remains immediately before the atlas-only layer");
  }
  assert.ok(styles.includes("/aurora-design-refresh.css"),page+" must preserve shared tokens");
  if(page!=="index.html")assert.ok(styles.includes("/aurora-black-pages.css"),page+" keeps black base");}
});
test("retired demo UI removed while world atlas, report entry, media and language remain",()=>{
 const html=read("index.html");
 for(const key of ['id="historicDemoMap"','id="mapPins"','class="prototype-notice"','class="data-hub"','class="feature-grid"','class="signal-ribbon"','id="reportDialog"','id="caseDialog"'])assert.ok(!html.includes(key),key+" removed");
 for(const key of ['id="worldAtlas"','id="worldMapPins"','id="homeNewsGrid"','id="submitObservation"','id="homeReportTitle"','id="reportGrid"','id="languageGate"'])assert.ok(html.includes(key),key+" kept");
 for(const key of ['id="control"','id="controlTabs"','id="caseGlobe"','data-control-nav'])assert.ok(!html.includes(key),key+" removed");
});
test("homepage archive-first CTA, navigation labels, and abandoned demo guard",()=>{
 const html=read("index.html"),script=read("script.js");
 assert.match(html,/href="\/archive\.html" class="button button-primary"/);
 assert.match(html,/data-portal="media" href="\/media\.html"/);
 assert.match(html,/class="button button-secondary hero-report-cta"/);
 assert.match(html,/data-i18n="heroArchiveCTA"/);assert.match(script,/premiumNavLabels/);
 assert.match(script,/if\(!container\)return/);assert.match(script,/\$\('#tooltipRead'\)\?\.addEventListener/);
 for(const key of ["navArchive","navMedia","heroArchiveCTA"])assert.match(script,new RegExp(key+":"));
});
