import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectTurnstile,verifyTurnstile} from '../functions/_lib/intake.js';
import {verifyNewsTipTurnstile} from '../functions/_lib/newsroom.js';
import {verifiedAccount} from '../functions/_lib/reporter-auth.js';

function simulateCloudflareWorkers(result){
 return async (_url,options)=>{
  // Workerd throws TypeError before contacting origin for redirect:"error".
  if(options.redirect==='error')throw new TypeError('Workers does not implement redirect:error');
  assert.equal(options.redirect,'manual','redirect must never be followed to another origin');
  return result();
 };
}
test('report Turnstile siteverify uses a Workers-supported redirect mode and still checks action/host',async()=>{
 const env={AURORA_TURNSTILE_SECRET:'synthetic-only-secret'};
 const good=simulateCloudflareWorkers(()=>Response.json({success:true,hostname:'aurorauap.org',action:'aurora_report'}));
 assert.deepEqual(await inspectTurnstile('synthetic-token',env,'aurorauap.org',good),{verified:true});
 assert.equal(await verifyTurnstile('synthetic-token',env,'aurorauap.org',good),true);
 const redirect=simulateCloudflareWorkers(()=>Response.redirect('https://other.example.invalid',302));
 await assert.rejects(()=>inspectTurnstile('synthetic-token',env,'aurorauap.org',redirect),/unavailable/);
 const bad=simulateCloudflareWorkers(()=>Response.json({success:true,hostname:'elsewhere.example',action:'aurora_report'}));
 assert.deepEqual(await inspectTurnstile('synthetic-token',env,'aurorauap.org',bad),{verified:false,reason:'hostname_mismatch'});
});
test('news-tip Turnstile verification uses supported redirect and rejects 302 & wrong action',async()=>{
 const env={AURORA_NEWS_TIPS_SECRET:'synthetic-news-secret'};
 const good=simulateCloudflareWorkers(()=>Response.json({success:true,hostname:'aurorauap.org',action:'news_tip'}));
 assert.equal(await verifyNewsTipTurnstile('synthetic-token',env,'aurorauap.org',good),true);
 const redirect=simulateCloudflareWorkers(()=>Response.redirect('https://elsewhere.example.invalid',302));
 await assert.rejects(()=>verifyNewsTipTurnstile('synthetic-token',env,'aurorauap.org',redirect),/turnstile_unavailable/);
 const wrong=simulateCloudflareWorkers(()=>Response.json({success:true,hostname:'aurorauap.org',action:'login'}));
 assert.equal(await verifyNewsTipTurnstile('synthetic-token',env,'aurorauap.org',wrong),false);
});
test('Supabase verified-account lookup uses supported redirect mode, refusing 3xx and unverified email',async()=>{
 const env={
  AURORA_REPORT_AUTH_URL:'https://synthetic.supabase.co',
  AURORA_REPORT_AUTH_PUBLISHABLE_KEY:'sb_publishable_synthetic1234567890123',
  AURORA_REPORT_AUTH_PROVIDERS:'email'
 };
 const req=new Request('https://aurorauap.org/api/account/privacy',{headers:{Authorization:'Bearer '+'validtoken_'.repeat(5)}});
 const confirmed={id:'123e4567-e89b-42d3-a456-426614174000',email:'sample@example.test',email_confirmed_at:'2026-11-04T09:00:00Z'};
 const valid=simulateCloudflareWorkers(()=>Response.json(confirmed));
 assert.deepEqual(await verifiedAccount(req,env,valid),{id:confirmed.id});
 const redirect=simulateCloudflareWorkers(()=>Response.redirect('https://elsewhere.example.invalid',302));
 assert.equal(await verifiedAccount(req,env,redirect),null);
 const unverified=simulateCloudflareWorkers(()=>Response.json({...confirmed,email_confirmed_at:null}));
 assert.equal(await verifiedAccount(req,env,unverified),null);
});
