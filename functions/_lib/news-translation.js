// Translate sourced headlines and optional article summaries only.
// Never accept arbitrary user-provided text or invent article content.
export const NEWS_LANGUAGES=new Set(["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ko"]);
export const PAGE_SIZE=12;
const MODEL="@cf/meta/m2m100-1.2b";
const MAX_CACHE_ENTRIES=600;
const memoryCache=new Map();

export function normalizeTargetLanguage(target){
 return target==="zh-CN"?"zh":String(target||"en").split("-")[0];
}

export function detectHeadlineLanguage(text,fallback="en"){
 const s=String(text||"");
 if(/[\u3040-\u30ff]/.test(s))return "ja";
 if(/[\uac00-\ud7af]/.test(s))return "ko";
 if(/[\u4e00-\u9fff]/.test(s))return "zh";
 if(/[\u0600-\u06ff]/.test(s))return "ar";
 if(/[\u0370-\u03ff]/.test(s))return "el";
 if(/[\u0400-\u04ff]/.test(s)){
  if(/[іїєґ]/i.test(s))return "uk";
  if(/[ђјљњћџ]/i.test(s))return "sr";
  if(/[ыэъё]/i.test(s))return "ru";
  return fallback==="ru"||fallback==="uk"||fallback==="sr"?fallback:"bg";
 }
 return String(fallback||"en").split("-")[0]||"en";
}

function cacheKey(source,target,field,text){
 return `${source}:${target}:${field}:${text}`;
}

export function getCachedTranslation(source,target,field,text){
 const key=cacheKey(source,target,field,text);
 if(!memoryCache.has(key))return null;
 const val=memoryCache.get(key);
 memoryCache.delete(key);
 memoryCache.set(key,val);
 return val;
}

function setCachedTranslation(source,target,field,text,translated){
 const key=cacheKey(source,target,field,text);
 if(memoryCache.has(key))memoryCache.delete(key);
 memoryCache.set(key,translated);
 if(memoryCache.size>MAX_CACHE_ENTRIES){
  const oldest=memoryCache.keys().next().value;
  if(oldest!==undefined)memoryCache.delete(oldest);
 }
}

export function clearTranslationCache(){
 memoryCache.clear();
}

export async function translateNewsPage(items,target,offset,ai){
 const copy=items.map(item=>({...item})),todo=[];
 const requested=normalizeTargetLanguage(target);
 let cachedHits=0;
 for(let i=offset;i<Math.min(copy.length,offset+PAGE_SIZE);i++){
  const item=copy[i];
  const rawTitle=typeof item.title==="string"?item.title.trim():"";
  if(!rawTitle)continue;
  const source=detectHeadlineLanguage(rawTitle,item.language||"en");
  item.source_language=source;
  if(source===requested)continue;
  const rawSummary=typeof item.summary==="string"?item.summary.trim():"";
  const cachedTitle=getCachedTranslation(source,requested,"title",rawTitle.slice(0,240));
  const cachedSummary=rawSummary?getCachedTranslation(source,requested,"summary",rawSummary.slice(0,360)):null;
  if(cachedTitle){
   item.translated_title=cachedTitle;
   if(rawSummary&&cachedSummary)item.translated_summary=cachedSummary;
   if(!rawSummary||cachedSummary){cachedHits++;continue}
  }
  todo.push({item,source,rawTitle,rawSummary,cachedTitle});
 }
 if(!todo.length){
  return {items:copy,translation:{target,status:cachedHits?"translated":"original",translated:cachedHits,cached:cachedHits}};
 }
 if(!ai||typeof ai.run!=="function"){
  return {items:copy,translation:{target,status:cachedHits?"partial":"unavailable",translated:cachedHits,cached:cachedHits}};
 }
 let pointer=0,translated=cachedHits,failed=0;
 async function worker(){
  while(pointer<todo.length){
   const task=todo[pointer++];
   try{
    let titleOk=Boolean(task.cachedTitle);
    if(!titleOk){
     const result=await ai.run(MODEL,{
      text:task.rawTitle.slice(0,240),source_lang:task.source,target_lang:requested
     });
     const answer=typeof result?.translated_text==="string"?result.translated_text.trim():"";
     if(answer.length>=2&&answer.length<=600){
      task.item.translated_title=answer;
      setCachedTranslation(task.source,requested,"title",task.rawTitle.slice(0,240),answer);
      titleOk=true;
     }
    }
    if(titleOk&&task.rawSummary){
     try{
      const sumRes=await ai.run(MODEL,{
       text:task.rawSummary.slice(0,360),source_lang:task.source,target_lang:requested
      });
      const sumAns=typeof sumRes?.translated_text==="string"?sumRes.translated_text.trim():"";
      if(sumAns.length>=2&&sumAns.length<=900){
       task.item.translated_summary=sumAns;
       setCachedTranslation(task.source,requested,"summary",task.rawSummary.slice(0,360),sumAns);
      }
     }catch{/* summary translation failure must not discard translated title */}
    }
    if(titleOk)translated++;
    else failed++;
   }catch{failed++}
  }
 }
 await Promise.all(Array.from({length:Math.min(3,todo.length)},()=>worker()));
 return {items:copy,translation:{
  target,status:failed?(translated?"partial":"unavailable"):(translated?"translated":"original"),translated,cached:cachedHits
 }};
}
