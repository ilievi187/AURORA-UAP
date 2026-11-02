import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {RETENTION_DAYS,retentionDueCounts,purgeRejectedReports} from "../worker/privacy-retention.js";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const NOW=new Date("2026-11-02T12:00:00.000Z");
function setup(){
 const sql=new DatabaseSync(":memory:");
 sql.exec("PRAGMA foreign_keys=ON");
 sql.exec(read("migrations/0001_init.sql"));
 sql.exec(read("migrations/0002_intake_quarantine.sql"));
 const db={
  prepare(query){
   const statement=sql.prepare(query);
   const command=(args=[])=>({
    bind(...values){return command(values)},
    async first(){return statement.get(...args)||null},
    async run(){const x=statement.run(...args);return {meta:{changes:x.changes}}},
    async all(){return {results:statement.all(...args)}}
   });
   return command();
  },
  async batch(commands){
   sql.exec("BEGIN IMMEDIATE");
   try{const out=[];for(const q of commands)out.push(await q.run());sql.exec("COMMIT");return out}
   catch(error){sql.exec("ROLLBACK");throw error}
  }
 };
 const seed=(status,created_at,updated_at)=>{
  const id="aur-int-"+crypto.randomUUID();
  sql.prepare("INSERT INTO intake_submissions (id,request_key,country_code,region,approximate_location,occurred_local,time_zone,category,description,language_code,consent_version,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
   .run(id,crypto.randomUUID(),"BG","Shumen","Approximate area","2025-03-01T12:30","Europe/Sofia","lights","A report describing multiple unusual moving lights over a town, to be independently reviewed.","en","intake-v1-reviewed",status,created_at,updated_at);
  sql.prepare("INSERT INTO intake_review_events(submission_id,actor_type,actor_id,action,new_status,rationale) VALUES (?,'admin','test','review',?,'Test-only retained audit event')").run(id,status);
  return id;
 };
 return {db,sql,seed};
}
test("owner-approved retention deadlines are fixed and only counts leave quarantine",async()=>{
 assert.deepEqual(RETENTION_DAYS,{rejected:90,pendingReview:180,approvedReview:365});
 const {db,sql,seed}=setup();
 const oldRejected=seed("rejected","2026-05-01T10:00:00.000Z","2026-06-01T00:00:00.000Z");
 seed("rejected","2026-09-01T10:00:00.000Z","2026-10-01T00:00:00.000Z");
 seed("pending","2026-03-01T10:00:00.000Z","2026-08-01T00:00:00.000Z");
 seed("needs_clarification","2026-10-01T10:00:00.000Z","2026-10-01T00:00:00.000Z");
 const oldApproved=seed("approved","2024-08-01T10:00:00.000Z","2025-08-01T00:00:00.000Z");
 seed("approved","2026-10-01T10:00:00.000Z","2026-10-01T00:00:00.000Z");
 const due=await retentionDueCounts(db,NOW);
 assert.deepEqual(due,{rejected_expired:1,awaiting_review:1,approved_reassessment:1});
 const dry=await purgeRejectedReports(db,{now:NOW});
 assert.equal(dry.dry_run,true);assert.equal(dry.deleted,0);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions").get().n,6);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_review_events").get().n,6);
 const purge=await purgeRejectedReports(db,{now:NOW,enabled:true});
 assert.equal(purge.deleted,1);assert.equal(purge.dry_run,false);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions WHERE id=?").get(oldRejected).n,0);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_review_events WHERE submission_id=?").get(oldRejected).n,0);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions WHERE id=?").get(oldApproved).n,1);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM cases").get().n,0);
 assert.deepEqual(await retentionDueCounts(db,NOW),{rejected_expired:0,awaiting_review:1,approved_reassessment:1});
 sql.close();
});
test("90-day boundary and limit: never delete a young rejected report",async()=>{
 const {db,sql,seed}=setup();
 const older=seed("rejected","2026-01-01T00:00:00.000Z","2026-08-01T12:00:00.000Z");
 const boundary=seed("rejected","2026-01-01T00:00:00.000Z","2026-08-04T12:00:00.000Z");
 const newer=seed("rejected","2026-01-01T00:00:00.000Z","2026-08-10T12:00:00.000Z");
 const res=await purgeRejectedReports(db,{now:NOW,enabled:true,limit:1});
 assert.equal(res.deleted,1);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions WHERE id=?").get(older).n,0);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions WHERE id=?").get(boundary).n,1);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions WHERE id=?").get(newer).n,1);
 await assert.rejects(()=>purgeRejectedReports(db,{now:NOW,enabled:true,limit:1000}),/limit/);
 await assert.rejects(()=>retentionDueCounts(db,"not-a-date"),/Invalid retention date/);
 sql.close();
});
test("audit deletion and submission deletion are transactional",async()=>{
 const {db,sql,seed}=setup();
 const id=seed("rejected","2025-01-01T00:00:00.000Z","2026-01-01T00:00:00.000Z");
 sql.exec("CREATE TRIGGER prevent_retention_delete BEFORE DELETE ON intake_submissions BEGIN SELECT RAISE(ABORT,'retention aborted'); END;");
 await assert.rejects(()=>purgeRejectedReports(db,{now:NOW,enabled:true}),/retention aborted/);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_review_events WHERE submission_id=?").get(id).n,1);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM intake_submissions WHERE id=?").get(id).n,1);
 sql.close();
});
