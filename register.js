/* Strictly real D1 counts — never display DEMO data as registered cases. */
"use strict";
(()=>{
 const q=id=>document.getElementById(id);
 const bg=()=>document.documentElement.lang==="bg";
 const title=()=>({registered:bg()?"РЕГИСТРИРАНИ НАБЛЮДЕНИЯ":"GLOBAL REGISTERED SIGHTINGS",countries:bg()?"ОБХВАНАТИ ДЪРЖАВИ":"COUNTRIES COVERED",sync:bg()?"ПОСЛЕДНА СИНХРОНИЗАЦИЯ":"LAST SUCCESSFUL SYNC",explore:bg()?"РАЗГЛЕДАЙ ДЪРЖАВИТЕ ↗":"EXPLORE COUNTRIES ↗"});
 function localize(){const words=title();document.querySelectorAll("[data-register-t]").forEach(n=>{if(words[n.dataset.registerT])n.textContent=words[n.dataset.registerT]})}
 async function refresh(){
  localize();
  try{
   const res=await fetch("/api/stats",{cache:"no-store"});
   if(!res.ok)throw Error("D1 "+res.status);
   const data=await res.json();
   if(!Number.isInteger(data.sightings)||!Number.isInteger(data.countries)||data.includes_demo!==false)throw Error("Invalid stats");
   q("registeredSightings").textContent=data.sightings.toLocaleString();
   q("registeredCountries").textContent=data.countries.toLocaleString();
   q("lastSync").textContent=data.last_successful_sync?data.last_successful_sync.slice(0,10):"—";
   q("registerHealth").textContent="D1 / CONNECTED";
   q("registerNotice").textContent=bg()?"Само одобрени и публикувани случаи. Демо сигналите не се включват.":"Only approved, published cases. Demo reports are excluded.";
   window.dispatchEvent(new CustomEvent("aurora:register-stats",{detail:data}));
  }catch{
   q("registeredSightings").textContent="—";q("registeredCountries").textContent="—";q("lastSync").textContent="—";
   q("registerHealth").textContent="D1 / NOT CONNECTED";
   q("registerNotice").textContent=bg()?"Базата още не е свързана или е недостъпна. Не показваме измислени числа.":"Database not connected or unavailable. No fabricated totals.";
  }
 }
 new MutationObserver(localize).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 refresh();
})();
