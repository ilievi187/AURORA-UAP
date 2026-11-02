// Private intake retention; never reads or modifies public case archives.
// All timestamps are UTC. Every purge is opt-in and bounded.
const MS_PER_DAY=86_400_000;
function utcDate(value) {
 const date=value instanceof Date?value:new Date(value);
 if(Number.isNaN(date.valueOf()))throw Error("Invalid retention date");
 return date;
}
function cutoff(now,days) {
 return new Date(utcDate(now).getTime()-days*MS_PER_DAY).toISOString();
}
export const RETENTION_DAYS=Object.freeze({rejected:90,pendingReview:180,approvedReview:365});

// Count only. Do not expose submitted text, identities or report identifiers to logs.
export async function retentionDueCounts(db,now=new Date()) {
 if(typeof db?.prepare!=="function")throw Error("D1 required");
 const result=await db.prepare(
  "SELECT "+
  "(SELECT COUNT(*) FROM intake_submissions WHERE status='rejected' AND updated_at<=?) AS rejected_expired,"+
  "(SELECT COUNT(*) FROM intake_submissions WHERE status IN ('pending','needs_clarification') AND created_at<=?) AS awaiting_review,"+
  "(SELECT COUNT(*) FROM intake_submissions WHERE status='approved' AND publication_status='quarantined' AND updated_at<=?) AS approved_reassessment"
 ).bind(cutoff(now,RETENTION_DAYS.rejected),cutoff(now,RETENTION_DAYS.pendingReview),cutoff(now,RETENTION_DAYS.approvedReview)).first();
 if(!result)throw Error("Retention count unavailable");
 return {rejected_expired:Number(result.rejected_expired),awaiting_review:Number(result.awaiting_review),
  approved_reassessment:Number(result.approved_reassessment)};
}

// Delete rejected reports AND their private review events together to avoid orphaned
// personal data. Never remove pending or approved reports automatically.
// An owner-approved retention policy alone does not activate purging: production
// backups, Access, rights request handling and explicit flag must be reviewed first.
export async function purgeRejectedReports(db,{now=new Date(),enabled=false,limit=100}={}) {
 if(typeof db?.prepare!=="function"||typeof db.batch!=="function")throw Error("Transactional D1 required");
 if(!Number.isInteger(limit)||limit<1||limit>500)throw Error("Invalid purge limit");
 const before=await retentionDueCounts(db,now);
 if(!enabled)return {dry_run:true,deleted:0,due:before};
 const threshold=cutoff(now,RETENTION_DAYS.rejected);
 // D1 batch is atomic. Two statements use the same selection criteria and cutoff.
 const filter="SELECT id FROM intake_submissions WHERE status='rejected' AND updated_at<=? ORDER BY updated_at,id LIMIT ?";
 const statements=[
  db.prepare("DELETE FROM intake_review_events WHERE submission_id IN ("+filter+")").bind(threshold,limit),
  db.prepare("DELETE FROM intake_submissions WHERE id IN ("+filter+") AND status='rejected' AND updated_at<=?").bind(threshold,limit,threshold)
 ];
 const results=await db.batch(statements);
 return {dry_run:false,deleted:Number(results?.[1]?.meta?.changes??0),due:before};
}
