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
 assert.doesNotMatch(privacy,/<article id="bg" lang="bg">/);
 assert.match(privacy,/<article id="en" lang="en">/);
 assert.match(privacy,/<html lang="en">/);
 assert.doesNotMatch(privacy,/class="langnav"|href="#bg"/);
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
 assert.match(privacy,/AURORA accepts text reports from verified-email users/);
 assert.match(privacy,/accepts text reports from verified-email users/);
 assert.match(privacy,/Brevo/,"Transactional email processor must be named");
 assert.match(privacy,/Supabase Auth/,"Auth processor must be named");
 assert.match(privacy,/Verified-email sign-in may also remain available/,"Verified-email authentication persists during temporary report downtime");
 assert.doesNotMatch(privacy,/[\u0400-\u04ff]/,"Public privacy notice must be English only");
 assert.match(privacy,/backup-retention procedures remain under review/);
 assert.match(privacy,/Erasing a private report and deleting a Supabase account/);
 assert.doesNotMatch(privacy,/Български|Поверителност|Подай сигнал/);
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

test('all live report and moderator interface markup is English-only',()=>{
 const moderator=read('moderation.html');
 const moderatorLogic=read('moderation.js');
 const reportMarkup=read('report.html');
 assert.match(moderator,/<html lang="en">/);
 assert.match(reportMarkup,/<html lang="en">/);
 for(const [name,source] of [['privacy',privacy],['report',reportMarkup],['moderator',moderator],['moderator script',moderatorLogic]]){
  assert.doesNotMatch(source,/[\u0400-\u04ff]/,name+' must not contain Bulgarian or Cyrillic interface text');
 }
 assert.match(reportMarkup,/id="privacyLink" href="\/privacy"/);
 assert.match(reportMarkup,/id="adultConfirm" required/);
 assert.match(moderator,/id="moderationSummary"/);
 assert.match(moderatorLogic,/pending/);
});
