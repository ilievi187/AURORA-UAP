import {accessIdentity} from '../../_lib/access.js';
import {reviewSubmission} from '../../_lib/intake.js';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'};
const reply=(body,status=200)=>Response.json(body,{status,headers});
async function authenticate(request,env){
 if(new URL(request.url).hostname!=='aurorauap.org'||env.AURORA_MODERATION_ENABLED!=='enabled'||!env.DB)return null;
 return accessIdentity(request,env);
}
export async function onRequestGet({request,env}){
 if(!await authenticate(request,env))return reply({error:'unavailable'},403);
 try{
  const rows=await env.DB.prepare("SELECT id,country_code,region,approximate_location,occurred_local,time_zone,category,description,language_code,status,publication_status,created_at FROM intake_submissions ORDER BY created_at DESC LIMIT 100").all();
  return reply({submissions:rows.results});
 }catch{return reply({error:'unavailable'},503)}
}
export async function onRequestPost({request,env}){
 const user=await authenticate(request,env); if(!user)return reply({error:'unavailable'},403);
 const url=new URL(request.url);
 if(url.protocol!=='https:'||request.headers.get('Origin')!==url.origin||!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply({error:'rejected'},403);
 try{
  const raw=await request.text(); if(raw.length>3000)return reply({error:'invalid'},400);
  const input=JSON.parse(raw);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['id','decision','rationale'].includes(k)))return reply({error:'invalid'},400);
  const result=await reviewSubmission(env.DB,input.id,{decision:input.decision,rationale:input.rationale,actor_id:user.email});
  return reply(result);
 }catch{return reply({error:'review_failed'},409)}
}
