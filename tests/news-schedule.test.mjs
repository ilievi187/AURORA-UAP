import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('news cache refresh is scheduled conservatively and remains manual-testable',()=>{
 const workflow=read('.github/workflows/news-refresh.yml');
 assert.match(workflow,/schedule:/);
 assert.match(workflow,/cron:\s*['"](?:\d{1,2})\s+\*\/6\s+\*\s+\*\s+\*['"]/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/timeout-minutes:\s*3/);
 assert.doesNotMatch(workflow,/\b(?:API_KEY|TOKEN|SECRET)\s*:/i,'the read-only refresh requires no secrets');
});

test('scheduled refresh only warms public feeds and validates source-backed API responses',()=>{
 const workflow=read('.github/workflows/news-refresh.yml');
 assert.match(workflow,/for edition in global bulgaria official/);
 assert.match(workflow,/https:\/\/aurorauap\.org\/api\/news/);
 assert.match(workflow,/status.*live.*cached|live.*cached.*status/i);
 assert.match(workflow,/published/);
 assert.match(workflow,/source/);
 assert.match(workflow,/https:\/\//);
 assert.doesNotMatch(workflow,/method:\s*['"]POST['"]|\/api\/news-editor|\/api\/news-tips/i,'the schedule cannot publish or accept submissions');
});
