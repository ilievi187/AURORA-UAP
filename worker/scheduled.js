import {importReviewed,monthlyAudit} from "./import-core.js";
// Independent scheduled Worker; deployment is disabled until the owner provides D1 binding.
const MANIFEST="https://aurorauap.org/data/imports/aaro-reviewed.json";
export default {
 async scheduled(controller,env){
  if(!env.DB)throw Error("Missing D1 binding DB");
  if(controller.cron==="0 3 1 * *"){await monthlyAudit(env.DB);return}
  if(controller.cron!=="0 3 * * MON")throw Error("Unknown schedule");
  const res=await fetch(MANIFEST,{headers:{accept:"application/json"}});
  if(!res.ok||Number(res.headers.get("content-length")||0)>200000)throw Error("Manifest fetch failed/too large");
  const payload=await res.text();
  if(payload.length>200000)throw Error("Manifest too large");
  await importReviewed(env.DB,JSON.parse(payload),"weekly_import");
 }
};
