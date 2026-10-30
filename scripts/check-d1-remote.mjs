import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
// Validate Wrangler --json responses without assuming a database exists.
import {readFileSync} from "node:fs";
const expectedProductionUuid="724b6a03-575b-478e-a5ed-8734a89a7fa4";
const ids=new Set(["aaro-pr-2013","aaro-iraq-2017","aaro-west-us-2021"]);
export function databases(response){
 if(Array.isArray(response))return response;
 if(Array.isArray(response?.result))return response.result;
 throw Error("Unexpected Cloudflare D1 list JSON");
}
export function verifyDatabaseIdentity(list,uuid){
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid))throw Error("Invalid D1 UUID");
 if(uuid.toLowerCase()!==expectedProductionUuid)throw Error("Unexpected production D1 UUID");
 const matches=databases(list).filter(x=>[x.uuid,x.database_id,x.id].includes(uuid));
 if(matches.length!==1||matches[0].name!=="aurora-uap-production")throw Error("D1 UUID is not uniquely bound to aurora-uap-production in authenticated Cloudflare account");
 return true;
}
const requiredSchema={
 sources:["id","name","publisher","homepage_url","license","license_url","rights_note","rights_checked_at","approved_for_ingest","created_at"],
 cases:["id","record_kind","title","title_bg","description","description_bg","date","date_precision","country_code","region","location","latitude","longitude","location_precision","category","review_status","publication_status","source_name","source_url","license","media","assessment_status","assessment_authority","assessment_confidence","created_at","updated_at"],
 case_sources:["case_id","source_id","source_record_id","source_url","recorded_at"],
 import_runs:["id","source_id","run_type","status","inserted_count","updated_count","rejected_count","started_at","completed_at","details"],
 moderation_events:["id","case_id","actor_type","actor_id","action","old_status","new_status","explanation","created_at"],
 media_assets:["id","case_id","object_key","source_url","media_type","rights_status","is_public","created_at"]
};
export function verifyExistingSchema(payload){
 const items=Array.isArray(payload)?payload:Array.isArray(payload?.result)?payload.result:[payload];
 const rows=items.flatMap(item=>item?.results||item?.result?.results||[]);
 if(rows.length!==1)throw Error("Expected one D1 schema summary row");
 for(const [table,fields] of Object.entries(requiredSchema)){
  const value=rows[0][table];
  if(typeof value!=="string")throw Error("Missing D1 schema table: "+table);
  const actual=new Set(value.split(",").map(x=>x.trim()));
  for(const field of fields)if(!actual.has(field))throw Error("Missing D1 schema column: "+table+"."+field);
 }
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
  else if(action==="schema"){verifyExistingSchema(data);console.log("PASS: existing production D1 schema is compatible")}
  else if(action==="seed"){console.log("PASS: "+verifySeedRows(data)+" reviewed seed cases confirmed in remote D1")}
  else throw Error("Usage: node scripts/check-d1-remote.mjs identity <list.json> <uuid> | schema <schema.json> | seed <rows.json>");
 }catch(error){console.error("FAIL D1 bootstrap: "+error.message);process.exitCode=1}
}
