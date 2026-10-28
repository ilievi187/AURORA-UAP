/* AURORA country directory: only D1-approved public observations, never demo totals. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 let language="bg";try{language=localStorage.getItem("aurora-lang")||"bg"}catch{}
 const bg=language==="bg",locale=language==="zh-CN"?"zh-Hans":language;
 document.documentElement.lang=language;
 const messages=bg?{
  title:"НАБЛЮДЕНИЯ ПО ДЪРЖАВИ",intro:"Разгледай държавите с одобрени и публикувани записи. Данните идват от реалния публичен регистър, не от демонстрационните случаи.",
  home:"НАЧАЛО",cases:"ПУБЛИКУВАНИ НАБЛЮДЕНИЯ",countries:"ДЪРЖАВИ СЪС ЗАПИСИ",sync:"ПОСЛЕДНО ОБНОВЯВАНЕ",
  indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ИЗБЕРИ ДЪРЖАВА",search:"ТЪРСИ ДЪРЖАВА",loading:"Проверяваме публичния регистър…",
  offline:"Публичният регистър не е активен или е временно недостъпен. Затова не показваме измислени държави и бройки. Можеш да разгледаш отделния исторически архив.",
  empty:"Все още няма одобрени и публикувани записи в регистъра.",filtered:"Няма държави, които съответстват на търсенето.",
  archive:"Исторически архив с източници ↗",prepare:"Подготви сигнал (локална чернова) ↗",
  privacy:"Няма лични адреси, точни координати или непубликувани сигнали. DEMO записите са изключени.",
  listed:n=>"Държави с публикувани записи: "+n,
  reports:n=>"публикувани случая: "+n
 }:{
  title:"EXPLORE THE WORLD REGISTER",intro:"Explore countries with approved, published observations. Figures come only from the public registry, never from demonstration cases.",
  home:"HOME",cases:"PUBLISHED OBSERVATIONS",countries:"COUNTRIES WITH RECORDS",sync:"LAST SYNC",
  indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"CHOOSE A COUNTRY",search:"SEARCH COUNTRIES",loading:"Checking the public registry…",
  offline:"The public registry is offline or not yet active. We do not invent country counts. Explore the separate sourced historical archive instead.",
  empty:"There are no approved published records in the registry yet.",filtered:"No countries match your search.",
  archive:"Sourced historical archive ↗",prepare:"Prepare a report (local draft) ↗",
  privacy:"No private addresses, exact coordinates, unpublished observations or DEMO cases are displayed.",
  listed:n=>"Countries with published records: "+n,
  reports:n=>"published observations: "+n
 };
 document.querySelectorAll("[data-t]").forEach(el=>{const s=messages[el.dataset.t];if(typeof s==="string")el.textContent=s});
 document.title="AURORA — "+(bg?"Държави":"Country Directory");
 $("countrySearch").placeholder=bg?"BG / България":"US / United States";
 const status=$("countryDirectoryStatus"),grid=$("countryGrid"),search=$("countrySearch");
 let countries=[];
 let displayNames;try{displayNames=new Intl.DisplayNames([locale,"en"],{type:"region"})}catch{displayNames=new Intl.DisplayNames(["en"],{type:"region"})}
 const nameOf=code=>displayNames.of(code)||code;
 function render(){
  grid.replaceChildren();
  const q=search.value.trim().toLocaleLowerCase(locale);
  const filtered=countries.filter(c=>(c.name+" "+c.code).toLocaleLowerCase(locale).includes(q));
  for(const c of filtered){
   const a=document.createElement("a");a.className="country-card";a.href="/countries/"+c.code;
   a.setAttribute("aria-label",c.name+" — "+messages.reports(c.count));
   const label=document.createElement("span"),name=document.createElement("strong"),iso=document.createElement("small"),num=document.createElement("span");
   name.textContent=c.name;iso.textContent=c.code+" / ISO";num.className="count";num.textContent=c.count.toLocaleString(locale);num.title=messages.reports(c.count);
   label.append(name,iso);a.append(label,num);grid.append(a);
  }
  if(status.dataset.state==="ready")status.textContent=countries.length===0?messages.empty:filtered.length===0?messages.filtered:messages.listed(filtered.length);
 }
 search.addEventListener("input",render);
 async function start(){
  try{
   const response=await fetch("/api/stats",{cache:"no-store"});
   if(!response.ok)throw Error("stats unavailable");
   const stats=await response.json();
   if(stats?.includes_demo!==false||!Number.isInteger(stats.sightings)||stats.sightings<0||
      !Number.isInteger(stats.countries)||stats.countries<0||!Array.isArray(stats.by_country))
     throw Error("invalid stats");
   const unique=new Set();
   countries=stats.by_country.filter(c=>{
    if(!c||typeof c.code!=="string"||!/^[A-Z]{2}$/.test(c.code)||
       !Number.isInteger(c.count)||c.count<1||unique.has(c.code))return false;
    unique.add(c.code);return true
   }).map(c=>({code:c.code,count:c.count,name:nameOf(c.code)})).sort((a,b)=>a.name.localeCompare(b.name,locale));
   if(countries.length!==stats.countries||countries.reduce((s,c)=>s+c.count,0)!==stats.sightings)throw Error("mismatched stats");
   $("directoryCaseCount").textContent=stats.sightings.toLocaleString(locale);
   $("directoryCountryCount").textContent=stats.countries.toLocaleString(locale);
   $("directoryLastSync").textContent=typeof stats.last_successful_sync==="string"?stats.last_successful_sync.slice(0,10):"—";
   $("directoryMetrics").hidden=false;
   status.dataset.state="ready";render();
  }catch{
   countries=[];grid.replaceChildren();$("directoryMetrics").hidden=true;
   status.dataset.state="offline";status.textContent=messages.offline;
  }
 }
 start();
})();
