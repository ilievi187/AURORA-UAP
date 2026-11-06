import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rules=readFileSync(new URL('../_headers',import.meta.url),'utf8');
const privateGate=readFileSync(new URL('../functions/_middleware.js',import.meta.url),'utf8');
test('public Cloudflare Pages responses use short staged HSTS and narrow baseline CSP',()=>{
 const defaults=rules.split(/\n\s*\n/)[0];
 assert.match(defaults,/^\/\*\s*\n/m);
 assert.match(defaults,/Strict-Transport-Security:\s*max-age=86400/);
 assert.doesNotMatch(defaults,/includeSubDomains|preload/,'do not accidentally lock subdomains or preload without owner approval');
 assert.match(defaults,/Content-Security-Policy: object-src 'none'; base-uri 'self'; frame-ancestors 'none'/);
 assert.match(defaults,/X-Frame-Options: DENY/);
 assert.match(defaults,/X-Content-Type-Options: nosniff/);
 assert.match(defaults,/Referrer-Policy: strict-origin-when-cross-origin/);
 assert.doesNotMatch(defaults,/script-src[^\n]*'unsafe-inline'/,'avoid introducing weak script exceptions');
});
test('private moderator and news editor retain stronger per-route CSP and fail-closed Access',()=>{
 for(const route of ['/moderation.html','/news-editor.html']){
  const specific=rules.slice(rules.indexOf('\n'+route+'\n'));
  assert.match(specific,/Content-Security-Policy: default-src 'none'; script-src 'self'/);
  assert.match(specific,/Cache-Control: no-store/);
 }
 assert.match(privateGate,/PRIVATE_PAGES/);
 assert.match(privateGate,/accessIdentity\(request, env\)/);
 assert.match(privateGate,/frame-ancestors 'none'/);
});
