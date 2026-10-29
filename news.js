"use strict";
(()=>{
 const $=id=>document.getElementById(id),PAGE=12,STORAGE="aurora-news-locale-v3-";
 let items=[],shown=0,requestId=0,searchVersion=0,updatedAt="";
 let loadedPages=new Set(),pendingPages=new Map(),failedPages=new Set(),searchTimer;
 const language=()=>document.documentElement.lang||"bg";
 const fetchUrl=(edition,lang,offset)=>"/api/news?edition="+encodeURIComponent(edition)+"&lang="+encodeURIComponent(lang)+"&offset="+offset;
 const date=iso=>{try{return new Intl.DateTimeFormat(language(),{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(iso))}catch{return "—"}};
 const key=(edition,lang)=>STORAGE+edition+"-"+lang;
 function filtered(){
  const q=$("newsSearch").value.trim().toLocaleLowerCase();
  return items.filter(x=>!q||[x.title,x.translated_title,x.source].some(y=>String(y||"").toLocaleLowerCase().includes(q)));
 }
 function render(reset=false,advance=false){
  if(reset)shown=PAGE;
  else if(advance)shown+=PAGE;
  const matches=filtered(),total=Math.min(matches.length,shown);
  const root=$("newsList");root.replaceChildren();
  for(const item of matches.slice(0,total)){
   const card=document.createElement("article");card.className="live-card";
   const meta=document.createElement("div");meta.className="live-meta";meta.textContent=item.source+" · "+date(item.published);
   const h=document.createElement("h2"),link=document.createElement("a");
   link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";
   link.textContent=item.translated_title||item.title;h.append(link);card.append(meta,h);
   if(item.translated_title&&item.translated_title!==item.title){
    const details=document.createElement("details"),summary=document.createElement("summary"),p=document.createElement("p");
    summary.textContent=window.AURORA_SUBPAGES?.text("origHeadline")||"ORIGINAL HEADLINE";p.textContent=item.title;details.className="news-original";
    details.append(summary,p);card.append(details);
   }
   root.append(card);
  }
  $("showMoreNews").hidden=total>=matches.length;
  if(items.length)$("newsStatus").textContent=total+" / "+matches.length+" · "+(window.AURORA_SUBPAGES?.text("news")||"News");
 }
 // A search can surface a headline anywhere in the source feed, not only in
 // the first translated page. Fetch only the source pages currently visible.
 async function translateSourcePage(offset,id,edition,lang){
  if(loadedPages.has(offset)||failedPages.has(offset))return;
  if(pendingPages.has(offset))return pendingPages.get(offset);
  const job=(async()=>{
   try{
    const r=await fetch(fetchUrl(edition,lang,offset),{cache:"no-store"});
    if(!r.ok)throw Error("translation_unavailable");
    const data=await r.json();
    if(id!==requestId||lang!==language()||edition!==$("edition").value)return;
    if(!Array.isArray(data.items)||!["live","cached"].includes(data.status))throw Error("invalid_news");
    // Never merge translations from a different source snapshot.
    for(let i=offset;i<Math.min(items.length,offset+PAGE);i++){
     if(data.items[i]?.url!==items[i]?.url)return;
    }
    for(let i=offset;i<Math.min(items.length,offset+PAGE);i++){
     if(typeof data.items[i].translated_title==="string")
      items[i].translated_title=data.items[i].translated_title;
    }
    loadedPages.add(offset);
    try{localStorage.setItem(key(edition,lang),JSON.stringify({saved_at:Date.now(),updated_at:updatedAt,items}));}catch{}
   }catch{if(id===requestId)failedPages.add(offset)}
  })();
  pendingPages.set(offset,job);
  try{await job}finally{if(pendingPages.get(offset)===job)pendingPages.delete(offset)}
 }
 async function translateVisible(version=searchVersion){
  const id=requestId,edition=$("edition").value,lang=language();
  // Search matching happens against original and translated text; indices refer
  // to the fixed original feed order, which is what the server offset expects.
  const offsets=[...new Set(filtered().slice(0,shown).map(item=>Math.floor(items.indexOf(item)/PAGE)*PAGE))]
   .filter(offset=>offset>=0&&!loadedPages.has(offset)&&!failedPages.has(offset));
  for(let i=0;i<offsets.length;i+=2){
   if(version!==searchVersion||id!==requestId||lang!==language()||edition!==$("edition").value)return;
   await Promise.all(offsets.slice(i,i+2).map(offset=>translateSourcePage(offset,id,edition,lang)));
   if(version!==searchVersion||id!==requestId||lang!==language()||edition!==$("edition").value)return;
   render(); // Do not reveal another page just because a translation finished.
  }
 }
 function restore(edition,lang){
  try{
   const old=JSON.parse(localStorage.getItem(key(edition,lang))||"null");
   if(!old||Date.now()-old.saved_at>12*3600000||!Array.isArray(old.items)||!old.items.length)return false;
   items=old.items;updatedAt=old.updated_at||"";render(true);
   $("newsStatus").dataset.state="cached";$("newsStatus").textContent=(window.AURORA_SUBPAGES?.text("cached")||"CACHED")+" · "+items.length;
   return true;
  }catch{return false}
 }
 async function load(){
  const edition=$("edition").value,lang=language(),id=++requestId;
  searchVersion++;clearTimeout(searchTimer);
  loadedPages=new Set();pendingPages=new Map();failedPages=new Set();updatedAt="";
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
   items=data.items;updatedAt=data.updated_at||"";loadedPages.add(0);render(true);
   void translateVisible();
   const tr=k=>window.AURORA_SUBPAGES?.text(k);
   $("newsStatus").dataset.state=data.translation?.status==="unavailable"?"original":data.status;
   $("newsStatus").textContent=items.length+" "+(tr("headlines")||"headlines")+" · "+
    (data.translation?.translated?data.translation.translated+" "+(tr("translated")||"translated")+" · ":"")+
    (data.translation?.status==="unavailable"?(tr("origUntranslated")||"Original titles — translation unavailable")+" · ":"")+
    (data.status==="cached"?(tr("cached")||"CACHED")+" · ":"")+new Date(data.updated_at).toLocaleString(lang);
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
  $("showMoreNews").disabled=true;
  try{
   render(false,true);
   await translateVisible();
  }finally{$("showMoreNews").disabled=false}
 }
 $("edition").addEventListener("change",load);
 $("newsSearch").addEventListener("input",()=>{
  searchVersion++;clearTimeout(searchTimer);render(true);
  const version=searchVersion;
  searchTimer=setTimeout(()=>{void translateVisible(version)},180);
 });
 $("showMoreNews").addEventListener("click",more);
 $("refreshNews").addEventListener("click",load);
 window.addEventListener("aurora:language-changed",load);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)load()});
 setInterval(()=>{if(!document.hidden)load()},15*60*1000);
 load();
})();
