/* Source-safe, purely declarative normalization for every AURORA public dossier.
 * No media extraction or invented copy. Renderer uses textContent for all strings. */
(function(root){
 "use strict";
 const safeUrl=value=>{
  try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port?u.href:null}catch{return null}
 };
 const text=(value,max=2000)=>typeof value==="string"?value.trim().slice(0,max):"";
 const localized=(value,lang)=>{
  if(typeof value==="string")return text(value);
  if(value&&typeof value==="object")return text(value[lang]||value[lang.split("-")[0]]||value.en||value.bg);
  return "";
 };
 const isPublicResource=record=>record&&typeof record==="object"&&record.private!==true&&record.public!==false;
 function sources(c,lang="en"){
  const candidates=[];
  const sourceIsSecondary=c?.source_verification_status==="SECONDARY_ATTRIBUTED"||
   c?.provenance?.source_kind==="licensed secondary case compilation";
  if(c?.source_url||c?.source?.url)candidates.push({
   url:c.source_url||c.source.url,
   name:c.source_name||c.source?.name||"",
   type:sourceIsSecondary?"secondary":"primary"
  });
  for(const item of Array.isArray(c?.sources)?c.sources:[]){
   if(!isPublicResource(item))continue;
   candidates.push({url:item.url,name:localized(item.title,lang)||localized(item.name,lang)||text(item.publisher,180),type:text(item.type,35)||"reference",date:text(item.date,45)});
  }
  for(const item of Array.isArray(c?.media)?c.media:[]){
   if(!isPublicResource(item)||!["documents","archive","video"].includes(item.type))continue;
   candidates.push({url:item.url,name:localized(item.title,lang)||(item.type==="video"?"Published video":"Published document"),type:item.type});
  }
  const seen=new Set(),out=[];
  for(const item of candidates){
   const url=safeUrl(item.url);
   if(!url||seen.has(url))continue;
   seen.add(url);out.push({...item,url,name:text(item.name,200)||new URL(url).hostname});
   if(out.length>=60)break;
  }
  return out;
 }
 function sourceVerification(c,lang="en"){
  const status=c?.source_verification_status||c?.provenance?.source_verification_status;
  if(!["PRIMARY_VERIFIED","SECONDARY_ATTRIBUTED","INSUFFICIENT_SOURCE"].includes(status))return null;
  return {status,note:localized(c?.source_verification_note,lang)};
 }
 function sourceAccessNotice(c,lang="en"){
  const note=localized(c?.editorial_review?.source_access_note,lang);
  if(!note)return null;
  return {note,reviewedAt:text(c?.editorial_review?.reviewed_at,20)};
 }
 function timeline(c,lang="en"){
  const out=[];
  for(const item of Array.isArray(c?.timeline)?c.timeline:[]){
   if(!isPublicResource(item))continue;
   const title=localized(item.title,lang);
   const description=localized(item.description,lang)||localized(item.summary,lang);
   const date=text(item.date,50);
   if(!title&&!description)continue;
   out.push({title,description,date,kind:text(item.kind,32),url:safeUrl(item.source_url||item.url)});
   if(out.length>=50)break;
  }
  return out;
 }
 function media(c){
  const seen=new Set(),out=[];
  for(const item of Array.isArray(c?.media)?c.media:[]){
   if(!isPublicResource(item)||!["video","photo","documents","archive"].includes(item.type))continue;
   const url=safeUrl(item.url);if(!url)continue;
   const key=item.type+"|"+url;
   if(seen.has(key))continue;
   seen.add(key);
   out.push({...item,url});
   if(out.length>=60)break;
  }
  return out;
 }
 function photoPreview(item){
  if(item?.type!=="photo")return null;
  const photo=item.preview||item.image;
  if(!photo||photo.rights_status!=="verified"||photo.hosting_permission!==true||
    !["public_domain","license","written_permission"].includes(photo.authorization_type))return null;
  const url=safeUrl(photo.url);
  if(!url||!/\.(?:png|jpe?g|webp|avif)$/i.test(new URL(url).pathname))return null;
  const evidence=safeUrl(photo.rights_evidence_url);
  if(!evidence)return null;
  if(photo.authorization_type==="license"&&!safeUrl(photo.license_url))return null;
  return {url,attribution:text(photo.attribution,240)||text(item.source_name,240),
   evidence,license:photo.authorization_type==="license"?safeUrl(photo.license_url):null};
 }
 root.AURORA_DOSSIER_CONTENT={sources,sourceVerification,sourceAccessNotice,timeline,media,photoPreview,safeUrl,localized};
})(globalThis);
