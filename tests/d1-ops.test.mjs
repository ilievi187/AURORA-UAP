import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyDatabaseIdentity,verifyExistingSchema,verifySeedRows} from "../scripts/check-d1-remote.mjs";
const uuid="724b6a03-575b-478e-a5ed-8734a89a7fa4";
const validRows=["aaro-pr-2013","aaro-iraq-2017","aaro-west-us-2021"].map(id=>({
 id,record_kind:"historical_import",review_status:"approved",publication_status:"published",
 source_url:"https://www.aaro.mil/Portals/136/PDFs/case_resolution_reports/AARO.pdf"
}));
test("existing D1 database must match both UUID and exact expected name",()=>{
 assert.equal(verifyDatabaseIdentity([{uuid,name:"aurora-uap-production"}],uuid),true);
 assert.equal(verifyDatabaseIdentity({result:[{uuid,name:"aurora-uap-production"}]},uuid),true);
 assert.throws(()=>verifyDatabaseIdentity([{uuid,name:"aurora-uap-cases"}],uuid),/not uniquely bound/);
 assert.throws(()=>verifyDatabaseIdentity([{uuid,name:"aurora-uap-production"},{uuid,name:"aurora-uap-production"}],uuid),/not uniquely bound/);
 assert.throws(()=>verifyDatabaseIdentity([{uuid,name:"aurora-uap-production"}],"../not-a-uuid"),/Invalid D1 UUID/);
 assert.throws(()=>verifyDatabaseIdentity([{uuid:"00000000-0000-0000-0000-000000000001",name:"aurora-uap-production"}],"00000000-0000-0000-0000-000000000001"),/Unexpected production D1 UUID/);
});
const schema={
 sources:"id,name,publisher,homepage_url,license,license_url,rights_note,rights_checked_at,approved_for_ingest",
 cases:"id,record_kind,title,title_bg,description,description_bg,date,date_precision,country_code,region,location,latitude,longitude,location_precision,category,review_status,publication_status,source_name,source_url,license,media,assessment_status,assessment_authority,assessment_confidence",
 case_sources:"case_id,source_id,source_record_id,source_url",
 import_runs:"id,source_id,run_type,status,inserted_count,updated_count,started_at,completed_at,details",
 moderation_events:"id,case_id,action",
 media_assets:"id,case_id,rights_status"
};
test("read-only preflight refuses missing or incompatible existing D1 schema",()=>{
 assert.equal(verifyExistingSchema([{results:[schema]}]),true);
 assert.equal(verifyExistingSchema({result:[{results:[schema]}]}),true);
 assert.throws(()=>verifyExistingSchema([{results:[{...schema,cases:null}]}]),/Missing D1 schema table: cases/);
 assert.throws(()=>verifyExistingSchema([{results:[{...schema,cases:"id,title"}]}]),/Missing D1 schema column: cases.record_kind/);
 assert.throws(()=>verifyExistingSchema([{results:[]}]),/Expected one D1 schema summary row/);
});
test("remote seed check accepts only three published editorially approved historical records",()=>{
 assert.equal(verifySeedRows([{results:validRows}]),3);
 assert.equal(verifySeedRows({result:[{results:validRows}]}),3);
 assert.throws(()=>verifySeedRows([{results:validRows.slice(0,2)}]),/missing\/unpublished/);
 assert.throws(()=>verifySeedRows([{results:validRows.map((r,i)=>i? r:{...r,publication_status:"draft"})}]),/missing\/unpublished/);
 assert.throws(()=>verifySeedRows([{results:validRows.map((r,i)=>i? r:{...r,source_url:"https://example.com"})}]),/Missing official AARO/);
});
test("Cloudflare D1 workflows are manual and cannot silently activate public registry",()=>{
 const bootstrap=readFileSync(new URL("../.github/workflows/d1-bootstrap.yml",import.meta.url),"utf8");
 const verify=readFileSync(new URL("../.github/workflows/verify-registry.yml",import.meta.url),"utf8");
 assert.match(bootstrap,/workflow_dispatch:/);
 assert.match(bootstrap,/approval_phrase == 'SEED_EXISTING_AURORA_D1'/);
 assert.match(bootstrap,/environment: aurora-d1-ops/);
 assert.match(bootstrap,/AURORA_CF_D1_TOKEN/);
 assert.match(bootstrap,/AURORA_CF_ACCOUNT_ID/);
 assert.match(bootstrap,/default: preflight/);
 assert.match(bootstrap,/inputs\.mode == 'preflight'/);
 assert.match(bootstrap,/inputs\.mode == 'seed' && inputs\.approval_phrase == 'SEED_EXISTING_AURORA_D1'/);
 assert.match(bootstrap,/- name: Apply existing, reviewed initial schema\s+if: \$\{\{ inputs\.mode == 'seed' \}\}/);
 assert.match(bootstrap,/- name: Import only the three approved AARO cases\s+if: \$\{\{ inputs\.mode == 'seed' \}\}/);
 assert.match(bootstrap,/- name: Verify real D1 seed records before claiming completion\s+if: \$\{\{ inputs\.mode == 'seed' \}\}/);
 assert.match(bootstrap,/check-d1-remote\.mjs schema/);
 assert.doesNotMatch(bootstrap,/^\s+schedule:|^\s+push:|AURORA_REGISTRY_PUBLIC\s*=\s*enabled/m);
 assert.match(verify,/workflow_dispatch:/);
 assert.doesNotMatch(verify,/^\s+schedule:|^\s+push:/m);
});
