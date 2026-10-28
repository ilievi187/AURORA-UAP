/* AURORA live headline preview; source links, no synthetic headlines. */
"use strict";
(()=>{
 const host=document.getElementById("homeNewsGrid"),status=document.getElementById("homeNewsStatus");
 if(!host||!status)return;
 let sequence=0;
 const locale=()=>{try{return localStorage.getItem("aurora-lang")||document.documentElement.lang||"bg"}catch{return document.documentElement.lang||"bg"}};
 async function render(){
  const lang=locale(),seq=++sequence;
  try{
   const r=await fetch("/api/news?edition=global&lang="+encodeURIComponent(lang)+"&offset=0",{cache:"no-store"});if(!r.ok)throw Error("feed");
   const data=await r.json();if(seq!==sequence||lang!==locale())return;if(!["live","cached"].includes(data.status)||!Array.isArray(data.items))throw Error("format");
   host.replaceChildren();
   for(const item of data.items.slice(0,9)){
    if(!/^https:\/\//.test(item.url))continue;
    const card=document.createElement("article"),small=document.createElement("small"),a=document.createElement("a");
    small.textContent=item.source+" · "+new Date(item.published).toLocaleDateString(document.documentElement.lang||"en");
    a.href=item.url;a.textContent=item.translated_title||item.title;a.title=item.title;a.target="_blank";a.rel="noopener noreferrer";
    card.append(small,a);host.append(card);
   }
   status.textContent=host.childElementCount?(data.translation?.status==="unavailable"?"Original headlines · translation unavailable":data.status==="cached"?"CACHED · last successful news feed":""):"No headlines available right now.";
  }catch{
   if(seq===sequence&&!host.childElementCount)status.textContent="News feed temporarily unavailable. The full news page remains accessible.";
  }
 }
 render();
 new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 // New-source server cache lasts 15 minutes; refresh while the page is open.
 setInterval(()=>{if(!document.hidden)render()},15*60*1000);
})();
