// AURORA public read-only security proof for prelaunch OR an explicitly authorized postlaunch.
// No cookies, tokens, POST requests, WAF bursts, D1 writes or secrets.
const BASE='https://aurorauap.org';
const privateEndpoints=[
 '/moderation',
 '/moderation/',
 '/moderation.html',
 '/api/moderation/',
 '/api/moderation/?view=overview',
 '/api/moderation/turnstile',
 // Access route-alias regression: GET only, no private content requested.
 '/moderation.html/',
 '/moderation%2ehtml',
 '/moderation/index.html',
 '/api/moderation/index',
 '/api/moderation/turnstile/',
 '/news-editor',
 '/news-editor/',
 '/news-editor.html'
];
function legitimateAccessRedirect(response){
 if(![301,302,303,307,308].includes(response.status))return false;
 const location=response.headers.get('location');
 if(!location)return false;
 try{
  const url=new URL(location,BASE);
  return url.protocol==='https:' && /^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(url.hostname);
 }catch{return false}
}
async function get(fetcher,path){
 const result=await fetcher(BASE+path,{
  method:'GET',redirect:'manual',cache:'no-store',
  headers:{'User-Agent':'AURORA-ReadOnly-Release-Preflight/1.0'},
  signal:AbortSignal.timeout(9000)
 });
 return result;
}
export async function checkReadOnlyRelease(fetcher=fetch,{profile='prelaunch'}={}){
 if(!['prelaunch','postlaunch'].includes(profile))throw Error('Invalid release monitor profile');
 const results=[];
 const fail=(name,reason)=>results.push({name,ok:false,reason});
 const pass=(name,detail)=>results.push({name,ok:true,detail});
 const status=await get(fetcher,'/api/intake/status');
 if(status.status!==200)fail('intake-status','HTTP '+status.status);
 else {
  const noStore=(status.headers.get('cache-control')||'').includes('no-store');
  let state;
  try{state=await status.json()}catch{state=null}
  const common=state&&noStore&&state.attachments_enabled===false&&
   state.contact_collection_enabled===false&&state.automatic_publication===false&&
   state.auth_required===true;
  if(profile==='prelaunch'){
   if(!common||state.accepting!==false||state.mode!=='local_draft_only'||
      Object.hasOwn(state,'site_key'))
    fail('intake-status','Closed-mode or cache contract mismatch');
   else pass('intake-status','public intake disabled; auth separate; no-store');
  }else{
   // The public site may accept private reports ONLY with the existing
   // email verification and reviewed-policy contract; this GET never submits.
   const liveKey=typeof state?.site_key==='string'&&state.site_key.length>10&&
    !['1x00000000000000000000AA','2x00000000000000000000AB',
      '1x00000000000000000000BB','2x00000000000000000000BB',
      '3x00000000000000000000FF'].includes(state.site_key);
   if(!common||state.accepting!==true||state.mode!=='text_only_quarantine'||
      state.policy_version!=='intake-v1-reviewed'||
      state.policy_url!=='https://aurorauap.org/privacy'||!liveKey||
      !Array.isArray(state.auth_providers)||!state.auth_providers.includes('email'))
    fail('intake-status','Approved text-only intake contract mismatch');
   else pass('intake-status','private text-only intake active; manual review, no publication; no-store');
  }
 }
 const privacy=await get(fetcher,'/privacy');
 if(privacy.status!==200)fail('privacy-notice','HTTP '+privacy.status);
 else {
  const body=await privacy.text();
  const fields=['<article id="bg"','<article id="en"','Supabase Auth','Brevo','GDPR'];
  if(fields.some(x=>!body.includes(x)))fail('privacy-notice','Missing bilingual or processor disclosure');
  else pass('privacy-notice','BG/EN and processors publicly disclosed');
 }
 // A private account inventory must deny anonymous visitors even while intake is off.
 const account=await get(fetcher,'/api/account/privacy');
 if(account.status!==401||!(account.headers.get('cache-control')||'').includes('no-store'))
  fail('account-privacy','Anonymous access must be denied and not cached: '+account.status);
 else pass('account-privacy','private account inventory denies anonymous requests');
 for(const path of privateEndpoints){
  const response=await get(fetcher,path);
  const allowed=(response.status===403||legitimateAccessRedirect(response));
  if(!allowed)fail(path,'Unexpected anonymous response HTTP '+response.status);
  else pass(path,legitimateAccessRedirect(response)?'Access login redirect':'origin denies anonymous user');
 }
 return {ok:results.every(x=>x.ok),results};
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
 const extra=process.argv[3]||'--profile=prelaunch';
 const profile=extra.startsWith('--profile=')?extra.slice('--profile='.length):'';
 if((process.argv.length!==3&&process.argv.length!==4)||process.argv[2]!=='--live'||
    !['prelaunch','postlaunch'].includes(profile)){
  console.error('Usage: node scripts/check-private-release-readiness.mjs --live [--profile=prelaunch|postlaunch]');
  console.error('Read-only: seventeen bounded anonymous GETs; NEVER writes production data.');
  process.exitCode=2;
 }else{
  try{
   const audit=await checkReadOnlyRelease(fetch,{profile});
   for(const item of audit.results)
    console.log((item.ok?'PASS ':'FAIL ')+item.name+' — '+(item.detail||item.reason));
   console.log(audit.ok?'PASS: '+profile+' anonymous isolation and disclosure':'FAIL: investigate '+profile+' release gate');
   if(!audit.ok)process.exitCode=1;
  }catch(err){
   console.error('FAIL: network or release monitor unavailable:',err?.name||'Error');
   process.exitCode=1;
  }
 }
}
