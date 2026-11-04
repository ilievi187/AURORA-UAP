// Owner-only real Turnstile challenge diagnostic. Never touches D1 or reporting.
import {accessIdentity} from '../../_lib/access.js';
import {liveTurnstileConfigured,inspectTurnstile} from '../../_lib/intake.js';

const BASE_HEADERS={
  'Cache-Control':'private, no-store, max-age=0',
  'Pragma':'no-cache',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'X-Robots-Tag':'noindex, nofollow',
  'Referrer-Policy':'no-referrer',
  'Cross-Origin-Resource-Policy':'same-origin'
};
const pageCsp=[
  "default-src 'none'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'unsafe-inline'",
  "frame-src https://challenges.cloudflare.com",
  "connect-src 'self' https://challenges.cloudflare.com",
  "img-src https://challenges.cloudflare.com data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'"
].join('; ');
const json=(value,status)=>Response.json(value,{status,headers:{
  ...BASE_HEADERS,'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"
}});
async function authorize(req,env){
  const u=new URL(req.url);
  if(u.protocol!=='https:'||u.hostname!=='aurorauap.org'||
   u.pathname!=='/api/moderation/turnstile'||
   env?.AURORA_MODERATION_ENABLED!=='enabled')return false;
  return Boolean(await accessIdentity(req,env));
}
function ready(env){
  return liveTurnstileConfigured(env)&&
   /^[A-Za-z0-9_-]{10,100}$/.test(env.AURORA_TURNSTILE_SITE_KEY);
}
const html=(siteKey)=>'<!doctype html><html lang="en"><head>'+
 '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<meta name="robots" content="noindex,nofollow"><title>AURORA · Private Turnstile Diagnostic</title>'+
 '</head><body style="background:#090f17;color:#ecf6fd;font:16px/1.6 system-ui,sans-serif;max-width:630px;margin:7vh auto;padding:24px">'+
 '<h1>AURORA · Turnstile diagnostic</h1>'+
 '<p>Owner-only test. This verifies the real managed challenge without submitting a report, changing D1 or enabling public intake.</p>'+
 '<p><a href="/moderation.html" style="color:#83dded">Back to moderation</a></p>'+
 '<button type="button" id="start" style="padding:12px;cursor:pointer">Run real Turnstile challenge</button>'+
 '<div id="mount" data-site-key="'+siteKey+'" style="margin:18px 0"></div>'+
 '<p id="status" role="status" aria-live="polite">Waiting to start.</p>'+
 '<script defer src="/assets/turnstile-diagnostic.js?v=20261104b"></script>'+
 '</body></html>';
export async function onRequestGet({request,env}){
  if(!await authorize(request,env))return json({error:'unavailable'},403);
  if(!ready(env))return json({error:'turnstile_not_configured'},503);
  return new Response(html(env.AURORA_TURNSTILE_SITE_KEY),{status:200,headers:{
    ...BASE_HEADERS,'Content-Type':'text/html; charset=utf-8',
    'Content-Security-Policy':pageCsp
  }});
}
export async function onRequestPost({request,env}){
  if(!await authorize(request,env))return json({error:'unavailable'},403);
  if(!ready(env))return json({error:'turnstile_not_configured'},503);
  const u=new URL(request.url);
  if(request.headers.get('Origin')!==u.origin||
   !/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))
    return json({error:'invalid_request'},403);
  let token;
  try{
    const raw=await request.text();
    if(raw.length>4000)return json({error:'invalid_request'},400);
    const data=JSON.parse(raw);
    if(!data||Array.isArray(data)||typeof data!=='object'||
     Object.keys(data).length!==1||typeof data.token!=='string'||
     data.token.length<6||data.token.length>2048) return json({error:'invalid_request'},400);
    token=data.token;
  }catch{return json({error:'invalid_request'},400)}
  try{
    const outcome=await inspectTurnstile(token,env,'aurorauap.org');
    return outcome.verified
      ?json({verified:true,report_submitted:false,private_data_changed:false},200)
      :json({verified:false,error:'challenge_rejected',reason:outcome.reason},403);
  }catch{return json({verified:false,error:'challenge_unavailable',reason:'siteverify_unavailable'},503)}
}
export async function onRequestDelete(){return json({error:'method_not_allowed'},405)}
