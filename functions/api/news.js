import {NEWS_LANGUAGES,PAGE_SIZE,translateNewsPage} from "../_lib/news-translation.js";
// Public headlines only: linked Google News RSS search results, NOT verified UAP cases.
// Fixed upstream feeds, no arbitrary network URLs, no private user data.
// Independent source regions improve global coverage without invented articles.
const EDITIONS={
 global:[
  {q:'(UAP OR UFO OR "unidentified anomalous phenomena") when:30d',hl:'en-US',gl:'US',ceid:'US:en'},
  {q:'("UFO sighting" OR "UAP hearing" OR "AARO") when:60d',hl:'en-GB',gl:'GB',ceid:'GB:en'},
  {q:'("OVNI" OR "fenómeno aéreo no identificado") when:45d',hl:'es-ES',gl:'ES',ceid:'ES:es'},
  {q:'("НЛО" OR "неидентифициран обект") when:60d',hl:'bg',gl:'BG',ceid:'BG:bg'},
  {q:'("OVNI" OR "phénomène aérien non identifié") when:45d',hl:'fr-FR',gl:'FR',ceid:'FR:fr'},
  {q:'("UFO" OR "UAP" OR "unbekanntes Flugobjekt") when:45d',hl:'de-DE',gl:'DE',ceid:'DE:de'},
  {q:'("OVNI" OR "UFO avvistamento") when:45d',hl:'it-IT',gl:'IT',ceid:'IT:it'},
  {q:'("OVNI" OR "objeto voador não identificado") when:45d',hl:'pt-BR',gl:'BR',ceid:'BR:pt'},
  {q:'("UFO" OR "未確認飛行物体") when:45d',hl:'ja',gl:'JP',ceid:'JP:ja'},
  {q:'("UFO" OR "НЛО" OR "аномальные явления") when:45d',hl:'ru',gl:'RU',ceid:'RU:ru'}
 ],
 bulgaria:[
  {q:'("НЛО" OR "неидентифициран летящ обект") when:75d',hl:'bg',gl:'BG',ceid:'BG:bg'},
  {q:'("необяснима светлина" OR "необичаен обект" OR "UAP") when:75d',hl:'bg',gl:'BG',ceid:'BG:bg'}
 ],
 official:[
  {q:'("AARO" OR "UAP hearing" OR "unidentified anomalous phenomena") when:75d',hl:'en-US',gl:'US',ceid:'US:en'},
  {q:'("UAP" OR "UFO" OR "Pentagon footage") when:75d',hl:'en-GB',gl:'GB',ceid:'GB:en'}
 ]
};
const decode=s=>String(s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
 .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==="x"?parseInt(v.slice(1),16):Number(v);return n>0&&n<=0x10ffff?String.fromCodePoint(n):""})
 .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,v=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&nbsp;":" "}[v]))
 .replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();
const field=(s,n)=>s.match(new RegExp("<"+n+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+n+">","i"))?.[1]||"";
export function parseNewsRss(xml){
 if(typeof xml!=="string"||xml.length>800000||!/<(?:rss|feed)\b/i.test(xml))return [];
 return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0,120).map(([,raw])=>{
  const title=decode(field(raw,"title")).slice(0,240);
  const url=decode(field(raw,"link"));
  const source=decode(field(raw,"source")).slice(0,100)||"Google News";
  const ms=Date.parse(decode(field(raw,"pubDate")));
  if(title.length<8||!/^https:\/\/[^\s<>]+$/.test(url)||!Number.isFinite(ms))return null;
  const age=Date.now()-ms;
  if(age>76*86400000||age< -2*86400000)return null;
  return {title,url,source,published:new Date(ms).toISOString()};
 }).filter(Boolean);
}
export async function fetchHeadlines(edition,fetcher=fetch){
 const cfg=EDITIONS[edition];if(!cfg)return null;
 const fetched=await Promise.allSettled(cfg.map(async f=>{
  const url=new URL("https://news.google.com/rss/search");
  for(const [k,v] of Object.entries(f))url.searchParams.set(k,v);
  const r=await fetcher(url.toString(),{headers:{Accept:"application/rss+xml, application/xml"},signal:AbortSignal.timeout(9000)});
  if(!r.ok)throw Error("upstream_"+r.status);
  const xml=await r.text();
  return parseNewsRss(xml).map(item=>({...item,language:f.hl.split("-")[0]}));
 }));
 const results=fetched.flatMap(x=>x.status==="fulfilled"?x.value:[]);
 const seen=new Set();
 return results.filter(x=>{
  const key=x.title.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,"").slice(0,150);
  if(seen.has(key))return false;
  seen.add(key);return true;
 }).sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,200);
}
const FRESH_AGE=900;
const FALLBACK_AGE=43200;
const response=(data,age)=>Response.json(data,{headers:{
 "Cache-Control":"public, max-age=60, s-maxage="+age,
 "X-Content-Type-Options":"nosniff"
}});
async function getRawNews({request,ctx}){
 const edition=new URL(request.url).searchParams.get("edition")||"global";
 if(!Object.hasOwn(EDITIONS,edition))return Response.json({error:"invalid_edition"},{status:400});
 const key=new Request("https://aurora-cache.invalid/news/fresh/"+edition);
 const backup=new Request("https://aurora-cache.invalid/news/last-good/"+edition);
 let cache;try{
  if(typeof caches!=="undefined")cache=caches.default;
  const saved=cache&&await cache.match(key);if(saved)return saved;
 }catch{}
 const items=await fetchHeadlines(edition);
 if(items.length){
  const payload={status:"live",edition,updated_at:new Date().toISOString(),count:items.length,items};
  const out=response(payload,FRESH_AGE);
  if(cache&&ctx?.waitUntil)ctx.waitUntil(Promise.all([
   cache.put(key,out.clone()).catch(()=>{}),
   cache.put(backup,response(payload,FALLBACK_AGE)).catch(()=>{})
  ]));
  return out;
 }
 if(cache){
  try{
   const saved=await cache.match(backup);
   if(saved){
    const payload=await saved.json();
    const age=Date.now()-Date.parse(payload.updated_at);
    if(age>=0&&age<FALLBACK_AGE*1000&&Array.isArray(payload.items)&&payload.items.length){
     return response({...payload,status:"cached"},120);
    }
   }
  }catch{}
 }
 return Response.json({status:"unavailable",error:"news_source_unavailable",items:[]},{status:503,headers:{"Cache-Control":"no-store"}});
}

// Optional server translation is restricted to fixed, fetched news headlines.
export async function onRequestGet({request,env,ctx}){
 const u=new URL(request.url),lang=u.searchParams.get("lang");
 if(lang!==null&&!NEWS_LANGUAGES.has(lang))
  return Response.json({error:"unsupported_language"},{status:400});
 const offsetValue=u.searchParams.get("offset")||"0";
 if(!/^(0|[1-9]\d{0,2})$/.test(offsetValue)||Number(offsetValue)>192||Number(offsetValue)%PAGE_SIZE!==0)
  return Response.json({error:"invalid_translation_offset"},{status:400});
 const original=await getRawNews({request,ctx});
 if(lang===null||original.status!==200)return original;
 const data=await original.clone().json(),offset=Number(offsetValue);
 if(!Array.isArray(data.items))return original;
 const edition=u.searchParams.get("edition")||"global";
 const key=new Request("https://aurora-cache.invalid/news/translated/v1/"+
  encodeURIComponent(edition)+"/"+encodeURIComponent(lang)+"/"+offset+"/"+encodeURIComponent(data.updated_at||"unknown"));
 let cache;
 try{
  if(typeof caches!=="undefined")cache=caches.default;
  if(cache){const found=await cache.match(key);if(found)return found}
 }catch{}
 const {items,translation}=await translateNewsPage(data.items,lang,offset,env?.AI);
 const out=Response.json({...data,items,translation},{headers:{
  "Cache-Control":"public, max-age=60, s-maxage=900","X-Content-Type-Options":"nosniff"
 }});
 // Fail open: do not cache outages. When AI is connected later, it takes effect.
 if(cache&&ctx?.waitUntil&&["translated","original"].includes(translation.status))
  ctx.waitUntil(cache.put(key,out.clone()).catch(()=>{}));
 return out;
}
