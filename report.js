/* AURORA V1.5 — a truthful local draft UI; HTTP intake enabled only by server. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const STORAGE="aurora-private-text-report-draft-v1";
 const fields=["country","region","location","occurred","timezone","category","description"];
 let enabled=false,siteKey="",policyVersion="",challenge="",widget=null,pending=false;
 let requestKey=crypto.randomUUID(),widgetApi=null;
 const msg=(text,error=false)=>{
  $("formFeedback").textContent=text;
  $("formFeedback").style.color=error?"#ffd1c4":"#b7fff3";
 };
 const getDraft=()=>{
  const result={};
  for(const id of fields)result[id]=$(id).value;
  return result;
 };
 function saveDraft(){
  try{
   localStorage.setItem(STORAGE,JSON.stringify({...getDraft(),requestKey}));
   msg("Черновата е запазена само в този браузър. Не е изпратена към AURORA. / Draft saved locally. Nothing was submitted.");
  }catch{msg("Този браузър не разрешава съхранение на чернова. / Local storage unavailable.",true)}
 }
 function restoreDraft(){
  try{
   const draft=JSON.parse(localStorage.getItem(STORAGE)||"null");
   if(draft){
    for(const id of fields)if(typeof draft[id]==="string")$(id).value=draft[id];
    if(typeof draft.requestKey==="string"&&/^[a-f0-9-]{36}$/i.test(draft.requestKey))requestKey=draft.requestKey;
   }
  }catch{/* private browsing or blocked storage */}
 }
 function clearDraft(){
  $("receiptPanel").hidden=true;
  $("receiptValue").textContent="";
  try{localStorage.removeItem(STORAGE)}catch{}
  $("observationForm").reset();
  requestKey=crypto.randomUUID();
  msg("Черновата е изчистена от този браузър. / Local draft cleared.");
 }
 function refreshSubmitButton(){
  $("sendReport").disabled=!enabled||!challenge||!$("consent").checked||pending;
 }
 function renderChallenge(){
  if(!window.turnstile||!enabled)return;
  widgetApi=window.turnstile;
  widget=widgetApi.render("#turnstileMount",{
   sitekey:siteKey,action:"aurora_report",theme:"dark",
   callback:token=>{challenge=token;refreshSubmitButton()},
   "expired-callback":()=>{challenge="";refreshSubmitButton()},
   "error-callback":()=>{challenge="";refreshSubmitButton()}
  });
 }
 async function initialize(){
  restoreDraft();
  const country=new URLSearchParams(location.search).get("country");
  if(/^[A-Za-z]{2}$/.test(country||"")&&!$("country").value)$("country").value=country.toUpperCase();
  try{$("timezone").value||=Intl.DateTimeFormat().resolvedOptions().timeZone||"Europe/Sofia"}catch{$("timezone").value="Europe/Sofia"}
  $("country").addEventListener("input",()=>{$("country").value=$("country").value.toUpperCase()});
  $("saveDraft").addEventListener("click",saveDraft);
  $("clearDraft").addEventListener("click",clearDraft);
  $("copyReceipt").addEventListener("click",async()=>{
   const receipt=$("receiptValue").textContent;if(!receipt)return;
   try{await navigator.clipboard.writeText(receipt);msg("Номерът е копиран. / Reference copied.")}
   catch{msg("Копирай номера ръчно. / Copy the reference manually.",true)}
  });
  $("consent").addEventListener("change",refreshSubmitButton);
  $("observationForm").addEventListener("submit",send);
  try{
   const result=await fetch("/api/intake/status",{cache:"no-store"});
   if(!result.ok)throw Error("status");
   const state=await result.json();
   if(state.accepting!==true){
    $("reportStatus").classList.add("disabled");
    $("reportStatus").textContent="LOCAL DRAFT MODE · Публичното подаване все още не е активно. Можеш да подготвиш чернова само на устройството си.";
    msg("Изпращането е изключено до юридическа, техническа и модераторска готовност.");
    return;
   }
   if(!state.site_key||!state.policy_version)throw Error("incomplete");
   if(state.policy_url!=="https://aurorauap.org/privacy")throw Error("missing reviewed privacy URL");
   enabled=true;siteKey=state.site_key;policyVersion=state.policy_version;
   $("privacyLink").href=state.policy_url;
   $("reportStatus").classList.add("ready");
   $("reportStatus").textContent="PRIVATE INTAKE ACTIVE · Приемаме само текстови сигнали за човешка проверка. Не публикуваме автоматично.";
   $("activationControls").hidden=false;
   const script=document.createElement("script");
   script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
   script.async=true;script.defer=true;
   script.onload=renderChallenge;
   script.onerror=()=>{enabled=false;refreshSubmitButton();msg("Проверката за защита от спам не е достъпна. Сигналът не може да бъде изпратен.",true)};
   document.head.append(script);
  }catch{
   $("reportStatus").classList.add("disabled");
   $("reportStatus").textContent="INTAKE OFFLINE · Не можем да потвърдим, че приемането е активно. Можеш да запазиш само чернова.";
  }
 }
 async function send(event){
  event.preventDefault();
  if(!enabled||pending||!challenge||!$("consent").checked){msg("Изпращането все още не е разрешено.",true);return}
  const form=$("observationForm");
  if(!form.reportValidity())return;
  const draft=getDraft();
  const payload={
   request_key:requestKey,country_code:draft.country,region:draft.region,
   approximate_location:draft.location,occurred_local:draft.occurred,
   time_zone:draft.timezone,category:draft.category,description:draft.description,
   language_code:document.documentElement.lang||"bg",consent:true,consent_version:policyVersion,
   turnstile_token:challenge,website:$("website").value
  };
  pending=true;refreshSubmitButton();msg("Изпращаме за поверителен преглед…");
  try{
   const response=await fetch("/api/intake/submit",{
    method:"POST",headers:{"Content-Type":"application/json"},
    credentials:"same-origin",body:JSON.stringify(payload)
   });
   const result=await response.json();
   if(response.status!==202||result.status!=="pending"||result.published!==false||
      !/^aur-int-[a-f0-9-]{36}$/.test(result.receipt_id||""))
    throw Error(result.error||"submit_failed");
   clearDraft();
   $("receiptValue").textContent=result.receipt_id;
   $("receiptPanel").hidden=false;
   msg("Сигналът е приет за ЧОВЕШКИ ПРЕГЛЕД. Номер: "+result.receipt_id+
    ". Не е публикуван. / Received for private review. Not published.");
  }catch(error){
   msg("Няма потвърдено получаване ("+String(error.message).slice(0,70)+"). Черновата не е изтрита. / Not confirmed; save your draft and retry.",true);
  }finally{
   pending=false;challenge="";
   if(widgetApi&&widget!==null)widgetApi.reset(widget);
   refreshSubmitButton();
  }
 }
 initialize();
})();
