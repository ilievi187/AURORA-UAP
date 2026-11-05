import test from 'node:test';
import assert from 'node:assert/strict';
import {checkReadOnlyRelease} from '../scripts/check-private-release-readiness.mjs';
const BASE='https://aurorauap.org';
const notice='<article id="en" lang="en"></article>Supabase Auth Brevo GDPR';
const STATE={accepting:false,mode:'local_draft_only',attachments_enabled:false,contact_collection_enabled:false,automatic_publication:false,auth_required:true};
function mock(overrides={}){
 const calls=[];
 const fetcher=async(url,init)=>{
  calls.push({url,init});
  assert.ok(url.startsWith(BASE+'/'));
  assert.equal(init.method,'GET');
  assert.equal(init.redirect,'manual');
  assert.equal(init.cache,'no-store');
  assert.equal(init.headers.Authorization,undefined);
  if(overrides[new URL(url).pathname])return overrides[new URL(url).pathname];
  if(url.endsWith('/api/intake/status'))return Response.json(STATE,{headers:{'Cache-Control':'no-store'}});
  if(url.endsWith('/api/account/privacy'))return Response.json(
   {error:'verified_email_required'},
   {status:401,headers:{'Cache-Control':'private, no-store, max-age=0'}});
  if(url===BASE+'/privacy')return new Response(notice,{status:200});
  if(url.includes('/moderation'))return Response.redirect('https://aurora.cloudflareaccess.com/cdn-cgi/access/login',302);
  if(url.includes('/news-editor'))return new Response('Forbidden',{status:403});
  throw Error('Unexpected '+url);
 };
 return {fetcher,calls};
}
test('prelaunch proof only performs anonymous GET, requires Cloudflare Access or denied origin',async()=>{
 const m=mock();const result=await checkReadOnlyRelease(m.fetcher);
 assert.equal(result.ok,true);
 assert.equal(result.results.length,17);
 assert.equal(m.calls.length,17);
 assert.equal(new Set(m.calls.map(x=>x.url)).size,17);
 assert.equal(m.calls.some(x=>x.init.body!==undefined),false);
});
test('GET 200 on any private route fails release preflight',async()=>{
 for(const path of ['/moderation','/moderation/','/moderation.html','/api/moderation/','/news-editor','/news-editor/','/news-editor.html','/moderation.html/','/moderation%2ehtml',
  '/moderation/index.html','/api/moderation/index','/api/moderation/turnstile/']){
  const m=mock({[path]:new Response('private data',{status:200})});
  const result=await checkReadOnlyRelease(m.fetcher);
  assert.equal(result.ok,false,path);
  assert.ok(result.results.some(x=>x.name===path&&!x.ok),path);
 }
});
test('accidentally public receipt endpoint fails prelaunch verification',async()=>{
 const m=mock({'/api/account/privacy':Response.json({receipts:[{receipt_id:'secret'}]},{status:200})});
 const result=await checkReadOnlyRelease(m.fetcher);
 assert.equal(result.ok,false);
 assert.ok(result.results.some(item=>item.name==='account-privacy'&&!item.ok));
});
test('redirect to unsafe external domain cannot masquerade as Access protection',async()=>{
 const m=mock({'/moderation':Response.redirect('https://attacker.example/login',302)});
 assert.equal((await checkReadOnlyRelease(m.fetcher)).ok,false);
});
test('Accidental release/invalid auth gating/caching fails prelaunch contract',async()=>{
 const cases=[
  {...STATE,accepting:true},
  {...STATE,automatic_publication:true},
  {...STATE,site_key:'public-live-key'},
  {...STATE,auth_required:false},
  {...STATE,attachments_enabled:true}
 ];
 for(const state of cases){
  const m=mock({'/api/intake/status':Response.json(state,{headers:{'Cache-Control':'no-store'}})});
  const result=await checkReadOnlyRelease(m.fetcher);
  assert.equal(result.ok,false,JSON.stringify(state));
 }
 const noCache=mock({'/api/intake/status':Response.json(STATE)});
 assert.equal((await checkReadOnlyRelease(noCache.fetcher)).ok,false);
});
test('Missing Brevo/Supabase processing disclosure fails release preflight',async()=>{
 const m=mock({'/privacy':new Response('<article id="en"></article>',{status:200})});
 assert.equal((await checkReadOnlyRelease(m.fetcher)).ok,false);
});

const LIVE_STATE={...STATE,accepting:true,mode:'text_only_quarantine',
 site_key:'0x4AAuroraReleasedProviderKey',policy_version:'intake-v1-reviewed',
 policy_url:'https://aurorauap.org/privacy',auth_providers:['email']};
test('postlaunch proof accepts only properly gated private text-only intake and 17 anonymous GET requests',async()=>{
 const m=mock({'/api/intake/status':Response.json(LIVE_STATE,{headers:{'Cache-Control':'no-store'}})});
 const audit=await checkReadOnlyRelease(m.fetcher,{profile:'postlaunch'});
 assert.equal(audit.ok,true);
 assert.equal(audit.results.length,17);
 assert.equal(m.calls.length,17);
 assert.ok(m.calls.every(x=>x.init.method==='GET'&&x.init.redirect==='manual'));
 assert.equal(m.calls.some(x=>x.init.body!==undefined),false);
});
test('prelaunch monitor does not silently accept an unapproved launch',async()=>{
 const m=mock({'/api/intake/status':Response.json(LIVE_STATE,{headers:{'Cache-Control':'no-store'}})});
 assert.equal((await checkReadOnlyRelease(m.fetcher)).ok,false);
});
test('postlaunch monitor fails closed on unsafe launch changes',async()=>{
 const cases=[
  {...LIVE_STATE,accepting:false,mode:'local_draft_only'},
  {...LIVE_STATE,automatic_publication:true},
  {...LIVE_STATE,attachments_enabled:true},
  {...LIVE_STATE,contact_collection_enabled:true},
  {...LIVE_STATE,auth_required:false},
  {...LIVE_STATE,policy_version:'draft'},
  {...LIVE_STATE,policy_url:'https://other.example/privacy'},
  {...LIVE_STATE,auth_providers:['google']},
  {...LIVE_STATE,site_key:'1x00000000000000000000AA'},
  {...LIVE_STATE,site_key:undefined}
 ];
 for(const state of cases){
  const m=mock({'/api/intake/status':Response.json(state,{headers:{'Cache-Control':'no-store'}})});
  const result=await checkReadOnlyRelease(m.fetcher,{profile:'postlaunch'});
  assert.equal(result.ok,false,JSON.stringify(state));
 }
 const noStore=mock({'/api/intake/status':Response.json(LIVE_STATE)});
 assert.equal((await checkReadOnlyRelease(noStore.fetcher,{profile:'postlaunch'})).ok,false);
});
test('monitor rejects unrecognized release profile instead of ignoring safeguards',async()=>{
 const m=mock();
 await assert.rejects(()=>checkReadOnlyRelease(m.fetcher,{profile:'launch-now'}),/Invalid release monitor profile/);
 assert.equal(m.calls.length,0);
});

test('live English-only notice passes, but missing English notice still fails closed',async()=>{
 const valid=mock({'/privacy':new Response('<article id="en" lang="en"></article>Supabase Auth Brevo GDPR',{status:200})});
 assert.equal((await checkReadOnlyRelease(valid.fetcher)).ok,true);
 const missing=mock({'/privacy':new Response('<article id="bg"></article>Supabase Auth Brevo GDPR',{status:200})});
 const result=await checkReadOnlyRelease(missing.fetcher);
 assert.equal(result.ok,false);
 assert.ok(result.results.some(row=>row.name==='privacy-notice'&&!row.ok));
});
