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
 assert.match(report,/id="reportPrivacyTools"/);
 assert.match(report,/id="reportPrivacyList"/);
 assert.match(report,/id="reportDeleteRequest" href="mailto:blizzard9011@gmail.com\?subject=/);
 assert.match(report,/report\.js\?v=privacy-20261104/);
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
 assert.match(privacy,/View my private reports/);
 assert.match(privacy,/requests are handled manually after identity verification/);
 assert.match(privacy,/Self-declaration is not independent age verification/);
 assert.match(report,/id="adultConfirm" required/);
 assert.match(report,/Only people aged 18 or older may submit reports/);
 assert.match(report,/report\.js\?v=privacy-20261104/);
});


test('Turnstile diagnostic is a protected separate origin path with isolated CSP',()=>{
 const page=read('moderation.html');
 const headers=read('_headers');
 const source=read('functions/api/moderation/turnstile.js');
 assert.match(page,/href="\/api\/moderation\/turnstile"/);
 assert.match(source,/accessIdentity/);
 assert.match(source,/frame-ancestors 'none'/);
 assert.match(source,/report_submitted:false/);
 assert.match(headers,/\/moderation\.html[\s\S]*?Content-Security-Policy: default-src 'none'; script-src 'self';/);
});
