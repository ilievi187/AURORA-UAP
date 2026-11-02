import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isLegacyPlaceholder} from "../archive-localization.js";
import "../archive-records.js";

const {identity, hasCoordinates, prepareArchiveCases} = globalThis.AURORA_ARCHIVE;
const caseOf = (id, title = "A reported aerial object", fields = {}) => ({
  id, title: {en:title}, date:"1976-09-19", country:"IR",
  source:{url:"https://example.org/records/tehran"}, lat:35.7, lng:51.4,
  location_precision:"City anchor, not a measured trajectory", ...fields
});

test("historical archive deduplicates the same publisher/date/title even across local IDs", () => {
  const a=caseOf("one");
  const b=caseOf("two","  A REPORTED aerial object  ");
  const c=caseOf("three","A different observation from the same article");
  const output=prepareArchiveCases([a,b,c]);
  assert.deepEqual(output.map(item=>item.id),["one","three"]);
  assert.equal(identity(a),identity(b));
  assert.notEqual(identity(a),identity(c));
});

test("explicit provenance identities override local IDs but distinct source URLs remain distinct", () => {
  const a=caseOf("one","First",{dedup_key:"AARO-1976"});
  const b=caseOf("two","Second",{dedup_key:"AARO-1976"});
  const c=caseOf("three","Third",{provenance:{source_record_id:"X-17",source_url:"https://example.org/reports/17"},source:{url:"https://example.org/reports/17"}});
  const d=caseOf("four","Fourth",{provenance:{source_record_id:"X-17",source_url:"https://example.org/reports/17"},source:{url:"https://example.org/reports/17"}});
  const e=caseOf("five","Fifth",{provenance:{source_record_id:"X-17",source_url:"https://different.example/reports/17"},source:{url:"https://different.example/reports/17"}});
  assert.deepEqual(prepareArchiveCases([a,b,c,d,e]).map(item=>item.id),["one","three","five"]);
});

test("duplicate local dossier IDs never make ambiguous links even when sources differ", () => {
  const a=caseOf("same");
  const b=caseOf("same","Another case",{source:{url:"https://elsewhere.example/story"}});
  assert.deepEqual(prepareArchiveCases([a,b]).map(item=>item.id),["same"]);
});

test("missing, invalid and partially published coordinates are normalized but case remains readable", () => {
  const zero=caseOf("zero","At the equator",{lat:0,lng:0});
  const unknown=caseOf("unknown","No location",{lat:null,lng:null,location_precision:""});
  const partial=caseOf("partial","Partial location",{lat:25,lng:undefined});
  const outOfBounds=caseOf("outofbounds","Bad latitude",{lat:91,lng:12});
  const result=prepareArchiveCases([zero,unknown,partial,outOfBounds]);
  assert.equal(result.length,4);
  assert.equal(hasCoordinates(result[0]),true);
  for (const item of result.slice(1)) {
    assert.equal(hasCoordinates(item),false);
    assert.equal(item.lat,null);
    assert.equal(item.lng,null);
    assert.ok(item.location_precision);
  }
  assert.equal(unknown.lat,null);
  assert.equal(partial.lat,25,"normalization must not mutate upstream records");
});

test("empty, invalid and duplicate-only lists stay empty or bounded", () => {
  assert.deepEqual(prepareArchiveCases([]),[]);
  assert.deepEqual(prepareArchiveCases(null),[]);
  assert.deepEqual(prepareArchiveCases([null,0,{}, {id:""}, {id:"  "}]),[]);
  assert.equal(prepareArchiveCases([caseOf("a"),caseOf("a")]).length,1);
});

test("all historical views load the shared helper before their consumers", () => {
  const read = name => readFileSync(new URL("../"+name,import.meta.url),"utf8");
  for (const [page, consumer] of [
    ["index.html","globe.js"], ["countries.html","countries.js"],
    ["country.html","country.js"], ["dossier.html","dossier.js"]
  ]) {
    const html=read(page);
    assert.ok(html.includes('src="/archive-records.js"'),page+" missing helper");
    assert.ok(html.indexOf('src="/archive-records.js"')<html.indexOf('src="/'+consumer+'"') ||
      (consumer==="globe.js" && html.indexOf('src="/archive-records.js"')<html.indexOf('src="globe.js"')),
      page+" loads consumer before helper");
    assert.match(read(consumer),/prepareArchiveCases/,consumer+" must use shared archive cases");
  }
  assert.match(read("world-atlas.js"),/prepareArchiveCases/);
});


test("all 101 sourced dossiers keep short geographic labels and full source context",()=>{
 const published=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8")).cases;
 const normalized=prepareArchiveCases(published);
 assert.equal(normalized.length,101);
 const harare=normalized.find(c=>c.id==="disclosure-harare-2008");
 assert.equal(harare.city.bg,"Международно летище Хараре, Зимбабве");
 assert.ok(harare.location_context.en.length>120,"full original geographic note retained");
 assert.ok(Number.isFinite(harare.lat)&&Number.isFinite(harare.lng));
 assert.equal(harare.story.bg.length,7);
 assert.ok(harare.story.bg.join(" ").length>1600,"real Bulgarian narrative replaces boilerplate");
 assert.ok(!harare.story.bg.some(t=>t.startsWith("EN ·")));
 const long=normalized.filter(c=>typeof c.city?.en==="string"&&c.city.en.length>120);
 assert.equal(long.length,0,"source coordinate essays must not be rendered as city names");
 const unknown=normalized.filter(c=>!hasCoordinates(c));
 assert.deepEqual(unknown.map(c=>c.id).sort(),[
  "disclosure-six-spheres-2025","disclosure-test-site-2023","uap-archive-aaro-atmospheric-wakes-case"
 ]);
 assert.ok(unknown.every(c=>c.lat===null&&c.lng===null),"unknown geographic sites stay unpinned");
 const sanitized=normalized.find(c=>c.id==="disclosure-virginia-2024");
 assert.ok(sanitized.summary.bg?.length>90,"batch-two Bulgarian summary is present");
 assert.notEqual(sanitized.summary.bg,sanitized.summary.en,"authored BG summary is not passed off as source English");
 assert.equal(isLegacyPlaceholder(sanitized,"bg"),false,"batch-two narrative no longer classifies as a legacy placeholder");
 assert.ok(sanitized.story.bg.length>=3&&sanitized.story.bg.every(p=>p.trim().length>=75),"substantive Bulgarian story is present");
 assert.ok(sanitized.summary.en?.length>100);
});
