import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {intakeEnabled,moderatorQueueConfigured,normalizeSubmission,verifyTurnstile,storeSubmission,reviewSubmission} from "../functions/_lib/intake.js";
import {onRequestGet as getStatus} from "../functions/api/intake/status.js";
import {onRequestPost as submit} from "../functions/api/intake/submit.js";
const TEST_REPORTER="123e4567-e89b-42d3-a456-426614174000";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function database(){
 const sql=new DatabaseSync(":memory:");
 sql.exec(read("migrations/0001_init.sql"));
 sql.exec(read("migrations/0002_intake_quarantine.sql"));
 sql.exec(read("migrations/0005_reporter_ownership.sql"));
 const db={
  prepare(query){
   const stmt=sql.prepare(query);
   const prepared=(values=[])=>({
    bind(...args){return prepared(args)},
    async run(){const result=stmt.run(...values);return {meta:{changes:result.changes}}},
    async first(){return stmt.get(...values)||null},
    async all(){return {results:stmt.all(...values)}}
   });
   return prepared();
  },
  async batch(statements){
   sql.exec("BEGIN IMMEDIATE TRANSACTION");
   try{
    const results=[];for(const stmt of statements)results.push(await stmt.run());
    sql.exec("COMMIT");return results;
   }catch(e){sql.exec("ROLLBACK");throw e}
  }
 };
 return {db,sql};
}
function environment(db){
 return {DB:db,AURORA_REGISTRY_PUBLIC:"enabled",AURORA_INTAKE_ENABLED:"enabled",
  AURORA_INTAKE_LEGAL_APPROVED:"yes",AURORA_INTAKE_WAF_REVIEWED:"yes",
  AURORA_INTAKE_POLICY_VERSION:"intake-v1-reviewed",
  AURORA_INTAKE_POLICY_URL:"https://aurorauap.org/privacy",
  AURORA_INTAKE_HOSTNAME:"aurorauap.org",
  AURORA_TURNSTILE_SITE_KEY:"public-test-site-key-123",
  AURORA_TURNSTILE_SECRET:"private-test-turnstile-secret-123",
  AURORA_REPORT_AUTH_ENABLED:"enabled",
  AURORA_REPORT_AUTH_URL:"https://aurora-test.supabase.co",
  AURORA_REPORT_AUTH_PUBLISHABLE_KEY:"sb_publishable_test_key_this_is_not_a_secret",
  AURORA_REPORT_AUTH_PROVIDERS:"email,google,apple,x",
  AURORA_MODERATION_ENABLED:"enabled",
  AURORA_ACCESS_TEAM:"https://aurora-test.cloudflareaccess.com",
  AURORA_ACCESS_AUD:"a".repeat(64),
  AURORA_MODERATOR_EMAIL:"moderator@example.com"};
}
function body(){
 return {request_key:crypto.randomUUID(),country_code:"BG",region:"Shumen",approximate_location:"Shumen area",
  occurred_local:"2025-10-23T21:30",time_zone:"Europe/Sofia",category:"lights",
  description:"Several silent lights moved across the night sky over an approximate area. They appeared for a few minutes, then disappeared beyond the horizon.",
  language_code:"bg",consent_version:"intake-v1-reviewed",consent:true,adult_confirmed:true,
  turnstile_token:"token-opaque",website:""};
}
function request(data,opts={}){
 const origin=opts.origin??"https://aurorauap.org";
 return new Request("https://aurorauap.org/api/intake/submit",{
  method:"POST",headers:{"Content-Type":opts.type??"application/json",...(origin?{Origin:origin}:{}),...(!opts.noAuth?{Authorization:"Bearer "+"test_token_".repeat(6)}:{})},
  body:JSON.stringify(data)
 });
}
test("second schema creates quarantine and audit without publishing or storing contact identifiers",()=>{
 const {sql}=database();
 const tables=sql.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(x=>x.name);
 assert.ok(tables.includes("intake_submissions")&&tables.includes("intake_review_events"));
 const cols=sql.prepare("PRAGMA table_info(intake_submissions)").all().map(x=>x.name);
 for(const secret of ["email","name","ip_address","raw_ip","object_key","media"])assert.equal(cols.includes(secret),false,secret);
 assert.ok(cols.includes("consent_version"));assert.ok(cols.includes("publication_status"));
 assert.equal(cols.includes("birth_date"),false);
 assert.equal(cols.includes("adult_confirmed"),false,"D1 should not store a separate age declaration");
 sql.close();
});
test("public intake fails closed without every explicit policy, D1, WAF, hostname and Turnstile gate",async()=>{
 const {db,sql}=database();const env=environment(db);
 assert.equal(intakeEnabled(env,"aurorauap.org"),true);
 assert.equal(intakeEnabled({...env,AURORA_REGISTRY_PUBLIC:"disabled"},"aurorauap.org"),true);
 assert.equal(intakeEnabled({...env,AURORA_REGISTRY_PUBLIC:undefined},"aurorauap.org"),true);
 for(const key of ["DB","AURORA_INTAKE_ENABLED","AURORA_INTAKE_LEGAL_APPROVED",
  "AURORA_INTAKE_WAF_REVIEWED","AURORA_INTAKE_POLICY_VERSION","AURORA_INTAKE_POLICY_URL",
  "AURORA_INTAKE_HOSTNAME","AURORA_TURNSTILE_SECRET","AURORA_TURNSTILE_SITE_KEY",
  "AURORA_MODERATION_ENABLED","AURORA_ACCESS_TEAM","AURORA_ACCESS_AUD","AURORA_MODERATOR_EMAIL",
  "AURORA_REPORT_AUTH_ENABLED","AURORA_REPORT_AUTH_URL","AURORA_REPORT_AUTH_PUBLISHABLE_KEY","AURORA_REPORT_AUTH_PROVIDERS"]){
  const invalid={...env};delete invalid[key];
  assert.equal(intakeEnabled(invalid,"aurorauap.org"),false,"missing "+key+" should reject");
 }
 assert.equal(intakeEnabled(env,"fake.aurora-uap.pages.dev"),false);
 // Production rejects every official Cloudflare always-pass/fail/replay key.
 for(const key of ["1x00000000000000000000AA","2x00000000000000000000AB","3x00000000000000000000FF"]){
  assert.equal(intakeEnabled({...env,AURORA_TURNSTILE_SITE_KEY:key},"aurorauap.org"),false);
 }
 for(const key of ["1x0000000000000000000000000000000AA","2x0000000000000000000000000000000AA","3x0000000000000000000000000000000AA"]){
  assert.equal(intakeEnabled({...env,AURORA_TURNSTILE_SECRET:key},"aurorauap.org"),false);
 }
 const disabled=await getStatus({request:new Request("https://aurorauap.org/api/intake/status"),env:{...env,AURORA_INTAKE_ENABLED:"off"}});
 const response=await disabled.json();
 assert.equal(response.accepting,false);assert.equal(response.mode,"local_draft_only");
 assert.equal(response.site_key,undefined);assert.equal(response.automatic_publication,false);
 assert.equal(response.auth_required,true,"Login is available while intake is disabled");
 assert.equal(response.auth_url,env.AURORA_REPORT_AUTH_URL);
 assert.equal(response.auth_key,env.AURORA_REPORT_AUTH_PUBLISHABLE_KEY);
 assert.equal(response.auth_providers.includes("email"),true);
 const missingLogin=await getStatus({request:new Request("https://aurorauap.org/api/intake/status"),
  env:{...env,AURORA_INTAKE_ENABLED:"off",AURORA_REPORT_AUTH_PUBLISHABLE_KEY:""}});
 assert.equal((await missingLogin.json()).auth_required,undefined);
 // Exact production staging state: SMTP/auth configured, intake auth switch still off.
 const staged=await getStatus({request:new Request("https://aurorauap.org/api/intake/status"),
  env:{...env,AURORA_INTAKE_ENABLED:"off",AURORA_REPORT_AUTH_ENABLED:undefined}});
 const stagedState=await staged.json();
 assert.equal(stagedState.auth_required,true);
 assert.equal(stagedState.accepting,false);
 assert.equal(stagedState.site_key,undefined);
 sql.close();
});
test("intake cannot activate without a configured Access-protected moderator queue",()=>{
 const {db,sql}=database();const env=environment(db);
 assert.equal(moderatorQueueConfigured(env),true);
 for(const bad of [
  {...env,AURORA_MODERATION_ENABLED:"disabled"},
  {...env,AURORA_ACCESS_TEAM:"https://untrusted.example.com"},
  {...env,AURORA_ACCESS_AUD:"short"},
  {...env,AURORA_MODERATOR_EMAIL:"not-an-email"}
 ]){
  assert.equal(moderatorQueueConfigured(bad),false);
  assert.equal(intakeEnabled(bad,"aurorauap.org"),false);
 }
 sql.close();
});
test("validation rejects new private identity/media fields, exact GPS, bad timestamps, missing consent, spam",()=>{
 const good=body();const validated=normalizeSubmission(good,"intake-v1-reviewed");
 assert.equal(validated.country_code,"BG");assert.equal(validated.region,"Shumen");
 for(const [key,val] of [["email","somebody@example.com"],["contact_name","A Person"],
  ["media",[{url:"https://site"}]],["raw_ip","1.2.3.4"]]){
  assert.throws(()=>normalizeSubmission({...good,[key]:val},"intake-v1-reviewed"),/Unsupported/);
 }
 for(const bad of [
  {...good,description:"A short note"},
  {...good,occurred_local:"2026-02-30T08:12"},
  {...good,time_zone:"Wrong/Zone"},
  {...good,consent:false},
  {...good,adult_confirmed:false},
  {...good,adult_confirmed:null},
  {...good,adult_confirmed:0},
  {...good,adult_confirmed:"true"},
  {...good,consent_version:"outdated"},
  {...good,website:"robot"},
  {...good,latitude:12.1,longitude:undefined},
  {...good,category:"aliens"},
  {...good,turnstile_token:""}
 ])assert.throws(()=>normalizeSubmission(bad,"intake-v1-reviewed"));
 const missingAge={...good};delete missingAge.adult_confirmed;
 assert.throws(()=>normalizeSubmission(missingAge,"intake-v1-reviewed"),/Adult confirmation required/);
 assert.equal(normalizeSubmission(good,"intake-v1-reviewed").adult_confirmed,undefined,"age declaration is checked but not persisted as extra report metadata");
 const coarse=normalizeSubmission({...good,latitude:42.15647,longitude:26.82458},"intake-v1-reviewed");
 assert.equal(coarse.latitude,42.2);assert.equal(coarse.longitude,26.8);
});
test("Turnstile requires siteverify success AND matching expected hostname and action",async()=>{
 const env=environment({});
 const invoke=async result=>verifyTurnstile("secret-token",env,"aurorauap.org",async(url,init)=>{
  assert.equal(url,"https://challenges.cloudflare.com/turnstile/v0/siteverify");
  assert.equal(init.method,"POST");
  assert.ok(init.body.includes("secret=")&&init.body.includes("response="));
  assert.ok(!init.body.includes("remoteip"));
  return Response.json(result);
 });
 assert.equal(await invoke({success:true,hostname:"aurorauap.org",action:"aurora_report"}),true);
 assert.equal(await invoke({success:false,hostname:"aurorauap.org",action:"aurora_report"}),false);
 assert.equal(await invoke({success:true,hostname:"attacker.org",action:"aurora_report"}),false);
 assert.equal(await invoke({success:true,hostname:"aurorauap.org",action:"login"}),false);
});
test("inactive intake returns 503 and does not write to quarantine",async()=>{
 const {db,sql}=database();const env={...environment(db),AURORA_INTAKE_ENABLED:"off"};
 const res=await submit({request:request(body()),env});
 assert.equal(res.status,503);assert.equal((await res.json()).error,"intake_disabled");
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions").get().n,0);
 sql.close();
});
test("intake rejects requests from other origins or content types before token validation",async()=>{
 const {db,sql}=database();const env=environment(db);
 assert.equal((await submit({request:request(body(),{origin:"https://attacker.example"}),env})).status,403);
 assert.equal((await submit({request:request(body(),{type:"text/plain"}),env})).status,415);
 assert.equal((await submit({request:request({...body(),contact_email:"a@b.example"}),env})).status,400);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions").get().n,0);
 sql.close();
});
test("accepted text-only report is stored once, under private pending review, never public",async()=>{
 const {db,sql}=database();const env=environment(db),payload=body();
 const oldFetch=globalThis.fetch;let verified=0;
 globalThis.fetch=async (url)=>{
   if(url==="https://aurora-test.supabase.co/auth/v1/user")return Response.json({id:TEST_REPORTER,email:"verified@example.com",email_confirmed_at:"2026-01-01T00:00:00Z"});
   assert.equal(url,"https://challenges.cloudflare.com/turnstile/v0/siteverify");verified++;
   return Response.json({success:true,hostname:"aurorauap.org",action:"aurora_report"});
  };
 try{
  const res=await submit({request:request(payload),env});
  assert.equal(res.status,202);
  const reply=await res.json();
  assert.ok(/^aur-int-[a-f0-9-]{36}$/.test(reply.receipt_id));
  assert.equal(reply.published,false);assert.equal(reply.status,"pending");
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions").get().n,1);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM cases").get().n,0);
  const row=sql.prepare("SELECT status,publication_status,description FROM intake_submissions LIMIT 1").get();
  assert.equal(row.status,"pending");assert.equal(row.publication_status,"quarantined");
  assert.equal(row.description,payload.description);
  const repeat=await submit({request:request(payload),env});
  assert.equal(repeat.status,202);
  assert.equal((await repeat.json()).receipt_id,reply.receipt_id);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions").get().n,1);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_review_events").get().n,1);
  assert.equal(verified,2);
 }finally{globalThis.fetch=oldFetch;sql.close()}
});
test("human review updates private status with audit; even approval never publishes",async()=>{
 const {db,sql}=database();
 const s=normalizeSubmission(body(),"intake-v1-reviewed");
 const {receipt_id}=await storeSubmission(db,s,TEST_REPORTER);
 const updated=await reviewSubmission(db,receipt_id,{decision:"approved",actor_id:"admin@aurorauap.org",
  rationale:"Reviewed the reported facts and source context. Further verification before any publication."});
 assert.equal(updated.status,"approved");assert.equal(updated.publication_status,"quarantined");
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM cases").get().n,0);
 assert.equal(sql.prepare("SELECT publication_status FROM intake_submissions WHERE id=?").get(receipt_id).publication_status,"quarantined");
 const events=sql.prepare("SELECT action,new_status FROM intake_review_events WHERE submission_id=? ORDER BY id").all(receipt_id);
 assert.deepEqual(events.map(x=>x.action),["received","review"]);
 await assert.rejects(()=>reviewSubmission(db,receipt_id,{decision:"rejected",actor_id:"admin@aurorauap.org",
  rationale:"Cannot override a terminal moderator outcome."}),/not reviewable/);
 sql.close();
});
test("a concurrent identical review cannot create a false audit event",async()=>{
 const {db,sql}=database();
 const {receipt_id}=await storeSubmission(db,normalizeSubmission(body(),"intake-v1-reviewed"),TEST_REPORTER);
 const batch=db.batch.bind(db);
 db.batch=async statements=>{
  // Simulate another moderator committing after this request read pending status.
  sql.prepare("UPDATE intake_submissions SET status='approved' WHERE id=?").run(receipt_id);
  return batch(statements);
 };
 await assert.rejects(()=>reviewSubmission(db,receipt_id,{decision:"approved",actor_id:"reviewer",
  rationale:"Reviewed the report and available context."}),/transition conflict/);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_review_events WHERE action='review'").get().n,0);
 sql.close();
});
test("D1-like transactional batch aborts receipt and audit together on storage error",async()=>{
 const {db,sql}=database();
 sql.exec("CREATE TRIGGER fail_first_intake_review BEFORE INSERT ON intake_review_events BEGIN SELECT RAISE(ABORT,'audit trigger failure'); END;");
 await assert.rejects(()=>storeSubmission(db,normalizeSubmission(body(),"intake-v1-reviewed"),TEST_REPORTER) ,/audit trigger failure/);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions").get().n,0);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_review_events").get().n,0);
 sql.close();
});

test("intake status cannot claim readiness when private D1 migration is missing",async()=>{
 const {db,sql}=database();const env=environment(db);
 const ready=await getStatus({request:new Request("https://aurorauap.org/api/intake/status"),env});
 assert.equal((await ready.json()).accepting,true);
 sql.exec("DROP TABLE intake_review_events;DROP TABLE intake_submissions;");
 const stopped=await getStatus({request:new Request("https://aurorauap.org/api/intake/status"),env});
 assert.equal((await stopped.json()).accepting,false);
 const requestResult=await submit({request:request(body()),env});
 assert.equal(requestResult.status,503);
 assert.equal((await requestResult.json()).error,"intake_disabled");
 sql.close();
});

test("private text report works while the separate public registry is disabled",async()=>{
 const {db,sql}=database(),env={...environment(db),AURORA_REGISTRY_PUBLIC:"disabled"};
 const status=await getStatus({request:new Request("https://aurorauap.org/api/intake/status"),env});
 assert.equal((await status.json()).accepting,true);
 const original=globalThis.fetch;
 globalThis.fetch=async url=>url==="https://aurora-test.supabase.co/auth/v1/user"
   ?Response.json({id:TEST_REPORTER,email:"verified@example.com",email_confirmed_at:"2026-01-01T00:00:00Z"})
   :Response.json({success:true,hostname:"aurorauap.org",action:"aurora_report"});
 try{
  const response=await submit({request:request(body()),env});
  assert.equal(response.status,202);
  assert.equal((await response.json()).published,false);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions").get().n,1);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM cases").get().n,0);
 }finally{globalThis.fetch=original;sql.close()}
});

test("18+ declaration is mandatory at API boundary, before auth, Turnstile and D1",async()=>{
 const {db,sql}=database(),env=environment(db),source=body();
 const oldFetch=globalThis.fetch;
 let externalCalls=0;
 globalThis.fetch=async()=>{externalCalls++;throw Error("should not verify outsiders on invalid age")};
 try{
  for(const variant of [undefined,false,null,"true",0,17]){
   const payload={...source};
   if(variant===undefined)delete payload.adult_confirmed;
   else payload.adult_confirmed=variant;
   const response=await submit({request:request(payload),env});
   assert.equal(response.status,400,JSON.stringify(variant));
   assert.equal((await response.json()).error,"invalid_report");
  }
  assert.equal(externalCalls,0);
  assert.equal(sql.prepare("SELECT count(*) n FROM intake_submissions").get().n,0);
  assert.equal(sql.prepare("SELECT count(*) n FROM intake_review_events").get().n,0);
  assert.equal(sql.prepare("SELECT count(*) n FROM intake_reporter_links").get().n,0);
 }finally{globalThis.fetch=oldFetch;sql.close()}
});
