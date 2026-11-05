import {accessIdentity} from '../../_lib/access.js';
import {reviewSubmission,intakeEnabled,intakeSchemaReady,moderatorQueueConfigured,liveTurnstileConfigured} from '../../_lib/intake.js';
import {reporterAuthConfigured,configuredProviders} from '../../_lib/reporter-auth.js';
import {retentionDueCounts} from '../../../worker/privacy-retention.js';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'};
const reply=(body,status=200)=>Response.json(body,{status,headers});
async function authenticate(request,env){
 if(new URL(request.url).hostname!=='aurorauap.org'||env.AURORA_MODERATION_ENABLED!=='enabled'||!env.DB)return null;
 return accessIdentity(request,env);
}
const receiptPattern=/^aur-int-[a-f0-9]{8}-[a-f0-9]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const detailColumns="id,country_code,region,approximate_location,occurred_local,time_zone,category,description,language_code,status,publication_status,created_at,updated_at";
export async function onRequestGet({request,env}){
 // Every private query path is authorized before parsing params or touching the D1 database.
 if(!await authenticate(request,env))return reply({error:'unavailable'},403);
 const params=new URL(request.url).searchParams;
 if(params.has('view')){
  if([...params.keys()].length!==1||!['overview','readiness'].includes(params.get('view')))return reply({error:'invalid_query'},400);
  if(params.get('view')==='readiness'){
   // Owner-only configuration diagnosis. Never return any env value, key,
   // identity, report body or private data. The only D1 reads are schema names.
   const checks={
    production_host:new URL(request.url).hostname==='aurorauap.org',
    d1_schema:await intakeSchemaReady(env.DB),
    verified_reporter_auth:reporterAuthConfigured(env),
    email_provider:configuredProviders(env).includes('email'),
    moderator_queue:moderatorQueueConfigured(env),
    live_turnstile:liveTurnstileConfigured(env),
    policy_version:env.AURORA_INTAKE_POLICY_VERSION==='intake-v1-reviewed',
    policy_url:env.AURORA_INTAKE_POLICY_URL==='https://aurorauap.org/privacy',
    hostname_binding:env.AURORA_INTAKE_HOSTNAME==='aurorauap.org',
    owner_privacy_decision:env.AURORA_INTAKE_LEGAL_APPROVED==='yes',
    waf_review:env.AURORA_INTAKE_WAF_REVIEWED==='yes',
    intake_switch:env.AURORA_INTAKE_ENABLED==='enabled'
   };
   return reply({
    ready:Object.values(checks).every(Boolean),
    accepting:checks.d1_schema&&intakeEnabled(env,'aurorauap.org'),
    checks,report_submitted:false,private_record_content_accessed:false
   });
  }
  try{
   const counts={pending:0,needs_clarification:0,approved:0,rejected:0};
   const rows=await env.DB.prepare("SELECT status,COUNT(*) AS total FROM intake_submissions GROUP BY status").all();
   for(const item of rows.results||[]){
    if(Object.hasOwn(counts,item.status))counts[item.status]=Number(item.total);
   }
   const due=await retentionDueCounts(env.DB);
   return reply({counts,total:Object.values(counts).reduce((a,b)=>a+b,0),due});
  }catch{return reply({error:'unavailable'},503)}
 }
 if(params.has('receipt')){
  const id=params.get('receipt');
  if([...params.keys()].length!==1||!receiptPattern.test(id||''))return reply({error:'invalid_receipt'},400);
  try{
   const submission=await env.DB.prepare("SELECT "+detailColumns+" FROM intake_submissions WHERE id=?").bind(id).first();
   if(!submission)return reply({error:'not_found'},404);
   const result=await env.DB.prepare("SELECT id,action,actor_type,previous_status,new_status,rationale,created_at FROM intake_review_events WHERE submission_id=? ORDER BY created_at ASC,id ASC LIMIT 101").bind(id).all();
   const events=result.results||[];
   return reply({submission,events:events.slice(0,100),events_truncated:events.length>100});
  }catch{return reply({error:'unavailable'},503)}
 }
 const offsetValue=params.get('offset')??'0';
 if(!/^(0|[1-9][0-9]{0,5})$/.test(offsetValue)||Number(offsetValue)>100000||
    [...params.keys()].some(key=>key!=='offset')||[...params.keys()].length>1)return reply({error:'invalid_pagination'},400);
 const offset=Number(offsetValue),limit=50;
 try{
  const rows=await env.DB.prepare("SELECT "+detailColumns+" FROM intake_submissions ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?").bind(limit+1,offset).all();
  const records=rows.results||[];
  return reply({submissions:records.slice(0,limit),offset,limit,has_more:records.length>limit,
    next_offset:records.length>limit?offset+limit:null});
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
