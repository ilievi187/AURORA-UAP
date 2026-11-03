import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync,backup} from 'node:sqlite';
import {readFileSync,mkdtempSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {eraseQuarantinedReport} from '../worker/privacy-rights.js';
const read=file=>readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8');
const RECEIPT='aur-int-123e4567-e89b-42d3-a456-426614174000';
const OTHER='aur-int-123e4567-e89b-42d3-a456-426614174001';
const OWNER='123e4567-e89b-42d3-a456-426614174010';
function seeded(){
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0001_init.sql','0002_intake_quarantine.sql','0005_reporter_ownership.sql'])sql.exec(read(name));
 for(const [id,requestKey] of [[RECEIPT,'123e4567-e89b-42d3-a456-426614174020'],[OTHER,'123e4567-e89b-42d3-a456-426614174021']]){
  sql.prepare('INSERT INTO intake_submissions (id,request_key,country_code,region,approximate_location,occurred_local,time_zone,category,description,language_code,consent_version) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
   .run(id,requestKey,'BG','Shumen','Fictional test region','2026-01-01T12:00','Europe/Sofia','lights','Synthetic non-user report for an isolated recovery exercise only.','en','intake-v1-reviewed');
  sql.prepare('INSERT INTO intake_review_events(submission_id,actor_type,actor_id,action,new_status,rationale) VALUES (?,?,?,?,?,?)')
   .run(id,'system','test','received','pending','Synthetic audit');
  sql.prepare('INSERT INTO intake_reporter_links(submission_id,auth_user_id) VALUES (?,?)').run(id,OWNER);
 }
 return sql;
}
const facade=sql=>({
 prepare(q){
  const statement=sql.prepare(q);
  const bound=(values=[])=>({bind(...params){return bound(params)},
   async first(){return statement.get(...values)||null},
   async run(){return {meta:{changes:statement.run(...values).changes}}}});
  return bound();
 },
 async batch(statements){
  sql.exec('BEGIN IMMEDIATE');
  try{
   const outputs=[];
   for(const statement of statements)outputs.push(await statement.run());
   sql.exec('COMMIT');
   return outputs;
  }catch(err){sql.exec('ROLLBACK');throw err}
 }
});
function stats(sql,id){
 return Object.fromEntries([
  ['reports',sql.prepare('SELECT COUNT(*) AS n FROM intake_submissions WHERE id=?').get(id).n],
  ['events',sql.prepare('SELECT COUNT(*) AS n FROM intake_review_events WHERE submission_id=?').get(id).n],
  ['owner_links',sql.prepare('SELECT COUNT(*) AS n FROM intake_reporter_links WHERE submission_id=?').get(id).n],
  ['public_cases',sql.prepare('SELECT COUNT(*) AS n FROM cases').get().n]
 ]);
}
test('synthetic recovery proves an old snapshot can resurrect erased data until reconciled',async()=>{
 const tmp=mkdtempSync(join(tmpdir(),'aurora-private-backup-'));
 const dest=join(tmp,'synthetic-only.sqlite3');
 const live=seeded();
 let restored;
 try{
  assert.equal(live.prepare('PRAGMA foreign_key_check').all().length,0);
  assert.deepEqual(stats(live,RECEIPT),{reports:1,events:1,owner_links:1,public_cases:0});
  await backup(live,dest);
  assert.ok(statSync(dest).size>0);
  const result=await eraseQuarantinedReport(facade(live),{
   receiptId:RECEIPT,authUserId:OWNER,execute:true,ownerApproved:true
  });
  assert.equal(result.deleted,1);
  assert.deepEqual(stats(live,RECEIPT),{reports:0,events:0,owner_links:0,public_cases:0});
  assert.deepEqual(stats(live,OTHER),{reports:1,events:1,owner_links:1,public_cases:0});
  // This is a real privacy risk: an old snapshot can RESURRECT erased PII.
  restored=new DatabaseSync(dest);
  restored.exec('PRAGMA foreign_keys=ON');
  assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.equal(restored.prepare('PRAGMA foreign_key_check').all().length,0);
  assert.deepEqual(stats(restored,RECEIPT),{reports:1,events:1,owner_links:1,public_cases:0});
  // An operator must reconcile already-approved erasure BEFORE any restored
  // production copy may begin serving requests.
  const again=await eraseQuarantinedReport(facade(restored),{
   receiptId:RECEIPT,authUserId:OWNER,execute:true,ownerApproved:true
  });
  assert.equal(again.deleted,1);
  assert.deepEqual(stats(restored,RECEIPT),{reports:0,events:0,owner_links:0,public_cases:0});
  assert.deepEqual(stats(restored,OTHER),{reports:1,events:1,owner_links:1,public_cases:0});
  assert.equal(restored.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{
  restored?.close();
  live.close();
  rmSync(tmp,{recursive:true,force:true});
 }
});
test('synthetic snapshot contains required reporter links schema and private indexes',async()=>{
 const tmp=mkdtempSync(join(tmpdir(),'aurora-schema-'));
 const dest=join(tmp,'synthetic-schema.sqlite3');
 const sql=seeded();
 try{
  await backup(sql,dest);
  const copy=new DatabaseSync(dest,{readOnly:true});
  try{
   assert.equal(copy.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='intake_reporter_links'").get().n,1);
   assert.equal(copy.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='idx_reporter_links_user'").get().n,1);
   assert.equal(copy.prepare("SELECT COUNT(*) AS n FROM intake_submissions").get().n,2);
  }finally{copy.close()}
 }finally{sql.close();rmSync(tmp,{recursive:true,force:true})}
});
