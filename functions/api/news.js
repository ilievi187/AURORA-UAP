import {NEWS_LANGUAGES,PAGE_SIZE,translateNewsPage} from "../_lib/news-translation.js";
import {DISCOVERY_TOTAL_LIMIT,discoverMatches} from "../_lib/discovery.js";
import {dedupeHeadlines} from "../_lib/headline-dedup.js";
import {SOURCE_CATALOG} from "../_lib/source-catalog.js";
// Public headlines from Google News and checked publisher feeds, NOT verified UAP cases.
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
const XML_NAMESPACE="http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE="http://www.w3.org/2000/xmlns/";
const MAX_RSS_XML_BYTES=800000,MAX_RSS_XML_CHUNKS=4096,MAX_RSS_XML_NODES=10000,MAX_RSS_XML_DEPTH=64;
const MAX_RSS_XML_ATTRIBUTES_PER_ELEMENT=64,MAX_RSS_XML_ATTRIBUTES=4096,MAX_RSS_NAMESPACE_DECLARATIONS=256;
const decode=s=>String(s||"").replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==="x"?parseInt(v.slice(1),16):Number(v);return n>=0&&n<=0x10ffff?String.fromCodePoint(n):""})
 .replace(/&(amp|lt|gt|quot|apos);/g,(_,name)=>({amp:"&",lt:"<",gt:">",quot:'"',apos:"'"}[name]));
const xmlText=node=>node?node.parts.map(part=>typeof part==="string"?decode(part):part.type==="cdata"?part.value:xmlText(part)).join("").replace(/\s+/g," ").trim():"";
const cancelBody=response=>{try{const pending=response.body?.cancel?.();if(pending&&typeof pending.catch==="function")pending.catch(()=>{})}catch{}};
const cancelReader=reader=>{try{const pending=reader.cancel();if(pending&&typeof pending.catch==="function")pending.catch(()=>{})}catch{}};
async function readLimitedResponseText(response){
 const contentLength=response.headers?.get?.("content-length")||"";
 if(/^\d+$/.test(contentLength)&&Number(contentLength)>MAX_RSS_XML_BYTES){
  cancelBody(response);
  return null;
 }
 const body=response.body;
 if(!body||typeof body.getReader!=="function")return null;
 const reader=body.getReader(),bytes=new Uint8Array(MAX_RSS_XML_BYTES);let total=0,chunks=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   if(++chunks>MAX_RSS_XML_CHUNKS||total+value.byteLength>MAX_RSS_XML_BYTES){cancelReader(reader);return null}
   bytes.set(value,total);total+=value.byteLength;
  }
  const contentType=response.headers?.get?.("content-type")||"";
  const charset=/\bcharset\s*=\s*["']?([^;"'\s]+)/i.exec(contentType)?.[1]||"utf-8";
  try{return new TextDecoder(charset).decode(bytes.subarray(0,total))}catch{return null}
 }catch(error){cancelReader(reader);throw error}
}
export function parseNewsRss(xml,document=tokenizeRss(xml)){
 if(!document)return [];
 return document.channel.parts.filter(node=>node.type==="element"&&node.name==="item").slice(0,120).map(item=>{
  const value=name=>xmlText(item.parts.find(node=>node.type==="element"&&node.name===name));
  const title=value("title").slice(0,240);
  const url=value("link");
  const source=value("source").slice(0,100)||"Google News";
  const ms=Date.parse(value("pubDate"));
  if(title.length<8||!/^https:\/\/[^\s<>]+$/.test(url)||!Number.isFinite(ms))return null;
  const age=Date.now()-ms;
  if(age>76*86400000||age< -2*86400000)return null;
  return {title,url,source,published:new Date(ms).toISOString()};
 }).filter(Boolean);
}
function tokenizeRss(xml){
 if(typeof xml!=="string"||xml.length>MAX_RSS_XML_BYTES)return null;
 for(let i=0;i<xml.length;i++){
  const point=xml.codePointAt(i);if(point>0xffff)i++;
  if(!(point===9||point===10||point===13||(point>=32&&point<=0xd7ff)||(point>=0xe000&&point<=0xfffd)||(point>=0x10000&&point<=0x10ffff)))return null;
 }
 let source=xml;if(source.charCodeAt(0)===0xfeff)source=source.slice(1);
 let cursor=0,roots=0,nodes=0,totalAttributes=0,namespaceDeclarations=0,root=null,channel=null,channelCount=0,xmlDeclaration=false;
 const stack=[];
 const baseNamespaces={parent:null,bindings:{xml:XML_NAMESPACE}};
 const skipSpace=()=>{const start=cursor;while(/[\t\r\n ]/.test(source[cursor]||""))cursor++;return cursor>start};
 const readName=()=>{
  const match=/^[A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?/.exec(source.slice(cursor));
  if(!match)return "";cursor+=match[0].length;return match[0];
 };
 const validReferences=text=>{
  for(let i=0;i<text.length;i++)if(text[i]==="&"){
   const end=text.indexOf(";",i+1);if(end<0)return false;
   const ref=text.slice(i+1,end);
   if(["amp","lt","gt","apos","quot"].includes(ref)){i=end;continue}
   let point;
   if(/^#\d+$/.test(ref))point=Number(ref.slice(1));
   else if(/^#x[0-9a-fA-F]+$/.test(ref))point=parseInt(ref.slice(2),16);
   else return false;
   if(!(point===9||point===10||point===13||(point>=32&&point<=0xd7ff)||(point>=0xe000&&point<=0xfffd)||(point>=0x10000&&point<=0x10ffff)))return false;
   i=end;
  }
  return true;
 };
 const resolveNamespace=(scope,prefix)=>{
  for(let current=scope;current;current=current.parent)
   if(Object.prototype.hasOwnProperty.call(current.bindings,prefix))return current.bindings[prefix];
  return null;
 };
 const expandedName=(qname,namespaces,isAttribute)=>{
  const separator=qname.indexOf(":");
  if(separator<0)return [isAttribute?"":(resolveNamespace(namespaces,"")||""),qname];
  if(separator===0||separator===qname.length-1||qname.indexOf(":",separator+1)>=0)return null;
  const prefix=qname.slice(0,separator),uri=resolveNamespace(namespaces,prefix);
  return uri?[uri,qname.slice(separator+1)]:null;
 };
 while(cursor<source.length){
  if(source[cursor]!=="<"){
   const end=source.indexOf("<",cursor),stop=end<0?source.length:end,text=source.slice(cursor,stop);
   if(!stack.length&&!/^[\t\r\n ]*$/.test(text))return null;
   if(text.includes("]]>")||!validReferences(text))return null;
   if(stack.length)stack[stack.length-1].node.parts.push(text);
   cursor=stop;continue;
  }
  if(source.startsWith("<!--",cursor)){
   const end=source.indexOf("-->",cursor+4);if(end<0)return null;
   const comment=source.slice(cursor+4,end);if(comment.includes("--")||comment.endsWith("-"))return null;
   cursor=end+3;continue;
  }
  if(source.startsWith("<![CDATA[",cursor)){
   if(!stack.length)return null;
   const end=source.indexOf("]]>",cursor+9);if(end<0)return null;
   stack[stack.length-1].node.parts.push({type:"cdata",value:source.slice(cursor+9,end)});
   cursor=end+3;continue;
  }
  if(source.startsWith("<?",cursor)){
   const end=source.indexOf("?>",cursor+2);if(end<0)return null;
   const body=source.slice(cursor+2,end),pi=/^([A-Za-z_][A-Za-z0-9_.-]*(?::[A-Za-z_][A-Za-z0-9_.-]*)?)([\s\S]*)$/.exec(body);
   if(!pi)return null;
   if(pi[1].toLowerCase()==="xml"){
    if(pi[1]!=="xml"||xmlDeclaration||cursor!==0||!/^xml[\t\r\n ]+version[\t\r\n ]*=[\t\r\n ]*(['"])1\.0\1(?:[\t\r\n ]+encoding[\t\r\n ]*=[\t\r\n ]*(['"])[A-Za-z][A-Za-z0-9._-]*\2)?(?:[\t\r\n ]+standalone[\t\r\n ]*=[\t\r\n ]*(['"])(?:yes|no)\3)?[\t\r\n ]*$/.test(body))return null;
    xmlDeclaration=true;
   }else if(pi[2]&&!/^[\t\r\n ]/.test(pi[2]))return null;
   cursor=end+2;continue;
  }
  if(source.startsWith("<!",cursor))return null;
  if(source.startsWith("</",cursor)){
   cursor+=2;const name=readName();if(!name)return null;
   skipSpace();if(source[cursor]!==">")return null;
   const frame=stack[stack.length-1];if(!frame||frame.name!==name)return null;
   stack.pop();cursor++;continue;
  }
  cursor++;const name=readName();if(!name)return null;
  const attributes=[],rawNames=new Set;let selfClosing=false;
  while(true){
   const hadSpace=skipSpace();
   if(source[cursor]===">"){cursor++;break}
   if(source[cursor]==="/"&&source[cursor+1]===">"){selfClosing=true;cursor+=2;break}
   if(!hadSpace)return null;
   const attributeName=readName();if(!attributeName||rawNames.has(attributeName))return null;
   if(attributes.length>=MAX_RSS_XML_ATTRIBUTES_PER_ELEMENT||++totalAttributes>MAX_RSS_XML_ATTRIBUTES)return null;
   if((attributeName==="xmlns"||attributeName.startsWith("xmlns:"))&&++namespaceDeclarations>MAX_RSS_NAMESPACE_DECLARATIONS)return null;
   rawNames.add(attributeName);skipSpace();if(source[cursor]!=="=")return null;
   cursor++;skipSpace();const quote=source[cursor];if(quote!=='"'&&quote!=="'")return null;
   cursor++;const start=cursor;while(cursor<source.length&&source[cursor]!==quote){if(source[cursor]==="<")return null;cursor++}
   if(cursor>=source.length)return null;
   const value=source.slice(start,cursor);if(!validReferences(value))return null;
   attributes.push({name:attributeName,value});cursor++;
  }
  if(++nodes>MAX_RSS_XML_NODES||stack.length>=MAX_RSS_XML_DEPTH)return null;
  const inherited=stack.length?stack[stack.length-1].namespaces:baseNamespaces;
  const namespaceAttributes=attributes.filter(attribute=>attribute.name==="xmlns"||attribute.name.startsWith("xmlns:"));
  const localBindings=namespaceAttributes.length?Object.create(null):null;
  for(const attribute of namespaceAttributes){
   if(attribute.name==="xmlns"){
    const uri=decode(attribute.value);if(uri||uri===XML_NAMESPACE||uri===XMLNS_NAMESPACE)return null;
    localBindings[""]=uri;
   }else if(attribute.name.startsWith("xmlns:")){
    const prefix=attribute.name.slice(6),uri=decode(attribute.value);
    if(!prefix||prefix==="xmlns"||uri===XMLNS_NAMESPACE||(prefix==="xml"&&uri!==XML_NAMESPACE)||(prefix!=="xml"&&uri===XML_NAMESPACE)||(prefix!=="xml"&&!uri))return null;
    localBindings[prefix]=uri;
   }
  }
  const namespaces=localBindings?{parent:inherited,bindings:localBindings}:inherited;
  if(!expandedName(name,namespaces,false))return null;
  const expandedAttributes=new Set;
  for(const attribute of attributes){
   if(attribute.name==="xmlns"||attribute.name.startsWith("xmlns:"))continue;
   const parts=expandedName(attribute.name,namespaces,true);if(!parts)return null;
   const key=parts[0]+"\u0000"+parts[1];if(expandedAttributes.has(key))return null;
   expandedAttributes.add(key);
  }
  const node={type:"element",name,parts:[]};
  if(!stack.length){
   if(++roots>1||name!=="rss"||(resolveNamespace(namespaces,"")||""))return null;
   root=node;
  }else{
   const parent=stack[stack.length-1].node;parent.parts.push(node);
   if(parent===root&&name==="channel"){
    if(++channelCount>1||(resolveNamespace(namespaces,"")||""))return null;
    channel=node;
   }
  }
  if(!selfClosing)stack.push({name,node,namespaces});
 }
 return roots===1&&root?.name==="rss"&&channelCount===1&&channel&&!stack.length?{root,channel}:null;
}
export async function fetchHeadlinesWithDiagnostics(edition,fetcher=fetch,parser=parseNewsRss,timeoutMs=9000,maxConcurrency=5){
 const cfg=EDITIONS[edition];if(!cfg)return null;
 const fetched=new Array(cfg.length);
 let next=0;
 const deadline=AbortSignal.timeout(timeoutMs);
 const fetchFeed=async f=>{
  const url=new URL("https://news.google.com/rss/search");
  for(const [k,v] of Object.entries(f))url.searchParams.set(k,v);
  const r=await fetcher(url.toString(),{headers:{Accept:"application/rss+xml, application/xml"},signal:deadline});
  if(!r.ok){cancelBody(r);return {items:[],kind:"http_error",status:String(r.status)}}
  const xml=await readLimitedResponseText(r);if(xml===null)return {items:[],kind:"invalid"};
  const document=tokenizeRss(xml);if(!document)return {items:[],kind:"invalid"};
  try{
   const items=parser(xml,document).map(item=>({...item,language:f.hl.split("-")[0]}));
   return {items,kind:items.length?"parsed":"unverified"};
  }catch{return {items:[],kind:"parse_error"}}
 };
 // Bound fan-out so slow upstream responses do not exhaust this request's fetch budget.
 const workers=Array.from({length:Math.min(Number.isInteger(maxConcurrency)?Math.max(1,maxConcurrency):5,cfg.length)},async()=>{
  while(true){
   const index=next++;
   if(index>=cfg.length)return;
   try{fetched[index]=await fetchFeed(cfg[index])}
   catch(error){fetched[index]={items:[],kind:error?.name==="TimeoutError"||error?.name==="AbortError"?"timeout":"network_error"}}
  }
 });
 await Promise.all(workers);
 const httpErrors={};
 for(const feed of fetched)if(feed.kind==="http_error")httpErrors[feed.status]=(httpErrors[feed.status]||0)+1;
 const results=fetched.flatMap(x=>x.items);
 const diagnostics={
  configured_sources:cfg.length,
  http_successes:fetched.filter(x=>["parsed","unverified","invalid","parse_error"].includes(x.kind)).length,
  parsed_sources:fetched.filter(x=>x.kind==="parsed").length,
  unverified_sources:fetched.filter(x=>x.kind==="unverified").length,
  invalid_sources:fetched.filter(x=>x.kind==="invalid").length,
  parse_errors:fetched.filter(x=>x.kind==="parse_error").length,
  network_errors:fetched.filter(x=>x.kind==="network_error").length,
  timeouts:fetched.filter(x=>x.kind==="timeout").length,
  http_errors:httpErrors,
  parsed_items:results.length
 };
 const seen=new Set();
 const items=results.filter(x=>{
  const key=x.title.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,"").slice(0,150);
  if(seen.has(key))return false;
  seen.add(key);return true;
 }).sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,200);
 diagnostics.items_returned=items.length;
 return {items,diagnostics};
}
export async function fetchHeadlines(edition,fetcher=fetch){
 const result=await fetchHeadlinesWithDiagnostics(edition,fetcher);
 return result?.items??null;
}
const FRESH_AGE=900;
const FALLBACK_AGE=43200;
const NEWS_CACHE_REVISION="publisher-catalog-v1";
const PUBLISHER_FEED_LIMIT=DISCOVERY_TOTAL_LIMIT;
const PUBLISHER_FEED_CONCURRENCY=3;
const GOOGLE_FEED_CONCURRENCY=2;
const NEWS_REQUEST_TIMEOUT_MS=9000;
const response=(data,age)=>Response.json(data,{headers:{
 "Cache-Control":"public, max-age=60, s-maxage="+age,
 "X-Content-Type-Options":"nosniff"
}});
async function fetchPublisherHeadlines(edition,fetcher=fetch,timeoutMs=NEWS_REQUEST_TIMEOUT_MS){
 let catalog;
 if(edition==="global")catalog=SOURCE_CATALOG;
 else if(edition==="official")catalog=SOURCE_CATALOG.filter(source=>source.role==="official-institution");
 else if(edition==="bulgaria")catalog=SOURCE_CATALOG.filter(source=>source.country==="BG");
 else return {status:"not_applicable",checked:[],failed:[],count:0,items:[]};
 try{
  return await discoverMatches({
   catalog,fetcher,region:"all",timeoutMs,
   feedLimit:PUBLISHER_FEED_LIMIT,maxConcurrency:PUBLISHER_FEED_CONCURRENCY,maxAttempts:1
  });
 }catch{
  return {status:"unavailable",checked:[],failed:[],count:0,items:[]};
 }
}
async function getRawNews({request,ctx,fetcher=fetch,catalogFetcher=fetch,timeoutMs=NEWS_REQUEST_TIMEOUT_MS}){
 const edition=new URL(request.url).searchParams.get("edition")||"global";
 if(!Object.hasOwn(EDITIONS,edition))return Response.json({error:"invalid_edition"},{status:400});
 const key=new Request("https://aurora-cache.invalid/news/fresh/"+NEWS_CACHE_REVISION+"/"+edition);
 const backup=new Request("https://aurora-cache.invalid/news/last-good/"+edition);
 let cache;try{
  if(typeof caches!=="undefined")cache=caches.default;
  const saved=cache&&await cache.match(key);if(saved)return saved;
 }catch{}
 const requestDeadline=AbortSignal.timeout(timeoutMs);
 // Run independent sources together while reserving five total in-flight fetches.
 const withRequestDeadline=fetcher=>async(url,init={})=>{
  const signal=init.signal?AbortSignal.any([requestDeadline,init.signal]):requestDeadline;
  return fetcher(url,{...init,signal});
 };
 const [result,publisher]=await Promise.all([
  fetchHeadlinesWithDiagnostics(edition,withRequestDeadline(fetcher),parseNewsRss,timeoutMs,GOOGLE_FEED_CONCURRENCY),
  fetchPublisherHeadlines(edition,withRequestDeadline(catalogFetcher),timeoutMs)
 ]);
 const items=dedupeHeadlines([...(result?.items??[]),...(publisher.items??[])]).slice(0,200);
 const diagnostics={
  ...(result?.diagnostics||{}),
  publisher_status:publisher.status,
  publisher_sources_checked:publisher.checked?.length||0,
  publisher_sources_failed:publisher.failed?.length||0,
  publisher_matches:publisher.count||0,
  items_returned:items.length
 };
 if(items.length){
  const payload={status:"live",edition,updated_at:new Date().toISOString(),count:items.length,items,diagnostics};
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
     return Response.json({...payload,status:"cached",last_attempt:{status:"unavailable",at:new Date().toISOString(),diagnostics}},{headers:{
      "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"
     }});
    }
   }
  }catch{}
 }
 return Response.json({status:"unavailable",error:"news_source_unavailable",items:[],diagnostics},{status:503,headers:{"Cache-Control":"no-store"}});
}

// Optional server translation is restricted to fixed, fetched news headlines.
export async function onRequestGet({request,env,ctx,fetcher=fetch,catalogFetcher=fetch,timeoutMs=NEWS_REQUEST_TIMEOUT_MS}){
 const u=new URL(request.url),lang=u.searchParams.get("lang");
 if(lang!==null&&!NEWS_LANGUAGES.has(lang))
  return Response.json({error:"unsupported_language"},{status:400});
 const offsetValue=u.searchParams.get("offset")||"0";
 if(!/^(0|[1-9]\d{0,2})$/.test(offsetValue)||Number(offsetValue)>192||Number(offsetValue)%PAGE_SIZE!==0)
  return Response.json({error:"invalid_translation_offset"},{status:400});
 const original=await getRawNews({request,ctx,fetcher,catalogFetcher,timeoutMs});
 if(lang===null||original.status!==200)return original;
 const data=await original.clone().json(),offset=Number(offsetValue);
 if(!Array.isArray(data.items))return original;
 const edition=u.searchParams.get("edition")||"global";
 const key=new Request("https://aurora-cache.invalid/news/translated/v1/"+
  encodeURIComponent(edition)+"/"+encodeURIComponent(lang)+"/"+offset+"/"+encodeURIComponent(data.updated_at||"unknown"));
 let cache;
 try{
  if(typeof caches!=="undefined")cache=caches.default;
  if(cache&&data.status!=="cached"){const found=await cache.match(key);if(found)return found}
 }catch{}
 const {items,translation}=await translateNewsPage(data.items,lang,offset,env?.AI);
 const out=Response.json({...data,items,translation},{headers:{
  "Cache-Control":data.status==="cached"?"no-store":"public, max-age=60, s-maxage=900",
  "X-Content-Type-Options":"nosniff"
 }});
 // Fail open: do not cache outages. When AI is connected later, it takes effect.
 if(cache&&data.status!=="cached"&&ctx?.waitUntil&&["translated","original"].includes(translation.status))
  ctx.waitUntil(cache.put(key,out.clone()).catch(()=>{}));
 return out;
}
