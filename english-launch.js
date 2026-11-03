/* Temporary English-only PUBLIC rollout. Keep authored translations and the
   existing locale QA tools available on localhost for later language releases. */
"use strict";
(()=>{
  const host=location.hostname.toLowerCase();
  const publicSite=host==="aurorauap.org"||host.endsWith(".aurorauap.org")||
    host==="aurora-uap.pages.dev"||host.endsWith(".aurora-uap.pages.dev");
  if(!publicSite)return;
  window.AURORA_PUBLIC_LANGUAGE="en";
  document.documentElement.classList.add("aurora-english-launch");
  document.documentElement.lang="en";
  document.documentElement.dir="ltr";
  try{localStorage.setItem("aurora-lang","en")}catch{}
  // Legacy ?lang=xx links must not re-enable an unfinished translation.
  try{
    const u=new URL(location.href);
    if(u.searchParams.has("lang")){
      u.searchParams.delete("lang");
      history.replaceState(history.state,"",u.pathname+u.search+u.hash);
    }
  }catch{}
  // These homepage labels are not driven by the normal i18n pack.
  const finish=()=>{
    const headlines=document.getElementById("homeNewsTitle");
    if(headlines)headlines.textContent="LATEST NEWS FROM AROUND THE WORLD";
    const allNews=document.querySelector(".home-news-top > a");
    if(allNews)allNews.textContent="ALL NEWS ↗";
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",finish,{once:true});
  else finish();
})();
