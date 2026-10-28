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
 async function load(){
  const edition=$("edition").value;
  $("newsStatus").textContent=window.AURORA_SUBPAGES?.text("loading")||"Зареждане…";
  $("newsStatus").dataset.state="loading";$("refreshNews").disabled=true;
  try{
   const response=await fetch("/api/news?edition="+encodeURIComponent(edition),{cache:"no-store"});
   if(!response.ok)throw Error("source_offline");
   const result=await response.json();
   if(result.status!=="live"||!Array.isArray(result.items))throw Error("invalid_feed");
   news=result.items;render(true);
   if(!news.length)$("newsStatus").textContent="0 / 0";
  }catch{
   news=[];$("newsList").replaceChildren();$("showMoreNews").hidden=true;
   $("newsStatus").dataset.state="error";
   $("newsStatus").textContent=window.AURORA_SUBPAGES?.text("offline")||"Източникът временно не отговаря.";
  }finally{$("refreshNews").disabled=false}
 }
 $("edition").addEventListener("change",load);
 $("newsSearch").addEventListener("input",()=>render(true));
 $("showMoreNews").addEventListener("click",()=>render());
 $("refreshNews").addEventListener("click",load);
 load();
})();