/* Generate offline reviewed seed SQL; the SQL must be manually applied to the D1 database.
   Run: node scripts/build-seed.mjs > /tmp/aurora-seed.sql
   Then: npx wrangler d1 execute aurora-uap-cases --remote --file=/tmp/aurora-seed.sql
*/
import {readFileSync} from "node:fs";
import {validateManifest} from "../worker/import-core.js";
const data=validateManifest(JSON.parse(readFileSync(new URL("../data/imports/aaro-reviewed.json",import.meta.url),"utf8")));
const literal=value=>value===null?"NULL":typeof value==="number"?String(value):"'"+String(value).replaceAll("'","''")+"'";
function values(xs){return xs.map(literal).join(",")}
console.log("-- GENERATED; V1.4 reviewed AARO factual records only. Do not edit generated output.");
console.log("BEGIN TRANSACTION;");
const s=data.source;
console.log("INSERT INTO sources(id,name,publisher,homepage_url,license,license_url,rights_note,rights_checked_at,approved_for_ingest) VALUES("+values([s.id,s.name,s.publisher,s.homepage_url,s.license,s.license_url,s.rights_note,s.rights_checked_at,1])+") ON CONFLICT(id) DO NOTHING;");
for(const c of data.cases){
 console.log("INSERT INTO cases(id,record_kind,title,title_bg,description,description_bg,date,date_precision,country_code,region,location,latitude,longitude,location_precision,category,review_status,publication_status,source_name,source_url,license,media) VALUES("+values([c.id,"historical_import",c.title,c.title_bg,c.description,c.description_bg,c.date,c.date_precision,c.country_code,c.region,c.location,c.latitude,c.longitude,c.location_precision,c.category,"approved","published",s.name,c.source_url,c.license,"[]"])+") ON CONFLICT(id) DO NOTHING;");
 console.log("INSERT INTO case_sources(case_id,source_id,source_record_id,source_url) VALUES("+values([c.id,s.id,c.source_record_id,c.source_url])+") ON CONFLICT(source_id,source_record_id) DO NOTHING;");
}
const id="seed-aarov14-reviewed";
console.log("INSERT INTO import_runs(id,source_id,run_type,status,inserted_count,updated_count,started_at,completed_at,details) VALUES("+values([id,s.id,"manual_import","success",data.cases.length,0,"2026-10-27T00:00:00Z","2026-10-27T00:00:00Z","Reviewed static seed; idempotent on reruns; seed timestamp is publication date, not a live synchronization clock."])+") ON CONFLICT(id) DO NOTHING;");
console.log("COMMIT;");
