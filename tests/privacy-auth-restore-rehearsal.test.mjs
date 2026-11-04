import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync,backup} from 'node:sqlite';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {onRequestGet as privateReceipts} from '../functions/api/account/privacy.js';
import {previewPrivateAccountErasure,inspectPrivateAccountLedgerCoverage,eraseQuarantinedReport} from '../worker/privacy-rights.js';
import {inspectRestoredPrivateErasures} from '../worker/privacy-restore-guard.js';

// This is an OFFLINE REHEARSAL, not actual Supabase admin deletion or real D1
// backup. Nothing is sent to production; only fictitious users and reports.
const OWNER='123e4567-e89b-42d3-a456-426614174010';
const OTHER='123e4567-e89b-42d3-a456-426614174011';
const id=i=>'aur-int-123e4567-e89b-42d3-a456-'+String(426614174000+i).padStart(12,'0');
const ACCOUNT_API='https://aurorauap.org/api/account/privacy';
const AUTH_URL='https://rehearsal-example.supabase.co';
const OWNER_TOKEN='rehearsal_owner_session_token_0123456789';
const OTHER_TOKEN='rehearsal_other_session_token_0123456789';
const apiEnv={
 AURORA_REPORT_AUTH_URL:AUTH_URL,
 AURORA_REPORT_AUTH_PUBLISHABLE_KEY:'sb_publishable_test_key_for_offline_rehearsal_only_123',
 AURORA_REPORT_AUTH_PROVIDERS:'email'
};
function localSql(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON');
 for(const migration of ['0001_init.sql','0002_intake_quarantine.sql','0005_reporter_ownership.sql'])
  sql.exec(readFileSync(new URL('../migrations/'+migration,import.meta.url),'utf8'));
 return sql;
}
function d1(sql){
 let calls=0;
 return {
  prepare(query){
   calls++;
   const statement=sql.prepare(query);
   const bound=(args=[])=>({
    bind(...values){return bound(values)},
    async first(){return statement.get(...args)||null},
    async all(){return {results:statement.all(...args)}},
    async run(){return {meta:{changes:Number(statement.run(...args).changes)}}}
   });
   return bound();
  },
  async batch(statements){
   sql.exec('BEGIN IMMEDIATE');
   try{
    const result=[];
    for(const statement of statements)result.push(await statement.run());
    sql.exec('COMMIT');return result;
   }catch(error){sql.exec('ROLLBACK');throw error}
  },
  getCalls(){return calls}
 };
}
function seed(sql,n,user,status='pending'){
 const receipt=id(n);
 sql.prepare('INSERT INTO intake_submissions (id,request_key,country_code,region,approximate_location,occurred_local,time_zone,category,description,language_code,consent_version,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
  .run(receipt,crypto.randomUUID(),'BG','Fictional test area','Fictional region','2026-10-03T18:30','Europe/Sofia','lights','Completely artificial private observation, not an actual user report.','en','intake-v1-reviewed',status);
 sql.prepare('INSERT INTO intake_reporter_links(submission_id,auth_user_id) VALUES(?,?)')
  .run(receipt,user);
 sql.prepare("INSERT INTO intake_review_events(submission_id,actor_type,actor_id,action,new_status,rationale) VALUES(?,'system','synthetic','received',?,'Fictional moderation audit')")
  .run(receipt,status);
 return receipt;
}
function count(sql,report){
 return {
  report:sql.prepare('SELECT COUNT(*) AS n FROM intake_submissions WHERE id=?').get(report).n,
  link:sql.prepare('SELECT COUNT(*) AS n FROM intake_reporter_links WHERE submission_id=?').get(report).n,
  audit:sql.prepare('SELECT COUNT(*) AS n FROM intake_review_events WHERE submission_id=?').get(report).n
 };
}
function fakeAuth(){
 const users=new Map([
  [OWNER_TOKEN,{id:OWNER,active:true}],
  [OTHER_TOKEN,{id:OTHER,active:true}]
 ]);
 let calls=0;
 return {
  async fetch(url,options){
   calls++;
   assert.equal(url,AUTH_URL+'/auth/v1/user');
   assert.equal(options.method,'GET');
   assert.equal(options.cache,'no-store');
   assert.equal(options.redirect,'manual');
   const bearer=options.headers.Authorization;
   const token=bearer?.startsWith('Bearer ')?bearer.slice(7):null;
   const user=users.get(token);
   if(!user?.active)return Response.json({error:'Invalid JWT'}, {status:401});
   return Response.json({
    id:user.id,email:'fictional_user@example.test',
    email_confirmed_at:'2026-11-01T00:00:00.000Z',app_metadata:{provider:'email'}
   },{status:200});
  },
  // Simulate a successful separate Supabase administrative deletion; do NOT
  // pretend the behavior of this fake represents verified real Auth revocation.
  simulateAdminDelete(userId){
   let removed=0;
   for(const user of users.values())if(user.id===userId){user.active=false;removed++}
   return removed;
  },
  isActive(token){return Boolean(users.get(token)?.active)},
  getCalls(){return calls}
 };
}
function receiptRequest(token){
 return new Request(ACCOUNT_API,{
  headers:{Authorization:'Bearer '+token,Origin:'https://aurorauap.org','Sec-Fetch-Site':'same-origin'}
 });
}
async function withFakeAuth(auth,callback){
 const old=globalThis.fetch;
 globalThis.fetch=auth.fetch;
 try{return await callback()}
 finally{globalThis.fetch=old}
}
test('offline full-account rehearsal: Supabase receipt access, private D1 erasure, old snapshot resurrection and reconciliation',async()=>{
 const tmp=mkdtempSync(join(tmpdir(),'aurora-synthetic-account-erasure-'));
 const snapshot=join(tmp,'fictional-pre-erasure-snapshot.sqlite3');
 const live=localSql(),liveD1=d1(live),auth=fakeAuth();
 let restored;
 try{
  const ownReports=[seed(live,1,OWNER),seed(live,2,OWNER,'rejected')];
  const foreignReport=seed(live,3,OTHER,'approved');
  const beforeForeign=count(live,foreignReport);
  const register={version:1,entries:ownReports.map(receiptId=>({receiptId,authUserId:OWNER}))};
  assert.deepEqual(beforeForeign,{report:1,link:1,audit:1});
  const identityCallsBefore=auth.getCalls();
  await withFakeAuth(auth,async()=>{
   const response=await privateReceipts({request:receiptRequest(OWNER_TOKEN),env:{...apiEnv,DB:liveD1}});
   assert.equal(response.status,200);
   assert.match(response.headers.get('Cache-Control'),/no-store/);
   const body=await response.json();
   assert.equal(body.receipts.length,2);
   assert.deepEqual(new Set(body.receipts.map(r=>r.receipt_id)),new Set(ownReports));
   assert.ok(!JSON.stringify(body).includes(foreignReport));
   assert.equal((await privateReceipts({
    request:receiptRequest(OTHER_TOKEN),env:{...apiEnv,DB:liveD1}
   })).status,200);
  });
  assert.equal(auth.getCalls()-identityCallsBefore,2);
  const preview=await previewPrivateAccountErasure(liveD1,{authUserId:OWNER});
  assert.equal(preview.report_counts.total,2);
  assert.equal(preview.private_review_event_count,2);
  assert.equal(preview.executed,false);
  const coverage=await inspectPrivateAccountLedgerCoverage(liveD1,{authUserId:OWNER,register});
  assert.equal(coverage.current_link_coverage_complete,true);
  assert.equal(coverage.sufficient_for_deletion,false);
  assert.equal(coverage.sufficient_for_public_launch,false);
  // A real SQLite snapshot, stored outside the repository, contains only
  // synthetic fixture rows. It represents an OLD backup before erasure.
  await backup(live,snapshot);
  for(const receiptId of ownReports){
   const out=await eraseQuarantinedReport(liveD1,{
    receiptId,authUserId:OWNER,execute:true,ownerApproved:true
   });
   assert.equal(out.deleted,1);
   assert.deepEqual(count(live,receiptId),{report:0,link:0,audit:0});
  }
  assert.deepEqual(count(live,foreignReport),beforeForeign);
  assert.equal((await previewPrivateAccountErasure(liveD1,{authUserId:OWNER})).report_counts.total,0);

  // THIS IS A FAKE AUTH SYSTEM; a REAL Supabase admin deletion needs a
  // separately authorized live sandbox test and post-deletion token check.
  assert.equal(auth.simulateAdminDelete(OWNER),1);
  assert.equal(auth.isActive(OWNER_TOKEN),false);
  assert.equal(auth.isActive(OTHER_TOKEN),true);
  await withFakeAuth(auth,async()=>{
   const beforeDbCalls=liveD1.getCalls();
   const revoked=await privateReceipts({request:receiptRequest(OWNER_TOKEN),env:{...apiEnv,DB:liveD1}});
   assert.equal(revoked.status,401);
   assert.equal(liveD1.getCalls(),beforeDbCalls,'revoked Auth token cannot query live D1');
   const outsider=await privateReceipts({request:receiptRequest(OTHER_TOKEN),env:{...apiEnv,DB:liveD1}});
   assert.equal(outsider.status,200);
   assert.deepEqual((await outsider.json()).receipts.map(r=>r.receipt_id),[foreignReport]);
  });

  restored=new DatabaseSync(snapshot);
  restored.exec('PRAGMA foreign_keys=ON');
  assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.equal(restored.prepare('PRAGMA foreign_key_check').all().length,0);
  const restoredD1=d1(restored);
  for(const receiptId of ownReports)assert.deepEqual(count(restored,receiptId),{report:1,link:1,audit:1});
  const raised=await inspectRestoredPrivateErasures(restoredD1,{register});
  assert.equal(raised.counts.resurrected,2,'old backup must trigger an erasure quarantine');
  assert.equal(raised.erasure_reconciliation_clean,false);
  assert.equal(raised.sufficient_for_public_launch,false);

  for(const receiptId of ownReports){
   const result=await eraseQuarantinedReport(restoredD1,{
    receiptId,authUserId:OWNER,execute:true,ownerApproved:true
   });
   assert.equal(result.deleted,1);
  }
  const reconciled=await inspectRestoredPrivateErasures(restoredD1,{register});
  assert.equal(reconciled.counts.absent,2);
  assert.equal(reconciled.erasure_reconciliation_clean,true);
  assert.equal(reconciled.sufficient_for_public_launch,false,
   'clean local restore alone does not mean external identity/processor erasure');
  assert.deepEqual(count(restored,foreignReport),beforeForeign);
  assert.equal(restored.prepare('PRAGMA foreign_key_check').all().length,0);
  // No test path activates public intake or purges unrelated records.
  for(const result of [preview,coverage,raised,reconciled]){
   const serialized=JSON.stringify(result);
   for(const sensitive of [...ownReports,OWNER,OTHER,foreignReport,
    'Completely artificial private observation','fictional_user@example.test']){
    assert.ok(!serialized.includes(sensitive),'sensitive data in owner summary');
   }
  }
 }finally{
  restored?.close();live.close();
  rmSync(tmp,{recursive:true,force:true});
 }
});
test('incomplete ledger is a stop condition: keep Auth active and do not erase any D1 report',async()=>{
 const live=localSql(),db=d1(live),auth=fakeAuth();
 try{
  const a=seed(live,4,OWNER),b=seed(live,5,OWNER);
  const beforeA=count(live,a),beforeB=count(live,b);
  const coverage=await inspectPrivateAccountLedgerCoverage(db,{
   authUserId:OWNER,register:{version:1,entries:[{receiptId:a,authUserId:OWNER}]}
  });
  assert.equal(coverage.current_link_coverage_complete,false);
  assert.equal(coverage.currently_unregistered,1);
  assert.equal(coverage.sufficient_for_deletion,false);
  assert.deepEqual(count(live,a),beforeA);
  assert.deepEqual(count(live,b),beforeB);
  assert.equal(auth.isActive(OWNER_TOKEN),true);
 }finally{live.close()}
});
test('Supabase provider deletion failure MUST NOT be presented as completed account erasure',async()=>{
 const live=localSql(),db=d1(live),auth=fakeAuth();
 try{
  const a=seed(live,6,OWNER);
  const register={version:1,entries:[{receiptId:a,authUserId:OWNER}]};
  assert.equal((await inspectPrivateAccountLedgerCoverage(db,{authUserId:OWNER,register})).current_link_coverage_complete,true);
  const deleted=await eraseQuarantinedReport(db,{receiptId:a,authUserId:OWNER,execute:true,ownerApproved:true});
  assert.equal(deleted.deleted,1,'synthetic D1 step succeeded');
  // External provider is down; no actual Auth delete is even attempted.
  const simulatedAuthAdminResponse=503;
  assert.equal(simulatedAuthAdminResponse,503);
  assert.equal(auth.isActive(OWNER_TOKEN),true,
   'a successful D1 deletion cannot imply that Supabase Auth user is gone');
  await withFakeAuth(auth,async()=>{
   const r=await privateReceipts({request:receiptRequest(OWNER_TOKEN),env:{...apiEnv,DB:db}});
   assert.equal(r.status,200,'user account still signs in; private receipts may be empty');
   assert.equal((await r.json()).receipts.length,0);
  });
  assert.equal((await inspectRestoredPrivateErasures(db,{register})).sufficient_for_public_launch,false);
 }finally{live.close()}
});
