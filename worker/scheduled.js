import {importReviewed,monthlyAudit} from "./import-core.js";
import {retentionDueCounts,purgeRejectedReports} from "./privacy-retention.js";
// Independent scheduled Worker; deployment is disabled until the owner provides D1 binding.
const MANIFEST="https://aurorauap.org/data/imports/aaro-reviewed.json";
export default {
 async scheduled(controller,env){
  if(!env.DB)throw Error("Missing D1 binding DB");
  if(controller.cron==="0 3 1 * *"){await monthlyAudit(env.DB);return}
  if(controller.cron==="0 4 * * *"){
   // Daily retention audit; deletion is disabled unless operational safeguards
   // have been verified and the production owner explicitly enables the flag.
   const due=await retentionDueCounts(env.DB);
   if(env.AURORA_RETENTION_PURGE_ENABLED!=="enabled"){
    console.log("AURORA retention (read-only counts)",due);
    return;
   }
   let deleted=0;
   for(let page=0;page<20;page++){
    const result=await purgeRejectedReports(env.DB,{enabled:true,limit:100});
    deleted+=result.deleted;
    if(result.deleted<100)break;
   }
   // Log only counts, never report IDs or content.
   console.log("AURORA retention completed",{deleted,awaiting_review:due.awaiting_review,
    approved_reassessment:due.approved_reassessment});
   return;
  }
  if(controller.cron!=="0 3 * * MON")throw Error("Unknown schedule");
  const res=await fetch(MANIFEST,{headers:{accept:"application/json"}});
  if(!res.ok||Number(res.headers.get("content-length")||0)>200000)throw Error("Manifest fetch failed/too large");
  const payload=await res.text();
  if(payload.length>200000)throw Error("Manifest too large");
  await importReviewed(env.DB,JSON.parse(payload),"weekly_import");
 }
};
