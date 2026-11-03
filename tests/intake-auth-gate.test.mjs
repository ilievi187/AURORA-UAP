import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {onRequestPost} from "../functions/api/intake/submit.js";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
function env(){
 const sql=new DatabaseSync(":memory:");
 for(const n of ["0001_init.sql","0002_intake_quarantine.sql","0005_reporter_ownership.sql"])
  sql.exec(read("migrations/"+n));
 const db={
  prepare(q){const stmt=sql.prepare(q);const p=(args=[])=>({bind(...a){return p(a)},async first(){return stmt.get(...args)||null},async run(){const r=stmt.run(...args);return {meta:{changes:r.changes}}}});return p()},
  async batch(stmts){sql.exec("BEGIN");try{const r=[];for(const s of stmts)r.push(await s.run());sql.exec("COMMIT");return r}catch(e){sql.exec("ROLLBACK");throw e}}
 };
 return {sql,env:{DB:db,AURORA_INTAKE_ENABLED:"enabled",AURORA_INTAKE_LEGAL_APPROVED:"yes",AURORA_INTAKE_WAF_REVIEWED:"yes",
  AURORA_INTAKE_POLICY_VERSION:"intake-v1-reviewed",AURORA_INTAKE_POLICY_URL:"https://aurorauap.org/privacy",AURORA_INTAKE_HOSTNAME:"aurorauap.org",
  AURORA_TURNSTILE_SECRET:"test_turnstile_secret_123456",AURORA_TURNSTILE_SITE_KEY:"test_turnstile_site_key_123456",
  AURORA_MODERATION_ENABLED:"enabled",AURORA_ACCESS_TEAM:"https://aurora-test.cloudflareaccess.com",
  AURORA_ACCESS_AUD:"a".repeat(64),AURORA_MODERATOR_EMAIL:"reviewer@example.com",
  AURORA_REPORT_AUTH_ENABLED:"enabled",AURORA_REPORT_AUTH_URL:"https://aurora-auth.supabase.co",
  AURORA_REPORT_AUTH_PUBLISHABLE_KEY:"sb_publishable_example_key_123456789",AURORA_REPORT_AUTH_PROVIDERS:"email,google,apple,x"}};
}
const payload=()=>({
 request_key:crypto.randomUUID(),country_code:"BG",region:"Shumen",approximate_location:"Nearby town",occurred_local:"2025-11-01T19:10",
 time_zone:"Europe/Sofia",category:"lights",description:"Multiple silent lights crossed the open sky above a town and disappeared behind the trees after several minutes.",
 language_code:"en",consent_version:"intake-v1-reviewed",consent:true,adult_confirmed:true,turnstile_token:"fake-turnstile-token",website:""
});
function request(authorization){
 return new Request("https://aurorauap.org/api/intake/submit",{method:"POST",
 headers:{Origin:"https://aurorauap.org","Content-Type":"application/json",...(authorization?{Authorization:authorization}:{})},
 body:JSON.stringify(payload())});
}
test("unverified users cannot submit and no Turnstile or D1 writes occur",async()=>{
 const {sql,env:settings}=env();
 let called=0;
 const old=globalThis.fetch;
 globalThis.fetch=async url=>{
  called++;
  assert.equal(url,"https://aurora-auth.supabase.co/auth/v1/user");
  return Response.json({id:"123e4567-e89b-42d3-a456-426614174000",email:"reporter@example.com",email_confirmed_at:null});
 };
 try{
  const missing=await onRequestPost({request:request(),env:settings});
  assert.equal(missing.status,401);
  const unverified=await onRequestPost({request:request("Bearer "+"verylongtesttoken_".repeat(3)),env:settings});
  assert.equal(unverified.status,401);
  assert.equal(called,1);
  assert.equal(sql.prepare("SELECT count(*) n FROM intake_submissions").get().n,0);
  assert.equal(sql.prepare("SELECT count(*) n FROM intake_reporter_links").get().n,0);
 }finally{globalThis.fetch=old;sql.close()}
});
