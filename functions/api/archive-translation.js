/* On-demand public archive translation using the same optional Workers AI binding
 * as the AURORA news feed. Translates ONLY published, source-attributed case fields;
 * never arbitrary user text, private intake, publisher names or evidence links. */
import {NEWS_LANGUAGES,normalizeTargetLanguage} from "../_lib/news-translation.js";
const MODEL="@cf/meta/m2m100-1.2b";
const CACHE_REVISION="public-case-l10n-v1";
const MAX_DETAIL=6;
const ID=/^[a-z0-9-]{3,90}$/;
const headers={"X-Content-Type-Options":"nosniff","Vary":"Accept-Encoding"};
const result=(data,status=200,cache="no-store")=>Response.json(data,{status,headers:{...headers,"Cache-Control":cache}});
export function selectPublicCase(cases,id){
 return Array.isArray(cases)?cases.find(c=>c?.id===id&&c?.private!==true&&c?.public!==false&&
  typeof c?.source?.url==="string"&&/^https:\/\//.test(c.source.url))??null:null;
}
export async function translatePublishedCase(record,lang,ai,{detail=false}={}){
 const src=record?.title?.en||record?.title?.bg;
 const sum=record?.summary?.en||record?.summary?.bg;
 const originalStory=Array.isArray(record?.story?.en)?record.story.en:[];
 if(typeof src!=="string"||!src.trim()||typeof sum!=="string")return {status:"unavailable"};
 const nativeTitle=record.title?.[lang],nativeSummary=record.summary?.[lang];
 if(nativeTitle&&nativeSummary&&(!detail||Array.isArray(record.story?.[lang])))
  return {status:"original",title:nativeTitle,summary:nativeSummary,story:detail?(record.story[lang]||[]):undefined};
 if(!ai||typeof ai.run!=="function")return {status:"unavailable",source_language:"en"};
 const target=normalizeTargetLanguage(lang);
 const jobs=[["title",src,240],["summary",sum,1600]];
 if(detail)originalStory.slice(0,MAX_DETAIL).forEach((line,i)=>{if(typeof line==="string"&&line.trim())jobs.push(["story_"+i,line,1800])});
 const translated={title:nativeTitle||"",summary:nativeSummary||"",story:[]};
 let successes=0,failures=0;
 // Bound all text and sequential calls to limit Workers AI consumption per request.
 for(const [name,text,max] of jobs){
  if((name==="title"&&nativeTitle)||(name==="summary"&&nativeSummary))continue;
  if(!String(text).trim())continue;
  try{
   const reply=await ai.run(MODEL,{text:String(text).slice(0,max),source_lang:"en",target_lang:target});
   const value=typeof reply?.translated_text==="string"?reply.translated_text.trim():"";
   if(value.length<2||value.length>max*3)throw Error("invalid_translation");
   if(name.startsWith("story_"))translated.story[Number(name.slice(6))]=value;
   else translated[name]=value;
   successes++;
  }catch{failures++;}
 }
 const story=detail?originalStory.slice(0,MAX_DETAIL).map((item,i)=>translated.story[i]||null):undefined;
 if(!translated.title||!translated.summary)return {status:"unavailable",source_language:"en"};
 return {status:failures?"partial":"translated",source_language:"en",target_language:lang,
  title:translated.title,summary:translated.summary,story};
}
export async function onRequestGet({request,env,ctx}){
 const url=new URL(request.url);
 const id=url.searchParams.get("id"),lang=url.searchParams.get("lang");
 const detail=url.searchParams.get("detail")==="1";
 if(!ID.test(id||"")||!NEWS_LANGUAGES.has(lang)||![null,"0","1"].includes(url.searchParams.get("detail")))
  return result({error:"invalid_case_translation_request"},400);
 if(lang==="en")return result({status:"original",source_language:"en",target_language:"en"});
 const cacheKey=new Request("https://aurora-cache.invalid/translation/"+CACHE_REVISION+"/"+encodeURIComponent(id)+"/"+lang+"/"+Number(detail));
 let cache=null;try{if(typeof caches!=="undefined")cache=caches.default;const hit=await cache?.match(cacheKey);if(hit)return hit}catch{}
 let data;
 try{
  const file=await env?.ASSETS?.fetch(new Request(new URL("/data/cases.json",url)));
  if(!file?.ok)return result({status:"unavailable",source_language:"en"},503);
  data=await file.json();
 }catch{return result({status:"unavailable",source_language:"en"},503)}
 const record=selectPublicCase(data?.cases,id);
 if(!record)return result({error:"case_not_found"},404);
 const translated=await translatePublishedCase(record,lang,env?.AI,{detail});
 if(translated.status==="unavailable")return result(translated,503);
 const out=result({...translated,id},200,"public, max-age=3600, s-maxage=604800");
 if(cache&&ctx?.waitUntil&&["translated","original"].includes(translated.status))
  ctx.waitUntil(cache.put(cacheKey,out.clone()).catch(()=>{}));
 return out;
}
