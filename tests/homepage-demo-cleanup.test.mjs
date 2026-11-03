import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("portal navigation copy is complete and authored for every interface locale",()=>{
  const sandbox={window:{}};
  runInNewContext(read("home-portal-i18n.js"),sandbox);
  const copy=sandbox.window.AURORA_PORTAL_COPY;
  const locales=["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ko"];
  const cards=["news","map","archive","media","report","about","support","search"];
  assert.deepEqual(Object.keys(copy).sort(),locales.sort());
  for(const locale of locales){
    assert.ok(copy[locale].heading&&copy[locale].intro&&copy[locale].navAbout&&copy[locale].navSupport&&copy[locale].submitNews,locale+" has localized portal chrome and news submission");
    for(const name of cards){
      const [title,description]=copy[locale].cards[name]||[];
      assert.ok(title?.trim()&&description?.trim(),locale+" has authored "+name+" copy");
    }
  }
});

test("homepage language control supports every configured locale",()=>{
  const html=read("index.html");
  const start=html.indexOf('<select class="lang-button lang-select" id="langToggle"');
  const bodyStart=html.indexOf(">",start)+1,bodyEnd=html.indexOf("</select>",bodyStart);
  const select=html.slice(bodyStart,bodyEnd);
  const options=[...select.matchAll(/<option value="([^"]+)"/g)].map(([,locale])=>locale);
  assert.equal(options.length,18);
  assert.equal(new Set(options).size,18);
  assert.ok(options.includes("ar")&&options.includes("ko"),"RTL and East Asian locales remain directly selectable");
});

test("homepage portal exposes every primary destination as a working link",()=>{
  const html=read("index.html");
  const section=html.match(/<section class="portal-hub"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section,"homepage includes a compact navigation dashboard");
  const destinations={
    news:"/news.html",map:"#worldAtlas",archive:"/archive.html",media:"/media.html",
    report:"/report.html",about:"#mission",support:"/donate.html",search:"/archive.html#archiveSearch"
  };
  const links=[...section.matchAll(/<a\b([^>]*)>/g)].map(([,attrs])=>({
    name:attrs.match(/\bdata-portal="([^"]+)"/)?.[1],
    href:attrs.match(/\bhref="([^"]+)"/)?.[1]
  }));
  assert.match(section,/id="portalSubmitNews"[^>]*href="\/news\.html#newsTips"/,"homepage offers a direct news-tip destination");
  for(const [name,href] of Object.entries(destinations))
    assert.ok(links.some(link=>link.name===name&&link.href===href),name+" destination is present");
  const nav=html.match(/<nav class="desktop-nav"[\s\S]*?<\/nav>/)?.[0]||"";
  const mobileStart=html.indexOf('<nav class="mobile-nav"');
  const mobile=html.slice(mobileStart,html.indexOf('</nav>',mobileStart)+6);
  for(const href of ["/news.html","/archive.html","#worldAtlas","/media.html","/report.html","#mission","/donate.html"]){
    assert.ok(nav.includes(`href="${href}"`),"primary navigation includes "+href);
    assert.ok(mobile.includes(`href="${href}"`),"mobile navigation includes "+href);
  }
  assert.match(read("script.js"),/let reportPageSize=6;/,"homepage starts with a compact case preview");
});

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
