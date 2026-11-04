import test from 'node:test';
import assert from 'node:assert/strict';
import {checkReadOnlyRelease} from '../scripts/check-private-release-readiness.mjs';
const BASE='https://aurorauap.org';
const notice='<article id="bg" lang="bg"></article><article id="en" lang="en"></article>Supabase Auth Brevo GDPR';
const STATE={accepting:false,mode:'local_draft_only',attachments_enabled:false,automatic_publication:false,auth_required:true};
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
 const m=mock({'/privacy':new Response('<article id="bg"></article><article id="en"></article>',{status:200})});
 assert.equal((await checkReadOnlyRelease(m.fetcher)).ok,false);
});
