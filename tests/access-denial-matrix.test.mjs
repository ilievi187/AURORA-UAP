import test from 'node:test';
import assert from 'node:assert/strict';
import {accessIdentity} from '../functions/_lib/access.js';
import {onRequest as protectPage} from '../functions/_middleware.js';
import {onRequestGet as moderationGet,onRequestPost as moderationPost} from '../functions/api/moderation/index.js';
import {onRequestGet as diagnosticGet,onRequestPost as diagnosticPost} from '../functions/api/moderation/turnstile.js';
import {onRequestGet as editorGet,onRequestPost as editorPost} from '../functions/api/news-editor.js';

// Synthetic identities and keys: no real Cloudflare/Supabase token, account,
// personal data, database or production POST request ever leaves this test.
const TEAM='https://synthetic-access-matrix.cloudflareaccess.com';
const AUD='a'.repeat(64);
const OWNER='owner@example.test';
const OTHER='different-user@example.test';
const keys=await crypto.subtle.generateKey(
 {name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},
 true,['sign','verify']
);
const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'audit-test-key',alg:'RS256'};
const jwksFetch=async()=>Response.json({keys:[jwk]});
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const now=Math.floor(Date.now()/1000);
const defaultClaims={iss:TEAM,aud:[AUD],email:OWNER,iat:now,exp:now+300};
async function signed(claims={},header={}){
 const protectedHead=encode({alg:'RS256',kid:'audit-test-key',...header});
 const body=encode({...defaultClaims,...claims});
 const message=protectedHead+'.'+body;
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(message));
 return message+'.'+Buffer.from(signature).toString('base64url');
}
function request(path,jwt=null,method='GET'){
 const headers={};
 if(jwt!==null)headers['Cf-Access-Jwt-Assertion']=jwt;
 if(method==='POST'){
  headers.Origin='https://aurorauap.org';
  headers['Content-Type']='application/json';
 }
 return new Request('https://aurorauap.org'+path,{
  method,headers,...(method==='POST'?{body:'{"synthetic":"not-a-valid-action"}'}:{})
 });
}
function environment(){
 let queries=0;
 const db={prepare(){
  queries++;
  throw Error('UNAUTHORIZED MUST NOT ACCESS D1');
 }};
 return {
  env:{
   DB:db,
   AURORA_ACCESS_TEAM:TEAM,AURORA_ACCESS_AUD:AUD,
   AURORA_MODERATOR_EMAIL:OWNER,
   AURORA_MODERATION_ENABLED:'enabled',AURORA_NEWS_EDITOR_ENABLED:'enabled',
   AURORA_TURNSTILE_SITE_KEY:'synthetic_site_key_1234567890',
   AURORA_TURNSTILE_SECRET:'synthetic_secret_key_1234567890'
  },
  getQueries:()=>queries
 };
}
test('independently signed stranger and invalid Access tokens are denied by identity verifier',async()=>{
 const allowed=await signed();
 assert.deepEqual(await accessIdentity(request('/moderation',allowed),environment().env,jwksFetch),{email:OWNER});
 const bad=[
  await signed({email:OTHER}),
  await signed({aud:['different-audience']}),
  await signed({iss:'https://different.cloudflareaccess.com'}),
  await signed({iat:now+3600}),
  await signed({exp:now-5}),
  await signed({nbf:now+3600}),
  await signed({aud:AUD}), // must be an Access audience ARRAY
  await signed({email:OWNER,exp:now+20},{kid:'unknown-kid'})
 ];
 for(const token of bad){
  assert.equal(await accessIdentity(request('/moderation',token),environment().env,jwksFetch),null);
 }
 const parts=allowed.split('.');
 parts[1]=encode({...defaultClaims,email:OTHER});
 assert.equal(await accessIdentity(request('/moderation',parts.join('.')),environment().env,jwksFetch),null,'modified JWT must fail signature check');
 assert.equal(await accessIdentity(request('/moderation','not-a-jwt'),environment().env,jwksFetch),null);
 assert.equal(await accessIdentity(request('/moderation'),environment().env,jwksFetch),null);
 assert.equal(await accessIdentity(request('/moderation',allowed),environment().env,async()=>{throw Error('JWKS unavailable')}),null);
});
test('a real-format signed token for DIFFERENT email cannot access private shell/API or touch D1',async()=>{
 const variants=[
  {name:'no session',jwt:null},
  {name:'signed different account',jwt:await signed({email:OTHER})},
  {name:'valid signature, wrong app audience',jwt:await signed({aud:['b'.repeat(64)]})},
  {name:'valid signature, wrong issuer',jwt:await signed({iss:'https://different.cloudflareaccess.com'})},
  {name:'expired signed token',jwt:await signed({exp:now-5})},
  {name:'unsigned garbage',jwt:'not-a-valid-access-token'}
 ];
 const previousFetch=globalThis.fetch;
 globalThis.fetch=jwksFetch;
 try{
  for(const {name,jwt} of variants){
   const {env,getQueries}=environment();
   let served=0;
   const next=async()=>{served++;return new Response('PRIVATE_SHELL_MUST_NOT_RENDER',{status:200})};
   for(const path of ['/moderation','/moderation.html','/news-editor','/news-editor.html']){
    const response=await protectPage({request:request(path,jwt),env,next});
    assert.equal(response.status,403,name+' / '+path);
    assert.match(response.headers.get('cache-control')||'',/no-store/);
   }
   assert.equal(served,0,name+' cannot render HTML');
   for(const [label,fn] of [
    ['moderation-list',()=>moderationGet({request:request('/api/moderation/',jwt),env})],
    ['moderation-review',()=>moderationPost({request:request('/api/moderation/',jwt,'POST'),env})],
    ['Turnstile-GET',()=>diagnosticGet({request:request('/api/moderation/turnstile',jwt),env})],
    ['Turnstile-POST',()=>diagnosticPost({request:request('/api/moderation/turnstile',jwt,'POST'),env})],
    ['newsroom-GET',()=>editorGet({request:request('/api/news-editor',jwt),env,accessFetcher:jwksFetch})],
    ['newsroom-POST',()=>editorPost({request:request('/api/news-editor',jwt,'POST'),env,accessFetcher:jwksFetch})]
   ]){
    const response=await fn();
    assert.equal(response.status,403,name+' / '+label);
    assert.match(response.headers.get('cache-control')||'',/no-store/,name+' / '+label+' must not cache');
   }
   assert.equal(getQueries(),0,name+' must not read/write/inspect D1 schema');
  }
 }finally{globalThis.fetch=previousFetch}
});
test('missing/unsafe owner configuration denies every private surface without D1 access',async()=>{
 const token=await signed();
 const badConfigs=[
  {AURORA_MODERATOR_EMAIL:OTHER},
  {AURORA_ACCESS_AUD:'b'.repeat(64)},
  {AURORA_ACCESS_TEAM:'https://invalid.example'},
  {AURORA_MODERATION_ENABLED:'off'},
  {AURORA_NEWS_EDITOR_ENABLED:'off'}
 ];
 const old=globalThis.fetch;globalThis.fetch=jwksFetch;
 try{
  for(const config of badConfigs){
   const {env,getQueries}=environment();
   Object.assign(env,config);
   if(config.AURORA_NEWS_EDITOR_ENABLED){
    assert.equal((await editorGet({request:request('/api/news-editor',token),env,accessFetcher:jwksFetch})).status,403);
   }else{
    assert.equal((await moderationGet({request:request('/api/moderation/',token),env})).status,403);
   }
   assert.equal(getQueries(),0);
  }
 }finally{globalThis.fetch=old}
});
