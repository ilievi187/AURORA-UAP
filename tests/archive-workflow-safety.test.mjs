import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const workflow=readFileSync(new URL("../.github/workflows/auto-case-archive.yml",import.meta.url),"utf8");
const qualityGate=readFileSync(new URL("../.github/workflows/aurora-v1-checks.yml",import.meta.url),"utf8");
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

test("only scheduled main runs in the canonical repository can publish on a dedicated branch",()=>{
 assert.ok(publish.includes("github.event_name == 'schedule'"));
 assert.ok(publish.includes("github.ref == 'refs/heads/main'"));
 assert.ok(publish.includes("github.repository == 'ilievi187/AURORA-UAP'"));
 assert.ok(publish.includes("vars.AURORA_ARCHIVE_PR_AUTOMATION_ENABLED == 'true'"));
 assert.ok(!publish.includes("github.ref_protected"));
 assert.match(publish,/permissions:\s+contents: write\s+pull-requests: write\s+actions: write/);
 assert.ok(publish.indexOf("node --test tests/archive-records.test.mjs tests/auto-archive-sync.test.mjs")<publish.indexOf("node scripts/sync-open-case-archive.mjs"));
 assert.ok(publish.indexOf("node scripts/sync-open-case-archive.mjs")<publish.indexOf("git add data/cases.json data/archive-sync-status.json"));
 assert.ok(publish.includes("branch=automation/archive-sync"));
 assert.match(publish,/git push[^\n]*HEAD:\$branch_ref/);
 assert.doesNotMatch(publish,/git push[^\n]*(?:HEAD:main|refs\/heads\/main)/);
});

test("scheduled archive runs update one existing PR instead of creating duplicates",()=>{
 assert.ok(publish.includes("--state open --base main --head \"$GITHUB_REPOSITORY_OWNER:$branch\""));
 assert.ok(publish.includes("gh pr edit \"$existing\""));
 assert.ok(publish.includes("--state closed --base main --head \"$GITHUB_REPOSITORY_OWNER:$branch\" --json number,mergedAt"));
 assert.ok(publish.includes("if [ -z \"$merged_at\" ]"));
 assert.ok(publish.includes("closed but unmerged; refusing to create a duplicate"));
 assert.ok(publish.includes("Previous archive update PR #$closed_number is merged"));
 assert.ok(publish.includes("gh pr create --draft --repo \"$GITHUB_REPOSITORY\" --base main --head \"$branch\""));
 assert.ok(publish.includes("--force-with-lease=$branch_ref:$expected"));
});

test("scheduled archive PRs dispatch the full read-only CI suite on the bot branch",()=>{
 assert.ok(qualityGate.includes("  workflow_dispatch:"));
 assert.ok(!qualityGate.includes("inputs:"));
 assert.match(qualityGate,/permissions:\r?\n  contents: read/);
 assert.ok(publish.includes("gh workflow run aurora-v1-checks.yml --repo \"$GITHUB_REPOSITORY\" --ref \"$branch\""));
 assert.ok(publish.indexOf("gh workflow run aurora-v1-checks.yml")>publish.indexOf("gh pr create --draft"));
});


test("workflow has no caller-controlled publishing inputs and fixtures precede import",()=>{
 assert.ok(!workflow.includes("inputs:"));
 assert.ok(!workflow.includes("github.event.inputs"));
 assert.ok(workflow.indexOf("node --test tests/archive-records.test.mjs tests/auto-archive-sync.test.mjs")<workflow.indexOf("node scripts/sync-open-case-archive.mjs"));
 assert.ok(workflow.indexOf("node --test tests/aurora-v1.test.mjs tests/archive-records.test.mjs tests/auto-archive-sync.test.mjs")<workflow.indexOf("git add data/cases.json data/archive-sync-status.json"));
});
