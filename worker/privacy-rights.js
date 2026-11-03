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
