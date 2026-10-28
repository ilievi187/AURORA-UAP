import test from 'node:test';
import assert from 'node:assert/strict';
import {accessIdentity} from '../functions/_lib/access.js';
import {onRequestGet,onRequestPost} from '../functions/api/moderation/index.js';
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
 const db={prepare(query){assert.match(query,/FROM intake_submissions/);return {all:async()=>{reads++;return {results:[{id:'aur-int-example',description:'private'}]}}}}};
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
