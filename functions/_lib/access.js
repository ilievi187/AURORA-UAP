// The origin must verify Cloudflare Access JWT signatures, not just decoded claims.
// Mirrors Cloudflare's Workers guidance: jose + issuer-scoped remote JWKS.
// Fail closed for missing configuration and unknown token issuers.
import {createRemoteJWKSet,customFetch,jwtVerify} from 'jose';

const jwksCache=new Map();
function getJWKS(domain,fetcher){
 // Cache only normal production network access; test fetchers stay isolated.
 if(fetcher===fetch){
  if(!jwksCache.has(domain))jwksCache.set(domain,createRemoteJWKSet(new URL(domain+'/cdn-cgi/access/certs'),{
   timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:3600000
  }));
  return jwksCache.get(domain);
 }
 return createRemoteJWKSet(new URL(domain+'/cdn-cgi/access/certs'),{
  timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:3600000,
  [customFetch]:fetcher
 });
}

export async function accessIdentity(request,env,fetcher=fetch){
 const domain=env?.AURORA_ACCESS_TEAM,audience=env?.AURORA_ACCESS_AUD,allowed=env?.AURORA_MODERATOR_EMAIL;
 if(typeof domain!=='string'||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)||
    typeof audience!=='string'||!/^[a-f0-9]{64}$/.test(audience)||
    typeof allowed!=='string'||!allowed.includes('@'))return null;
 const token=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!token||token.length>8192)return null;
 try{
  const {payload,protectedHeader}=await jwtVerify(token,getJWKS(domain,fetcher),{
   issuer:domain,audience,algorithms:['RS256']
  });
  // Access identity is scoped to this exact app, one owner, and fresh tokens.
  const now=Math.floor(Date.now()/1000);
  if(protectedHeader.alg!=='RS256'||!Array.isArray(payload.aud)||!payload.aud.includes(audience)||
     !Number.isFinite(payload.exp)||payload.exp<=now||
     !Number.isFinite(payload.iat)||payload.iat>now+60||
     typeof payload.email!=='string'||payload.email.toLowerCase()!==allowed.toLowerCase())return null;
  return {email:payload.email};
 }catch{
  // Never expose crypto errors or JWT contents to unauthenticated clients.
  return null;
 }
}
