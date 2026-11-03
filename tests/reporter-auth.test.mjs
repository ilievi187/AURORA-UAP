import test from "node:test";
import assert from "node:assert/strict";
import {configuredProviders,reporterAuthConfigured,verifiedReporter} from "../functions/_lib/reporter-auth.js";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {storeSubmission,normalizeSubmission,intakeSchemaReady} from "../functions/_lib/intake.js";
const GOOD_ID="123e4567-e89b-42d3-a456-426614174000";
const OTHER_ID="123e4567-e89b-42d3-a456-426614174001";
const CONFIG={AURORA_REPORT_AUTH_ENABLED:"enabled",
 AURORA_REPORT_AUTH_URL:"https://aurora-auth.supabase.co",
 AURORA_REPORT_AUTH_PUBLISHABLE_KEY:"sb_publishable_test_public_key_12345678",
 AURORA_REPORT_AUTH_PROVIDERS:"email,google,apple,x"};
const req=(token="valid_token_".repeat(4))=>new Request("https://aurorauap.org/api/intake/submit",{headers:{Authorization:"Bearer "+token}});
test("reporter auth fails closed unless configured with constrained origin and known providers",()=>{
 assert.equal(reporterAuthConfigured(CONFIG),true);
 assert.deepEqual(configuredProviders(CONFIG),["email","google","apple","x"]);
 for(const changed of [
  {...CONFIG,AURORA_REPORT_AUTH_ENABLED:"disabled"},
  {...CONFIG,AURORA_REPORT_AUTH_URL:"https://evil.example.com"},
  {...CONFIG,AURORA_REPORT_AUTH_URL:"http://aurora-auth.supabase.co"},
  {...CONFIG,AURORA_REPORT_AUTH_URL:"https://aurora-auth.supabase.co.evil.com"},
  {...CONFIG,AURORA_REPORT_AUTH_PROVIDERS:"google,unknown"},
  {...CONFIG,AURORA_REPORT_AUTH_PROVIDERS:"google,google"},
  {...CONFIG,AURORA_REPORT_AUTH_PUBLISHABLE_KEY:""}
 ])assert.equal(reporterAuthConfigured(changed),false);
});
test("only Auth-server-confirmed email gets report identity, never browser-submitted identity fields",async()=>{
 const confirmed={id:GOOD_ID,email:"hidden@private.icloud.com",email_confirmed_at:"2026-10-31T15:00:00Z"};
 const invoke=async(user,code=200)=>verifiedReporter(req(),CONFIG,async(url,opts)=>{
  assert.equal(url,"https://aurora-auth.supabase.co/auth/v1/user");
  assert.equal(opts.headers.apikey,CONFIG.AURORA_REPORT_AUTH_PUBLISHABLE_KEY);
  assert.ok(opts.headers.Authorization.startsWith("Bearer "));
  assert.equal(opts.redirect,"error");
  assert.equal(opts.cache,"no-store");
  return Response.json(user,{status:code});
 });
 assert.deepEqual(await invoke(confirmed),{id:GOOD_ID});
 for(const user of [
  {...confirmed,email_confirmed_at:null},
  {...confirmed,email_confirmed_at:"not a date"},
  {...confirmed,email:"missing"},
  {...confirmed,id:"not-a-uuid"},
  {...confirmed,email_confirmed_at:undefined}
 ])assert.equal(await invoke(user),null);
 assert.equal(await invoke({...confirmed,app_metadata:{provider:"x"}}),null);
 assert.deepEqual(await invoke({...confirmed,app_metadata:{provider:"x"},identities:[{provider:"x"},{provider:"email"}]}),{id:GOOD_ID});
 assert.equal(await invoke(confirmed,401),null);
 assert.equal(await verifiedReporter(req("short"),CONFIG,async()=>{throw Error("Must not call backend")}),null);
 assert.equal(await verifiedReporter(new Request("https://aurorauap.org"),CONFIG,async()=>{throw Error("No auth")}),null);
});
function sqlDb(){
 const sql=new DatabaseSync(":memory:");
 sql.exec("PRAGMA foreign_keys=ON");
 for(const f of ["0001_init.sql","0002_intake_quarantine.sql","0005_reporter_ownership.sql"]){
  sql.exec(readFileSync(new URL("../migrations/"+f,import.meta.url),"utf8"))
 }
 const db={
  prepare(query){const stmt=sql.prepare(query);
   const bound=(a=[])=>({bind(...v){return bound(v)},async run(){const r=stmt.run(...a);return {meta:{changes:r.changes}}},async first(){return stmt.get(...a)||null}});
   return bound();
  },
  async batch(items){
   sql.exec("BEGIN IMMEDIATE");
   try{const result=[];for(const i of items)result.push(await i.run());sql.exec("COMMIT");return result}
   catch(e){sql.exec("ROLLBACK");throw e}
  }
 };
 return {db,sql};
}
const payload=()=>normalizeSubmission({
 request_key:crypto.randomUUID(),country_code:"BG",region:"Shumen",approximate_location:"Shumen area",
 occurred_local:"2025-11-01T20:45",time_zone:"Europe/Sofia",category:"lights",
 description:"Three silent lights moved past a rural town for several minutes before vanishing into the eastern sky.",
 language_code:"bg",consent_version:"intake-v1-reviewed",consent:true,turnstile_token:"opaque-token",website:""
},"intake-v1-reviewed");
test("quarantined reports have private pseudonymous ownership; donation and email are not stored in D1",async()=>{
 const {db,sql}=sqlDb();
 assert.equal(await intakeSchemaReady(db),true);
 const s=payload();
 const accepted=await storeSubmission(db,s,GOOD_ID);
 assert.equal(accepted.status,"pending");
 assert.equal((await storeSubmission(db,s,GOOD_ID)).receipt_id,accepted.receipt_id);
 await assert.rejects(()=>storeSubmission(db,s,OTHER_ID),/different account/);
 assert.equal(sql.prepare("SELECT auth_user_id FROM intake_reporter_links LIMIT 1").get().auth_user_id,GOOD_ID);
 assert.equal(sql.prepare("SELECT COUNT(*) n FROM intake_submissions").get().n,1);
 assert.equal(sql.prepare("SELECT COUNT(*) n FROM cases").get().n,0);
 const cols=sql.prepare("PRAGMA table_info(intake_reporter_links)").all().map(c=>c.name);
 for(const name of ["email","donation","payment_method","ip_address"])assert.equal(cols.includes(name),false);
 sql.prepare("DELETE FROM intake_submissions WHERE id=?").run(accepted.receipt_id);
 assert.equal(sql.prepare("SELECT COUNT(*) n FROM intake_reporter_links").get().n,0);
 sql.close();
});
