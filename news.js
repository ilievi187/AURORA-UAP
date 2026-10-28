"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 let news=[],shown=0;
 const date=iso=>{try{return new Intl.DateTimeFormat(document.documentElement.lang||"en",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(iso))}catch{return "—"}};
 function filtered(){
  const q=$("newsSearch").value.trim().toLocaleLowerCase();
  return news.filter(x=>!q||(x.title+" "+x.source).toLocaleLowerCase().includes(q));
 }
 function render(reset=false){
  if(reset)shown=0;
  const items=filtered();
  const amount=Math.min(items.length,shown+20);
  const mount=$("newsList");mount.replaceChildren();
  for(const item of items.slice(0,amount)){
   const card=document.createElement("article");card.className="live-card";
   const meta=document.createElement("div");meta.className="live-meta";meta.textContent=item.source+" · "+date(item.published);
   const h=document.createElement("h2");
   const a=document.createElement("a");a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=item.title;
   h.append(a);card.append(meta,h);mount.append(card);
  }
  shown=amount;
  $("showMoreNews").hidden=amount>=items.length;
  if(news.length)$("newsStatus").textContent=amount+" / "+items.length+" · "+(window.AURORA_SUBPAGES?.text("news")||"News");
 }
 const STORAGE="aurora-news-cache-v2-";
 let requestSeq=0;
 function restore(edition){
  try{
   const stored=JSON.parse(localStorage.getItem(STORAGE+edition)||"null");
   if(!stored||Date.now()-stored.saved_at>12*3600000||!Array.isArray(stored.items)||!stored.items.length)return false;
   news=stored.items;render(true);
   $("newsStatus").dataset.state="cached";
   $("newsStatus").textContent="CACHED · "+news.length+" headlines · "+new Date(stored.updated_at).toLocaleString(document.documentElement.lang||"en");
   return true;
  }catch{return false}
 }
 async function load(){
  const edition=$("edition").value,seq=++requestSeq;
  const recovered=restore(edition);
  if(!recovered)$("newsStatus").textContent=window.AURORA_SUBPAGES?.text("loading")||"Loading…";
  $("refreshNews").disabled=true;
  try{
   const response=await fetch("/api/news?edition="+encodeURIComponent(edition),{cache:"no-store"});
   if(!response.ok)throw Error("feed_unavailable");
   const data=await response.json();
   if(seq!==requestSeq||data.edition!==edition||!["live","cached"].includes(data.status)||!Array.isArray(data.items))return;
   news=data.items;render(true);
   $("newsStatus").dataset.state=data.status;
   $("newsStatus").textContent=news.length+" headlines · "+(data.status==="cached"?"CACHED / ":"")+
     new Date(data.updated_at).toLocaleString(document.documentElement.lang||"en");
   if(data.status==="live")try{localStorage.setItem(STORAGE+edition,JSON.stringify({saved_at:Date.now(),updated_at:data.updated_at,items:news}))}catch{}
  }catch{
   if(seq!==requestSeq)return;
   if(!recovered&&!news.length){
    $("newsList").replaceChildren();$("showMoreNews").hidden=true;
    $("newsStatus").dataset.state="error";
    $("newsStatus").textContent=window.AURORA_SUBPAGES?.text("offline")||"Source temporarily unavailable.";
   }
  }finally{if(seq===requestSeq)$("refreshNews").disabled=false}
 }
 $("edition").addEventListener("change",()=>{news=[];$("newsList").replaceChildren();load()});
 $("newsSearch").addEventListener("input",()=>render(true));
 $("showMoreNews").addEventListener("click",()=>render());
 $("refreshNews").addEventListener("click",load);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)load()});
 setInterval(()=>{if(!document.hidden)load()},15*60*1000);
 load();
})();