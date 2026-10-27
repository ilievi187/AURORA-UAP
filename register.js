/* AURORA D1-only public register: always reflect the selected language, even offline. */
"use strict";
(()=>{
 const q=id=>document.getElementById(id);
 const bg=()=>document.documentElement.lang==="bg";
 let stats=null;
 function strings(){
  return bg()?{
   registered:"РЕГИСТРИРАНИ НАБЛЮДЕНИЯ",countries:"ОБХВАНАТИ ДЪРЖАВИ",
   sync:"ПОСЛЕДНА СИНХРОНИЗАЦИЯ",explore:"РАЗГЛЕДАЙ ДЪРЖАВИТЕ ↗",
   online:"Само одобрени и публикувани случаи. Демо сигналите не се включват.",
   offline:"Базата още не е свързана или е недостъпна. Не показваме измислени числа."
  }:{
   registered:"GLOBAL REGISTERED SIGHTINGS",countries:"COUNTRIES COVERED",
   sync:"LAST SUCCESSFUL SYNC",explore:"EXPLORE COUNTRIES ↗",
   online:"Only approved, published cases. Demo reports are excluded.",
   offline:"Database not connected or unavailable. No fabricated totals."
  };
 }
 function render(){
  const w=strings();
  document.querySelectorAll("[data-register-t]").forEach(n=>{
   if(w[n.dataset.registerT])n.textContent=w[n.dataset.registerT];
  });
  if(stats){
   const locale=bg()?"bg-BG":"en-US";
   q("registeredSightings").textContent=stats.sightings.toLocaleString(locale);
   q("registeredCountries").textContent=stats.countries.toLocaleString(locale);
   q("lastSync").textContent=stats.last_successful_sync?.slice(0,10)||"—";
   q("registerHealth").textContent="D1 / CONNECTED";
   q("registerNotice").textContent=w.online;
  }else{
   q("registeredSightings").textContent="—";
   q("registeredCountries").textContent="—";
   q("lastSync").textContent="—";
   q("registerHealth").textContent="D1 / NOT CONNECTED";
   q("registerNotice").textContent=w.offline;
  }
 }
 async function refresh(){
  try{
   const res=await fetch("/api/stats",{cache:"no-store"});
   if(!res.ok)throw Error("D1 "+res.status);
   const data=await res.json();
   if(!Number.isInteger(data.sightings)||!Number.isInteger(data.countries)||data.includes_demo!==false)
    throw Error("Invalid stats");
   stats=data;document.getElementById("globalRegister").hidden=false;render();
   window.dispatchEvent(new CustomEvent("aurora:register-stats",{detail:data}));
  }catch{stats=null;document.getElementById("globalRegister").hidden=true;render()}
 }
 new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 render();refresh();
})();