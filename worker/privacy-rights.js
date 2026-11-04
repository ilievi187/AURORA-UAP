import {validatePrivateErasureRegister} from './privacy-restore-guard.js';
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
 // Check ownership + quarantine state *inside the batch*, not only in the
 // preceding read. A report could change state between the first SELECT and
 // starting the transaction. With a stale owner check, an earlier revision
 // could delete audit events and the account link even if the report DELETE
 // itself affected zero rows. D1.batch commits successful zero-row statements;
 // a post-batch changes check cannot retroactively roll back that work.
 const owned="SELECT l.submission_id FROM intake_reporter_links l "+
  "JOIN intake_submissions s ON s.id=l.submission_id "+
  "WHERE l.submission_id=? AND l.auth_user_id=? AND s.publication_status='quarantined'";
 const result=await db.batch([
  db.prepare("DELETE FROM intake_review_events WHERE submission_id IN ("+owned+")")
   .bind(receiptId,authUserId),
  db.prepare("DELETE FROM intake_submissions WHERE id=? AND publication_status='quarantined' AND id IN ("+owned+")")
   .bind(receiptId,receiptId,authUserId),
  // If FKs are disabled in a restoration exercise, remove the link ONLY
  // after the submission row is really absent. A stale account/visibility
  // check must never orphan a live report by removing the ownership link.
  db.prepare("DELETE FROM intake_reporter_links WHERE submission_id=? AND auth_user_id=? "+
   "AND NOT EXISTS(SELECT 1 FROM intake_submissions WHERE id=?)")
   .bind(receiptId,authUserId,receiptId)
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

// Owner-only PRE-ERASURE coverage check. This can be used to verify that each
// currently linked private report has a corresponding entry in an external
// owner-maintained, legally reviewed erasure register BEFORE any deletion.
//
// It intentionally does not establish register provenance, authenticate the
// Supabase account, approve legal retention, change D1, or authorize launch.
// All identifiers remain private in memory; the returned object is aggregate.

export async function inspectPrivateAccountLedgerCoverage(db,{
 authUserId,register
}={}){
 if(typeof db?.prepare!=='function')throw Error('Read-only D1 binding required');
 if(typeof authUserId!=='string'||!UUID.test(authUserId))
  throw Error('Independently verified private account UUID required');
 validatePrivateErasureRegister(register);
 const user=authUserId.toLowerCase();
 const approved=new Set(register.entries
  .filter(entry=>entry.authUserId.toLowerCase()===user)
  .map(entry=>entry.receiptId.toLowerCase()));
 // Include orphaned links, even if a restored schema has foreign keys disabled.
 // Bounded to avoid silently giving a green result on a truncated account.
 const query="SELECT l.submission_id, s.publication_status "+
  "FROM intake_reporter_links l LEFT JOIN intake_submissions s "+
  "ON s.id=l.submission_id WHERE lower(l.auth_user_id)=? "+
  "ORDER BY l.submission_id LIMIT 501";
 const result=await db.prepare(query).bind(user).all();
 if(!Array.isArray(result?.results))throw Error('Private account inventory unavailable');
 if(result.results.length>500)throw Error('Too many private links for one safe preview');
 const live=new Set();
 let nonQuarantinedOrOrphaned=0,covered=0;
 for(const row of result.results){
  if(!row||typeof row.submission_id!=='string'||!ID.test(row.submission_id))
   throw Error('Corrupt private account link metadata');
  const id=row.submission_id.toLowerCase();
  if(live.has(id))throw Error('Duplicate private account link metadata');
  live.add(id);
  if(row.publication_status!=='quarantined')nonQuarantinedOrOrphaned++;
  if(approved.has(id))covered++;
 }
 const missing=live.size-covered;
 const previouslyRegistered=approved.size-covered;
 const complete=missing===0&&nonQuarantinedOrOrphaned===0&&
  live.size>0&&approved.size>0;
 return {
  dry_run:true,scope:'d1_private_account_ledger_coverage_only',
  checked_live_private_links:live.size,
  registered_for_account:approved.size,
  currently_covered:covered,
  currently_unregistered:missing,
  registered_not_currently_linked:previouslyRegistered,
  nonquarantined_or_orphaned:nonQuarantinedOrOrphaned,
  current_link_coverage_complete:complete,
  // Even a fully covered register MUST NOT be treated as verified deletion,
  // complete historical ledger provenance, or public launch approval.
  independent_identity_verification_done:false,
  register_provenance_verified:false,
  processor_erasure_verified:false,
  sufficient_for_deletion:false,
  sufficient_for_public_launch:false,
  database_writes:0,
  required_next_steps:[
   'verify_requester_via_supabase_auth_admin',
   'protect_and_approve_external_erasure_register',
   'check_historical_snapshots_and_conflicts',
   'review_published_material_and_retention_exceptions',
   'owner_approve_separate_report_and_auth_erasure',
   'verify_processors_and_future_backup_reconciliation'
  ]
 };
}
