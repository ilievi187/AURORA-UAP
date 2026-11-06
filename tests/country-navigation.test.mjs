import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const json=name=>JSON.parse(read(name));
const geo=json("data/bulk/geo-points.json");
const countries=json("data/bulk/countries.json");
const bulk=json("data/bulk/index.json").cases;
const curated=json("data/cases.json").cases;

test("country records cover all correctly assigned published sources, including old curated files",()=>{
 const byCountry=new Map();
 for(const row of [...curated,...bulk]){
  if(!/^[A-Z]{2}$/.test(row.country||"")||row.country==="XZ"||!row.source?.url?.startsWith("https://"))continue;
  byCountry.set(row.country,(byCountry.get(row.country)||0)+1);
 }
 const total=countries.countries.reduce((sum,entry)=>sum+entry.count,0);
 assert.equal(countries.country_assigned,total);
 assert.equal(total,[...byCountry.values()].reduce((a,b)=>a+b,0));
 assert.equal(countries.countries.length,byCountry.size);
 for(const row of countries.countries)assert.equal(row.count,byCountry.get(row.code),row.code);
 assert.equal(byCountry.get("US"),7361);
 assert.equal(byCountry.get("FR"),2713);
 assert.equal(bulk.length+curated.length,10133);
});

test("all 2715 map anchors come from source-published city references, not fabricated Blue Book points",()=>{
 assert.equal(geo.geo_anchors,2715);
 assert.equal(geo.points.length,2715);
 assert.equal(new Set(geo.points.map(p=>p.id)).size,2715);
 assert.ok(geo.points.every(p=>p.id.startsWith("geipan-")&&p.precision==="city"&&
   p.source==="CNES GEIPAN"&&/^https:\/\/www\.cnes-geipan\.fr\//.test(p.source_url)&&
   Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180));
 assert.equal(geo.points.filter(p=>p.id.startsWith("bluebook-")).length,0);
 assert.match(read("aurora-silence.js"),/additionalCityAnchors/);
});

test("world marker activation navigates to country files, never calls automatic zoom",()=>{
 const script=read("world-atlas.js"),page=read("index.html"),style=read("world-atlas-orbital.css");
 assert.match(page,/id="worldBulkPins"/);
 assert.match(page,/id="worldCountryLinks"/);
 assert.match(script,/window\.location\.assign\(destination\)/);
 assert.match(script,/const destination=hasCountry \? '\/countries\/'/);
 assert.match(script,/link\.href = '\/countries\/'/);
 assert.doesNotMatch(script,/zoomTo\(/);
 assert.doesNotMatch(script,/selectCase\(item\.id, \{ center: true \}\)/);
 assert.match(script,/function zoomBy\(factor\)/,"explicit zoom controls may remain");
 assert.match(style,/Marker offset for visibility|world-bulk-pins/);
});

test("country pages paginate source-linked files and replace fake folder images with source identity",()=>{
 const country=read("country.js"),page=read("country.html"),dir=read("countries.js");
 assert.match(country,/const HISTORY_PAGE_SIZE=24/);
 assert.match(country,/fetch\("\/data\/bulk\/by-country\/"\+code\+"\.json"/);
 assert.match(dir,/fetch\("\/data\/bulk\/countries\.json"/);
 assert.match(page,/id="countryHistorySearch"/);
 assert.match(page,/id="countryHistoryPager"/);
 assert.match(country,/country-history-art/);
 assert.doesNotMatch(country,/feature-cases\.webp/);
 assert.match(read("dossier.js"),/sourceOnlyRecord=c\.record_kind==="published_archive"/);
});
