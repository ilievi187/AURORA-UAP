// User-authenticated report intake. This identity is separate from moderator Access and donors.
// Only Supabase Auth server can attest to the verified email; never trust browser user metadata.
const USER_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROVIDERS=new Set(["email","google","apple","x"]);
export function configuredProviders(env){
 const raw=env?.AURORA_REPORT_AUTH_PROVIDERS;
 if(typeof raw!=="string")return [];
 const list=raw.split(",").map(s=>s.trim().toLowerCase());
 return list.length>0&&list.every(p=>PROVIDERS.has(p))&&new Set(list).size===list.length?list:[];
}
// Public login can be available while public report submission remains disabled.
export function reporterAuthAvailable(env){
 return /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(env?.AURORA_REPORT_AUTH_URL||"")&&
  typeof env?.AURORA_REPORT_AUTH_PUBLISHABLE_KEY==="string"&&
  /^(?:sb_publishable_[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_.-]{30,})$/.test(env.AURORA_REPORT_AUTH_PUBLISHABLE_KEY)&&
  configuredProviders(env).length>0;
}
// Submission authorization requires a separate, explicit production switch.
export function reporterAuthConfigured(env){
 return env?.AURORA_REPORT_AUTH_ENABLED==="enabled"&&reporterAuthAvailable(env);
}
// Verify a fresh access token against the Auth service. Never rely on JWT decoding or an untrusted email claim.
// Read-only account/privacy features remain available whenever verified-email
// sign-in is configured, even while public report intake is disabled.
export async function verifiedAccount(request,env,fetcher=fetch){
 if(!reporterAuthAvailable(env))return null;
 const header=request.headers.get("Authorization")||"";
 const match=/^Bearer ([A-Za-z0-9._-]{30,4096})$/.exec(header);
 if(!match)return null;
 const response=await fetcher(env.AURORA_REPORT_AUTH_URL+"/auth/v1/user",{
  method:"GET",headers:{Authorization:"Bearer "+match[1],apikey:env.AURORA_REPORT_AUTH_PUBLISHABLE_KEY,Accept:"application/json"},
  cache:"no-store",redirect:"error",signal:AbortSignal.timeout(7000)
 });
 if(!response.ok)return null;
 const body=await response.json();
 const user=body?.user??body;
 if(!user||!USER_ID.test(user.id||"")||typeof user.email!=="string"||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)||
  typeof user.email_confirmed_at!=="string"||Number.isNaN(Date.parse(user.email_confirmed_at)))return null;
 // X may supply an unverified email. Require a separately linked email identity.
 const provider=user.app_metadata?.provider;
 if(provider==="x"||provider==="twitter"){
  if(!Array.isArray(user.identities)||!user.identities.some(identity=>identity?.provider==="email"))return null;
 }
 return {id:user.id};
}


// Submission uses a separate operator-controlled switch. Do NOT bypass it merely
// because the same Auth service can verify accounts for read-only privacy access.
export async function verifiedReporter(request,env,fetcher=fetch){
 if(!reporterAuthConfigured(env))return null;
 return verifiedAccount(request,env,fetcher);
}
