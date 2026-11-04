import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {inspectRestoredPrivateErasures,validatePrivateErasureRegister} from '../worker/privacy-restore-guard.js';
const OWNER='123e4567-e89b-42d3-a456-426614174010';
const FOREIGN='123e4567-e89b-42d3-a456-426614174011';
const id=i=>'aur-int-123e4567-e89b-42d3-a456-'+String(426614174000+i).padStart(12,'0');
const register=entries=>({version:1,entries});
function fixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0001_init.sql','0002_intake_quarantine.sql','0005_reporter_ownership.sql'])
  sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const create=(receipt,owner=OWNER,status='pending',publication='quarantined')=>{
  sql.prepare('INSERT INTO intake_submissions(id,request_key,country_code,region,approximate_location,occurred_local,time_zone,category,description,language_code,consent_version,status,publication_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
   .run(receipt,crypto.randomUUID(),'BG','Shumen','Synthetic-only location','2026-10-01T19:30','Europe/Sofia','lights',
    'Imaginary report for private restore regression testing only.','en','intake-v1-reviewed',status,publication);
  if(owner)sql.prepare('INSERT INTO intake_reporter_links(submission_id,auth_user_id) VALUES(?,?)').run(receipt,owner);
  sql.prepare('INSERT INTO intake_review_events(submission_id,actor_type,actor_id,action,new_status,rationale) VALUES(?,?,?,?,?,?)')
   .run(receipt,'system','test','received',status,'Fictional private audit only');
 };
 const db={prepare(query){
  const statement=sql.prepare(query);
  return {bind(...values){return {async first(){return statement.get(...values)||null}}}};
 }};
 const sizes=()=>Object.fromEntries(['intake_submissions','intake_review_events','intake_reporter_links','cases']
  .map(name=>[name,sql.prepare('SELECT COUNT(*) AS n FROM '+name).get().n]));
 return {sql,db,create,sizes};
}
test('detects resurrected erased data without reading report bodies or modifying restored database',async()=>{
 const f=fixture();
 try{
  f.create(id(1),OWNER);
  f.create(id(2),FOREIGN);
  const before=f.sizes();
  const result=await inspectRestoredPrivateErasures(f.db,{register:register([{receiptId:id(1),authUserId:OWNER}])});
  assert.deepEqual(result.counts,{expected_erased:1,absent:0,resurrected:1,
   owner_conflict:0,missing_owner_link:0,unexpected_metadata:0,published_collision:0});
  assert.equal(result.erasure_reconciliation_clean,false);
  assert.equal(result.needs_owner_review,true);
  assert.equal(result.sufficient_for_public_launch,false);
  assert.equal(result.database_writes,0);
  assert.deepEqual(f.sizes(),before);
  for(const sensitive of [OWNER,FOREIGN,id(1),id(2),'Fictional private audit only'])
   assert.equal(JSON.stringify(result).includes(sensitive),false);
 }finally{f.sql.close()}
});
test('already erased receipt is absent and unrelated private rows remain untouched',async()=>{
 const f=fixture();
 try{
  f.create(id(3),FOREIGN);
  const before=f.sizes();
  const result=await inspectRestoredPrivateErasures(f.db,{register:register([{receiptId:id(4),authUserId:OWNER}])});
  assert.equal(result.counts.absent,1);
  assert.equal(result.erasure_reconciliation_clean,true);
  assert.equal(result.sufficient_for_public_launch,false);
  assert.deepEqual(f.sizes(),before);
 }finally{f.sql.close()}
});
test('detects different owner, unlinked restored report and publication collision',async()=>{
 const f=fixture();
 try{
  f.create(id(5),FOREIGN);
  f.create(id(6),null);
  // Publication state is constrained to "quarantined" in the live schema.
  // To exercise a *corrupt restored snapshot* explicitly, bypass CHECK only
  // within this synthetic in-memory fixture, never on production.
  f.sql.exec('PRAGMA ignore_check_constraints=ON');
  f.create(id(7),OWNER,'approved','published');
  const result=await inspectRestoredPrivateErasures(f.db,{register:register([5,6,7].map(n=>({receiptId:id(n),authUserId:OWNER})))});
  assert.equal(result.counts.owner_conflict,1);
  assert.equal(result.counts.missing_owner_link,1);
  assert.equal(result.counts.published_collision,1);
  assert.equal(result.erasure_reconciliation_clean,false);
 }finally{f.sql.close()}
});
test('orphaned private audit after partial restore triggers manual review',async()=>{
 const f=fixture();
 try{
  f.create(id(8),OWNER);
  f.sql.exec('PRAGMA foreign_keys=OFF');
  f.sql.prepare('DELETE FROM intake_submissions WHERE id=?').run(id(8));
  const result=await inspectRestoredPrivateErasures(f.db,{register:register([{receiptId:id(8),authUserId:OWNER}])});
  assert.equal(result.counts.unexpected_metadata,1);
  assert.equal(result.erasure_reconciliation_clean,false);
 }finally{f.sql.close()}
});
test('rejects private PII in register, duplicate receipt IDs and excessive workloads',async()=>{
 const entry={receiptId:id(10),authUserId:OWNER};
 assert.equal(validatePrivateErasureRegister(register([entry])),1);
 for(const bad of [
  null,[],{},register({}),register(Array.from({length:501},()=>entry)),
  {version:2,entries:[]},{version:1,entries:[],email:'private@example.org'},
  register([{...entry,description:'sensitive'}]),register([entry,entry]),
  register([{...entry,receiptId:'invalid'}]),register([{...entry,authUserId:'invalid'}])
 ])assert.throws(()=>validatePrivateErasureRegister(bad));
 await assert.rejects(()=>inspectRestoredPrivateErasures(null,{register:register([entry])}),/Read-only database required/);
});


test('an empty but well-formed private register does not authorize service restart',async()=>{
 const f=fixture();
 try{
  f.create(id(15),OWNER);
  const result=await inspectRestoredPrivateErasures(f.db,{register:register([])});
  assert.equal(result.counts.expected_erased,0);
  assert.equal(result.erasure_reconciliation_clean,true);
  assert.equal(result.sufficient_for_public_launch,false);
  assert.ok(result.required_independent_checks.includes('private_register_provenance_completeness_and_legal_retention'));
 }finally{f.sql.close()}
});
test('database query errors do not return a misleading green reconciliation status',async()=>{
 const candidate=register([{receiptId:id(20),authUserId:OWNER}]);
 const broken={prepare(){throw Error('Restored schema missing')}};
 await assert.rejects(()=>inspectRestoredPrivateErasures(broken,{register:candidate}),/Restored schema missing/);
});
