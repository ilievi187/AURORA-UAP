// AURORA V1.5: text-only intake, intentionally PRIVATE and opt-in.
// Never import the quarantine schema into the read-only public cases API.
import {reporterAuthConfigured} from "./reporter-auth.js";
const ACTION="aurora_report";
// Cloudflare's public testing credentials must never activate real intake.
const TEST_SITEKEYS=new Set([
 "1x00000000000000000000AA","2x00000000000000000000AB",
 "1x00000000000000000000BB","2x00000000000000000000BB",
 "3x00000000000000000000FF"
]);
const TEST_SECRETS=new Set([
 "1x0000000000000000000000000000000AA",
 "2x0000000000000000000000000000000AA",
 "3x0000000000000000000000000000000AA"
]);
const SAFE_CATEGORY=new Set(["lights","object","instrument","other"]);
const KEYS=new Set(["request_key","country_code","region","approximate_location","latitude",
 "longitude","occurred_local","time_zone","category","description","language_code",
 "consent_version","consent","adult_confirmed","turnstile_token","website"]);
const text=(value,min,max)=>typeof value==="string"&&value.trim().length>=min&&
 value.trim().length<=max&&!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)?value.trim():null;
const isUuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const normalizeCoordinate=(value,limit)=>{
 if(value===null||value===undefined||value==="")return null;
 if(typeof value!=="number"||!Number.isFinite(value)||Math.abs(value)>limit)throw Error("Invalid approximate coordinates");
 return Math.round(value*10)/10; // Approximate to ~11km north/south; NEVER store exact GPS here.
};
// Do not accept real people’s reports unless the private moderator queue is configured.
// This verifies configuration shape, not live Cloudflare Access policy or dashboard reachability.
export function moderatorQueueConfigured(env){
 return Boolean(env?.AURORA_MODERATION_ENABLED==="enabled"&&
  typeof env.AURORA_ACCESS_TEAM==="string"&&
  /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.AURORA_ACCESS_TEAM)&&
  typeof env.AURORA_ACCESS_AUD==="string"&&
  /^[a-f0-9]{64}$/.test(env.AURORA_ACCESS_AUD)&&
  typeof env.AURORA_MODERATOR_EMAIL==="string"&&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.AURORA_MODERATOR_EMAIL));
}
// Separate reusable gate for a real managed widget; official dummy credentials
// must never be mistaken for production readiness in any endpoint.
export function liveTurnstileConfigured(env){
 return Boolean(typeof env?.AURORA_TURNSTILE_SECRET==="string"&&
  env.AURORA_TURNSTILE_SECRET.length>10&&!TEST_SECRETS.has(env.AURORA_TURNSTILE_SECRET)&&
  typeof env.AURORA_TURNSTILE_SITE_KEY==="string"&&
  env.AURORA_TURNSTILE_SITE_KEY.length>10&&!TEST_SITEKEYS.has(env.AURORA_TURNSTILE_SITE_KEY));
}
export function intakeEnabled(env,hostname){
 return Boolean(env?.DB&&typeof env.DB.prepare==="function"&&typeof env.DB.batch==="function"&&
 // A private quarantined report is independent of the PUBLIC cases registry.
 env.AURORA_INTAKE_ENABLED==="enabled"&&reporterAuthConfigured(env)&&
 moderatorQueueConfigured(env)&&
 env.AURORA_INTAKE_LEGAL_APPROVED==="yes"&&
 env.AURORA_INTAKE_WAF_REVIEWED==="yes"&&
 env.AURORA_INTAKE_POLICY_VERSION==="intake-v1-reviewed"&&
 env.AURORA_INTAKE_POLICY_URL==="https://aurorauap.org/privacy"&&
 env.AURORA_INTAKE_HOSTNAME===hostname&&
 hostname==="aurorauap.org"&&
 liveTurnstileConfigured(env));
}
export async function intakeSchemaReady(db){
 if(!db||typeof db.prepare!=="function")return false;
 try{
  const record=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='intake_submissions'").first();
  const events=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='intake_review_events'").first();
  const ownership=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='intake_reporter_links'").first();
  return record?.name==="intake_submissions"&&events?.name==="intake_review_events"&&ownership?.name==="intake_reporter_links";
 }catch{return false}
}
export function normalizeSubmission(value,policyVersion){
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid report payload");
 if(Object.keys(value).some(key=>!KEYS.has(key)))throw Error("Unsupported report fields");
 if(!isUuid(value.request_key))throw Error("Invalid submission key");
 if(value.website!==undefined&&value.website!=="")throw Error("Automated submission rejected");
 if(value.consent!==true||value.consent_version!==policyVersion)throw Error("Consent must match reviewed policy");
 // Self-declared 18+ gate; do not collect dates of birth or ID documents.
 if(value.adult_confirmed!==true)throw Error("Adult confirmation required");
 const country_code=typeof value.country_code==="string"?value.country_code.toUpperCase():"";
 if(!/^[A-Z]{2}$/.test(country_code))throw Error("Invalid country code");
 const region=text(value.region,2,80),approximate_location=text(value.approximate_location,2,120);
 const description=text(value.description,50,5000);
 if(!region||!approximate_location||!description)throw Error("Invalid report fields");
 if(!SAFE_CATEGORY.has(value.category))throw Error("Invalid category");
 const tz=text(value.time_zone,3,80);
 if(!tz)throw Error("Invalid time zone");
 try{new Intl.DateTimeFormat("en",{timeZone:tz})}catch{throw Error("Invalid time zone")}
 const occurred_local=value.occurred_local;
 if(typeof occurred_local!=="string"||!/^(?:19|20)\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(occurred_local))
  throw Error("Invalid occurrence date");
 const dt=new Date(occurred_local+":00Z");
 if(Number.isNaN(dt.valueOf())||dt.toISOString().slice(0,16)!==occurred_local||
    dt.getTime()>Date.now()+36*60*60*1000)throw Error("Invalid occurrence date");
 const latitude=normalizeCoordinate(value.latitude,90),longitude=normalizeCoordinate(value.longitude,180);
 if((latitude===null)!==(longitude===null))throw Error("Partial coordinates are not accepted");
 const language_code=/^[a-z]{2}(?:-[A-Za-z]{2,4})?$/.test(value.language_code||"")?value.language_code:"en";
 const turnstile_token=text(value.turnstile_token,1,2048);
 if(!turnstile_token)throw Error("Missing Turnstile challenge");
 return {request_key:value.request_key.toLowerCase(),country_code,region,approximate_location,
  latitude,longitude,occurred_local,time_zone:tz,category:value.category,description,language_code,
  consent_version:policyVersion,turnstile_token};
}
// Sanitized diagnostic reasons: none contains the token, secret, visitor IP,
// response hostname, JWT, email address or raw Cloudflare error payload.
export async function inspectTurnstile(token,env,hostname,fetcher=fetch){
 const params=new URLSearchParams({secret:env.AURORA_TURNSTILE_SECRET,response:token});
 const response=await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
  method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:params.toString(),redirect:"error",signal:AbortSignal.timeout(9000)
 });
 if(!response.ok)throw Error("Turnstile verification unavailable");
 const result=await response.json();
 if(result?.success!==true){
  const codes=Array.isArray(result?.["error-codes"])?result["error-codes"]:[];
  if(codes.includes("invalid-input-secret")||codes.includes("missing-input-secret"))
   return {verified:false,reason:"server_secret_rejected"};
  if(codes.includes("timeout-or-duplicate"))
   return {verified:false,reason:"expired_or_reused_token"};
  if(codes.includes("invalid-input-response")||codes.includes("missing-input-response"))
   return {verified:false,reason:"token_rejected"};
  return {verified:false,reason:"siteverify_rejected"};
 }
 if(result.hostname!==hostname)return {verified:false,reason:"hostname_mismatch"};
 if(result.action!==ACTION)return {verified:false,reason:"action_mismatch"};
 return {verified:true};
}
export async function verifyTurnstile(token,env,hostname,fetcher=fetch){
 return (await inspectTurnstile(token,env,hostname,fetcher)).verified;
}
export async function storeSubmission(db,s,reporterId){
 if(typeof reporterId!=="string"||!/^[a-f0-9-]{36}$/i.test(reporterId))throw Error("Verified reporter required");
 if(typeof db.batch!=="function")throw Error("Transactional D1 required");
 // Opaque random receipt ID cannot be guessed and is NOT a public case URL.
 const id="aur-int-"+crypto.randomUUID();
 const existing=await db.prepare("SELECT s.id,l.auth_user_id FROM intake_submissions s LEFT JOIN intake_reporter_links l ON l.submission_id=s.id WHERE s.request_key=?").bind(s.request_key).first();
 if(existing){
  if(existing.auth_user_id!==reporterId)throw Error("Report request belongs to a different account");
  return {receipt_id:existing.id,status:"pending",duplicate:true};
 }
 const batch=[
  db.prepare("INSERT INTO intake_submissions(id,request_key,country_code,region,approximate_location,approximate_latitude,approximate_longitude,occurred_local,time_zone,category,description,language_code,consent_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING")
   .bind(id,s.request_key,s.country_code,s.region,s.approximate_location,s.latitude,s.longitude,s.occurred_local,s.time_zone,s.category,s.description,s.language_code,s.consent_version),
  db.prepare("INSERT INTO intake_review_events(submission_id,actor_type,actor_id,action,new_status,rationale) SELECT id,'system','intake','received','pending','Quarantined text-only submission; requires human review' FROM intake_submissions WHERE id=?")
   .bind(id),
  db.prepare("INSERT INTO intake_reporter_links(submission_id,auth_user_id) SELECT id,? FROM intake_submissions WHERE id=?")
   .bind(reporterId,id)
 ];
 await db.batch(batch);
 const actual=await db.prepare("SELECT s.id,l.auth_user_id FROM intake_submissions s LEFT JOIN intake_reporter_links l ON l.submission_id=s.id WHERE s.request_key=?").bind(s.request_key).first();
 if(!actual||actual.auth_user_id!==reporterId)throw Error("Submission ownership mismatch");
 return {receipt_id:actual.id,status:"pending",duplicate:actual.id!==id};
}
// Internal moderation domain function only; NOT exported via a public route.
// Only a future authenticated admin operation can call it.
export async function reviewSubmission(db,id,{decision,actor_id,rationale}){
 if(typeof db.batch!=="function")throw Error("Transactional D1 required");
 if(typeof id!=="string"||!/^aur-int-[a-f0-9-]{36}$/.test(id))throw Error("Invalid submission ID");
 if(!["approved","rejected","needs_clarification"].includes(decision)||
    !text(actor_id,3,120)||!text(rationale,12,1000))throw Error("Invalid review request");
 const old=await db.prepare("SELECT status FROM intake_submissions WHERE id=?").bind(id).first();
 if(!old||!["pending","needs_clarification"].includes(old.status))throw Error("Submission not reviewable");
 const updated=await db.batch([
  db.prepare("UPDATE intake_submissions SET status=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=? AND status=?")
   .bind(decision,id,old.status),
  // The audit entry must only be written when this batch's UPDATE actually won.
  // A concurrent moderator may already have made the same decision after our read.
  db.prepare("INSERT INTO intake_review_events(submission_id,actor_type,actor_id,action,previous_status,new_status,rationale) SELECT id,'admin',?,'review',?,?,? FROM intake_submissions WHERE id=? AND status=? AND changes()=1")
   .bind(actor_id,old.status,decision,rationale,id,decision)
 ]);
 if(!updated?.[0]?.meta||updated[0].meta.changes!==1)throw Error("Review transition conflict");
 // Still quarantined. 'approved' means admin checked it, NOT publicly published.
 return {submission_id:id,status:decision,publication_status:"quarantined"};
}
