import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {onRequestGet,onRequestPost,onRequestDelete} from "../functions/api/account/privacy.js";
const OWNER="123e4567-e89b-42d3-a456-426614174000";
const OTHER="123e4567-e89b-42d3-a456-426614174001";
const BASE="https://aurorauap.org/api/account/privacy";
const AUTH="https://privacy-test.supabase.co";
const envBase={
 AURORA_REPORT_AUTH_ENABLED:"enabled",
 AURORA_REPORT_AUTH_URL:AUTH,
 AURORA_REPORT_AUTH_PUBLISHABLE_KEY:"sb_publishable_test_key_123456789012345",
 AURORA_REPORT_AUTH_PROVIDERS:"email"
};
function setup(){
 const sql=new DatabaseSync(":memory:");
 sql.exec("PRAGMA foreign_keys=ON");
 for(const name of ["0001_init.sql","0002_intake_quarantine.sql","0005_reporter_ownership.sql"]){
  sql.exec(readFileSync(new URL("../migrations/"+name,import.meta.url),"utf8"));
 }
 const db={prepare(query){
  const statement=sql.prepare(query);
  const bound=(args=[])=>({
   bind(...values){return bound(values)},
   async all(){return {results:statement.all(...args)}}
  });
  return bound();
 }};
 const seed=(owner,status="pending")=>{
  const receipt="aur-int-"+crypto.randomUUID();
  sql.prepare("INSERT INTO intake_submissions(id,request_key,country_code,region,approximate_location,occurred_local,time_zone,category,description,language_code,consent_version,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
   .run(receipt,crypto.randomUUID(),"BG","Shumen","Fictional area","2026-10-01T20:30","Europe/Sofia","lights",
    "A private synthetic observation report for a controlled account-data access regression test.","en","intake-v1-reviewed",status);
  sql.prepare("INSERT INTO intake_reporter_links(submission_id,auth_user_id) VALUES (?,?)").run(receipt,owner);
  return receipt;
 };
 return {sql,db,seed};
}
function makeRequest(url=BASE,token="valid_token_".repeat(4),otherHeaders={}){
 return new Request(url,{headers:{
  ...(token?{Authorization:"Bearer "+token}:{}),
  Origin:"https://aurorauap.org",
  "Sec-Fetch-Site":"same-origin",
  ...otherHeaders
 }});
}
async function run({request=makeRequest(),env,authUser=OWNER,authCode=200,failAuth=false}={}){
 const previous=globalThis.fetch;
 const calls=[];
 globalThis.fetch=async(url,opts)=>{
  calls.push(url);
  assert.equal(url,AUTH+"/auth/v1/user");
  assert.equal(opts.method,"GET");
  assert.equal(opts.cache,"no-store");
  if(failAuth)throw Error("Auth network unavailable");
  return Response.json({
   id:authUser,email:"synthetic@example.org",email_confirmed_at:"2026-11-01T12:00:00Z"
  },{status:authCode});
 };
 try{
  return {response:await onRequestGet({request,env}),calls};
 }finally{globalThis.fetch=previous}
}
test("signed-in reporter sees only own private receipt IDs and statuses",async()=>{
 const {sql,db,seed}=setup();
 try{
  const own=seed(OWNER),other=seed(OTHER,"rejected");
  const {response,calls}=await run({env:{...envBase,DB:db}});
  assert.equal(response.status,200);
  assert.deepEqual(calls,[AUTH+"/auth/v1/user"]);
  assert.match(response.headers.get("Cache-Control"),/no-store/);
  assert.equal(response.headers.get("Content-Security-Policy").includes("default-src 'none'"),true);
  const j=await response.json();
  assert.deepEqual(j.receipts,[{receipt_id:own,status:"pending",created_at:j.receipts[0].created_at}]);
  assert.equal(j.next_offset,null);
  assert.equal(j.published,false);
  assert.equal(j.deletion_process,"manual_owner_review");
  assert.ok(!JSON.stringify(j).includes(other));
  assert.ok(!JSON.stringify(j).includes("synthetic@example.org"));
  assert.ok(!JSON.stringify(j).includes("Fictional area"));
  assert.ok(!JSON.stringify(j).includes(OWNER));
 }finally{sql.close()}
});
test("anonymous, unverified and revoked accounts cannot inspect private receipts",async()=>{
 const {sql,db,seed}=setup();
 try{
  seed(OWNER);
  const env={...envBase,DB:db};
  for(const scenario of [
   {request:makeRequest(BASE,null)},
   {request:makeRequest(BASE,"short")},
   {request:makeRequest(),authCode:401}
  ]){
   const {response}=await run({env,...scenario});
   assert.equal(response.status,401);
  }
  const {response:failed}=await run({env,failAuth:true});
  assert.equal(failed.status,503);
  assert.equal((await failed.json()).error,"identity_unavailable");
  assert.equal((await run({env:{...env,AURORA_REPORT_AUTH_ENABLED:"disabled"}})).response.status,503);
 }finally{sql.close()}
});
test("alternate host, nonsecure URL, cross-site requests and query pollution fail before contacting Auth",async()=>{
 const {sql,db}=setup();
 try{
  const env={...envBase,DB:db};
  for(const request of [
   makeRequest("http://aurorauap.org/api/account/privacy"),
   makeRequest("https://preview.pages.dev/api/account/privacy"),
   makeRequest(BASE,"valid_token_".repeat(4),{Origin:"https://evil.example"}),
   makeRequest(BASE,"valid_token_".repeat(4),{"Sec-Fetch-Site":"cross-site"}),
   makeRequest(BASE+"?email=other@example.com"),
   makeRequest(BASE+"?offset=1&offset=2"),
   makeRequest(BASE+"?offset=-1"),
   makeRequest(BASE+"?offset=10001")
  ]){
   const {response,calls}=await run({request,env});
   assert.ok([400,403].includes(response.status),request.url);
   assert.deepEqual(calls,[]);
  }
 }finally{sql.close()}
});
test("reporter pagination cannot disclose another person's receipts",async()=>{
 const {sql,db,seed}=setup();
 try{
  const list=Array.from({length:52},()=>seed(OWNER));
  const different=seed(OTHER);
  const env={...envBase,DB:db};
  const first=await run({env});
  assert.equal(first.response.status,200);
  const one=await first.response.json();
  assert.equal(one.receipts.length,50);
  assert.equal(one.next_offset,50);
  const second=await run({env,request:makeRequest(BASE+"?offset=50")});
  const two=await second.response.json();
  assert.equal(two.receipts.length,2);
  assert.equal(two.next_offset,null);
  assert.deepEqual(new Set([...one.receipts,...two.receipts].map(x=>x.receipt_id)),new Set(list));
  assert.ok(![...one.receipts,...two.receipts].some(x=>x.receipt_id===different));
 }finally{sql.close()}
});
test("account data endpoint cannot submit, delete or mutate data",async()=>{
 const {sql,db,seed}=setup();
 try{
  seed(OWNER);
  assert.equal((await onRequestPost()).status,405);
  assert.equal((await onRequestDelete()).status,405);
  const count=()=>sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions").get().n;
  const before=count();
  await run({env:{...envBase,DB:db}});
  assert.equal(count(),before);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_review_events").get().n,0);
 }finally{sql.close()}
});
