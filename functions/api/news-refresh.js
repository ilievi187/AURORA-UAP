import {refreshNewsEdition} from './news.js';

const editions=new Set(['global','bulgaria','official']);
const json=(payload,status=200,headers={})=>Response.json(payload,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
async function tokenMatches(present,expected){
 if(typeof present!=='string'||typeof expected!=='string'||present.length<32||present.length>512||expected.length<32||expected.length>512)return false;
 try{
  const encoder=new TextEncoder();
  const [left,right]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(present)),crypto.subtle.digest('SHA-256',encoder.encode(expected))]);
  const a=new Uint8Array(left),b=new Uint8Array(right);let difference=0;
  for(let index=0;index<a.length;index++)difference|=a[index]^b[index];
  return difference===0;
 }catch{return false}
}
async function readLimitedJson(request){
 const length=request.headers.get('content-length');
 if(/^\d+$/.test(length||'')&&Number(length)>512)return null;
 const reader=request.body?.getReader?.();if(!reader)return null;
 const chunks=[];let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   total+=value.byteLength;if(total>512){await reader.cancel().catch(()=>{});return null}
   chunks.push(value);
  }
  const bytes=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 }catch{try{await reader.cancel()}catch{}return null}
}

export async function onRequestPost({request,env,fetcher=fetch,catalogFetcher=fetch,timeoutMs}={}){
 const url=new URL(request.url);
 if(request.method!=='POST')return json({error:'method_not_allowed'},405,{Allow:'POST'});
 if(url.protocol!=='https:'||url.hostname!=='aurorauap.org')return json({error:'forbidden'},403);
 const origin=request.headers.get('origin');
 if(origin&&origin!==url.origin)return json({error:'forbidden'},403);
 const expected=env?.AURORA_NEWS_REFRESH_TOKEN;
 if(env?.AURORA_NEWS_ARCHIVE_ENABLED!=='enabled'||!env?.DB||typeof expected!=='string'||expected.length<32)return json({error:'news_archive_not_configured'},503);
 const authorization=request.headers.get('authorization')||'';
 const match=/^Bearer\s+(.+)$/i.exec(authorization);
 if(!match||!await tokenMatches(match[1],expected))return json({error:'forbidden'},403);
 if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type')||''))return json({error:'unsupported_media_type'},415);
 const payload=await readLimitedJson(request);
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||Object.keys(payload).length!==1||!editions.has(payload.edition))return json({error:'invalid_refresh_request'},400);
 const result=await refreshNewsEdition({edition:payload.edition,env,fetcher,catalogFetcher,timeoutMs});
 if(result.status!=='refreshed')return json({status:result.status,edition:result.edition,fetched_count:result.fetched_count||0},503);
 return json({status:result.status,edition:result.edition,fetched_count:result.fetched_count,stored_count:result.stored_count});
}
