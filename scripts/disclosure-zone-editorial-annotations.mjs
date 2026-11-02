/* Durable editorial overlays for licensed disclosure.zone imports.
 * Only translated prose, access notices, preserved editorial-review text, and source references may be added;
 * source facts, coordinates, status and media/playback permissions remain importer-owned. */
const DISCLOSURE_ZONE_SOURCE_URL="https://disclosure.zone/api/cases.json";
const SAFE_REFERENCE_HOSTS=new Set([
 "www.aaro.mil","aaro.mil","www.war.gov","war.gov","catalog.archives.gov",
 "www.uap-archive.org","uap-archive.org"
]);
const VALID_ID=/^[a-z0-9][a-z0-9-]{2,84}$/;
const paragraphs=value=>Array.isArray(value)&&value.length>=3&&value.length<=12&&
 value.every(p=>typeof p==="string"&&p.trim().length>=75&&p.length<=5000);
const localizedAccessNote=value=>!!value&&typeof value==="object"&&!Array.isArray(value)&&
 Object.keys(value).length===2&&["bg","en"].every(lang=>typeof value[lang]==="string"&&value[lang].trim().length>=100&&value[lang].length<=1200);
const validReviewDate=value=>{
 if(typeof value!=="string"||!/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(value))return false;
 const date=new Date(value+"T00:00:00.000Z");
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
};
function validUrl(value){
 try{
  const u=new URL(value);
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&SAFE_REFERENCE_HOSTS.has(u.hostname);
 }catch{return false}
}
export function validateDisclosureZoneEditorialAnnotations(catalog){
 if(!catalog||catalog.schema_version!==1||!validReviewDate(catalog.reviewed_at)||
    !catalog.records||typeof catalog.records!=="object"||Array.isArray(catalog.records))
  throw Error("Invalid disclosure.zone editorial catalog");
 const accessNote=catalog.source_access_notice;
 if(!localizedAccessNote(accessNote))throw Error("Missing localized disclosure.zone source-access notice");
 const ids=Object.keys(catalog.records);
 if(ids.length===0||ids.length>100)throw Error("Unexpected disclosure.zone editorial batch size");
 for(const id of ids){
  const note=catalog.records[id];
  if(!VALID_ID.test(id)||!note||typeof note!=="object"||Array.isArray(note))
   throw Error("Invalid disclosure.zone editorial ID: "+id);
  const hasEnglishStory=Object.prototype.hasOwnProperty.call(note,"story_en");
  if(typeof note.title_bg!=="string"||note.title_bg.trim().length<8||
     typeof note.summary_bg!=="string"||note.summary_bg.trim().length<90||
     !paragraphs(note.story_bg)||(hasEnglishStory&&!paragraphs(note.story_en)))
   throw Error("Incomplete BG/EN editorial narrative for "+id);
  if(note.source_access_note!==undefined&&!localizedAccessNote(note.source_access_note))
   throw Error("Invalid per-record source-access notice for "+id);
  if(note.reviewed_at!==undefined&&!validReviewDate(note.reviewed_at))
   throw Error("Invalid per-record review date for "+id);
  if(note.existing_editorial_review!==undefined&&
     (typeof note.existing_editorial_review!=="string"||!note.existing_editorial_review.trim()||note.existing_editorial_review.length>500))
   throw Error("Invalid preserved editorial-review text for "+id);
  if(!hasEnglishStory&&(!localizedAccessNote(note.source_access_note)||!validReviewDate(note.reviewed_at)))
   throw Error("BG-only annotation requires its own source-access notice and review date for "+id);
  if(!Array.isArray(note.references)||note.references.length>8||
     !note.references.every(ref=>ref&&typeof ref.name==="string"&&ref.name.trim().length>=6&&validUrl(ref.url)))
   throw Error("Unattributed or unsafe disclosure.zone editorial source for "+id);
  for(const forbidden of [
   "id","title_en","summary_en","date","date_precision","lat","lng","location",
   "location_precision","country","city","category","status","media","playback",
   "coordinates","publisher_assessment","source","provenance","dedup_key","license"
  ]){
   if(Object.prototype.hasOwnProperty.call(note,forbidden))
    throw Error("Editorial annotations cannot override "+forbidden);
  }
 }
 return catalog;
}
export function applyDisclosureZoneEditorialAnnotation(record,catalog){
 if(!record||!catalog?.records)return record;
 const sourceId=record.provenance?.source_record_id;
 if(typeof sourceId!=="string"||!Object.prototype.hasOwnProperty.call(catalog.records,sourceId))return record;
 const note=catalog.records[sourceId];
 if(record.private===true||record.public===false||
    record.provenance?.source_url!==DISCLOSURE_ZONE_SOURCE_URL||
    record.id!=="disclosure-"+sourceId)return record;
 const accessNote=note.source_access_note||catalog.source_access_notice;
 if(note.references.length===0){
  let sourceUrl;try{sourceUrl=new URL(record.source?.url||record.source_url||"")}catch{}
  if(sourceUrl?.protocol!=="https:"||sourceUrl?.hostname!=="disclosure.zone"||sourceUrl?.pathname!=="/cases/"+sourceId||sourceUrl?.username||sourceUrl?.password||sourceUrl?.port||sourceUrl?.search||sourceUrl?.hash)
   throw Error("BG-only annotation lacks its licensed publisher source for "+sourceId);
 }
 const sources=Array.isArray(record.sources)?[...record.sources]:[];
 const seen=new Set(sources.map(s=>s?.url).filter(url=>typeof url==="string"));
 for(const ref of note.references){
  if(seen.has(ref.url))continue;
  sources.push({type:"editorial-reference",name:ref.name,
   title:{en:ref.name,bg:ref.name},url:ref.url});
  seen.add(ref.url);
 }
 const priorEditorialReview=record.editorial_review&&typeof record.editorial_review==="object"&&!Array.isArray(record.editorial_review)?record.editorial_review:{};
 const existingEditorialReview=typeof record.editorial_review==="string"?record.editorial_review:
  priorEditorialReview.existing_editorial_review||note.existing_editorial_review;
 return {
  ...record,
  title:{...record.title,bg:note.title_bg},
  summary:{...record.summary,bg:note.summary_bg},
  story:{...record.story,bg:[...note.story_bg],...(note.story_en?{en:[...note.story_en]}:{})},
  sources,
  content_depth:"source-reviewed",
  editorial_review:{
   ...priorEditorialReview,
   ...(existingEditorialReview?{existing_editorial_review:existingEditorialReview}:{}),
   reviewed_at:note.reviewed_at||catalog.reviewed_at,method:"source-attributed",language_keys:["bg","en"],
   source_access_note:{...accessNote}}
 };
}
export function applyDisclosureZoneEditorialAnnotations(archive,catalog){
 if(!archive||!Array.isArray(archive.cases))throw Error("Invalid archive for disclosure.zone annotations");
 const valid=validateDisclosureZoneEditorialAnnotations(catalog);
 return {...archive,cases:archive.cases.map(record=>applyDisclosureZoneEditorialAnnotation(record,valid))};
}
