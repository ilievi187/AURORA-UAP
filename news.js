"use strict";
(()=>{
 const $=id=>document.getElementById(id),PAGE=12,STORAGE="aurora-news-locale-v3-";
 let items=[],shown=0,requestId=0;
 const language=()=>document.documentElement.lang||"bg";
 const fetchUrl=(edition,lang,offset)=>"/api/news?edition="+encodeURIComponent(edition)+"&lang="+encodeURIComponent(lang)+"&offset="+offset;
 const date=iso=>{try{return new Intl.DateTimeFormat(language(),{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(iso))}catch{return "—"}};
 const key=(edition,lang)=>STORAGE+edition+"-"+lang;
 function filtered(){
  const q=$("newsSearch").value.trim().toLocaleLowerCase();
  return items.filter(x=>!q||[x.title,x.translated_title,x.source].some(y=>String(y||"").toLocaleLowerCase().includes(q)));
 }
 function render(reset=false){
  if(reset)shown=0;
  const matches=filtered(),total=Math.min(matches.length,shown+PAGE);
  const root=$("newsList");root.replaceChildren();
  for(const item of matches.slice(0,total)){
   const card=document.createElement("article");card.className="live-card";
   const meta=document.createElement("div");meta.className="live-meta";meta.textContent=item.source+" · "+date(item.published);
   const h=document.createElement("h2"),link=document.createElement("a");
   link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";
   link.textContent=item.translated_title||item.title;h.append(link);card.append(meta,h);
   if(item.translated_title&&item.translated_title!==item.title){
    const details=document.createElement("details"),summary=document.createElement("summary"),p=document.createElement("p");
    summary.textContent="ORIGINAL HEADLINE";p.textContent=item.title;details.className="news-original";
    details.append(summary,p);card.append(details);
   }
   root.append(card);
  }
  shown=total;
  $("showMoreNews").hidden=total>=matches.length;
  if(items.length)$("newsStatus").textContent=total+" / "+matches.length+" · "+(window.AURORA_SUBPAGES?.text("news")||"News");
 }
 function restore(edition,lang){
  try{
   const old=JSON.parse(localStorage.getItem(key(edition,lang))||"null");
   if(!old||Date.now()-old.saved_at>12*3600000||!Array.isArray(old.items)||!old.items.length)return false;
   items=old.items;render(true);
   $("newsStatus").dataset.state="cached";$("newsStatus").textContent="CACHED · "+items.length;
   return true;
  }catch{return false}
 }
 async function load(){
  const edition=$("edition").value,lang=language(),id=++requestId;
  items=[];$("newsList").replaceChildren();
  const recovered=restore(edition,lang);
  if(!recovered)$("newsStatus").textContent=window.AURORA_SUBPAGES?.text("loading")||"Loading…";
  $("refreshNews").disabled=true;
  try{
   const response=await fetch(fetchUrl(edition,lang,0),{cache:"no-store"});
   if(!response.ok)throw Error("news_unavailable");
   const data=await response.json();
   if(id!==requestId||lang!==language()||edition!==$("edition").value||
      !["live","cached"].includes(data.status)||!Array.isArray(data.items))return;
   items=data.items;render(true);
   $("newsStatus").dataset.state=data.translation?.status==="unavailable"?"original":data.status;
   $("newsStatus").textContent=items.length+" headlines · "+
    (data.translation?.translated?data.translation.translated+" translated · ":"")+
    (data.translation?.status==="unavailable"?"Original titles — translation unavailable · ":"")+
    (data.status==="cached"?"CACHED · ":"")+new Date(data.updated_at).toLocaleString(lang);
   if(data.status==="live")try{
    localStorage.setItem(key(edition,lang),JSON.stringify({saved_at:Date.now(),updated_at:data.updated_at,items}));
   }catch{}
  }catch{
   if(id!==requestId)return;
   if(!recovered){
    items=[];$("newsList").replaceChildren();$("showMoreNews").hidden=true;
    $("newsStatus").dataset.state="error";
    $("newsStatus").textContent=window.AURORA_SUBPAGES?.text("offline")||"Source unavailable.";
   }
  }finally{if(id===requestId)$("refreshNews").disabled=false}
 }
 async function more(){
  if($("showMoreNews").disabled)return;
  // Filtered results are already translated when present; show them instantly.
  if($("newsSearch").value.trim()){render();return}
  const offset=shown,edition=$("edition").value,lang=language(),id=requestId;
  $("showMoreNews").disabled=true;
  try{
   const r=await fetch(fetchUrl(edition,lang,offset),{cache:"no-store"});
   if(!r.ok)throw Error("translation_unavailable");
   const data=await r.json();
   if(id!==requestId||lang!==language()||edition!==$("edition").value)return;
   for(let i=offset;i<Math.min(items.length,offset+PAGE);i++){
    if(data.items?.[i]?.url!==items[i]?.url){load();return}
    items[i].translated_title=data.items[i].translated_title;
   }
  }catch{/* Keep original headlines available. */}
  finally{if(id===requestId){render();$("showMoreNews").disabled=false}}
 }
 $("edition").addEventListener("change",load);
 $("newsSearch").addEventListener("input",()=>render(true));
 $("showMoreNews").addEventListener("click",more);
 $("refreshNews").addEventListener("click",load);
 window.addEventListener("aurora:language-changed",load);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)load()});
 setInterval(()=>{if(!document.hidden)load()},15*60*1000);
 load();
})();
