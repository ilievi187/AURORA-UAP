import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const privacy=read('privacy.html');
const redirects=read('_redirects');
const report=read('report.html');
test('public /privacy and /privacy/ rewrite to an actual notice, not the homepage',()=>{
 assert.match(redirects,/^\/privacy \/privacy\.html 200$/m);
 assert.match(redirects,/^\/privacy\/ \/privacy\.html 200$/m);
 assert.match(privacy,/<link rel="canonical" href="https:\/\/aurorauap\.org\/privacy">/);
 assert.match(privacy,/<article id="bg" lang="bg">/);
 assert.match(privacy,/<article id="en" lang="en">/);
 assert.match(report,/<a id="privacyLink" href="\/privacy"/);
});
test('privacy notice accurately describes privacy protections and local draft mode',()=>{
 for(const term of ['Cloudflare D1','Cloudflare Access','Turnstile','90','180','12','GDPR','quarantine','blizzard9011@gmail.com'])
  assert.ok(privacy.includes(term),`Missing required privacy topic: ${term}`);
 assert.doesNotMatch(privacy,/\[TO VERIFY\]|\[ТРЯБВА ДА СЕ ПОТВЪРДИ\]|lorem ipsum/i);
 assert.match(privacy,/не означава, че подаването е активно/);
 assert.match(privacy,/does not itself enable submissions/);
});
