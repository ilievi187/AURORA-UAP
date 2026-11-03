import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const privacy=read('privacy.html');
const redirects=read('_redirects');
const report=read('report.html');
test('Pages clean-url canonical /privacy has an HTML asset and no rewrite loop',()=>{
 assert.doesNotMatch(redirects,/^\/privacy(?:\/)?\s/m,'Do not rewrite Pages clean URLs to their .html paths');
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
 assert.match(privacy,/Brevo/,"Transactional email processor must be named");
 assert.match(privacy,/Supabase Auth/,"Auth processor must be named");
 assert.match(privacy,/Verified-email sign-in is already available/,"Do not imply registration starts only with public intake");
 assert.match(privacy,/Входът с потвърден имейл вече е достъпен/,"BG notice must disclose active registration");
 assert.match(privacy,/backup-retention procedures remain under review/);
 assert.match(privacy,/Изтриването на частен сигнал и изтриването на профила/);
 assert.match(privacy,/Само лица на 18 или повече години/);
 assert.match(privacy,/Only people aged 18 or older may submit reports/);
 assert.match(privacy,/Self-declaration is not independent age verification/);
 assert.match(report,/id="adultConfirm" required/);
 assert.match(report,/Only people aged 18 or older may submit reports/);
 assert.match(report,/report\.js\?v=18plus-20261103/);
});
