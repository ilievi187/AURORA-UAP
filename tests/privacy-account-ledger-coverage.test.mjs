import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {inspectPrivateAccountLedgerCoverage} from '../worker/privacy-rights.js';
const OWNER='123e4567-e89b-42d3-a456-426614174000';
const OUTSIDER='123e4567-e89b-42d3-a456-426614174111';
const id=n=>'aur-int-123e4567-e89b-42d3-a456-'+String(426614174000+n).padStart(12,'0');
const ledger=entries=>({version:1,entries});
const item=(n,authUserId=OWNER)=>({receiptId:id(n),authUserId});

function fixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0001_init.sql','0002_intake_quarantine.sql','0005_reporter_ownership.sql'])
  sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const insert=(n,authUserId=OWNER,publication='quarantined')=>{
  sql.prepare('INSERT INTO intake_submissions (id,request_key,country_code,region,approximate_location,occurred_local,time_zone,category,description,language_code,consent_version,status,publication_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
   .run(id(n),crypto.randomUUID(),'BG','Shumen','Fictional region','2026-10-02T21:15','Europe/Sofia','lights','Private fictional report body must never appear in output.','en','intake-v1-reviewed','pending',publication);
  sql.prepare('INSERT INTO intake_reporter_links(submission_id,auth_user_id) VALUES(?,?)').run(id(n),authUserId);
  sql.prepare("INSERT INTO intake_review_events(submission_id,actor_type,actor_id,action,new_status,rationale) VALUES(?,'system','intake','received','pending','Fictional audit note')")
   .run(id(n));
 };
 let statements=0;
 const db={prepare(sqlText){
  statements++;
  assert.match(sqlText,/^SELECT /i,'Read-only query required');
  assert.doesNotMatch(sqlText,/description|approximate_location|actor_id|email/i);
  const st=sql.prepare(sqlText);
  return {bind(...args){return {async all(){return {results:st.all(...args)}}}}};
 }};
 const counts=()=>Object.fromEntries(
  ['intake_submissions','intake_reporter_links','intake_review_events','cases']
   .map(table=>[table,sql.prepare('SELECT COUNT(*) AS n FROM '+table).get().n]));
 return {sql,db,insert,counts,readQueries:()=>statements};
}
test('covers only intended account; aggregate output has no identifiers, content or writes',async()=>{
 const f=fixture();
 try{
  f.insert(1);f.insert(2);f.insert(3,OUTSIDER);
  const before=f.counts();
  const all=ledger([item(1),item(2),item(3,OUTSIDER)]);
  const r=await inspectPrivateAccountLedgerCoverage(f.db,{authUserId:OWNER,register:all});
  assert.equal(r.current_link_coverage_complete,true);
  assert.equal(r.checked_live_private_links,2);
  assert.equal(r.registered_for_account,2);
  assert.equal(r.currently_covered,2);
  assert.equal(r.currently_unregistered,0);
  assert.equal(r.registered_not_currently_linked,0);
  assert.equal(r.nonquarantined_or_orphaned,0);
  assert.equal(r.sufficient_for_deletion,false);
  assert.equal(r.sufficient_for_public_launch,false);
  assert.equal(r.register_provenance_verified,false);
  assert.equal(r.database_writes,0);
  assert.deepEqual(f.counts(),before);
  for(const privateValue of [id(1),id(2),id(3),OWNER,OUTSIDER,
   'Private fictional report body','Fictional audit note'])
   assert.ok(!JSON.stringify(r).includes(privateValue),'Private material leaked');
  assert.equal(f.readQueries(),1);
 }finally{f.sql.close()}
});
test('flags missing owner ledger item without ever touching the other account',async()=>{
 const f=fixture();
 try{
  f.insert(1);f.insert(2);f.insert(3,OUTSIDER);
  const r=await inspectPrivateAccountLedgerCoverage(f.db,{
   authUserId:OWNER,register:ledger([item(1),item(3,OUTSIDER)])
  });
  assert.equal(r.current_link_coverage_complete,false);
  assert.equal(r.currently_unregistered,1);
  assert.equal(r.registered_for_account,1);
  const other=await inspectPrivateAccountLedgerCoverage(f.db,{
   authUserId:OUTSIDER,register:ledger([item(3,OUTSIDER)])
  });
  assert.equal(other.checked_live_private_links,1);
  assert.equal(other.current_link_coverage_complete,true);
 }finally{f.sql.close()}
});
test('previously erased entries require external snapshot check; zero live rows are never launch-ready',async()=>{
 const f=fixture();
 try{
  f.insert(1);
  const r=await inspectPrivateAccountLedgerCoverage(f.db,{
   authUserId:OWNER,register:ledger([item(1),item(7)])
  });
  assert.equal(r.current_link_coverage_complete,true);
  assert.equal(r.registered_not_currently_linked,1);
  assert.equal(r.sufficient_for_deletion,false);
  // Having no live private links is NOT proof of historic erasure completeness.
  f.sql.prepare('DELETE FROM intake_submissions WHERE id=?').run(id(1));
  const empty=await inspectPrivateAccountLedgerCoverage(f.db,{
   authUserId:OWNER,register:ledger([item(1)])
  });
  assert.equal(empty.checked_live_private_links,0);
  assert.equal(empty.current_link_coverage_complete,false);
  assert.equal(empty.registered_not_currently_linked,1);
 }finally{f.sql.close()}
});
test('published or corrupt/orphaned live records cannot qualify as covered',async()=>{
 const f=fixture();
 try{
  f.sql.exec('PRAGMA ignore_check_constraints=ON');
  f.insert(1,OWNER,'published');
  const bad=await inspectPrivateAccountLedgerCoverage(f.db,{
   authUserId:OWNER,register:ledger([item(1)])
  });
  assert.equal(bad.current_link_coverage_complete,false);
  assert.equal(bad.nonquarantined_or_orphaned,1);
  f.sql.exec('PRAGMA foreign_keys=OFF');
  f.sql.prepare('DELETE FROM intake_submissions WHERE id=?').run(id(1));
  const orphan=await inspectPrivateAccountLedgerCoverage(f.db,{
   authUserId:OWNER,register:ledger([item(1)])
  });
  assert.equal(orphan.nonquarantined_or_orphaned,1);
  assert.equal(orphan.current_link_coverage_complete,false);
 }finally{f.sql.close()}
});
test('invalid register or malformed account fails closed, including truncated 501-record inventory',async()=>{
 const f=fixture();
 try{
  for(const bad of [null,{},ledger([{...item(1),email:'never@in.register'}]),
    ledger([item(1),item(1)]),{version:9,entries:[]}]){
   await assert.rejects(()=>inspectPrivateAccountLedgerCoverage(f.db,{
    authUserId:OWNER,register:bad
   }));
  }
  await assert.rejects(()=>inspectPrivateAccountLedgerCoverage(f.db,{
   authUserId:'not-an-auth-uuid',register:ledger([])
  }));
  await assert.rejects(()=>inspectPrivateAccountLedgerCoverage(null,{
   authUserId:OWNER,register:ledger([])
  }));
  const extraDb={prepare(){return {bind(){return {async all(){
   return {results:Array.from({length:501},(_,i)=>({
    submission_id:id(1+(i%100)),publication_status:'quarantined'
   }))};
  }}}}}};
  await assert.rejects(()=>inspectPrivateAccountLedgerCoverage(extraDb,{
   authUserId:OWNER,register:ledger([])
  }),/Too many/);
  const failedDb={prepare(){throw Error('Missing table');}};
  await assert.rejects(()=>inspectPrivateAccountLedgerCoverage(failedDb,{
   authUserId:OWNER,register:ledger([])
  }),/Missing table/);
 }finally{f.sql.close()}
});
