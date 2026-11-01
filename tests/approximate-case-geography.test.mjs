import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {withApproximateMapAnchor} from "../scripts/approximate-case-geography.mjs";
import {normalizeCase as normalizeArchive} from "../scripts/sync-open-case-archive.mjs";
const cases=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8")).cases;

test("every sourced case with a trustworthy named place receives a clearly approximate map anchor",()=>{
 const ids=["uap-archive-aaro-eglin-uap-case","uap-archive-aaro-southeast-asia-triangles-case",
 "uap-archive-aaro-western-united-states-case","uap-archive-jal-1628-1986",
 "uap-archive-navy-flir1-2004","uap-archive-navy-gimbal-2015",
 "uap-archive-northeastern-orb-sightings","uap-archive-western-us-event",
 "uap-archive-colorado-springs-2022"];
 const marked=cases.filter(c=>c.map_anchor?.kind==="approximate_source_locality");
 assert.equal(marked.length,9);
 assert.deepEqual(new Set(marked.map(c=>c.id)),new Set(ids));
 for(const id of ids){
  const c=cases.find(x=>x.id===id);
  assert.ok(c,id);
  assert.ok(Number.isFinite(c.lat)&&Number.isFinite(c.lng));
  assert.ok(Math.abs(c.lat)<=90&&Math.abs(c.lng)<=180);
  assert.equal(c.map_anchor.not_observation_coordinates,true);
  assert.match(c.location_precision,/Approximate.*NOT an observed object position/);
  assert.match(c.location_precision_bg,/Ориентировъчен.*НЕ е измерена позиция/);
  assert.deepEqual(withApproximateMapAnchor(c),c,"enrichment must be idempotent");
 }
});

test("redacted, contradictory, multi-region and truly unknown records are never pinned to a guessed site",()=>{
 const unmapped=cases.filter(c=>c.lat==null&&c.lng==null);
 assert.deepEqual(new Set(unmapped.map(c=>c.id)),new Set([
  "uap-archive-aaro-atmospheric-wakes-case","disclosure-six-spheres-2025","disclosure-test-site-2023"
 ]));
 const classified={city:{en:"Every place name is redacted"},summary:{en:"Near Colorado Springs"},title:{en:"Unknown"}};
 assert.equal(withApproximateMapAnchor(classified),classified);
 const comparison={city:{en:"Location not published"},summary:{en:"Alaska was mentioned as a comparison, not the incident location"},title:{en:"Unidentified incident"},lat:null,lng:null};
 assert.equal(withApproximateMapAnchor(comparison),comparison);
});

test("existing source coordinates and provenance must not be changed",()=>{
 const record={id:"measured",lat:38.888,lng:-104.777,country:"US",city:{en:"Colorado Springs"},location_precision:"Original publisher coordinate"};
 assert.equal(withApproximateMapAnchor(record),record);
 const editorial=cases.filter(c=>c.content_depth==="editorial");
 assert.equal(editorial.length,15);
 for(const c of editorial)assert.equal(c.map_anchor,undefined,"editorial case coordinate overwritten: "+c.id);
});

test("future licensed imports infer an approximate city without guessing an incident point",()=>{
 const item=normalizeArchive({id:"new-city-reference",designation:"Independent case",kind:"pursue-cluster",
   incidentLocations:["Colorado Springs, Colorado, U.S."],
   incidentDates:["2022"],assets:[{type:"document",label:"Source PDF",url:"https://media.uap-archive.org/pursue-docs/example.pdf"}]});
 assert.equal(item.country,"US");assert.equal(item.lat,38.8);assert.equal(item.lng,-104.8);
 assert.equal(item.map_anchor.basis,"source city/region");
 const unknown=normalizeArchive({id:"no-site",designation:"Unknown object",kind:"pursue-cluster",incidentLocations:["Unknown area"],
   assets:[{type:"document",label:"Source PDF",url:"https://media.uap-archive.org/pursue-docs/example.pdf"}]});
 assert.equal(unknown.lat,null);assert.equal(unknown.lng,null);
});

test("world atlas renders structured precision labels instead of a generic area warning",()=>{
 const atlas=readFileSync(new URL("../world-atlas.js",import.meta.url),"utf8");
 const css=readFileSync(new URL("../world-atlas.css",import.meta.url),"utf8");
 assert.match(atlas,/is-approximate/);
 assert.match(atlas,/mapPrecision\(item\)/);
 assert.match(atlas,/precisionLabelKeys/);
 assert.match(atlas,/precisionNote\(item\)/);
 assert.match(atlas,/precisionLabels\.join/);
 assert.match(atlas,/world-result-precision/);
 assert.match(css,/\.world-map-marker\.is-approximate/);
});
