/* AURORA licensed secondary case-data adapter. Does not scrape, invent sightings,
 * translate source claims or publish without an owner-reviewed GitHub PR. */
import {readFile,writeFile,rename} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {withApproximateMapAnchor} from "./approximate-case-geography.mjs";

export const SOURCE_URL="https://disclosure.zone/api/cases.json";
export const SOURCE_NAME="disclosure.zone";
export const SOURCE_LICENSE="CC BY 4.0";
const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA=path.join(ROOT,"data","cases.json");
const MANIFEST=path.join(ROOT,"data","disclosure-zone-sync-status.json");
const MAX_SOURCE_BYTES=8_000_000;
const MAX_CASES=4000;
const ALIASES={
 "phoenix-lights-1997":"phoenix-1997",
 "nimitz-2004":"nimitz-2004",
 "gimbal-2015":"gimbal-2015",
 "gofast-2015":"gofast-2015",
 "westall-1966":"westall-1966",
 "roswell-1947":"roswell-1947",
 "rendlesham-1980":"rendlesham-1980",
 "tehran-1976":"tehran-1976",
 "colares-1977":"colares-1977",
 "washington-1952":"washington-1952",
 "arnold-1947":"arnold-1947",
 "puerto-rico-2013":"puerto-rico-2013",
 "al-taqaddum-2017":"al-taqaddum-2017",
 "etna-2018":"etna-2018",
 "jal-1628-1986":"jal-1628-1986"
};
const safeText=(x,max=2000)=>typeof x==="string"?x.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max):"";
const canon=v=>safeText(v,250).normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const safeUrl=v=>{
 if(typeof v!=="string")return null;
 try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port?u.href:null}
 catch{return null}
};
const dateInfo=v=>{
 if(typeof v!=="string")return {date:"undated",precision:"unknown"};
 const date=v.trim();
 if(!/^(?:1[0-9]{3}|2[0-9]{3})-(?:0[1-9]|1[0-2])-(?:[0-2]\d|3[01])$/.test(date)||
    Number.isNaN(Date.parse(date+"T00:00:00Z")))return {date:"undated",precision:"unknown"};
 const iso=new Date(date+"T00:00:00Z").toISOString().slice(0,10);
 return iso===date?{date,precision:"day"}:{date:"undated",precision:"unknown"};
};
function sourceEntries(row){
 const out=[],seen=new Set();
 for(const ref of Array.isArray(row.sources)?row.sources.slice(0,60):[]){
  if(!ref||typeof ref!=="object")continue;
  const url=safeUrl(ref.url);
  if(!url||seen.has(url))continue;
  seen.add(url);
  out.push({url,name:safeText(ref.label?.en,260)||new URL(url).hostname,
   type:"reference",source_tier:/^T[1-5]$/.test(ref.tier)?ref.tier:null,public:true});
  if(out.length>=30)break;
 }
 return out;
}
function metadataIsValid(source){
 if(!source||!Array.isArray(source.cases)||source.cases.length<1||source.cases.length>MAX_CASES)
  throw Error("Invalid disclosure.zone case list");
 if(source.license!=="CC BY 4.0")throw Error("Unapproved disclosure.zone license");
 if(!Number.isInteger(source.count)||source.count!==source.cases.length)
  throw Error("Case count mismatch; reject truncated or inconsistent source");
}
export function normalizeCase(row){
 if(!row||typeof row!=="object"||!(/^[a-z0-9][a-z0-9-]{2,84}$/).test(row.id||""))return null;
 const url=safeUrl(row.url),expected="https://disclosure.zone/cases/"+row.id;
 if(url!==expected)return null;
 const title=safeText(row.en?.title,180),summary=safeText(row.en?.summary,1700);
 if(title.length<3||summary.length<45)return null;
 const {date,precision}=dateInfo(row.date);
 const country=typeof row.country==="string"&&/^[A-Z]{2}$/.test(row.country)&&row.country!=="XX"?row.country:"";
 // Coordinates in this secondary dataset are locality/map anchors; never a
 // measured line-of-sight or instrument measurement. No reverse-geocoding.
 const locationOk=typeof row.lat==="number"&&Number.isFinite(row.lat)&&Math.abs(row.lat)<=90&&
  typeof row.lon==="number"&&Number.isFinite(row.lon)&&Math.abs(row.lon)<=180;
 const lat=locationOk?row.lat:null,lng=locationOk?row.lon:null;
 const location=safeText(row.en?.location,230)||safeText(row.en?.countryName,100)||"Location not published";
 // Unknown secondary-publisher labels must never silently become official findings.
 const status=row.status==="explained"?"explained":"reported";
 const subtitle=safeText(row.en?.subtitle,430);
 const authority=safeText(row.en?.official,1700);
 const alternatives=(Array.isArray(row.en?.alternatives)?row.en.alternatives:[])
  .filter(x=>typeof x==="string").map(x=>safeText(x,650)).filter(Boolean).slice(0,4);
 const sources=sourceEntries(row);
 const originalEnglish=[subtitle,summary,authority,...alternatives].filter(Boolean);
 const bgIntro="„"+title+"“ е случай, описан в публичния каталог disclosure.zone (CC BY 4.0). Публикуваните сведения се отнасят за "+(date==="undated"?"неуточнена дата":date)+" и район "+location+". Маркерът, ако има такъв, е ориентировъчен, а не измерена позиция на обект.";
 const bgCaution="Следва оригиналното описание на английски от лицензиран източник. То представя свидетелства и оценки на източника, а не доказателство за извънземен произход или независимо заключение на AURORA.";
 const storyEn=[
  "Source-linked case dossier · "+SOURCE_NAME+" (CC BY 4.0). Date and location are taken from this independent catalog; map coordinates, if present, are approximate reference points.",
  ...(subtitle?[subtitle]:[]),summary,
  ...(authority?["Source assessment: "+authority]:[]),
  ...alternatives.map((text,i)=>"Reported alternative "+(i+1)+": "+text)
 ];
 const storyBg=[bgIntro,bgCaution,...originalEnglish.slice(0,6).map((text,i)=>(i===0?"EN · ":"EN · ")+text)];
 // Reference only: we do not rehost third-party media or assume permissions
 // for a PDF, embedded video, photograph or a witness record.
 const media=sources.map(s=>{
  if(/\.pdf(?:$|[?#])/i.test(s.url)){
   return {type:"documents",title:{en:s.name,bg:s.name},url:s.url};
  }
  // These are official DVIDS source pages with publisher-provided iframe embeds.
  // Embed the remote player only; do not download or rehost source footage.
  if(/^https:\/\/www\.dvidshub\.net\/video\/[1-9]\d{5,8}(?:\/[a-z0-9-]+)?\/?$/.test(s.url)){
   return {type:"video",title:{en:s.name,bg:s.name},url:s.url,
    playback:{mode:"provider_embed",provider:"dvids",permission:"public_embed",source_url:s.url}};
  }
  return null;
 }).filter(Boolean).slice(0,30);
 const safeSourceName=SOURCE_NAME+" · "+SOURCE_LICENSE;
 return withApproximateMapAnchor({
  id:"disclosure-"+row.id,
  date,date_precision:precision,
  lat,lng,location_precision:locationOk?
   "Approximate locality reference from disclosure.zone; NOT a measured observation position":
   "No published coordinates; NOT geocoded by AURORA",
  country,category:"other",status,
  city:{en:location,bg:location},
  title:{en:title,bg:title},
  summary:{en:summary,bg:bgIntro},
  story:{en:storyEn,bg:storyBg},
  source:{name:safeSourceName,url:expected},
  sources,
  media,
  visual:null,
  content_depth:"source-linked",
  editorial_review:"licensed-secondary-summary; independent fact-check pending",
  dedup_key:"disclosure-zone:"+row.id,
  publisher_assessment:safeText(row.status,40),
  provenance:{source_name:SOURCE_NAME,source_url:SOURCE_URL,
   source_record_id:row.id,license:SOURCE_LICENSE,source_kind:"licensed secondary case compilation",
   automated:true,coordinates_policy:locationOk?"publisher-locality-anchor":"not available",
   verification:"source-attributed; not independently confirmed"}
 });
}
export function buildArchive(existing,source){
 if(!existing||!Array.isArray(existing.cases))throw Error("Invalid existing case archive");
 metadataIsValid(source);
 const current=existing.cases.filter(c=>c?.provenance?.source_url!==SOURCE_URL);
 const previous=existing.cases.filter(c=>c?.provenance?.source_url===SOURCE_URL).length;
 const ids=new Set(current.map(x=>x.id));
 const keys=new Set(current.map(x=>canon(x.title?.en)+"|"+x.date+"|"+x.country));
 const seen=new Set(),imported=[];
 let skipped_duplicates=0,skipped_invalid=0;
 for(const row of source.cases){
  const c=normalizeCase(row);
  if(!c){skipped_invalid++;continue}
  const matchKey=canon(c.title.en)+"|"+c.date+"|"+c.country;
  const alias=ALIASES[row.id]||row.id;
  if(seen.has(c.id)||ids.has(c.id)||ids.has(alias)||keys.has(matchKey)){
   skipped_duplicates++;continue;
  }
  seen.add(c.id);imported.push(c);
 }
 if(!imported.length)throw Error("No valid nonduplicate licensed cases; refusing replacement");
 if(previous>=10&&imported.length<previous*.75)
  throw Error("Source shrank unexpectedly; existing published cases left untouched");
 const cases=[...current,...imported].sort((a,b)=>String(b.date).localeCompare(String(a.date))||a.id.localeCompare(b.id));
 return {archive:{...existing,cases},report:{
  source:SOURCE_URL,license:SOURCE_LICENSE,upstream:source.cases.length,
  generated:imported.length,existing_curated:current.length,total:cases.length,
  skipped_duplicates,skipped_invalid,previous,
  coordinates_policy:"publisher approximate locality, never measured object position",
  status:"ok"
 }};
}
export async function fetchSource(fetcher=fetch){
 const res=await fetcher(SOURCE_URL,{headers:{"Accept":"application/json","User-Agent":"AURORA-UAP-source-sync/1.0 (+https://aurorauap.org)"},signal:AbortSignal.timeout(18000)});
 if(!res.ok){if(res.body)await res.body.cancel().catch(()=>{});throw Error("Upstream HTTP "+res.status)}
 const declared=res.headers.get("content-length");
 if(declared&&/^\d+$/.test(declared)&&Number(declared)>MAX_SOURCE_BYTES)throw Error("Source exceeds size limit");
 if(!res.body)throw Error("Missing response body");
 const reader=res.body.getReader(),parts=[];let total=0;
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;
   total+=value.byteLength;
   if(total>MAX_SOURCE_BYTES){await reader.cancel().catch(()=>{});throw Error("Source exceeds size limit")}
   parts.push(value);
  }
 }finally{reader.releaseLock()}
 const all=new Uint8Array(total);let pos=0;for(const part of parts){all.set(part,pos);pos+=part.length}
 const payload=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(all));
 metadataIsValid(payload);
 return payload;
}
async function atomicWrite(filename,content){const tmp=filename+".next";await writeFile(tmp,content,"utf8");await rename(tmp,filename)}
async function main(){
 const existing=JSON.parse(await readFile(DATA,"utf8"));
 const source=await fetchSource();
 const {archive,report}=buildArchive(existing,source);
 if(process.argv.includes("--check")){console.log(JSON.stringify(report,null,2));return}
 await atomicWrite(DATA,JSON.stringify(archive,null,2)+"\n");
 await atomicWrite(MANIFEST,JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify(report,null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(error=>{console.error("Disclosure archive sync refused:",error.message);process.exitCode=1});
