import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const workflow=readFileSync(new URL("../.github/workflows/auto-case-archive.yml",import.meta.url),"utf8");
const validate=workflow.slice(workflow.indexOf("  validate-licensed-case-data:"),workflow.indexOf("  publish-scheduled-main-archive:"));
const publish=workflow.slice(workflow.indexOf("  publish-scheduled-main-archive:"));

test("archive validation is read-only and manual/PR events cannot enter the publisher",()=>{
 assert.ok(workflow.includes("permissions:"+String.fromCharCode(13)+String.fromCharCode(10)+"  contents: read")||workflow.includes("permissions:"+String.fromCharCode(10)+"  contents: read"));
 assert.ok(workflow.includes("pull_request:"));
 assert.ok(workflow.includes("if: github.event_name != 'schedule'"));
 assert.ok(!validate.includes("contents: write"));
 assert.ok(!validate.includes("git push"));
 assert.ok(!validate.includes("git add data/cases.json"));
 assert.ok(validate.includes("mktemp -d"));
 assert.ok(!validate.includes("workflow_dispatch"));
});

test("only scheduled main runs in the canonical repository can publish with job-scoped write permission",()=>{
 assert.ok(publish.includes("github.ref == 'refs/heads/main'"));
 assert.ok(publish.includes("github.ref_protected && github.repository == 'ilievi187/AURORA-UAP'"));
 assert.ok(publish.includes("permissions:"+String.fromCharCode(13)+String.fromCharCode(10)+"      contents: write")||publish.includes("permissions:"+String.fromCharCode(10)+"      contents: write"));
 assert.ok(publish.indexOf("node --test tests/archive-records.test.mjs tests/auto-archive-sync.test.mjs")<publish.indexOf("node scripts/sync-open-case-archive.mjs"));
 assert.ok(publish.indexOf("node scripts/sync-open-case-archive.mjs")<publish.indexOf("git push origin HEAD:main"));
});

test("workflow has no caller-controlled publishing inputs and fixtures precede import",()=>{
 assert.ok(!workflow.includes("inputs:"));
 assert.ok(!workflow.includes("github.event.inputs"));
 assert.ok(workflow.indexOf("node --test tests/archive-records.test.mjs tests/auto-archive-sync.test.mjs")<workflow.indexOf("node scripts/sync-open-case-archive.mjs"));
 assert.ok(workflow.indexOf("node --test tests/aurora-v1.test.mjs tests/archive-records.test.mjs tests/auto-archive-sync.test.mjs")<workflow.indexOf("git add data/cases.json data/archive-sync-status.json"));
});
