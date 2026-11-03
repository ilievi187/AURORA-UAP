/* Deterministic, rights-aware build of a sharded public UAP archive.
   UAPDrop compiled dataset CC BY 4.0: https://www.uapdrop.com/data.html
   Never mirror outside images, personal details, or unsigned media.
   Run: node scripts/import-uapdrop-records.mjs /path/to/sightings.json */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
export const DATASET_URL="https://www.uapdrop.com/data.html";
export const SOURCE_JSON="https://www.uapdrop.com/rest/v1/public/sightings.json";
export const SHARD_COUNT=64;
const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUTPUT=path.join(ROOT,"data","bulk");
const limit=(s,n=5500)=>String(s??"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,n);
const norm=s=>limit(s,220).normalize("NFKC").toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]+/gu," ").trim();
const safe=v=>{try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port?u.href:""}catch{return ""}};
export function shardFor(id){
 let hash=2166136261;for(let i=0;i<id.length;i++)hash=Math.imul(hash^id.charCodeAt(i),16777619)>>>0;
 return String(hash%SHARD_COUNT).padStart(2,"0");
}
export function normalizeRow(row){
 if(!row||typeof row!=="object")return null;
 const type=row.sourceKey,ext=limit(row.externalId,100);
 let id="",origin="",publisher="",country="";
 if(type==="fr_cnes_geipan"){
  if(!/^GEIPAN-[1-9]\d{0,9}$/.test(ext))return null;
  id="geipan-"+ext.slice(7);origin=safe(row.sourceUrl);
  if(!/^https:\/\/www\.cnes-geipan\.fr\/(?:fr|en)\/cas\/\d{4}-\d{2}-\d{3,8}$/.test(origin))return null;
  publisher="CNES GEIPAN / UAPDrop";country=limit(row.countryCode,2).toUpperCase();
  if(!/^[A-Z]{2}$/.test(country))country="FR";
 }else if(type==="us_nara_bluebook"){
  const match=/^US-BB-NAID-([1-9]\d{3,12})$/.exec(ext);if(!match)return null;
  id="bluebook-"+match[1];origin=safe(row.sourceUrl);
  if(origin!=="https://catalog.archives.gov/id/"+match[1])return null;
  publisher="US National Archives · Project Blue Book / UAPDrop";country="US";
 }else return null;
 const title=limit(row.title,180),raw=limit(row.summary,5500),location=limit(row.locationName,130);
 if(title.length<5||raw.length<85||!location)return null;
 const iso=typeof row.observedAt==="string"?row.observedAt.slice(0,10):"";
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||!Number.isFinite(Date.parse(iso+"T00:00:00Z")))return null;
 const date=type==="us_nara_bluebook"?iso.slice(0,7):iso;
 const lat=type==="fr_cnes_geipan"&&row.coordinatePrecision==="CITY"&&
  Number.isFinite(row.latitude)&&Math.abs(row.latitude)<=90&&
  Number.isFinite(row.longitude)&&Math.abs(row.longitude)<=180?row.latitude:null;
 const lng=lat===null?null:row.longitude;
 const summary=type==="fr_cnes_geipan"?"Original French account · "+raw.slice(0,225):raw.slice(0,320);
 return {id,date,date_precision:type==="us_nara_bluebook"?"month":"day",country,city:{en:location},
  lat,lng,location_precision:lat===null?"Not published":"GEIPAN city-level reference",
  category:"other",status:"reported",record_kind:"published_archive",
  title:{en:title},summary:{en:summary},
  story:{en:type==="fr_cnes_geipan"?["Original French account from GEIPAN:",raw]:[raw]},
  source:{name:publisher+" (compiled data CC BY 4.0)",url:origin},
  sources:[{name:"UAPDrop · UAP Sightings Open Dataset (CC BY 4.0)",url:DATASET_URL}],
  media:[],visual:null,content_depth:"source-linked",original_language:type==="fr_cnes_geipan"?"fr":"en",
  provenance:{source_name:publisher,source_url:SOURCE_JSON,source_record_id:ext,license:"CC BY 4.0",
   attribution:"UAPDrop · https://www.uapdrop.com/data.html",source_kind:type}};
}
export function buildBulk(rows,curated=[]){
 if(!Array.isArray(rows)||!rows.length)throw Error("Invalid input dataset");
 const curatedUrls=new Set(curated.map(c=>c.source?.url).filter(Boolean));
 const ids=new Set(),urls=new Set(),fingerprints=new Set();
 const shards=Object.fromEntries(Array.from({length:SHARD_COUNT},(_,i)=>[String(i).padStart(2,"0"),[]]));
 const index=[];
 const report={source:DATASET_URL,license:"CC BY 4.0",imported:0,by_source:{GEIPAN:0,NARA_Blue_Book:0},
  skipped_invalid:0,skipped_duplicate:0,curated_existing:curated.length};
 for(const row of rows){
  if(!["fr_cnes_geipan","us_nara_bluebook"].includes(row?.sourceKey))continue;
  const c=normalizeRow(row);if(!c){report.skipped_invalid++;continue}
  const fingerprint=norm(c.title.en)+"|"+c.date+"|"+c.country+"|"+norm(c.city.en);
  if(ids.has(c.id)||urls.has(c.source.url)||curatedUrls.has(c.source.url)||fingerprints.has(fingerprint)){
   report.skipped_duplicate++;continue;
  }
  ids.add(c.id);urls.add(c.source.url);fingerprints.add(fingerprint);
  const shard=shardFor(c.id);shards[shard].push(c);
  index.push({id:c.id,date:c.date,country:c.country,city:c.city,title:c.title,summary:c.summary,
   status:"reported",source:c.source,original_language:c.original_language,media:[],shard});
  report.by_source[c.id.startsWith("geipan-")?"GEIPAN":"NARA_Blue_Book"]++;
 }
 index.sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 for(const s of Object.values(shards))s.sort((a,b)=>a.id.localeCompare(b.id));
 report.imported=index.length;report.archive_total=index.length+curated.length;report.shards=SHARD_COUNT;
 if(report.by_source.GEIPAN<2000||report.by_source.NARA_Blue_Book<5000)
  throw Error("Truncated source: refusing import");
 return {index,shards,report};
}
async function main(){
 if(!process.argv[2])throw Error("Provide downloaded UAPDrop JSON path");
 const rows=JSON.parse(await readFile(process.argv[2],"utf8"));
 const curated=JSON.parse(await readFile(path.join(ROOT,"data/cases.json"),"utf8")).cases;
 const {index,shards,report}=buildBulk(rows,curated);
 if(process.argv.includes("--check")){console.log(report);return}
 await mkdir(path.join(OUTPUT,"shards"),{recursive:true});
 await writeFile(path.join(OUTPUT,"index.json"),JSON.stringify({cases:index})+"\n");
 await writeFile(path.join(OUTPUT,"manifest.json"),JSON.stringify(report)+"\n");
 await Promise.all(Object.entries(shards).map(([shard,cases])=>
  writeFile(path.join(OUTPUT,"shards",shard+".json"),JSON.stringify({cases})+"\n")));
 console.log(JSON.stringify(report,null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(error=>{console.error(error);process.exitCode=1});
