// Public headlines only: linked Google News RSS search results, NOT verified UAP cases.
// Fixed upstream feeds, no arbitrary network URLs, no private user data.
const EDITIONS={
  global:[
    {q:'("UAP" OR "UFO" OR "unidentified anomalous phenomena") when:14d',hl:'en-US',gl:'US',ceid:'US:en'},
    {q:'("unidentified aerial phenomena" OR "AARO" OR "UAP hearing") when:30d',hl:'en-GB',gl:'GB',ceid:'GB:en'},
    {q:'("OVNI" OR "UFO sighting" OR "UAP report") when:14d',hl:'es-ES',gl:'ES',ceid:'ES:es'},
    {q:'("НЛО" OR "неидентифициран летящ обект") when:30d',hl:'bg',gl:'BG',ceid:'BG:bg'}
  ],
  bulgaria:[{q:'("НЛО" OR "неидентифициран летящ обект" OR "необяснимо явление") when:30d',hl:'bg',gl:'BG',ceid:'BG:bg'}],
  official:[{q:'("AARO" OR "unidentified anomalous phenomena" OR "UAP congressional hearing") when:30d',hl:'en-US',gl:'US',ceid:'US:en'}]
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
  if(age>45*86400000||age< -2*86400000)return null;
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
  return parseNewsRss(xml);
 }));
 const results=fetched.flatMap(x=>x.status==="fulfilled"?x.value:[]);
 const seen=new Set();
 return results.filter(x=>{
  const key=x.title.toLocaleLowerCase().replace(/\W/g,"").slice(0,110);
  if(seen.has(key))return false;
  seen.add(key);return true;
 }).sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,100);
}
export async function onRequestGet({request,env,ctx}){
 const edition=new URL(request.url).searchParams.get("edition")||"global";
 if(!Object.hasOwn(EDITIONS,edition))return Response.json({error:"invalid_edition"},{status:400});
 const cacheKey=new Request("https://aurora-cache.invalid/news/"+edition);
 let cache;try{cache=caches.default;const found=await cache.match(cacheKey);if(found)return found}catch{}
 const items=await fetchHeadlines(edition);
 if(!items.length)return Response.json({status:"unavailable",error:"news_source_unavailable",items:[]},{status:503,headers:{"Cache-Control":"no-store"}});
 const out=Response.json({status:"live",edition,updated_at:new Date().toISOString(),count:items.length,items,disclaimer:"Third-party headlines. A headline is not verification of a UAP claim."},{headers:{"Cache-Control":"public, max-age=60, s-maxage=900","X-Content-Type-Options":"nosniff"}});
 if(cache&&ctx?.waitUntil)ctx.waitUntil(cache.put(cacheKey,out.clone()).catch(()=>{}));
 return out;
}
