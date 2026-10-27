import {intakeEnabled,normalizeSubmission,verifyTurnstile,storeSubmission} from "../../_lib/intake.js";
const respond=(body,status)=>Response.json(body,{status,headers:{
 "Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
 "Content-Security-Policy":"default-src 'none'"
}});
export async function onRequestPost({request,env}){
 const url=new URL(request.url),origin=request.headers.get("Origin");
 // The origin must be exact and secure. Refuse generic cross-origin requests.
 if(url.protocol!=="https:"||origin!==url.origin)return respond({error:"origin_rejected"},403);
 if(!intakeEnabled(env,url.hostname))return respond({error:"intake_disabled"},503);
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type")||""))
  return respond({error:"unsupported_media_type"},415);
 const declared=Number(request.headers.get("Content-Length")||"0");
 if(declared>18000)return respond({error:"payload_too_large"},413);
 let input;
 try{
  const raw=await request.text();
  if(raw.length>12000||new TextEncoder().encode(raw).length>18000)return respond({error:"payload_too_large"},413);
  input=JSON.parse(raw);
 }catch{return respond({error:"invalid_json"},400)}
 let data;
 try{data=normalizeSubmission(input,env.AURORA_INTAKE_POLICY_VERSION)}
 catch{return respond({error:"invalid_report"},400)}
 // Challenge is mandatory for every request and verified by Cloudflare's Siteverify.
 let valid=false;
 try{valid=await verifyTurnstile(data.turnstile_token,env,url.hostname)}
 catch{return respond({error:"verification_unavailable"},503)}
 if(!valid)return respond({error:"turnstile_rejected"},403);
 // No request IP, email, name, file or private address is written to D1.
 try{
  const saved=await storeSubmission(env.DB,data);
  return respond({receipt_id:saved.receipt_id,status:"pending",published:false},202);
 }catch(error){
  console.error("AURORA intake transactional storage failed",error?.name||"Error");
  return respond({error:"intake_unavailable"},503);
 }
}
