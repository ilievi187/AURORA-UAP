import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
// Validate Wrangler --json responses without assuming a database exists.
import {readFileSync} from "node:fs";
const ids=new Set(["aaro-pr-2013","aaro-iraq-2017","aaro-west-us-2021"]);
export function databases(response){
 if(Array.isArray(response))return response;
 if(Array.isArray(response?.result))return response.result;
 throw Error("Unexpected Cloudflare D1 list JSON");
}
export function verifyDatabaseIdentity(list,uuid){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid))throw Error("Invalid D1 UUID");
 const matches=databases(list).filter(x=>[x.uuid,x.database_id,x.id].includes(uuid));
 if(matches.length!==1||matches[0].name!=="aurora-uap-cases")throw Error("D1 UUID is not uniquely bound to aurora-uap-cases in authenticated Cloudflare account");
 return true;
}
export function verifySeedRows(payload){
 const items=Array.isArray(payload)?payload:Array.isArray(payload?.result)?payload.result:[payload];
 const rows=items.flatMap(item=>item?.results||item?.result?.results||[]);
 const byId=new Map(rows.filter(x=>ids.has(x.id)).map(x=>[x.id,x]));
 for(const id of ids){
  const x=byId.get(id);
  if(!x||x.review_status!=="approved"||x.publication_status!=="published"||x.record_kind!=="historical_import")
   throw Error("Required reviewed case missing/unpublished: "+id);
  if(!/^https:\/\/www\.aaro\.mil\//.test(x.source_url||""))
   throw Error("Missing official AARO source URL: "+id);
 }
 if(byId.size!==ids.size)throw Error("Seed record count mismatch");
 return byId.size;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [action,file,uuid]=process.argv.slice(2);
 try{
  const data=JSON.parse(readFileSync(file,"utf8"));
  if(action==="identity"){verifyDatabaseIdentity(data,uuid);console.log("PASS: correct Cloudflare D1 database identity")}
  else if(action==="seed"){console.log("PASS: "+verifySeedRows(data)+" reviewed seed cases confirmed in remote D1")}
  else throw Error("Usage: node scripts/check-d1-remote.mjs identity <list.json> <uuid> | seed <rows.json>");
 }catch(error){console.error("FAIL D1 bootstrap: "+error.message);process.exitCode=1}
}
