import {newsTipsEnabled,newsroomSchemaReady,normalizeNewsTip,verifyNewsTipTurnstile,saveNewsTip} from '../_lib/newsroom.js';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const reply=(body,status=200)=>Response.json(body,{status,headers});
export async function onRequestGet({request,env}){
 const hostname=new URL(request.url).hostname;
 const accepting=new URL(request.url).protocol==='https:'&&newsTipsEnabled(env,hostname)&&await newsroomSchemaReady(env.DB);
 return reply({accepting,mode:accepting?'moderated_only':'disabled',attachments_enabled:false,contact_collection_enabled:false,automatic_publication:false,
  ...(accepting?{site_key:env.AURORA_NEWS_TIPS_SITE_KEY,policy_version:env.AURORA_NEWS_TIPS_POLICY_VERSION,policy_url:env.AURORA_NEWS_TIPS_POLICY_URL}:{})});
}
export async function onRequestPost({request,env,fetcher=fetch}){
 const url=new URL(request.url),origin=request.headers.get('Origin');
 if(url.protocol!=='https:'||url.hostname!=='aurorauap.org'||origin!==url.origin)return reply({error:'origin_rejected'},403);
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply({error:'unsupported_media_type'},415);
 if(!newsTipsEnabled(env,url.hostname)||!await newsroomSchemaReady(env.DB))return reply({error:'news_tips_disabled'},503);
 const declared=Number(request.headers.get('Content-Length')||'0');if(declared>8000)return reply({error:'payload_too_large'},413);
 let input;try{const raw=await request.text();if(raw.length>5000||new TextEncoder().encode(raw).length>8000)return reply({error:'payload_too_large'},413);input=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400)}
 let tip;try{tip=normalizeNewsTip(input)}catch{return reply({error:'invalid_tip'},400)}
 let verified=false;try{verified=await verifyNewsTipTurnstile(tip.turnstile_token,env,url.hostname,fetcher)}catch{return reply({error:'verification_unavailable'},503)}
 if(!verified)return reply({error:'challenge_rejected'},403);
 try{
  const saved=await saveNewsTip(env.DB,tip);
  return reply({receipt_id:saved.receipt_id,status:'pending',published:false,duplicate:saved.duplicate},202);
 }catch(error){console.error('AURORA news-tip quarantine failed',error?.name||'Error');return reply({error:'news_tips_unavailable'},503)}
}
