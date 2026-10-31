/* Source-attributed editorial overlays for imported public records.
 * Do not touch incident locations, coordinates, assessments, media or playback rights.
 * The source sync reapplies vetted copy on every import so it cannot be lost. */
const SAFE_REFERENCE_HOSTS=new Set(["www.aaro.mil","aaro.mil","www.uap-archive.org",
 "uap-archive.org","www.war.gov","war.gov","catalog.archives.gov"]);
const VALID_ID=/^uap-archive-[a-z0-9-]{3,100}$/;
function validUrl(value){
 try{
  const u=new URL(value);
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&SAFE_REFERENCE_HOSTS.has(u.hostname);
 }catch{return false}
}
const paragraphs=(value)=>Array.isArray(value)&&value.length>=3&&value.length<=12&&
 value.every(p=>typeof p==="string"&&p.trim().length>=75&&p.length<=5000);
export function validateSourceCaseAnnotations(catalog){
 if(!catalog||catalog.schema_version!==1||!/^20\d\d-\d\d-\d\d$/.test(catalog.reviewed_at||"")||
    !catalog.records||typeof catalog.records!=="object"||Array.isArray(catalog.records))
  throw Error("Invalid source annotation catalog");
 const ids=Object.keys(catalog.records);
 if(ids.length===0||ids.length>100)throw Error("Unexpected number of source annotations");
 for(const id of ids){
  const a=catalog.records[id];
  if(!VALID_ID.test(id)||!a||typeof a!=="object")throw Error("Invalid annotated ID: "+id);
  if(typeof a.title_bg!=="string"||a.title_bg.trim().length<8||
     typeof a.summary_bg!=="string"||a.summary_bg.trim().length<90||
     !paragraphs(a.story_bg)||!paragraphs(a.story_en))
   throw Error("Incomplete editorial narrative for "+id);
  if(!Array.isArray(a.references)||a.references.length<1||a.references.length>8||
     !a.references.every(x=>x&&typeof x.name==="string"&&x.name.trim().length>=6&&validUrl(x.url)))
   throw Error("Unattributed or unsafe editorial source for "+id);
  for(const forbidden of ["lat","lng","status","media","playback","coordinates","date","publisher_assessment"])
   if(Object.prototype.hasOwnProperty.call(a,forbidden))throw Error("Annotations cannot override "+forbidden);
 }
 return catalog;
}
export function applySourceCaseAnnotations(record,catalog){
 if(!record||!catalog?.records)return record;
 const a=catalog.records[record.id];
 if(!a)return record;
 // No annotations for private reports, D1 review material or source mismatches.
 if(record.private===true||record.public===false||record.provenance?.source_url!==
    "https://www.uap-archive.org/uap/data/cases.json"||
    record.id!=="uap-archive-"+record.provenance?.source_record_id)return record;
 const sources=Array.isArray(record.sources)?record.sources.filter(x=>x&&validUrl(x.url)):[],
       seen=new Set(sources.map(x=>x.url));
 for(const ref of a.references){
  if(!seen.has(ref.url)){sources.push({type:"editorial-reference",name:ref.name,title:{en:ref.name,bg:ref.name},url:ref.url});seen.add(ref.url)}
 }
 return {...record,
  title:{...record.title,bg:a.title_bg},
  summary:{...record.summary,bg:a.summary_bg},
  story:{...record.story,bg:[...a.story_bg],en:[...a.story_en]},
  sources,content_depth:"source-reviewed",
  editorial_review:{reviewed_at:catalog.reviewed_at,method:"source-attributed",language_keys:["bg","en"]}
 };
}
