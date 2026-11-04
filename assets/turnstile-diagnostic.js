// Owner-only diagnostics. Neither token, JWT nor server-side Turnstile
// secret is ever logged, stored, reflected, or included in a URL.
(()=>{
 const button=document.getElementById('start');
 const mount=document.getElementById('mount');
 const message=document.getElementById('status');
 const siteKey=mount?.dataset.siteKey;
 const reasonText={
  server_secret_rejected:'Cloudflare rejected the server Secret Key. Check that the Pages secret belongs to this widget.',
  token_rejected:'Cloudflare rejected the challenge token. Check the widget Site Key / Secret Key pair.',
  expired_or_reused_token:'This challenge expired or was already used. Please try a fresh challenge.',
  hostname_mismatch:'Cloudflare validated the token, but its hostname did not match aurorauap.org.',
  action_mismatch:'Cloudflare validated the token, but its action was not aurora_report.',
  siteverify_rejected:'Cloudflare Siteverify rejected this challenge.',
  siteverify_unavailable:'The server could not reach or complete Cloudflare Siteverify.',
  challenge_unavailable:'Siteverify was unavailable.',
  invalid_request:'The server rejected the request format or Origin.',
  turnstile_not_configured:'The production Turnstile keys are not configured correctly.',
  unavailable:'Cloudflare Access or the owner authorization denied the request.'
 };
 let started=false,widgetId=null;
 const show=(text)=>{if(message)message.textContent=text};
 const retry=()=>{
  started=false;
  button.disabled=false;
  button.textContent='Try a fresh challenge';
  try{if(widgetId!==null)window.turnstile?.remove(widgetId)}catch{}
  widgetId=null;
  mount.replaceChildren();
 };
 async function verify(token){
  try{
   show('Checking the challenge with Cloudflare Siteverify...');
   const response=await fetch('/api/moderation/turnstile',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({token})
   });
   const contentType=response.headers.get('Content-Type')||'';
   if(!contentType.includes('application/json')){
    show('FAIL: The server returned a non-JSON response (HTTP '+response.status+
     '). Cloudflare Access may need a new sign-in. No report was submitted.');
    retry();return;
   }
   const result=await response.json();
   if(response.ok&&result.verified===true&&result.report_submitted===false){
    show('PASS: real Turnstile Siteverify succeeded. No report was submitted.');
    return;
   }
   const reason=reasonText[result.reason]||reasonText[result.error]||'The verification was not accepted.';
   show('FAIL: '+reason+' (HTTP '+response.status+'). No report was submitted.');
   retry();
  }catch{
   show('FAIL: Could not complete server verification. Try a fresh challenge. No report was submitted.');
   retry();
  }
 }
 function render(){
  if(!window.turnstile){
   show('FAIL: Turnstile did not initialize. Reload and try again.');
   retry();return;
  }
  try{
   widgetId=window.turnstile.render('#mount',{
    sitekey:siteKey,action:'aurora_report',
    callback:verify,
    'error-callback':()=>{show('FAIL: Turnstile widget error. No report was submitted.');retry()},
    'expired-callback':()=>{show('Challenge expired. Try a fresh challenge.');retry()}
   });
   show('Complete the challenge to verify the real Siteverify integration.');
  }catch{
   show('FAIL: Could not render Turnstile challenge. Reload and try again.');
   retry();
  }
 }
 button?.addEventListener('click',()=>{
  if(started)return;
  started=true;
  button.disabled=true;
  if(!/^[A-Za-z0-9_-]{10,100}$/.test(siteKey||'')){
   show('FAIL: Invalid public site key');retry();return;
  }
  if(window.turnstile){render();return;}
  show('Loading the real managed Turnstile widget...');
  const script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;
  script.onload=render;
  script.onerror=()=>{show('FAIL: Could not load Turnstile from Cloudflare.');retry()};
  document.head.append(script);
 });
})();
