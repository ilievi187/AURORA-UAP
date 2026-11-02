// Cloudflare Access assertions must be verified at the origin, including on pages.dev.
const decode = part => {
 if (!/^[A-Za-z0-9_-]+$/.test(part)) throw Error('bad encoding');
 const value = atob(part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'='));
 return Uint8Array.from(value,c=>c.charCodeAt(0));
};
const json = part => JSON.parse(new TextDecoder().decode(decode(part)));
export async function accessIdentity(request,env,fetcher=fetch){
 const domain=env.AURORA_ACCESS_TEAM, audience=env.AURORA_ACCESS_AUD, allowed=env.AURORA_MODERATOR_EMAIL;
 if(typeof domain!=='string'||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)||
    typeof audience!=='string'||!/^[a-f0-9]{64}$/.test(audience)||
    typeof allowed!=='string'||!allowed.includes('@')) return null;
 const token=request.headers.get('Cf-Access-Jwt-Assertion');
 if(!token||token.length>8192)return null;
 try{
  const parts=token.split('.'); if(parts.length!==3)return null;
  const header=json(parts[0]), claims=json(parts[1]), now=Math.floor(Date.now()/1000);
  if(header.alg!=='RS256'||typeof header.kid!=='string'||claims.iss!==domain||
     !Array.isArray(claims.aud)||!claims.aud.includes(audience)||
     !Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+60||
     (claims.nbf!==undefined&&(!Number.isFinite(claims.nbf)||claims.nbf>now))||
     typeof claims.email!=='string'||claims.email.toLowerCase()!==allowed.toLowerCase()) return null;
  const response=await fetcher(domain+'/cdn-cgi/access/certs',{redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!response.ok)return null;
  const data=await response.json();
  const jwk=Array.isArray(data.keys)?data.keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256'):null;
  if(!jwk)return null;
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const ok=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
  return ok?{email:claims.email}:null;
 }catch{return null}
}
