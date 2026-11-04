// Comprehensive OFFLINE hand-off rehearsal against the actual AURORA route
// handlers and SQLite migrations. All identity/Turnstile/JWKS providers are
// intercepted in-process; no real production site, user or Cloudflare API.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {onRequestPost as submit} from '../functions/api/intake/submit.js';
import {onRequestGet as publicIntakeStatus} from '../functions/api/intake/status.js';
import {onRequestGet as accountReceipts} from '../functions/api/account/privacy.js';
import {onRequestGet as moderationGet,onRequestPost as moderationPost} from '../functions/api/moderation/index.js';
import {onRequestGet as publicCases} from '../functions/api/cases.js';

const HOST='https://aurorauap.org';
const AUTH='https://journey-fixture.supabase.co';
const TEAM='https://journey-fixture.cloudflareaccess.com';
const SITEVERIFY='https://challenges.cloudflare.com/turnstile/v0/siteverify';
const REPORTER_ID='123e4567-e89b-42d3-a456-426614174101';
const OTHER_ID='123e4567-e89b-42d3-a456-426614174102';
const REPORTER_SESSION='reporter_test_session_'+ 'x'.repeat(48);
const OTHER_SESSION='outsider_test_session_'+ 'x'.repeat(48);
const AUD='a'.repeat(64);
const OWNER_EMAIL='owner@example.test';
const FOREIGN_EMAIL='not-owner@example.test';
const PRIVATE='Fictional non-personal story: several bright lights crossed an empty sky during a controlled test. Do not publish.';

const keys=await crypto.subtle.generateKey({
 name:'RSASSA-PKCS1-v1_5',modulusLength:2048,
 publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'
},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'journey-ephemeral',alg:'RS256'};
const b64=data=>Buffer.from(JSON.stringify(data)).toString('base64url');
async function signedAccess(email=OWNER_EMAIL){
 const now=Math.floor(Date.now()/1000);
 const h=b64({alg:'RS256',kid:'journey-ephemeral'});
 const p=b64({iss:TEAM,aud:[AUD],email,iat:now,exp:now+300});
 const msg=h+'.'+p;
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(msg));
 return msg+'.'+Buffer.from(signature).toString('base64url');
}
function setup(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON');
 for(const migration of ['0001_init.sql','0002_intake_quarantine.sql','0005_reporter_ownership.sql'])
  sql.exec(readFileSync(new URL('../migrations/'+migration,import.meta.url),'utf8'));
 let writes=0,reads=0;
 const db={
  prepare(q){
   if(/^\s*(?:INSERT|DELETE|UPDATE)\s/i.test(q))writes++;else reads++;
   const stmt=sql.prepare(q);
   const bound=(values=[])=>({
    bind(...v){return bound(v)},
    async first(){return stmt.get(...values)||null},
    async all(){return {results:stmt.all(...values)}},
    async run(){return {meta:{changes:Number(stmt.run(...values).changes)}}}
   });
   return bound();
  },
  async batch(commands){
   sql.exec('BEGIN IMMEDIATE');
   try{
    const result=[];for(const command of commands)result.push(await command.run());
    sql.exec('COMMIT');return result;
   }catch(e){sql.exec('ROLLBACK');throw e}
  }
 };
 // In-memory only: these otherwise production approval toggles are NOT set in
 // real Cloudflare Pages and cannot accidentally activate public reporting.
 const env={
  DB:db,AURORA_REGISTRY_PUBLIC:'enabled',
  AURORA_INTAKE_ENABLED:'enabled',
  AURORA_INTAKE_LEGAL_APPROVED:'yes',AURORA_INTAKE_WAF_REVIEWED:'yes',
  AURORA_INTAKE_POLICY_VERSION:'intake-v1-reviewed',
  AURORA_INTAKE_POLICY_URL:HOST+'/privacy',AURORA_INTAKE_HOSTNAME:'aurorauap.org',
  AURORA_REPORT_AUTH_ENABLED:'enabled',AURORA_REPORT_AUTH_URL:AUTH,
  AURORA_REPORT_AUTH_PUBLISHABLE_KEY:'sb_publishable_just_for_in_memory_test_12345',
  AURORA_REPORT_AUTH_PROVIDERS:'email',
  AURORA_TURNSTILE_SECRET:'synthetic_fixture_secret_123456789',
  AURORA_TURNSTILE_SITE_KEY:'synthetic_fixture_sitekey_123456789',
  AURORA_ACCESS_TEAM:TEAM,AURORA_ACCESS_AUD:AUD,
  AURORA_MODERATOR_EMAIL:OWNER_EMAIL,AURORA_MODERATION_ENABLED:'enabled'
 };
 const count=table=>sql.prepare('SELECT COUNT(*) AS n FROM '+table).get().n;
 return {sql,db,env,count,getWrites:()=>writes,getReads:()=>reads};
}
function samplePayload(requestKey=crypto.randomUUID(),turnstile='synthetic_challenge_01'){
 return {
  request_key:requestKey,
  country_code:'BG',region:'Shumen',approximate_location:'Fictional Shumen region',
  occurred_local:'2026-10-02T21:00',time_zone:'Europe/Sofia',
  category:'lights',description:PRIVATE,language_code:'en',
  consent_version:'intake-v1-reviewed',consent:true,adult_confirmed:true,
  turnstile_token:turnstile,website:''
 };
}
function requestReport(input,token=REPORTER_SESSION,origin=HOST){
 return new Request(HOST+'/api/intake/submit',{
  method:'POST',headers:{
   'Content-Type':'application/json','Origin':origin,
   ...(token?{Authorization:'Bearer '+token}:{})
  },body:JSON.stringify(input)
 });
}
function receiptRequest(token=REPORTER_SESSION){
 return new Request(HOST+'/api/account/privacy',{
  headers:{Authorization:'Bearer '+token,Origin:HOST,'Sec-Fetch-Site':'same-origin'}
 });
}
function moderatorRequest(token,path='/api/moderation/',body=null,origin=HOST){
 return new Request(HOST+path,{
  method:body?'POST':'GET',
  headers:{
   ...(token?{'Cf-Access-Jwt-Assertion':token}:{}),
   ...(body?{Origin:origin,'Content-Type':'application/json'}:{})
  },
  ...(body?{body:JSON.stringify(body)}:{})
 });
}
function mockedProviders(){
 const previous=globalThis.fetch;
 let authCalls=0,challengeCalls=0,keyCalls=0;
 const challengeUsed=new Set();
 let customChallenge=null;
 globalThis.fetch=async(url,opts={})=>{
  if(url===AUTH+'/auth/v1/user'){
   authCalls++;
   assert.equal(opts.method,'GET');
   assert.equal(opts.cache,'no-store');
   assert.equal(opts.redirect,'manual');
   const t=(opts.headers.Authorization||'').replace(/^Bearer /,'');
   const id=t===REPORTER_SESSION?REPORTER_ID:t===OTHER_SESSION?OTHER_ID:null;
   if(!id)return Response.json({error:'invalid'}, {status:401});
   return Response.json({id,email:'fixture@example.test',email_confirmed_at:'2026-11-01T18:00:00Z'});
  }
  if(url===SITEVERIFY){
   challengeCalls++;
   assert.equal(opts.method,'POST');
   assert.equal(opts.redirect,'manual');
   const params=new URLSearchParams(opts.body);
   assert.equal(params.get('secret'),'synthetic_fixture_secret_123456789');
   assert.equal(params.has('remoteip'),false);
   const challenge=params.get('response');
   if(customChallenge)return Response.json(customChallenge(challenge));
   if(challengeUsed.has(challenge))return Response.json({success:false,'error-codes':['timeout-or-duplicate']});
   challengeUsed.add(challenge);
   return Response.json({success:true,hostname:'aurorauap.org',action:'aurora_report'});
  }
  if(url===TEAM+'/cdn-cgi/access/certs'){
   keyCalls++;
   return Response.json({keys:[jwk]});
  }
  throw Error('OFFLINE TEST: unrecognized outgoing URL (not permitted)');
 };
 return {restore(){globalThis.fetch=previous},getCounters(){return {authCalls,challengeCalls,keyCalls}},
  overrideChallenge(fn){customChallenge=fn}};
}

test('synthetic end-to-end: verified report -> owner-only queue -> approval -> private receipts, never public cases',async()=>{
 const a=setup(),providers=mockedProviders();
 try{
  const unapproved={...a.env,AURORA_INTAKE_LEGAL_APPROVED:undefined};
  const blocked=await publicIntakeStatus({request:new Request(HOST+'/api/intake/status'),env:unapproved});
  assert.equal((await blocked.json()).accepting,false);
  assert.equal((await submit({request:requestReport(samplePayload()),env:unapproved})).status,503);
  assert.equal(a.count('intake_submissions'),0);
  assert.deepEqual(providers.getCounters(),{authCalls:0,challengeCalls:0,keyCalls:0});

  const requestKey=crypto.randomUUID(),firstPayload=samplePayload(requestKey);
  const accepted=await submit({request:requestReport(firstPayload),env:a.env});
  assert.equal(accepted.status,202);
  assert.match(accepted.headers.get('Cache-Control'),/no-store/);
  const receipt=await accepted.json();
  assert.equal(receipt.status,'pending');
  assert.equal(receipt.published,false);
  const receiptId=receipt.receipt_id;
  assert.match(receiptId,/^aur-int-[0-9a-f-]{36}$/);
  assert.equal(a.count('intake_submissions'),1);
  assert.equal(a.count('intake_reporter_links'),1);
  assert.equal(a.count('intake_review_events'),1);
  assert.equal(a.sql.prepare('SELECT auth_user_id FROM intake_reporter_links WHERE submission_id=?').get(receiptId).auth_user_id,REPORTER_ID);

  // Reporter may see only the receipt/status, never the private description.
  const own=await accountReceipts({request:receiptRequest(),env:a.env});
  assert.equal(own.status,200);
  const ownBody=await own.json();
  assert.deepEqual(ownBody.receipts.map(x=>x.receipt_id),[receiptId]);
  assert.ok(!JSON.stringify(ownBody).includes(PRIVATE));
  assert.ok(!JSON.stringify(ownBody).includes(REPORTER_ID));
  const different=await accountReceipts({request:receiptRequest(OTHER_SESSION),env:a.env});
  assert.equal(different.status,200);
  assert.deepEqual((await different.json()).receipts,[]);

  const validOwner=await signedAccess(),outsider=await signedAccess(FOREIGN_EMAIL);
  const forbidden=await moderationGet({request:moderatorRequest(outsider),env:a.env});
  assert.equal(forbidden.status,403);
  const unauth=await moderationGet({request:moderatorRequest(null),env:a.env});
  assert.equal(unauth.status,403);
  const listing=await moderationGet({request:moderatorRequest(validOwner),env:a.env});
  assert.equal(listing.status,200);
  const data=await listing.json();
  assert.equal(data.submissions.length,1);
  assert.equal(data.submissions[0].id,receiptId);
  assert.equal(data.submissions[0].description,PRIVATE);
  assert.equal(data.submissions[0].status,'pending');
  const detail=await moderationGet({
   request:moderatorRequest(validOwner,'/api/moderation/?receipt='+receiptId),env:a.env
  });
  assert.equal(detail.status,200);
  const detailData=await detail.json();
  assert.equal(detailData.submission.description,PRIVATE);
  assert.equal(detailData.events.length,1);
  assert.equal(detailData.events[0].action,'received');
  assert.equal(JSON.stringify(detailData).includes(REPORTER_ID),false);

  const decision={id:receiptId,decision:'approved',rationale:'Synthetic operator confirmed this report for isolated review only.'};
  const cross=await moderationPost({request:moderatorRequest(validOwner,'/api/moderation/',decision,'https://attacker.example'),env:a.env});
  assert.equal(cross.status,403);
  const strangerReview=await moderationPost({request:moderatorRequest(outsider,'/api/moderation/',decision),env:a.env});
  assert.equal(strangerReview.status,403);
  assert.equal(a.sql.prepare('SELECT status FROM intake_submissions WHERE id=?').get(receiptId).status,'pending');
  const reviewed=await moderationPost({request:moderatorRequest(validOwner,'/api/moderation/',decision),env:a.env});
  assert.equal(reviewed.status,200);
  const reviewBody=await reviewed.json();
  assert.deepEqual(reviewBody,{submission_id:receiptId,status:'approved',publication_status:'quarantined'});
  assert.equal(a.sql.prepare('SELECT status,publication_status FROM intake_submissions WHERE id=?').get(receiptId).publication_status,'quarantined');
  assert.equal(a.count('intake_review_events'),2);
  const events=a.sql.prepare('SELECT action,new_status FROM intake_review_events WHERE submission_id=? ORDER BY id').all(receiptId);
  assert.ok(events.some(x=>x.action==='review'&&x.new_status==='approved'));
  assert.equal((await moderationPost({request:moderatorRequest(validOwner,'/api/moderation/',decision),env:a.env})).status,409);
  assert.equal(a.count('intake_review_events'),2,'repeat review must NOT duplicate audit');

  const receiptAfter=await accountReceipts({request:receiptRequest(),env:a.env});
  assert.equal(receiptAfter.status,200);
  const state=(await receiptAfter.json()).receipts;
  assert.equal(state.length,1);
  assert.equal(state[0].status,'approved');
  assert.equal(a.count('cases'),0);
  const publicResponse=await publicCases({request:new Request(HOST+'/api/cases'),env:a.env});
  assert.equal(publicResponse.status,200);
  const publicJson=await publicResponse.json();
  assert.equal(publicJson.total,0);
  assert.deepEqual(publicJson.cases,[]);
  assert.equal(JSON.stringify(publicJson).includes(PRIVATE),false);
  assert.equal(JSON.stringify(publicJson).includes(receiptId),false);
  assert.equal(a.sql.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{providers.restore();a.sql.close()}
});

test('rejected challenge, unverified reporter and emergency off cannot create a private report',async()=>{
 const a=setup(),providers=mockedProviders();
 try{
  const badOrigin=await submit({request:requestReport(samplePayload(),'missing','https://evil.example'),env:a.env});
  assert.equal(badOrigin.status,403);
  const noIdentity=await submit({request:requestReport(samplePayload(),null),env:a.env});
  assert.equal(noIdentity.status,401);
  const badIdentity=await submit({request:requestReport(samplePayload(),'invalid_auth_test_session_xxxxxxxxxxxxxxxxxxx'),env:a.env});
  assert.equal(badIdentity.status,401);
  providers.overrideChallenge(()=>({success:true,hostname:'not-aurora.example',action:'aurora_report'}));
  const wrongHost=await submit({request:requestReport(samplePayload()),env:a.env});
  assert.equal(wrongHost.status,403);
  providers.overrideChallenge(()=>({success:true,hostname:'aurorauap.org',action:'wrong_action'}));
  const wrongAction=await submit({request:requestReport(samplePayload()),env:a.env});
  assert.equal(wrongAction.status,403);
  const off={...a.env,AURORA_INTAKE_ENABLED:'off'};
  const before=providers.getCounters();
  const halted=await submit({request:requestReport(samplePayload()),env:off});
  assert.equal(halted.status,503);
  assert.deepEqual(providers.getCounters(),before,'emergency off cannot contact external Auth or challenge');
  assert.equal(a.count('intake_submissions'),0);
  assert.equal(a.count('intake_reporter_links'),0);
  assert.equal(a.count('intake_review_events'),0);
  assert.equal(a.count('cases'),0);
 }finally{providers.restore();a.sql.close()}
});
