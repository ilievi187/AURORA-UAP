import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/moderation/access-check.js';
const env={
  AURORA_MODERATION_ENABLED:'enabled',
  AURORA_ACCESS_TEAM:'https://example.cloudflareaccess.com',
  AURORA_ACCESS_AUD:'a'.repeat(64),
  AURORA_MODERATOR_EMAIL:'owner@example.com',
  DB:{prepare(){throw Error('No DB queries needed')}}
};
test('Access diagnostic remains restricted to canonical HTTPS host and never exposes credentials',async()=>{
 for(const url of ['https://preview.pages.dev/api/moderation/access-check',
                   'https://evil.example/api/moderation/access-check',
                   'http://aurorauap.org/api/moderation/access-check']){
   const r=await onRequestGet({request:new Request(url),env});
   assert.equal(r.status,404);
 }
 const r=await onRequestGet({request:new Request('https://aurorauap.org/api/moderation/access-check',{headers:{Cookie:'CF_Authorization=not-a-real-token'}}),env});
 assert.equal(r.status,200);
 assert.equal(r.headers.get('Cache-Control'),'no-store');
 const body=await r.json();
 assert.equal(body.enabled,true);
 assert.equal(body.database_bound,true);
 assert.equal(body.assertion_header_present,false);
 assert.equal(body.authorization_cookie_present,true);
 assert.equal(body.signature_and_policy_verified,false);
 assert.equal(body.owner_email_matches,false);
 const text=JSON.stringify(body);
 assert.doesNotMatch(text,/owner@example\.com|example\.cloudflareaccess\.com|CF_Authorization|not-a-real-token/);
 assert.equal(Object.values(body).every(v=>typeof v==='boolean'),true);
});
