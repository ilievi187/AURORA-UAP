// AURORA V1.5: text-only intake, intentionally PRIVATE and opt-in.
// Never import the quarantine schema into the read-only public cases API.
const ACTION="aurora_report";
const SAFE_CATEGORY=new Set(["lights","object","instrument","other"]);
const KEYS=new Set(["request_key","country_code","region","approximate_location","latitude",
 "longitude","occurred_local","time_zone","category","description","language_code",
 "consent_version","consent","turnstile_token","website"]);
const text=(value,min,max)=>typeof value==="string"&&value.trim().length>=min&&
 value.trim().length<=max&&!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)?value.trim():null;
const isUuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const normalizeCoordinate=(value,limit)=>{
 if(value===null||value===undefined||value==="")return null;
 if(typeof value!=="number"||!Number.isFinite(value)||Math.abs(value)>limit)throw Error("Invalid approximate coordinates");
 return Math.round(value*10)/10; // Approximate to ~11km north/south; NEVER store exact GPS here.
};
export function intakeEnabled(env,hostname){
 return Boolean(env?.DB&&typeof env.DB.prepare==="function"&&typeof env.DB.batch==="function"&&
 env.AURORA_REGISTRY_PUBLIC==="enabled"&&
 env.AURORA_INTAKE_ENABLED==="enabled"&&
 env.AURORA_INTAKE_LEGAL_APPROVED==="yes"&&
 env.AURORA_INTAKE_WAF_REVIEWED==="yes"&&
 env.AURORA_INTAKE_POLICY_VERSION==="intake-v1-reviewed"&&
 env.AURORA_INTAKE_POLICY_URL==="https://aurorauap.org/privacy"&&
 env.AURORA_INTAKE_HOSTNAME===hostname&&
 hostname==="aurorauap.org"&&
 typeof env.AURORA_TURNSTILE_SECRET==="string"&&env.AURORA_TURNSTILE_SECRET.length>10&&
 typeof env.AURORA_TURNSTILE_SITE_KEY==="string"&&env.AURORA_TURNSTILE_SITE_KEY.length>10);
}
export function normalizeSubmission(value,policyVersion){
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid report payload");
 if(Object.keys(value).some(key=>!KEYS.has(key)))throw Error("Unsupported report fields");
 if(!isUuid(value.request_key))throw Error("Invalid submission key");
 if(value.website!==undefined&&value.website!=="")throw Error("Automated submission rejected");
 if(value.consent!==true||value.consent_version!==policyVersion)throw Error("Consent must match reviewed policy");
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
export async function verifyTurnstile(token,env,hostname,fetcher=fetch){
 const params=new URLSearchParams({secret:env.AURORA_TURNSTILE_SECRET,response:token});
 const response=await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
  method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:params.toString(),redirect:"error",signal:AbortSignal.timeout(9000)
 });
 if(!response.ok)throw Error("Turnstile verification unavailable");
 const result=await response.json();
 // Fail closed on hostname or action mismatch and on replay/expired challenges.
 return result.success===true&&result.hostname===hostname&&result.action===ACTION;
}
export async function storeSubmission(db,s){
 if(typeof db.batch!=="function")throw Error("Transactional D1 required");
 // Opaque random receipt ID cannot be guessed and is NOT a public case URL.
 const id="aur-int-"+crypto.randomUUID();
 const existing=await db.prepare("SELECT id FROM intake_submissions WHERE request_key=?").bind(s.request_key).first();
 if(existing)return {receipt_id:existing.id,status:"pending",duplicate:true};
 const batch=[
  db.prepare("INSERT INTO intake_submissions(id,request_key,country_code,region,approximate_location,approximate_latitude,approximate_longitude,occurred_local,time_zone,category,description,language_code,consent_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING")
   .bind(id,s.request_key,s.country_code,s.region,s.approximate_location,s.latitude,s.longitude,s.occurred_local,s.time_zone,s.category,s.description,s.language_code,s.consent_version),
  db.prepare("INSERT INTO intake_review_events(submission_id,actor_type,actor_id,action,new_status,rationale) SELECT id,'system','intake','received','pending','Quarantined text-only submission; requires human review' FROM intake_submissions WHERE id=?")
   .bind(id)
 ];
 await db.batch(batch);
 const actual=await db.prepare("SELECT id FROM intake_submissions WHERE request_key=?").bind(s.request_key).first();
 if(!actual)throw Error("Submission storage failure");
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
  db.prepare("INSERT INTO intake_review_events(submission_id,actor_type,actor_id,action,previous_status,new_status,rationale) SELECT id,'admin',?,'review',?,?,? FROM intake_submissions WHERE id=? AND status=?")
   .bind(actor_id,old.status,decision,rationale,id,decision)
 ]);
 if(!updated?.[0]?.meta||updated[0].meta.changes!==1)throw Error("Review transition conflict");
 // Still quarantined. 'approved' means admin checked it, NOT publicly published.
 return {submission_id:id,status:decision,publication_status:"quarantined"};
}
