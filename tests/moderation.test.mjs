import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {accessIdentity} from '../functions/_lib/access.js';
import {inspectTurnstile,verifyTurnstile} from '../functions/_lib/intake.js';
import {onRequest as guardModeratorPage} from '../functions/_middleware.js';
import {onRequestGet,onRequestPost} from '../functions/api/moderation/index.js';
import {onRequestGet as turnstileGet,onRequestPost as turnstilePost,onRequestDelete as turnstileDelete} from '../functions/api/moderation/turnstile.js';
const env={AURORA_ACCESS_TEAM:'https://example.cloudflareaccess.com',AURORA_ACCESS_AUD:'a'.repeat(64),AURORA_MODERATOR_EMAIL:'reviewer@example.com',AURORA_MODERATION_ENABLED:'enabled',DB:{}};
const b64=value=>Buffer.from(value).toString('base64url');
const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'one',alg:'RS256'};
const fetcher=async()=>Response.json({keys:[jwk]});
async function token(overrides={}){
 const now=Math.floor(Date.now()/1000),head=b64(JSON.stringify({alg:'RS256',kid:'one'}));
 const payload=b64(JSON.stringify({iss:env.AURORA_ACCESS_TEAM,aud:[env.AURORA_ACCESS_AUD],email:env.AURORA_MODERATOR_EMAIL,iat:now,exp:now+300,...overrides}));
 const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(head+'.'+payload));
 return head+'.'+payload+'.'+b64(sig);
}
const req=t=>new Request('https://aurorauap.org/api/moderation/',{headers:{'Cf-Access-Jwt-Assertion':t}});
test('Access requires valid signature, audience, issuer, expiry and selected moderator',async()=>{
 assert.equal((await accessIdentity(req(await token()),env,fetcher)).email,env.AURORA_MODERATOR_EMAIL);
 for(const claims of [{aud:['wrong']},{iss:'https://evil.cloudflareaccess.com'},{exp:1},{email:'other@example.com'},{nbf:Math.floor(Date.now()/1000)+100}])assert.equal(await accessIdentity(req(await token(claims)),env,fetcher),null);
 const good=await token();assert.equal(await accessIdentity(req(good.slice(0,-5)+'AAAAA'),env,fetcher),null);
 assert.equal(await accessIdentity(req(good),{...env,AURORA_ACCESS_TEAM:'https://evil.example'},fetcher),null);
});
test('moderation fails closed without configured authorization and never touches DB',async()=>{
 const db={prepare(){throw Error('must not query')}};
 const r=await onRequestGet({request:req('bad'),env:{DB:db}});assert.equal(r.status,403);assert.equal(r.headers.get('cache-control'),'no-store');
 const p=await onRequestPost({request:new Request('https://aurorauap.org/api/moderation/',{method:'POST',body:'{}'}),env:{DB:db}});assert.equal(p.status,403);
});
test('authorized moderator can read quarantine and cross-origin review is denied',async()=>{
 const original=globalThis.fetch; globalThis.fetch=fetcher;
 let reads=0;
 const db={prepare(query){assert.match(query,/FROM intake_submissions/);return {bind(...args){assert.deepEqual(args,[51,0]);return {all:async()=>{reads++;return {results:[{id:'aur-int-example',description:'private'}]}}}}}}};
 try{
  const jwt=await token();
  const good=await onRequestGet({request:req(jwt),env:{...env,DB:db}});
  assert.equal(good.status,200); assert.equal((await good.json()).submissions[0].description,'private');assert.equal(reads,1);
  const cross=new Request('https://aurorauap.org/api/moderation/',{method:'POST',headers:{'Cf-Access-Jwt-Assertion':jwt,'Origin':'https://evil.example','Content-Type':'application/json'},body:'{}'});
  assert.equal((await onRequestPost({request:cross,env:{...env,DB:db}})).status,403);
  const preview=new Request('https://preview.pages.dev/api/moderation/',{headers:{'Cf-Access-Jwt-Assertion':jwt}});
  assert.equal((await onRequestGet({request:preview,env:{...env,DB:db}})).status,403);
 }finally{globalThis.fetch=original}
});

test('private queue enforces bounded pagination and returns navigation metadata',async()=>{
 const original=globalThis.fetch;globalThis.fetch=fetcher;
 let used=[];
 const db={prepare(query){
  assert.match(query,/FROM intake_submissions/);
  return {bind(limit,offset){used.push({limit,offset});return {all:async()=>({
   results:Array.from({length:offset===0?51:1},(_,i)=>({id:'aur-int-page-'+offset+'-'+i,description:'private'}))
  })}}};
 }};
 try{
  const jwt=await token();
  const send=async path=>onRequestGet({request:new Request('https://aurorauap.org'+path,{headers:{'Cf-Access-Jwt-Assertion':jwt}}),env:{...env,DB:db}});
  const first=await send('/api/moderation/');
  const one=await first.json();assert.equal(first.status,200);
  assert.equal(one.submissions.length,50);assert.equal(one.has_more,true);assert.equal(one.next_offset,50);
  const second=await send('/api/moderation/?offset=50');
  const two=await second.json();assert.equal(two.submissions.length,1);assert.equal(two.has_more,false);assert.equal(two.next_offset,null);
  assert.deepEqual(used,[{limit:51,offset:0},{limit:51,offset:50}]);
  for(const bad of ['/api/moderation/?offset=-1','/api/moderation/?offset=100001','/api/moderation/?offset=abc','/api/moderation/?secret=1']){
   const res=await send(bad);assert.equal(res.status,400);assert.equal(res.headers.get('cache-control'),'no-store');
  }
 }finally{globalThis.fetch=original}
});

test('Cloudflare Pages middleware gates canonical moderator HTML and redirect alias',async()=>{
 const routes=JSON.parse((await import('node:fs')).readFileSync(new URL('../_routes.json',import.meta.url),'utf8'));
 assert.ok(routes.include.includes('/moderation'));
 assert.ok(routes.include.includes('/moderation.html'));
 assert.ok(routes.include.includes('/news-editor'));
 assert.ok(routes.include.includes('/news-editor.html'));
 let served=0;
 const next=async()=>{served++;return new Response('<html>Private moderation shell</html>',{headers:{'Content-Type':'text/html'}})};
 for(const path of ['/moderation','/moderation.html','/news-editor','/news-editor.html']){
  const denied=await guardModeratorPage({request:new Request('https://aurorauap.org'+path),env,next});
  assert.equal(denied.status,403,path);
  assert.equal(denied.headers.get('cache-control').includes('no-store'),true);
  assert.equal(denied.headers.get('x-robots-tag'),'noindex, nofollow');
 }
 assert.equal(served,0,'static moderator HTML must never be served without Access');
 const publicPage=await guardModeratorPage({request:new Request('https://aurorauap.org/report.html'),env,next});
 assert.equal(publicPage.status,200,'public reports form remains accessible');
 assert.equal(served,1);
 const original=globalThis.fetch;globalThis.fetch=fetcher;
 try {
  const jwt=await token();
  const allowed=await guardModeratorPage({
   request:new Request('https://aurorauap.org/moderation',{headers:{'Cf-Access-Jwt-Assertion':jwt}}),
   env,next
  });
  assert.equal(allowed.status,200,'valid signed Access identity can load page');
  assert.equal(allowed.headers.get('cache-control'),'private, no-store, max-age=0');
  assert.equal(allowed.headers.get('x-frame-options'),'DENY');
  assert.equal(allowed.headers.get('content-security-policy'),"frame-ancestors 'none'");
  const allowedNews=await guardModeratorPage({request:new Request('https://aurorauap.org/news-editor',{headers:{'Cf-Access-Jwt-Assertion':jwt}}),env:{...env,AURORA_NEWS_EDITOR_ENABLED:'enabled'},next});
  assert.equal(allowedNews.status,200,'news editor requires its separate feature flag and valid Access identity');
  assert.equal(allowedNews.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal(served,3);
  const preview=await guardModeratorPage({
   request:new Request('https://preview.pages.dev/moderation',{headers:{'Cf-Access-Jwt-Assertion':jwt}}),
   env,next
  });
  assert.equal(preview.status,403,'preview cannot serve private moderator interface');
  const disabled=await guardModeratorPage({
   request:new Request('https://aurorauap.org/moderation',{headers:{'Cf-Access-Jwt-Assertion':jwt}}),
   env:{...env,AURORA_MODERATION_ENABLED:'disabled'},next
  });
  assert.equal(disabled.status,403);
  const post=await guardModeratorPage({
   request:new Request('https://aurorauap.org/moderation',{method:'POST',headers:{'Cf-Access-Jwt-Assertion':jwt}}),
   env,next
  });
  assert.equal(post.status,405);
  assert.equal(served,3);
 }finally{globalThis.fetch=original}
});

test('private overview and individual audit require owner JWT and disclose no reporter identity',async()=>{
 const sql=new DatabaseSync(':memory:');
 sql.exec('PRAGMA foreign_keys=ON');
 for(const name of ['0001_init.sql','0002_intake_quarantine.sql'])
  sql.exec(readFileSync(new URL('../migrations/'+name,import.meta.url),'utf8'));
 const id='aur-int-123e4567-e89b-42d3-a456-426614174000';
 const description='An observation in the archive. A stray <img src=x onerror=alert(1)> is treated as text.';
 sql.prepare("INSERT INTO intake_submissions (id,request_key,country_code,region,approximate_location,occurred_local,time_zone,category,description,language_code,consent_version,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
  .run(id,crypto.randomUUID(),'BG','Shumen','Shumen area','2025-01-01T20:00','Europe/Sofia','lights',description,'en','intake-v1-reviewed','pending','2025-01-01T19:00:00.000Z','2025-01-01T19:00:00.000Z');
 sql.prepare("INSERT INTO intake_review_events (submission_id,actor_type,actor_id,action,new_status,rationale) VALUES (?,'system','intake','received','pending','Quarantine for owner review')")
  .run(id);
 const db={prepare(query){
  const stmt=sql.prepare(query);
  const command=(values=[])=>({bind(...v){return command(v)},async first(){return stmt.get(...values)||null},async all(){return {results:stmt.all(...values)}}});
  return command();
 }};
 const original=globalThis.fetch;globalThis.fetch=fetcher;
 try{
  const signed=await token();
  const get=path=>onRequestGet({request:new Request('https://aurorauap.org'+path,{headers:{'Cf-Access-Jwt-Assertion':signed}}),env:{...env,DB:db}});
  const overview=await get('/api/moderation/?view=overview');
  assert.equal(overview.status,200);
  assert.equal(overview.headers.get('cache-control'),'no-store');
  const stats=await overview.json();
  assert.deepEqual(stats.counts,{pending:1,needs_clarification:0,approved:0,rejected:0});
  assert.equal(stats.total,1);assert.equal(stats.due.awaiting_review,1);
  assert.equal(JSON.stringify(stats).includes(description),false);
  assert.equal(JSON.stringify(stats).includes('actor_id'),false);
  const detailed=await get('/api/moderation/?receipt='+id);
  assert.equal(detailed.status,200);
  const body=await detailed.json();
  assert.equal(body.submission.description,description);
  assert.equal(body.events.length,1);
  assert.equal(body.events[0].rationale,'Quarantine for owner review');
  assert.equal('actor_id' in body.events[0],false);
  assert.equal(body.events_truncated,false);
  assert.equal((await get('/api/moderation/?receipt=aur-int-nope')).status,400);
  assert.equal((await get('/api/moderation/?receipt='+id+'&offset=0')).status,400);
  assert.equal((await get('/api/moderation/?view=overview&offset=0')).status,400);
  assert.equal((await get('/api/moderation/?offset=0&offset=0')).status,400);
  const missing='aur-int-123e4567-e89b-42d3-a456-426614174999';
  assert.equal((await get('/api/moderation/?receipt='+missing)).status,404);
  const noAuth=await onRequestGet({request:new Request('https://aurorauap.org/api/moderation/?view=overview'),env:{...env,DB:db}});
  assert.equal(noAuth.status,403);
  const preview=await onRequestGet({request:new Request('https://staging.pages.dev/api/moderation/?receipt='+id,{headers:{'Cf-Access-Jwt-Assertion':signed}}),env:{...env,DB:db}});
  assert.equal(preview.status,403);
 }finally{globalThis.fetch=original;sql.close()}
});


test('owner-only real Turnstile diagnostic rejects anonymous and untrusted host without touching D1',async()=>{
 const envWithKeys={...env,
  AURORA_TURNSTILE_SITE_KEY:'real_site_key_1234567890',
  AURORA_TURNSTILE_SECRET:'real_secret_1234567890',
  DB:{prepare(){throw Error('D1 MUST NOT be accessed by diagnostic')}}
 };
 const noAuth=await turnstileGet({request:new Request('https://aurorauap.org/api/moderation/turnstile'),env:envWithKeys});
 assert.equal(noAuth.status,403);
 assert.equal(noAuth.headers.get('Cache-Control').includes('no-store'),true);
 const noPost=await turnstilePost({request:new Request('https://aurorauap.org/api/moderation/turnstile',{method:'POST'}),env:envWithKeys});
 assert.equal(noPost.status,403);
 assert.equal((await turnstileDelete()).status,405);
 const preview=await turnstileGet({request:new Request('https://preview.pages.dev/api/moderation/turnstile'),env:envWithKeys});
 assert.equal(preview.status,403);
});
test('valid Access owner can open isolated real Turnstile diagnostic without disabling intake gate',async()=>{
 const real={...env,AURORA_TURNSTILE_SITE_KEY:'real_site_key_1234567890',
  AURORA_TURNSTILE_SECRET:'real_secret_1234567890',
  AURORA_INTAKE_ENABLED:'off',
  DB:{prepare(){throw Error('Diagnostic cannot query D1')}}
 };
 const original=globalThis.fetch;
 globalThis.fetch=fetcher;
 try{
  const signed=await token();
  const request=new Request('https://aurorauap.org/api/moderation/turnstile',{headers:{'Cf-Access-Jwt-Assertion':signed}});
  const r=await turnstileGet({request,env:real});
  assert.equal(r.status,200);
  assert.match(r.headers.get('Content-Security-Policy'),/script-src 'self' https:\/\/challenges.cloudflare.com/);
  assert.match(r.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
  const body=await r.text();
  assert.match(body,/real_site_key_1234567890/);
  assert.doesNotMatch(body,/real_secret_1234567890/);
  assert.match(body,/No report was submitted|without submitting a report/);
  assert.match(body,/turnstile-diagnostic.js/);
  assert.equal((await turnstileGet({request,env:{...real,AURORA_TURNSTILE_SECRET:'1x0000000000000000000000000000000AA'}})).status,503);
  assert.equal((await turnstileGet({request,env:{...real,AURORA_TURNSTILE_SITE_KEY:'1x00000000000000000000AA'}})).status,503);
  const wrong=await turnstileGet({request:new Request(request.url,{headers:{'Cf-Access-Jwt-Assertion':await token({email:'outsider@example.com'})}}),env:real});
  assert.equal(wrong.status,403);
 }finally{globalThis.fetch=original}
});
test('owner real challenge diagnostic strictly verifies hostname/action and stores no data',async()=>{
 const real={...env,AURORA_TURNSTILE_SITE_KEY:'real_site_key_1234567890',
  AURORA_TURNSTILE_SECRET:'real_secret_1234567890',
  AURORA_INTAKE_ENABLED:'off',
  DB:{prepare(){throw Error('Diagnostic cannot query D1')}}
 };
 const signed=await token();
 const original=globalThis.fetch;
 let verified={success:true,hostname:'aurorauap.org',action:'aurora_report'};
 const calls=[];
 globalThis.fetch=async(url,opts)=>{
  calls.push(url);
  if(url===env.AURORA_ACCESS_TEAM+'/cdn-cgi/access/certs')return Response.json({keys:[jwk]});
  assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(opts.method,'POST');
  assert.ok(opts.body.includes('response='));
  assert.ok(opts.body.includes('secret='));
  return Response.json(verified);
 };
 const request=(origin='https://aurorauap.org',body={token:'opaque_valid_token'})=>
  new Request('https://aurorauap.org/api/moderation/turnstile',{
   method:'POST',headers:{'Cf-Access-Jwt-Assertion':signed,'Content-Type':'application/json','Origin':origin},
   body:JSON.stringify(body)
  });
 try{
  const ok=await turnstilePost({request:request(),env:real});
  assert.equal(ok.status,200);
  assert.deepEqual(await ok.json(),{verified:true,report_submitted:false,private_data_changed:false});
  verified={success:true,hostname:'attacker.example',action:'aurora_report'};
  const wrongHost=await turnstilePost({request:request(),env:real});
  assert.equal(wrongHost.status,403);
  assert.equal((await wrongHost.json()).reason,'hostname_mismatch');
  verified={success:true,hostname:'aurorauap.org',action:'signup'};
  const wrongAction=await turnstilePost({request:request(),env:real});
  assert.equal(wrongAction.status,403);
  assert.equal((await wrongAction.json()).reason,'action_mismatch');
  verified={success:false,hostname:'aurorauap.org',action:'aurora_report'};
  const rejected=await turnstilePost({request:request(),env:real});
  assert.equal(rejected.status,403);
  assert.equal((await rejected.json()).reason,'siteverify_rejected');
  const previous=calls.length;
  assert.equal((await turnstilePost({request:request('https://attacker.example'),env:real})).status,403);
  assert.equal((await turnstilePost({request:request('https://aurorauap.org',{token:'x'}),env:real})).status,400);
  assert.equal((await turnstilePost({request:request('https://aurorauap.org',{token:'long_valid_token',extra:true}),env:real})).status,400);
  assert.equal(calls.length,previous,'invalid requests must not call external Siteverify');
 }finally{globalThis.fetch=original}
});


test('Siteverify diagnostics distinguish safe failure types without echoing token, secret or hostname',async()=>{
 const envReal={AURORA_TURNSTILE_SECRET:'private_sensitive_secret_never_print'};
 const challenge='private_sensitive_challenge_never_print';
 const cases=[
  [{success:false,'error-codes':['invalid-input-secret']},'server_secret_rejected'],
  [{success:false,'error-codes':['missing-input-secret']},'server_secret_rejected'],
  [{success:false,'error-codes':['invalid-input-response']},'token_rejected'],
  [{success:false,'error-codes':['timeout-or-duplicate']},'expired_or_reused_token'],
  [{success:false,'error-codes':['unknown-error','private-data']},'siteverify_rejected'],
  [{success:true,hostname:'unexpected-private-host.example',action:'aurora_report'},'hostname_mismatch'],
  [{success:true,hostname:'aurorauap.org',action:'unexpected-private-action'},'action_mismatch']
 ];
 for(const [upstream,expected] of cases){
  let numRequests=0;
  const fake=async(url,options)=>{
   numRequests++;
   assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');
   assert.equal(options.redirect,'error');
   assert.ok(options.body.includes('response='));
   assert.ok(options.body.includes('secret='));
   return Response.json(upstream);
  };
  const diag=await inspectTurnstile(challenge,envReal,'aurorauap.org',fake);
  assert.deepEqual(diag,{verified:false,reason:expected});
  assert.equal(await verifyTurnstile(challenge,envReal,'aurorauap.org',fake),false);
  assert.equal(numRequests,2);
  const readable=JSON.stringify(diag);
  for(const secret of [challenge,envReal.AURORA_TURNSTILE_SECRET,'unexpected-private-host','unexpected-private-action','private-data'])
   assert.equal(readable.includes(secret),false);
 }
 const ok=await inspectTurnstile(challenge,envReal,'aurorauap.org',
  async()=>Response.json({success:true,hostname:'aurorauap.org',action:'aurora_report'}));
 assert.deepEqual(ok,{verified:true});
});
test('Owner-only diagnostic displays only sanitized Siteverify failure codes and safe 503',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async(url)=>{
  if(url===env.AURORA_ACCESS_TEAM+'/cdn-cgi/access/certs')return Response.json({keys:[jwk]});
  return Response.json({success:false,'error-codes':['invalid-input-secret']});
 };
 const signed=await token();
 const real={...env,AURORA_TURNSTILE_SITE_KEY:'real_site_key_1234567890',AURORA_TURNSTILE_SECRET:'secret_only_on_server_123456789'};
 const request=new Request('https://aurorauap.org/api/moderation/turnstile',{
  method:'POST',headers:{'Cf-Access-Jwt-Assertion':signed,Origin:'https://aurorauap.org','Content-Type':'application/json'},
  body:JSON.stringify({token:'private_ephemeral_token_123456'})
 });
 try{
  const result=await turnstilePost({request:request.clone(),env:real});
  assert.equal(result.status,403);
  assert.match(result.headers.get('Cache-Control'),/no-store/);
  const body=await result.text();
  assert.deepEqual(JSON.parse(body),{verified:false,error:'challenge_rejected',reason:'server_secret_rejected'});
  assert.doesNotMatch(body,/secret_only_on_server|private_ephemeral_token|invalid-input-secret/);
  globalThis.fetch=async url=>{
   if(url===env.AURORA_ACCESS_TEAM+'/cdn-cgi/access/certs')return Response.json({keys:[jwk]});
   throw Error('upstream internal secret that must never be exposed');
  };
  const unavailable=await turnstilePost({request:request.clone(),env:real});
  assert.equal(unavailable.status,503);
  assert.deepEqual(await unavailable.json(),{verified:false,error:'challenge_unavailable',reason:'siteverify_unavailable'});
 }finally{globalThis.fetch=previous}
});
