// Verified reporters can view only their own quarantined receipt references.
// This is a READ-ONLY self-service inventory, not an account deletion endpoint.
import {verifiedReporter,reporterAuthConfigured} from "../../_lib/reporter-auth.js";

const headers={
 "Cache-Control":"private, no-store, max-age=0",
 "Pragma":"no-cache",
 "X-Content-Type-Options":"nosniff",
 "Cross-Origin-Resource-Policy":"same-origin",
 "Referrer-Policy":"no-referrer",
 "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
 "X-Robots-Tag":"noindex, nofollow"
};
const reply=(body,status)=>Response.json(body,{status,headers});
export async function onRequestGet({request,env}){
 const url=new URL(request.url);
 // No preview, alternate host or cross-origin access to private receipts.
 if(url.protocol!=="https:"||url.hostname!=="aurorauap.org"||url.pathname!=="/api/account/privacy"||
  (request.headers.has("Origin")&&request.headers.get("Origin")!==url.origin)||
  (request.headers.has("Sec-Fetch-Site")&&!["same-origin","none"].includes(request.headers.get("Sec-Fetch-Site"))))
  return reply({error:"unavailable"},403);
 if([...url.searchParams.keys()].some(k=>k!=="offset")||url.searchParams.getAll("offset").length>1)
  return reply({error:"invalid_pagination"},400);
 const raw=url.searchParams.get("offset")??"0";
 if(!/^(0|[1-9][0-9]{0,4})$/.test(raw)||Number(raw)>10000)
  return reply({error:"invalid_pagination"},400);
 if(!env?.DB?.prepare||!reporterAuthConfigured(env))
  return reply({error:"unavailable"},503);
 let user;
 try{user=await verifiedReporter(request,env)}
 catch{return reply({error:"identity_unavailable"},503)}
 if(!user)return reply({error:"verified_email_required"},401);
 try{
  const offset=Number(raw),limit=50;
  const query=await env.DB.prepare(
   "SELECT s.id AS receipt_id,s.status,s.created_at FROM intake_submissions s "+
   "INNER JOIN intake_reporter_links l ON l.submission_id=s.id "+
   "WHERE l.auth_user_id=? AND s.publication_status='quarantined' "+
   "ORDER BY s.created_at DESC,s.id DESC LIMIT ? OFFSET ?"
  ).bind(user.id,limit+1,offset).all();
  const found=query.results||[];
  return reply({
   receipts:found.slice(0,limit),
   next_offset:found.length>limit?offset+limit:null,
   published:false,
   deletion_process:"manual_owner_review",
   privacy_url:"https://aurorauap.org/privacy"
  },200);
 }catch{return reply({error:"unavailable"},503)}
}
export function onRequestPost(){return reply({error:"method_not_allowed"},405)}
export function onRequestDelete(){return reply({error:"method_not_allowed"},405)}
