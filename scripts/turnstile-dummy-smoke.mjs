// Manually run ONLY with Cloudflare's public dummy credentials.
// Never reads a production secret or sends a request to aurorauap.org.
import assert from 'node:assert/strict';
import {verifyTurnstile} from '../functions/_lib/intake.js';
const tests=[
 ['accepted','1x0000000000000000000000000000000AA',true],
 ['rejected','2x0000000000000000000000000000000AA',false],
 ['replayed','3x0000000000000000000000000000000AA',false]
];
for(const [label,secret,expected] of tests){
 const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
  method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({secret,response:'XXXX.DUMMY.TOKEN.XXXX'}),
  signal:AbortSignal.timeout(8000)
 });
 assert.equal(response.status,200,'Siteverify should be reachable');
 const body=await response.json();
 assert.equal(body.success,expected,'Test token status: '+label);
 console.log('Cloudflare dummy token '+label+': '+(body.success?'PASS':'DENY'));
 if(expected){
  const stub=async()=>Response.json(body);
  assert.equal(await verifyTurnstile('XXXX.DUMMY.TOKEN.XXXX',
   {AURORA_TURNSTILE_SECRET:secret},'aurorauap.org',stub),false);
  console.log('AURORA strict production hostname/action rejects dummy response: PASS');
 }
}
console.log('Siteverify dummy smoke completed; no production credentials or submission used.');
