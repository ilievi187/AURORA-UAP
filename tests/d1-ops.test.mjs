import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {verifyDatabaseIdentity,verifySeedRows} from "../scripts/check-d1-remote.mjs";
const uuid="c8d293a9-a0fc-4474-b83a-fd4da6f3d65a";
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
 assert.throws(()=>verifyDatabaseIdentity([{uuid,name:"aurora-uap-production"}],"00000000-0000-0000-0000-000000000001"),/not uniquely bound/);
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
 assert.doesNotMatch(bootstrap,/^\s+schedule:|^\s+push:|AURORA_REGISTRY_PUBLIC\s*=\s*enabled/m);
 assert.match(verify,/workflow_dispatch:/);
 assert.doesNotMatch(verify,/^\s+schedule:|^\s+push:/m);
});
