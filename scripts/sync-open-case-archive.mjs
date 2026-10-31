/* AURORA automatic archive ingestion: approved CC BY metadata only.
 * No private reports, no scraping, no inference of geographical coordinates. */
import {readFile, writeFile, rename} from "node:fs/promises";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {withApproximateMapAnchor} from "./approximate-case-geography.mjs";
import {applySourceCaseAnnotations,validateSourceCaseAnnotations} from "./source-case-annotations.mjs";
import {resolveMediaPlayback} from "../media-player.js";

export const SOURCE_URL="https://www.uap-archive.org/uap/data/cases.json";
export const SOURCE_NAME="UAP Records Archive";
export const SOURCE_LICENSE="CC BY 4.0";
const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA=path.join(ROOT,"data","cases.json");
const MANIFEST=path.join(ROOT,"data","archive-sync-status.json");
const EDITORIAL=validateSourceCaseAnnotations(JSON.parse(readFileSync(path.join(ROOT,"data","source-case-annotations.json"),"utf8")));
const MAX_SOURCE_BYTES=5_000_000;
const FIXTURE_SOURCE={license:"U.S. government works; Creative Commons Attribution 4.0 (CC BY 4.0)",cases:[
 {id:"fixture-colorado-2022",designation:"Colorado Springs UAP Incident",kind:"pursue-cluster",card:{en:{apparent:"Documents describing a published observation; no further findings are provided."}},assets:[{type:"document",label:"Original release",url:"https://media.uap-archive.org/pursue-docs/example.pdf"}],incidentDates:["February, 2022"],incidentLocations:["Colorado Springs, Colorado, U.S."]},
 {id:"fixture-western-us-2022",designation:"Western US Event",kind:"pursue-cluster",card:{en:{apparent:"Documents describing a published observation; no further findings are provided."}},assets:[{type:"document",label:"Original release",url:"https://media.uap-archive.org/pursue-docs/example.pdf"}],incidentDates:["2022"],incidentLocations:["Unknown area"]}
]};
const ALIASES={
  "aaro-gofast-case":"gofast-2015",
  "aaro-mt-etna-case":"etna-2018",
  "aaro-al-taqaddum-case":"al-taqaddum-2017",
  "aaro-puerto-rico-case":"puerto-rico-2013",
  "aaro-flir1-case":"nimitz-2004",
  "aaro-gimbal-case":"gimbal-2015"
};
const safeText=(input,max=500)=>String(input??"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max);
const canonical=(value)=>safeText(value,240).normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g," ");
const knownExisting=existing=>new Set(existing.map(x=>canonical(x.title?.en)).filter(Boolean));
const sourcePage="https://www.uap-archive.org/uap/cases/";
const urlSafe=(raw)=>{
 if(typeof raw!=="string"||!(/^(https:\/\/|\/)/i).test(raw.trim()))return "";
 try{
  const u=new URL(raw,"https://www.uap-archive.org");
  if(u.protocol!=="https:"||u.username||u.password||u.port)return "";
  if(!["www.uap-archive.org","uap-archive.org","media.uap-archive.org","www.aaro.mil","www.dvidshub.net","www.war.gov","war.gov"].includes(u.hostname))return "";
  return u.toString();
 }catch{return ""}
};
const validDate=value=>{
 const v=safeText(value,60);
 let m=v.match(/\b(19|20)\d{2}[-./](0[1-9]|1[0-2])[-./]([0-2]\d|3[01])\b/);
 if(m){const iso=m[0].replace(/[./]/g,"-");if(!Number.isNaN(Date.parse(iso)))return {date:iso,precision:"day"}}
 m=v.match(/\b(19|20)\d{2}\b/);
 if(m)return {date:m[0],precision:"year"};
 return null;
};
export function sourceDate(row){
 for(const item of Array.isArray(row.incidentDates)?row.incidentDates:[]){
  const date=validDate(item);if(date?.precision==="day")return date;
 }
 for(const item of Array.isArray(row.incidentDates)?row.incidentDates:[]){
  const date=validDate(item);if(date)return date;
 }
 return {date:"undated",precision:"unknown"};
}
export function sourceCountry(row){
 const locations=Array.isArray(row.incidentLocations)?row.incidentLocations:[];
 // Country is used only when spelled out in the supplied source metadata.
 const text=locations.map(x=>safeText(x,180).toLowerCase()).join(" ");
 if(/\b(puerto rico)\b/.test(text))return "PR";
 if(/\b(iraq|al taqaddum)\b/.test(text))return "IQ";
 if(/\b(italy|sicily|mt\.? etna)\b/.test(text))return "IT";
 if(/\b(united states|u\.s\.|usa|colorado|alaska)\b/.test(text))return "US";
 if(/\b(japan)\b/.test(text))return "JP";
 return "";
}
function noticeBg(name){
 return "В каталога на UAP Records Archive са публикувани материали за „"+name+"“. Това е запис по първоизточник, не доказателство за извънземен произход. Подробностите и статуса проверете в цитираните документи.";
}
function noticeEn(name){
 return "The UAP Records Archive lists released materials for \""+name+"\". This is a sourced record, not proof of an extraterrestrial origin. Consult the linked primary documents for the scope and assessment.";
}
export function normalizeCase(row){
 if(!row||typeof row!=="object"||!(/^[a-z0-9][a-z0-9-]{2,84}$/).test(row.id||""))return null;
 const name=safeText(row.designation,145);
 if(name.length<4)return null;
 const {date,precision}=sourceDate(row);
 const country=sourceCountry(row);
 const location=(Array.isArray(row.incidentLocations)?row.incidentLocations:[])
   .map(s=>safeText(s,100)).find(Boolean)||"Location not published";
 const status=row.kind==="aaro-resolved"?"explained":"official_record";
 const media=(Array.isArray(row.assets)?row.assets:[]).map(asset=>{
  if(!asset||typeof asset!=="object")return null;
  const url=urlSafe(asset.url);if(!url)return null;
  const type=asset.type==="video"?"video":asset.type==="image"?"photo":
    asset.type==="document"?"documents":"archive";
  return {type,title:{en:safeText(asset.label,145)||"Published source material",
    bg:"Публикуван материал от източника"},url};
 }).filter(Boolean).slice(0,12);
 if(!media.length)media.push({type:"archive",title:{en:"Open source case catalog",bg:"Отворен каталог на случаите"},url:sourcePage});
 const english=safeText(row.card?.en?.apparent,450);
 const assessment=safeText(row.card?.en?.assessed||row.card?.en?.status,300);
 return withApproximateMapAnchor({
  id:"uap-archive-"+row.id, date,date_precision:precision,
  lat:null,lng:null,location_precision:"Coordinates not published in the source case metadata",
  category:"other",status,country,city:{en:location,bg:location},
  title:{en:name,bg:name},
  summary:{en:english.length>=45?english:noticeEn(name),bg:noticeBg(name)},
  source:{name:SOURCE_NAME+" (CC BY 4.0)",url:sourcePage},
  story:{
   en:[noticeEn(name),...(assessment?[assessment]:[])],
   bg:[noticeBg(name),"Източник на метаданните: UAP Records Archive, лиценз CC BY 4.0."]
  },
  media,
  dedup_key:"uap-records-archive:"+row.id,
  provenance:{source_name:SOURCE_NAME,source_url:SOURCE_URL,
    source_record_id:row.id,license:SOURCE_LICENSE,
    source_kind:"published public government records",automated:true},
  assessment_authority:row.kind==="aaro-resolved"?"AARO (as reproduced by source)":"",
  visual:null
 });
}
/* Previously verified in-site playback may survive a metadata-only refresh,
 * but only for the identical published video URL and source record.
 * Any changed/removed upstream media loses the old approval automatically. */
export function preserveVerifiedSourcePlayback(next,previous){
 if(!next||!previous||next.provenance?.source_url!==SOURCE_URL||
    previous.provenance?.source_url!==SOURCE_URL||
    next.provenance?.source_record_id!==previous.provenance?.source_record_id||
    !Array.isArray(next.media)||!Array.isArray(previous.media))return next;
 const previously=new Map(previous.media.filter(m=>m?.type==="video"&&typeof m.url==="string")
  .map(m=>[m.url,m]));
 const media=next.media.map(m=>{
  if(m?.type!=="video"||!previously.has(m.url))return m;
  const approved=previously.get(m.url);
  if(!approved?.playback)return m;
  const restored={...m,playback:approved.playback};
  return resolveMediaPlayback(restored)?restored:m;
 });
 return {...next,media};
}
export function buildArchive(existing,source){
 if(!Array.isArray(existing?.cases))throw Error("Invalid current case archive");
 if(!source||!Array.isArray(source.cases)||source.cases.length<1||source.cases.length>20000)throw Error("Invalid source case set");
 if(!/creativecommons attribution 4\.0|cc by 4\.0/i.test(source.license||""))throw Error("Source license not in allowlist");
 const current=existing.cases.filter(x=>x?.provenance?.source_url!==SOURCE_URL);
 const existingIds=new Set(current.map(x=>x.id));
 const existingNames=knownExisting(current);
 const seen=new Set();
 const imported=[];
 const priorImported=new Map(existing.cases.filter(c=>c?.provenance?.source_url===SOURCE_URL&&
   typeof c?.provenance?.source_record_id==="string").map(c=>[c.provenance.source_record_id,c]));
 let invalid=0,duplicates=0;
 for(const row of source.cases){
  const c=normalizeCase(row);
  if(!c){invalid++;continue}
  if(seen.has(c.id)){duplicates++;continue}
  seen.add(c.id);
  const duplicateAlias=ALIASES[row.id];
  if((duplicateAlias&&existingIds.has(duplicateAlias))||existingIds.has(c.id)||
     existingNames.has(canonical(c.title.en))){duplicates++;continue}
  imported.push(applySourceCaseAnnotations(preserveVerifiedSourcePlayback(c,priorImported.get(row.id)),EDITORIAL));
 }
 if(!imported.length)throw Error("No importable source records: refusing replacement");
 const previous=existing.cases.filter(x=>x?.provenance?.source_url===SOURCE_URL).length;
 if(previous>=10&&imported.length<previous*.75)throw Error("Source shrank unexpectedly; refusing destructive update");
 const merged=[...current,...imported].sort((a,b)=>String(b.date).localeCompare(String(a.date))||a.id.localeCompare(b.id));
 return {archive:{...existing,cases:merged},report:{
   source:SOURCE_URL,license:SOURCE_LICENSE,upstream:source.cases.length,
   generated:imported.length,existing_curated:current.length,
   skipped_duplicates:duplicates,skipped_invalid:invalid,total:merged.length,
   coordinates_policy:"source-only; missing latitude/longitude remain null",
   status:"ok"
 }};
}
export function runFixtureChecks(){
 // Deliberately fixture-only: no repository data paths are opened or written.
 const curated={schema_version:1,cases:[{id:"fixture-editorial",title:{en:"Curated Fixture Record"},source:{url:"https://example.org/source"}}]};
 const fixtureInput=structuredClone(FIXTURE_SOURCE);
 const {archive,report}=buildArchive(curated,fixtureInput);
 if(archive.cases.length!==3||report.generated!==2)throw Error("Deterministic archive fixture check failed");
 return {archive,report};
}
export async function fetchSource(fetcher=fetch){
 const response=await fetcher(SOURCE_URL,{headers:{Accept:"application/json","User-Agent":"AURORA-UAP-source-sync/1.0 (+https://aurorauap.org)"},signal:AbortSignal.timeout(18000)});
 if(!response.ok){if(response.body)await response.body.cancel().catch(()=>{});throw Error("Upstream HTTP "+response.status)}
 const declared=response.headers.get("content-length");
 if(declared!==null&&/^\d+$/.test(declared)&&BigInt(declared)>BigInt(MAX_SOURCE_BYTES)){
  if(response.body)await response.body.cancel().catch(()=>{});
  throw Error("Source exceeds 5 MB limit");
 }
 if(!response.body)throw Error("Source response has no body");
 const reader=response.body.getReader();const chunks=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   total+=value.byteLength;
   if(total>MAX_SOURCE_BYTES){await reader.cancel("Source exceeds 5 MB limit").catch(()=>{});throw Error("Source exceeds 5 MB limit")}
   chunks.push(value);
  }
 }catch(error){await reader.cancel().catch(()=>{});throw error}
 const bytes=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
 return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
}
async function atomicWrite(file,contents){
 const temp=file+".next";
 await writeFile(temp,contents,"utf8");
 await rename(temp,file);
}
async function main(){
 const baseline=JSON.parse(await readFile(DATA,"utf8"));
 const upstream=await fetchSource();
 const {archive,report}=buildArchive(baseline,upstream);
 if(process.argv.includes("--check")){
  console.log(JSON.stringify(report,null,2));
  return;
 }
 await atomicWrite(DATA,JSON.stringify(archive,null,2)+"\n");
 // Deterministic status: avoid date-only noise causing unnecessary commits.
 await atomicWrite(MANIFEST,JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify(report,null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 main().catch(error=>{console.error("Archive sync refused:",error.message);process.exitCode=1});
}