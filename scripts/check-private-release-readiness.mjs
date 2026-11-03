// AURORA PRELAUNCH public read-only security proof.
// No cookies, tokens, POST requests, WAF bursts, D1 writes or secrets.
const BASE='https://aurorauap.org';
const privateEndpoints=[
 '/moderation',
 '/moderation/',
 '/moderation.html',
 '/api/moderation/',
 '/api/moderation/?view=overview',
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
export async function checkReadOnlyRelease(fetcher=fetch){
 const results=[];
 const fail=(name,reason)=>results.push({name,ok:false,reason});
 const pass=(name,detail)=>results.push({name,ok:true,detail});
 const status=await get(fetcher,'/api/intake/status');
 if(status.status!==200)fail('intake-status','HTTP '+status.status);
 else {
  const noStore=(status.headers.get('cache-control')||'').includes('no-store');
  let state;
  try{state=await status.json()}catch{state=null}
  if(!state||state.accepting!==false||state.mode!=='local_draft_only'||
   state.attachments_enabled!==false||state.automatic_publication!==false||
   state.auth_required!==true||Object.hasOwn(state,'site_key')||!noStore){
    fail('intake-status','Closed-mode or cache contract mismatch');
  }else pass('intake-status','public intake disabled; auth separate; no-store');
 }
 const privacy=await get(fetcher,'/privacy');
 if(privacy.status!==200)fail('privacy-notice','HTTP '+privacy.status);
 else {
  const body=await privacy.text();
  const fields=['<article id="bg"','<article id="en"','Supabase Auth','Brevo','GDPR'];
  if(fields.some(x=>!body.includes(x)))fail('privacy-notice','Missing bilingual or processor disclosure');
  else pass('privacy-notice','BG/EN and processors publicly disclosed');
 }
 for(const path of privateEndpoints){
  const response=await get(fetcher,path);
  const allowed=(response.status===403||legitimateAccessRedirect(response));
  if(!allowed)fail(path,'Unexpected anonymous response HTTP '+response.status);
  else pass(path,legitimateAccessRedirect(response)?'Access login redirect':'origin denies anonymous user');
 }
 return {ok:results.every(x=>x.ok),results};
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
 if(process.argv.length!==3||process.argv[2]!=='--live'){
  console.error('Usage: node scripts/check-private-release-readiness.mjs --live');
  console.error('Performs eight bounded public GET requests only; NEVER writes production data.');
  process.exitCode=2;
 }else{
  try{
   const audit=await checkReadOnlyRelease();
   for(const item of audit.results)
    console.log((item.ok?'PASS ':'FAIL ')+item.name+' — '+(item.detail||item.reason));
   console.log(audit.ok?'PASS: prelaunch anonymous isolation and disclosure':'FAIL: investigate before launch');
   if(!audit.ok)process.exitCode=1;
  }catch(err){
   console.error('FAIL: network or preflight unavailable:',err?.name||'Error');
   process.exitCode=1;
  }
 }
}
