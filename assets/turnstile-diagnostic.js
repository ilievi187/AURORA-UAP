// This diagnostic contains NO reporter/identity data and never sends a report.
// Only a one-time challenge token is sent to the Access-protected verifier.
(()=>{
 const button=document.getElementById('start');
 const mount=document.getElementById('mount');
 const message=document.getElementById('status');
 const siteKey=mount?.dataset.siteKey;
 let started=false;
 const show=(text)=>{message.textContent=text};
 async function verify(token){
  try{
   show('Verifying the challenge with Cloudflare...');
   const response=await fetch('/api/moderation/turnstile',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({token})
   });
   const result=await response.json();
   show(response.ok&&result.verified===true&&result.report_submitted===false
    ?'PASS: real Turnstile verification succeeded. No report was submitted.'
    :'FAIL: Turnstile verification was not accepted. No report was submitted.');
  }catch{show('FAIL: Turnstile test unavailable. No report was submitted.')}
 }
 button?.addEventListener('click',async()=>{
  if(started)return;
  started=true;
  button.disabled=true;
  if(!/^[A-Za-z0-9_-]{10,100}$/.test(siteKey||'')){
   show('FAIL: Invalid public site key');return
  }
  show('Loading the real managed Turnstile widget...');
  const script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;
  script.onload=()=>{
   if(!window.turnstile){show('FAIL: Turnstile script did not initialize.');return}
   window.turnstile.render('#mount',{
    sitekey:siteKey,action:'aurora_report',
    callback:verify,
    'error-callback':()=>show('FAIL: Challenge error. No data submitted.'),
    'expired-callback':()=>show('Challenge expired; reload to try again.')
   });
   show('Complete the challenge to verify the real Siteverify integration.');
  };
  script.onerror=()=>show('FAIL: Could not load Turnstile from Cloudflare.');
  document.head.append(script);
 });
})();
