/* On-demand public-case translations. Only approved source cases can be translated;
 * source URLs, locations, assessment and media are never AI-translated or changed.
 * No partial story is advertised as fully translated, and incomplete work is
 * never cached in the Cloudflare edge Cache API. */
import {NEWS_LANGUAGES,normalizeTargetLanguage} from "../_lib/news-translation.js";
const MODEL="@cf/meta/m2m100-1.2b";
const CACHE_REVISION="public-case-l10n-v3-completeness";
const MAX_DETAIL=18;
const MAX_SOURCE_CHARS=4000;
const ID=/^[a-z0-9-]{3,90}$/;
const headers={"X-Content-Type-Options":"nosniff","Vary":"Accept-Encoding"};
const result=(data,status=200,cache="no-store")=>Response.json(data,{status,headers:{...headers,"Cache-Control":cache}});
const nonempty=(x,max=6000)=>typeof x==="string"&&x.trim().length>=2&&x.length<=max;
const storyComplete=(story,original)=>Array.isArray(story)&&story.length===original.length&&
 story.every(s=>nonempty(s,6000));
const authoredBgComplete=story=>Array.isArray(story)&&story.length>=3&&
 story.every(s=>nonempty(s,6000));
export function selectPublicCase(cases,id){
 return Array.isArray(cases)?cases.find(c=>c?.id===id&&c?.private!==true&&c?.public!==false&&
  typeof c?.source?.url==="string"&&/^https:\/\//.test(c.source.url))??null:null;
}
export async function translatePublishedCase(record,lang,ai,{detail=false,seed=null}={}){
 if(!NEWS_LANGUAGES.has(lang))return {status:"unavailable"};
 const src=record?.title?.en||record?.title?.bg;
 const sum=record?.summary?.en||record?.summary?.bg;
 const originalStory=Array.isArray(record?.story?.en)?record.story.en:[];
 if(!nonempty(src,750)||!nonempty(sum,6000))return {status:"unavailable"};
 const legacyPlaceholder=lang==="bg"&&(
  /(?:е случай, описан в публичния каталог|Публикуваните сведения се отнасят|Маркерът, ако има такъв)/i.test(String(record?.summary?.bg||""))||
  (record?.story?.bg||[]).some(x=>/^EN\s*[·:]/.test(String(x))||/Следва оригиналното описание на английски/.test(String(x)))
 );
 const nativeTitle=legacyPlaceholder?null:record.title?.[lang];
 const nativeSummary=legacyPlaceholder?null:record.summary?.[lang];
 const nativeStory=legacyPlaceholder?null:record.story?.[lang];
 if(nonempty(nativeTitle,750)&&nonempty(nativeSummary,6000)&&
   (!detail||(lang==="bg"&&!legacyPlaceholder?
    authoredBgComplete(nativeStory):storyComplete(nativeStory,originalStory)))){
  return {status:"original",source_language:lang,target_language:lang,
   title:nativeTitle,summary:nativeSummary,story:detail?[...nativeStory]:undefined};
 }
 // A previously successful, case-ID-matched summary translation may be reused
 // by the detailed dossier request; it is never treated as evidence or as story text.
 const cached=seed?.status==="translated"&&seed?.target_language===lang?seed:null;
 const translated={
  title:nonempty(nativeTitle,750)?nativeTitle:(nonempty(cached?.title,750)?cached.title:""),
  summary:nonempty(nativeSummary,6000)?nativeSummary:(nonempty(cached?.summary,6000)?cached.summary:""),
  story:detail?Array.from({length:originalStory.length},()=>null):undefined
 };
 const jobs=[];
 if(!translated.title)jobs.push({field:"title",text:src});
 if(!translated.summary)jobs.push({field:"summary",text:sum});
 if(detail)originalStory.forEach((text,i)=>jobs.push({field:"story",i,text}));
 let failed=0;
 // Three concurrent model calls at most; no truncation of published paragraphs.
 // Oversized or failed paragraphs become null and force an honest partial result.
 let next=0;
 async function worker(){
  while(next<jobs.length){
   const job=jobs[next++];
   if(!ai||typeof ai.run!=="function"||!nonempty(job.text,MAX_SOURCE_CHARS)){
    failed++;continue;
   }
   try{
    const response=await ai.run(MODEL,{text:job.text,source_lang:"en",target_lang:normalizeTargetLanguage(lang)});
    const value=typeof response?.translated_text==="string"?response.translated_text.trim():"";
    if(!nonempty(value,6000)||value.length>Math.max(750,job.text.length*3))throw Error("bad_translation");
    if(job.field==="story")translated.story[job.i]=value;
    else translated[job.field]=value;
   }catch{failed++}
  }
 }
 await Promise.all(Array.from({length:Math.min(3,jobs.length)},()=>worker()));
 if(!translated.title||!translated.summary)
  return {status:"unavailable",source_language:"en",target_language:lang};
 const complete=!detail||(
  originalStory.length<=MAX_DETAIL&&storyComplete(translated.story,originalStory));
 return {
  status:failed||!complete?"partial":"translated",
  source_language:"en",target_language:lang,
  title:translated.title,summary:translated.summary,
  story:translated.story
 };
}
const cacheKey=(id,lang,detail)=>new Request(
 "https://aurora-cache.invalid/translation/"+CACHE_REVISION+"/"+
 encodeURIComponent(id)+"/"+lang+"/"+Number(detail)
);
export async function onRequestGet({request,env,ctx}){
 const url=new URL(request.url);
 const id=url.searchParams.get("id"),lang=url.searchParams.get("lang");
 const detail=url.searchParams.get("detail")==="1";
 if(!ID.test(id||"")||!NEWS_LANGUAGES.has(lang)||
  ![null,"0","1"].includes(url.searchParams.get("detail")))
  return result({error:"invalid_case_translation_request"},400);
 if(lang==="en")return result({status:"original",source_language:"en",target_language:"en"});
 let cache=null,summarySeed=null;
 const key=cacheKey(id,lang,detail);
 try{
  if(typeof caches!=="undefined")cache=caches.default;
  const hit=await cache?.match(key);if(hit)return hit;
  if(detail){
   const prior=await cache?.match(cacheKey(id,lang,false));
   const data=prior?await prior.json():null;
   if(data?.id===id&&data?.target_language===lang&&data.status==="translated"&&
      nonempty(data.title,750)&&nonempty(data.summary,6000))summarySeed=data;
  }
 }catch{/* Cold POP or unavailable cache cannot block public content. */}
 let data;
 try{
  const file=await env?.ASSETS?.fetch(new Request(new URL("/data/cases.json",url)));
  if(!file?.ok)return result({status:"unavailable",source_language:"en"},503);
  data=await file.json();
 }catch{return result({status:"unavailable",source_language:"en"},503)}
 const record=selectPublicCase(data?.cases,id);
 if(!record)return result({error:"case_not_found"},404);
 const translated=await translatePublishedCase(record,lang,env?.AI,{detail,seed:summarySeed});
 if(translated.status==="unavailable")return result(translated,503);
 const out=result({...translated,id},200,
  translated.status==="partial"?"no-store":"public, max-age=3600, s-maxage=604800");
 if(cache&&ctx?.waitUntil&&["translated","original"].includes(translated.status))
  ctx.waitUntil(cache.put(key,out.clone()).catch(()=>{}));
 return out;
}
