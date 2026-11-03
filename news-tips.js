"use strict";
(()=>{
 const $=id=>document.getElementById(id),form=$("newsTipForm");if(!form)return;
 let siteKey="",token="",widgetId=null;
 const fields=[...form.querySelectorAll("input:not([type=hidden]),textarea")].filter(field=>field.name!=="website");
 const copy=()=>window.AURORA_NEWS_TIP_COPY?.[document.documentElement.lang]||window.AURORA_NEWS_TIP_COPY?.en;
 const setStatus=message=>{$("newsTipsStatus").textContent=message};
 function applyCopy(){
  const words=copy();if(!words)return;
  for(const [id,key] of [["newsTipsHeading","heading"],["newsTipsIntro","intro"],["newsTipTitleLabel","title"],["newsTipUrlLabel","url"],["newsTipConsentLabel","consent"],["newsTipSubmit","submit"]])$(id).textContent=words[key];
 }
 function setFieldsEnabled(enabled){for(const field of fields)field.disabled=!enabled}
 function validUrl(value){
  try{
   const url=new URL(value.trim());if(url.protocol!=="https:"||url.username||url.password||url.port)return false;
   const host=url.hostname.toLowerCase();
   if(host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||host.endsWith(".internal"))return false;
   if(/^127\.|^10\.|^192\.168\.|^169\.254\.|^0\./.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host))return false;
   return true;
  }catch{return false}
 }
 function updateSubmit(){
  const data=new FormData(form),title=String(data.get("newsTipTitle")||"").trim();
  const valid=title.length>=8&&title.length<=200&&validUrl(String(data.get("newsTipUrl")||""))&&
   data.get("newsTipConsent")==="on"&&Boolean(token)&&!String(data.get("website")||"").trim();
  $("newsTipSubmit").disabled=!valid;
 }
 function loadTurnstile(){
  const words=copy(),challenge=$("newsTipChallenge");challenge.hidden=false;setStatus(words.turnstile);
  const ready=()=>{
   if(!window.turnstile||!siteKey)return;
   widgetId=window.turnstile.render(challenge,{
    sitekey:siteKey,action:"news_tip",
    callback:value=>{token=value;setStatus(copy().ready);updateSubmit()},
    "expired-callback":()=>{token="";setStatus(copy().turnstile);updateSubmit()},
    "error-callback":()=>{token="";setStatus(copy().failed);updateSubmit()}
   });
  };
  if(window.turnstile){ready();return}
  let script=document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
  if(!script){script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;script.defer=true;document.head.append(script)}
  script.addEventListener("load",ready,{once:true});script.addEventListener("error",()=>setStatus(copy().failed),{once:true});
 }
 async function initialize(){
  applyCopy();setFieldsEnabled(false);$("newsTipSubmit").disabled=true;setStatus(copy()?.loading||"Checking secure submission status…");
  try{
   const response=await fetch("/api/news-tips",{cache:"no-store",credentials:"same-origin"});
   if(!response.ok)throw Error("status_unavailable");
   const data=await response.json();
   if(data.accepting!==true||typeof data.site_key!=="string"||data.site_key.length<10){setStatus(copy()?.disabled||"Submissions are unavailable.");return}
   siteKey=data.site_key;setFieldsEnabled(true);loadTurnstile();
  }catch{setStatus(copy()?.disabled||"Submissions are unavailable.")}
 }
 form.addEventListener("input",updateSubmit);form.addEventListener("change",updateSubmit);
 form.addEventListener("submit",async event=>{
  event.preventDefault();updateSubmit();if($("newsTipSubmit").disabled)return;
  const words=copy(),data=new FormData(form),button=$("newsTipSubmit");button.disabled=true;setStatus(words.sending);
  try{
   const response=await fetch("/api/news-tips",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    title:String(data.get("newsTipTitle")||"").trim(),url:String(data.get("newsTipUrl")||"").trim(),
    consent:data.get("newsTipConsent")==="on",turnstile_token:token,website:String(data.get("website")||"")
   })});
   if(!response.ok)throw Error("submission_failed");
   form.reset();token="";try{if(window.turnstile&&widgetId!==null)window.turnstile.reset(widgetId)}catch{}
   setStatus(words.sent);
  }catch{setStatus(words.failed);updateSubmit()}
 });
 window.addEventListener("aurora:language-changed",()=>{applyCopy();if(token)setStatus(copy().ready);else if(widgetId!==null)setStatus(copy().turnstile);else void initialize()});
 void initialize();
})();
