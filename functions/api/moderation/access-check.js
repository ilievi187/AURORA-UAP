// Temporary diagnostics for a Cloudflare Access application protected route.
// This endpoint must be removed immediately after the owner login smoke succeeds.
// Never return raw JWTs, email addresses, cookies, Access team domain or audience.
import {accessIdentity} from '../../_lib/access.js';
const headers={
  'Cache-Control':'no-store',
  'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options':'nosniff',
  'X-Robots-Tag':'noindex, nofollow',
  'Referrer-Policy':'no-referrer'
};
function decode(token) {
  try {
    if (!token || token.length>8192) return null;
    const parts=token.split('.');
    if(parts.length!==3)return null;
    const parse=part=>JSON.parse(new TextDecoder().decode(Uint8Array.from(
      atob(part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=')),c=>c.charCodeAt(0))));
    return {header:parse(parts[0]),claims:parse(parts[1])};
  }catch{return null;}
}
export async function onRequestGet({request,env}){
  const url=new URL(request.url);
  if(url.protocol!=='https:' || url.hostname!=='aurorauap.org')
    return new Response('Not found',{status:404,headers});
  const token=request.headers.get('Cf-Access-Jwt-Assertion');
  const details=decode(token);
  const h=details?.header,c=details?.claims,now=Math.floor(Date.now()/1000);
  const result={
    enabled:env?.AURORA_MODERATION_ENABLED==='enabled',
    database_bound:typeof env?.DB?.prepare==='function',
    access_team_configured:typeof env?.AURORA_ACCESS_TEAM==='string'&&/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.AURORA_ACCESS_TEAM),
    audience_configured:typeof env?.AURORA_ACCESS_AUD==='string'&&/^[a-f0-9]{64}$/.test(env.AURORA_ACCESS_AUD),
    allowed_email_configured:typeof env?.AURORA_MODERATOR_EMAIL==='string'&&env.AURORA_MODERATOR_EMAIL.includes('@'),
    assertion_header_present:!!token,
    authorization_cookie_present:/(?:^|;\s*)CF_Authorization=/.test(request.headers.get('Cookie')||''),
    jwt_structure_valid:!!details,
    algorithm_valid:h?.alg==='RS256',
    issuer_matches:typeof c?.iss==='string'&&c.iss===env?.AURORA_ACCESS_TEAM,
    audience_matches:Array.isArray(c?.aud)&&c.aud.includes(env?.AURORA_ACCESS_AUD),
    owner_email_matches:typeof c?.email==='string'&&c.email.toLowerCase()===env?.AURORA_MODERATOR_EMAIL?.toLowerCase(),
    token_time_valid:Number.isFinite(c?.exp)&&c.exp>now&&Number.isFinite(c?.iat)&&c.iat<=now+60,
    signature_and_policy_verified:!!(await accessIdentity(request,env))
  };
  return Response.json(result,{status:200,headers});
}
