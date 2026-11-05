import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('durable news refresh is scheduled conservatively and owner-gated',()=>{
 const workflow=read('.github/workflows/news-refresh.yml');
 assert.match(workflow,/schedule:/);
 assert.match(workflow,/cron:\s*['"](?:\d{1,2})\s+\*\/6\s+\*\s+\*\s+\*['"]/);
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/timeout-minutes:\s*6/);
 assert.match(workflow,/AURORA_NEWS_REFRESH_TOKEN:\s*\$\{\{\s*secrets\.AURORA_NEWS_REFRESH_TOKEN\s*\}\}/);
 assert.match(workflow,/vars\.AURORA_NEWS_REFRESH_ENABLED == 'true'/,'scheduled job must be visibly skipped while owner has not opted in');
 assert.match(workflow,/if \[\[ -z "\$\{AURORA_NEWS_REFRESH_TOKEN:-\}" \]\]/,'missing secret must be checked before any network request');
 assert.match(workflow,/exit 1/,'an opted-in job must fail visibly if the secret is missing');
 assert.doesNotMatch(workflow,/enabled=false|steps\.archive-config\.outputs\.enabled/,'do not report a green run when the durable refresh was skipped');
 assert.doesNotMatch(workflow,/AURORA_NEWS_REFRESH_TOKEN:\s*['"][^$]/i,'no credential value may be committed');
});

test('scheduled refresh archives only fixed editions and validates durable source-backed results',()=>{
 const workflow=read('.github/workflows/news-refresh.yml');
 assert.match(workflow,/for edition in global bulgaria official/);
 assert.match(workflow,/https:\/\/aurorauap\.org\/api\/news-refresh/);
 assert.match(workflow,/--request POST/);
 assert.match(workflow,/Authorization: Bearer/);
 assert.match(workflow,/status !== "refreshed"/);
 assert.match(workflow,/fetched_count/);
 assert.match(workflow,/stored_count/);
 assert.doesNotMatch(workflow,/\/api\/news-editor|\/api\/news-tips|https:\/\/aurorauap\.org\/api\/news\?/i,'scheduled ingestion never publishes or accepts visitor submissions');
});
