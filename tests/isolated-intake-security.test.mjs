// Local-only end-to-end security harness. Nothing in here contacts the
// production site, stores real accounts, or uses real Cloudflare credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {onRequestPost} from '../functions/api/intake/submit.js';
import {onRequestGet} from '../functions/api/intake/status.js';
import {intakeEnabled} from '../functions/_lib/intake.js';

const USER_ID='123e4567-e89b-42d3-a456-426614174000';
const AUTH_URL='https://qa-isolated.supabase.co';
const SITEVERIFY='https://challenges.cloudflare.com/turnstile/v0/siteverify';
function fixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0001_init.sql','0002_intake_quarantine.sql','0005_reporter_ownership.sql'])
  sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const db={
  prepare(q){
   const stmt=sql.prepare(q);
   const bound=(args=[])=>({bind(...values){return bound(values)},
    async first(){return stmt.get(...args)||null},
    async run(){return {meta:{changes:stmt.run(...args).changes}}},
    async all(){return {results:stmt.all(...args)}}});
   return bound();
  },
  async batch(stmts){
   sql.exec('BEGIN IMMEDIATE');
   try{const out=[];for(const stmt of stmts)out.push(await stmt.run());sql.exec('COMMIT');return out}
   catch(e){sql.exec('ROLLBACK');throw e}
  }
 };
 const config={
  DB:db,AURORA_INTAKE_ENABLED:'enabled',AURORA_INTAKE_LEGAL_APPROVED:'yes',
  AURORA_INTAKE_WAF_REVIEWED:'yes',AURORA_INTAKE_POLICY_VERSION:'intake-v1-reviewed',
  AURORA_INTAKE_POLICY_URL:'https://aurorauap.org/privacy',AURORA_INTAKE_HOSTNAME:'aurorauap.org',
  AURORA_MODERATION_ENABLED:'enabled',AURORA_ACCESS_TEAM:'https://aurora-qa.cloudflareaccess.com',
  AURORA_ACCESS_AUD:'a'.repeat(64),AURORA_MODERATOR_EMAIL:'owner@example.com',
  AURORA_REPORT_AUTH_ENABLED:'enabled',AURORA_REPORT_AUTH_URL:AUTH_URL,
  AURORA_REPORT_AUTH_PUBLISHABLE_KEY:'sb_publishable_isolated_testing_123456',
  AURORA_REPORT_AUTH_PROVIDERS:'email',
  AURORA_TURNSTILE_SECRET:'nonproduction_internal_mock_secret_value',
  AURORA_TURNSTILE_SITE_KEY:'nonproduction_internal_mock_public_value'
 };
 const count=table=>sql.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
 const data=()=>({
  request_key:crypto.randomUUID(),country_code:'BG',region:'Shumen',approximate_location:'Fictional nearby area',
  occurred_local:'2025-07-20T20:15',time_zone:'Europe/Sofia',category:'lights',
  description:'Fictional demonstration: a few silent lights moved across an empty sky and disappeared after several minutes.',
  language_code:'en',consent_version:'intake-v1-reviewed',consent:true,adult_confirmed:true,
  turnstile_token:'local-opaque-dummy-token',website:''
 });
 const post=(payload,opts={})=>onRequestPost({
  env:opts.env||config,
  request:new Request('https://aurorauap.org/api/intake/submit',{
   method:'POST',headers:{
    Origin:opts.origin??'https://aurorauap.org','Content-Type':'application/json',
    ...(!opts.noAuth?{Authorization:'Bearer '+'qa_token_string_'.repeat(6)}:{})
   },body:JSON.stringify(payload)
  })
 });
 return {sql,db,config,count,data,post};
}
function mockAuthAndTurnstile(getChallenge=()=>({success:true,hostname:'aurorauap.org',action:'aurora_report'})){
 const prev=globalThis.fetch,calls=[];
 globalThis.fetch=async(url,options)=>{
  calls.push(url);
  if(url===AUTH_URL+'/auth/v1/user'){
   assert.equal(options.method,'GET');
   return Response.json({id:USER_ID,email:'synthetic@example.com',email_confirmed_at:'2026-01-01T00:00:00Z'});
  }
  assert.equal(url,SITEVERIFY);
  assert.equal(options.method,'POST');
  assert.equal(options.redirect,'manual');
  assert.ok(options.body.includes('response='));
  assert.equal(options.body.includes('remoteip='),false);
  return Response.json(getChallenge());
 };
 return {calls,restore(){globalThis.fetch=prev}};
}
test('isolated staging stays fail closed without production approval flags or exact hostname',async()=>{
 const a=fixture();
 const mock=mockAuthAndTurnstile();
 try{
  for(const partial of [
   {...a.config,AURORA_INTAKE_ENABLED:undefined},
   {...a.config,AURORA_INTAKE_LEGAL_APPROVED:undefined},
   {...a.config,AURORA_INTAKE_WAF_REVIEWED:undefined},
   {...a.config,AURORA_REPORT_AUTH_ENABLED:undefined}
  ]){
   assert.equal(intakeEnabled(partial,'aurorauap.org'),false);
   const r=await a.post(a.data(),{env:partial});
   assert.equal(r.status,503);assert.equal((await r.json()).error,'intake_disabled');
  }
  assert.equal(intakeEnabled(a.config,'anything.pages.dev'),false);
  const status=await onRequestGet({request:new Request('https://staging.pages.dev/api/intake/status'),env:a.config});
  assert.equal((await status.json()).accepting,false);
  assert.equal(a.count('intake_submissions'),0);
  assert.deepEqual(mock.calls,[]);
 }finally{mock.restore();a.sql.close()}
});
test('synthetic report passes both identity and challenge once, remains private and idempotent',async()=>{
 const a=fixture(),mock=mockAuthAndTurnstile();
 try{
  const payload=a.data();
  const first=await a.post(payload);
  assert.equal(first.status,202);
  const body=await first.json();
  assert.equal(body.published,false);
  assert.match(body.receipt_id,/^aur-int-[a-f0-9-]{36}$/);
  assert.equal(a.count('intake_submissions'),1);
  assert.equal(a.count('intake_review_events'),1);
  assert.equal(a.count('intake_reporter_links'),1);
  assert.equal(a.count('cases'),0);
  const link=a.sql.prepare('SELECT auth_user_id FROM intake_reporter_links').get();
  assert.equal(link.auth_user_id,USER_ID);
  const record=a.sql.prepare('SELECT status,publication_status FROM intake_submissions').get();
  assert.equal(record.status,'pending');assert.equal(record.publication_status,'quarantined');
  const again=await a.post(payload);
  assert.equal(again.status,202);
  assert.equal((await again.json()).receipt_id,body.receipt_id);
  assert.equal(a.count('intake_submissions'),1);
  assert.equal(a.count('intake_review_events'),1);
  assert.deepEqual(mock.calls,[AUTH_URL+'/auth/v1/user',SITEVERIFY,AUTH_URL+'/auth/v1/user',SITEVERIFY]);
 }finally{mock.restore();a.sql.close()}
});
test('bad/replayed/misbound Turnstile challenges produce 403 without writing any report',async()=>{
 const scenarios=[
  {success:false,'error-codes':['timeout-or-duplicate']},
  {success:true,hostname:'example.org',action:'aurora_report'},
  {success:true,hostname:'aurorauap.org',action:'login'},
  {success:true,hostname:'aurorauap.org'},
  {success:true,action:'aurora_report'}
 ];
 const a=fixture();
 let current=scenarios[0];
 const mock=mockAuthAndTurnstile(()=>current);
 try{
  for(const item of scenarios){
   current=item;
   const response=await a.post(a.data());
   assert.equal(response.status,403);
   assert.equal((await response.json()).error,'turnstile_rejected');
  }
  assert.equal(a.count('intake_submissions'),0);
  assert.equal(a.count('intake_reporter_links'),0);
  assert.equal(a.count('intake_review_events'),0);
 }finally{mock.restore();a.sql.close()}
});
test('anonymous and cross-origin requests never reach Siteverify or D1',async()=>{
 const a=fixture(),mock=mockAuthAndTurnstile();
 try{
  const anonymous=await a.post(a.data(),{noAuth:true});
  assert.equal(anonymous.status,401);
  const cross=await a.post(a.data(),{origin:'https://untrusted.example'});
  assert.equal(cross.status,403);
  assert.deepEqual(mock.calls,[]);
  assert.equal(a.count('intake_submissions'),0);
 }finally{mock.restore();a.sql.close()}
});

test('emergency-off deployment flag stops NEW reports before auth, Turnstile and storage, preserving prior private data',async()=>{
 const a=fixture(),mock=mockAuthAndTurnstile();
 try{
  const first=await a.post(a.data());
  assert.equal(first.status,202);
  assert.equal(a.count('intake_submissions'),1);
  const beforeCalls=mock.calls.length;
  for(const override of [
   {...a.config,AURORA_INTAKE_ENABLED:'off'},
   {...a.config,AURORA_INTAKE_ENABLED:undefined},
   {...a.config,AURORA_INTAKE_LEGAL_APPROVED:undefined}
  ]){
   const response=await a.post(a.data(),{env:override});
   assert.equal(response.status,503);
   assert.equal((await response.json()).error,'intake_disabled');
   assert.equal(a.count('intake_submissions'),1);
   assert.equal(a.count('intake_review_events'),1);
   assert.equal(a.count('intake_reporter_links'),1);
  }
  assert.equal(mock.calls.length,beforeCalls,'emergency-off must not call Auth or Turnstile');
  assert.equal(a.count('cases'),0,'shutdown does not publish quarantined reports');
 }finally{mock.restore();a.sql.close()}
});
