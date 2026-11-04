// Private owner-operated deletion of a quarantined report after independent
// identity verification. This module has NO publicly exposed route or scheduler.
// Supabase account deletion and backup retention require separate operator steps.
const ID=/^aur-int-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function eraseQuarantinedReport(db,{
 receiptId,authUserId,execute=false,ownerApproved=false
}={}){
 if(typeof db?.prepare!=="function"||typeof db?.batch!=="function")throw Error("D1 required");
 if(!ID.test(receiptId||"")||!UUID.test(authUserId||""))throw Error("Invalid private report identity");
 if(typeof execute!=="boolean"||typeof ownerApproved!=="boolean")throw Error("Invalid approval state");
 // Never delete a report because somebody only knows a receipt ID.
 // The verified Auth UUID must match the internal ownership link.
 const found=await db.prepare(
  "SELECT s.id FROM intake_submissions s JOIN intake_reporter_links l ON l.submission_id=s.id "+
  "WHERE s.id=? AND l.auth_user_id=? AND s.publication_status='quarantined'"
 ).bind(receiptId,authUserId).first();
 if(!found)return {dry_run:!execute,matched:false,deleted:0};
 if(!execute)return {dry_run:true,matched:true,deleted:0};
 if(!ownerApproved)throw Error("Independent owner approval required");
 // D1.batch is atomic; deleting private records never edits public cases.
 // The owner match is repeated in the SQL to guard against stale verification.
 const owned="SELECT submission_id FROM intake_reporter_links WHERE submission_id=? AND auth_user_id=?";
 const result=await db.batch([
  db.prepare("DELETE FROM intake_review_events WHERE submission_id IN ("+owned+")")
   .bind(receiptId,authUserId),
  db.prepare("DELETE FROM intake_submissions WHERE id=? AND publication_status='quarantined' AND id IN ("+owned+")")
   .bind(receiptId,receiptId,authUserId),
  // Explicit cleanup as defense in depth if a database disables FK cascades.
  db.prepare("DELETE FROM intake_reporter_links WHERE submission_id=? AND auth_user_id=?")
   .bind(receiptId,authUserId)
 ]);
 if(Number(result?.[1]?.meta?.changes??0)!==1)throw Error("Deletion transaction conflict");
 return {dry_run:false,matched:true,deleted:1};
}

// Read-only operator preview BEFORE any full account-erasure workflow. The D1
// report index is scoped by an independently verified Supabase Auth UUID.
// Never expose this function as an anonymous/public API or treat it as proof
// the Supabase identity, storage, processor logs, or restorable backups are gone.
export async function previewPrivateAccountErasure(db,{authUserId}={}){
 if(typeof db?.prepare!=="function")throw Error("D1 required");
 if(!UUID.test(authUserId||""))throw Error("Invalid private account identity");
 // Aggregate only: never disclose receipt IDs, report descriptions or emails.
 const counts=await db.prepare(
  "SELECT COUNT(*) AS total, "+
  "COALESCE(SUM(CASE WHEN s.publication_status='quarantined' THEN 1 ELSE 0 END),0) AS quarantined, "+
  "COALESCE(SUM(CASE WHEN s.status='pending' THEN 1 ELSE 0 END),0) AS pending, "+
  "COALESCE(SUM(CASE WHEN s.status='needs_clarification' THEN 1 ELSE 0 END),0) AS needs_clarification, "+
  "COALESCE(SUM(CASE WHEN s.status='approved' THEN 1 ELSE 0 END),0) AS approved, "+
  "COALESCE(SUM(CASE WHEN s.status='rejected' THEN 1 ELSE 0 END),0) AS rejected "+
  "FROM intake_reporter_links l JOIN intake_submissions s ON s.id=l.submission_id "+
  "WHERE l.auth_user_id=?"
 ).bind(authUserId).first();
 const audits=await db.prepare(
  "SELECT COUNT(*) AS total FROM intake_review_events e "+
  "JOIN intake_reporter_links l ON l.submission_id=e.submission_id "+
  "WHERE l.auth_user_id=?"
 ).bind(authUserId).first();
 if(!counts||!audits)throw Error("Account privacy preview unavailable");
 const total=Number(counts.total);
 const quarantined=Number(counts.quarantined);
 return {
  dry_run:true,
  scope:"d1_private_reports_only",
  report_counts:{
   total,quarantined,
   pending:Number(counts.pending),
   needs_clarification:Number(counts.needs_clarification),
   approved:Number(counts.approved),
   rejected:Number(counts.rejected)
  },
  private_review_event_count:Number(audits.total),
  needs_separate_review:total!==quarantined,
  executed:false,
  next_steps:[
   "independent_supabase_account_verification",
   "owner_review_of_scope_and_any_published_material",
   "approved_backup_restore_reconciliation",
   "owner_approved_private_d1_erasure",
   "separate_supabase_auth_and_processor_erasure",
   "independent_final_verification"
  ]
 };
}
