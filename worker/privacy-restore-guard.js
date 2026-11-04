// OWNER ONLY. Compare a RESTORED, ISOLATED D1 snapshot with erasures
// approved in a private ledger kept OUTSIDE the restorable database.
// No public API, schedule, writes, keys, printing, or launch authorization.
const RECEIPT=/^aur-int-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const only=(obj,fields)=>obj!==null&&typeof obj==="object"&&!Array.isArray(obj)&&
 Object.keys(obj).length===fields.length&&
 Object.keys(obj).every(key=>fields.includes(key));
export function validatePrivateErasureRegister(register){
 if(!only(register,["version","entries"])||register.version!==1||
  !Array.isArray(register.entries)||register.entries.length>500)
  throw Error("Invalid private erasure register; check provenance and completeness");
 const seen=new Set();
 for(const row of register.entries){
  if(!only(row,["receiptId","authUserId"])||
    !RECEIPT.test(row.receiptId||"")||!UUID.test(row.authUserId||""))
   throw Error("Invalid private erasure register entry");
  const key=row.receiptId.toLowerCase();
  if(seen.has(key))throw Error("Duplicate erasure entry needs private owner review");
  seen.add(key);
 }
 return register.entries.length;
}
export async function inspectRestoredPrivateErasures(db,{register}={}){
 if(typeof db?.prepare!=="function")throw Error("Read-only database required");
 const total=validatePrivateErasureRegister(register);
 const counts={expected_erased:total,absent:0,resurrected:0,owner_conflict:0,
  missing_owner_link:0,unexpected_metadata:0,published_collision:0};
 const statement=db.prepare(
  "SELECT EXISTS(SELECT 1 FROM intake_submissions WHERE id=?) AS report_exists, "+
  "(SELECT publication_status FROM intake_submissions WHERE id=?) AS publication_status, "+
  "(SELECT auth_user_id FROM intake_reporter_links WHERE submission_id=?) AS linked_owner, "+
  "(SELECT COUNT(*) FROM intake_review_events WHERE submission_id=?) AS audit_count"
 );
 for(const {receiptId,authUserId} of register.entries){
  const row=await statement.bind(receiptId,receiptId,receiptId,receiptId).first();
  if(!row)throw Error("Restored snapshot inspection unavailable");
  const exists=Number(row.report_exists);
  const publication=row.publication_status;
  const owner=row.linked_owner;
  const audit=Number(row.audit_count);
  if(![0,1].includes(exists)||!Number.isSafeInteger(audit)||audit<0)
   throw Error("Invalid restored privacy metadata");
  if(exists===0&&owner===null&&audit===0){counts.absent++;continue}
  if(exists===1&&publication!=="quarantined"){counts.published_collision++;continue}
  if(owner!==null&&String(owner).toLowerCase()!==authUserId.toLowerCase()){
   counts.owner_conflict++;continue;
  }
  if(exists===1&&owner!==null){counts.resurrected++;continue}
  if(exists===1&&owner===null){counts.missing_owner_link++;continue}
  counts.unexpected_metadata++;
 }
 const unresolved=counts.resurrected+counts.owner_conflict+counts.missing_owner_link+
  counts.unexpected_metadata+counts.published_collision;
 return {dry_run:true,scope:"isolated_restored_d1_only",database_writes:0,
  erasure_reconciliation_clean:unresolved===0,
  needs_owner_review:unresolved>0,
  sufficient_for_public_launch:false,
  counts,
  required_independent_checks:[
   "private_register_provenance_completeness_and_legal_retention",
   "resolve_missing_or_conflicting_private_records",
   "verify_supabase_auth_brevo_and_other_processors",
   "review_backup_retention_and_full_restoration",
   "obtain_independent_legal_and_owner_go_live_approval"
  ]
 };
}
