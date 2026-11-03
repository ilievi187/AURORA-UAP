"use strict";
(()=>{
 const $=id=>document.getElementById(id),PAGE=12,STORAGE="aurora-news-locale-v3-";
 let items=[],currentPage=0,requestId=0,searchVersion=0,updatedAt="";
 let loadedPages=new Set(),pendingPages=new Map(),failedPages=new Set(),searchTimer;
 const language=()=>document.documentElement.lang||"bg";
 const ui=()=>window.AURORA_NEWS_UI?.[language()]||window.AURORA_NEWS_UI?.en;
 const fetchUrl=(edition,lang,offset)=>"/api/news?edition="+encodeURIComponent(edition)+"&lang="+encodeURIComponent(lang)+"&offset="+offset;
 const date=iso=>{try{const dateOnly=typeof iso==="string"&&iso.length===10&&iso[4]==="-"&&iso[7]==="-";const value=dateOnly?new Date(iso+"T12:00:00Z"):new Date(iso);return new Intl.DateTimeFormat(language(),{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(value)}catch{return "—"}};
 const key=(edition,lang)=>STORAGE+edition+"-"+lang;
 function updateControls(){
  const copy=ui();if(!copy)return;
  $("newsSourceTypeLabel").textContent=copy.sourceType;
  for(const option of $("newsSourceType").options)
   option.textContent=copy.roles[option.value]||copy.roles.other;
  $("newsTopicCategoryLabel").textContent=copy.topicCategory;
  for(const option of $("newsTopicCategory").options)
   option.textContent=copy.categories[option.value]||copy.categories.other;
  $("previousNews").textContent=copy.previous;
  $("nextNews").textContent=copy.next;
 }
 function filtered(){
  const q=$("newsSearch").value.trim().toLocaleLowerCase(language()),sourceType=$("newsSourceType").value,topic=$("newsTopicCategory").value;
  return items.filter(item=>{
   const role=item.source_role||"other";
   return (!sourceType||sourceType==="all"||role===sourceType)&&(!topic||topic==="all"||item.category===topic)&&
    (!q||[item.title,item.translated_title,item.summary,item.translated_summary,item.source].some(value=>String(value||"").toLocaleLowerCase(language()).includes(q)));
  });
 }
 function render(reset=false){
  if(reset)currentPage=0;
  const matches=filtered(),pageCount=Math.max(1,Math.ceil(matches.length/PAGE));
  if(currentPage>=pageCount)currentPage=pageCount-1;
  const start=currentPage*PAGE,visible=matches.slice(start,start+PAGE),root=$("newsList"),reqLang=language(),copy=ui();
  root.replaceChildren();
  for(const item of visible){
   let sourceUrl;try{sourceUrl=new URL(item.url)}catch{continue}
   if(sourceUrl.protocol!=="https:"||sourceUrl.username||sourceUrl.password||sourceUrl.port)continue;
   const card=document.createElement("article");card.className="live-card news-card";
   const thumb=document.createElement("div");thumb.className="news-thumb";thumb.setAttribute("aria-hidden","true");
   const fallback=()=>{thumb.replaceChildren();thumb.classList.add("news-thumb--fallback");thumb.textContent=String(item.source||"AURORA").trim().charAt(0).toUpperCase()||"✦"};
   if(typeof item.image==="string"&&/^https:\/\//.test(item.image)){
    const img=document.createElement("img");img.loading="lazy";img.decoding="async";img.referrerPolicy="no-referrer";img.alt="";
    img.addEventListener("error",fallback,{once:true});img.src=item.image;thumb.append(img);
   }else fallback();
   card.append(thumb);
   const srcLang=String(item.source_language||item.language||"").split("-")[0];
   const meta=document.createElement("div");meta.className="live-meta";
   const publisherLabel=item.published_by_aurora?(copy?.auroraPublished||"AURORA Editorial"):String(item.source||"Publisher");
   meta.textContent=publisherLabel+" · "+date(item.published);
   if(srcLang){
    const badge=document.createElement("span");badge.className="news-lang-badge";
    badge.textContent=item.translated_title&&item.translated_title!==item.title?srcLang.toUpperCase()+" → "+reqLang.toUpperCase():srcLang.toUpperCase();
    meta.append(" · ",badge);
   }
   const role=copy?.roles[item.source_role||"other"]||copy?.roles.other;
   if(role){const badge=document.createElement("span");badge.className="news-source-type";badge.textContent=role;meta.append(" · ",badge)}
   if(item.archival===true){const badge=document.createElement("span");badge.className="news-archive-record";badge.textContent=copy?.archivedRecord||"Archived source record";meta.append(" · ",badge)}
   const h=document.createElement("h2"),link=document.createElement("a");
   link.href=sourceUrl.href;link.target="_blank";link.rel="noopener noreferrer";
   link.textContent=item.translated_title||item.title;h.append(link);card.append(meta,h);
   const summaryText=item.translated_summary||item.summary;
   if(typeof summaryText==="string"&&summaryText.trim()){
    const sum=document.createElement("p");sum.className="news-summary";sum.textContent=summaryText.trim();card.append(sum);
   }
   if((item.translated_title&&item.translated_title!==item.title)||(item.translated_summary&&item.translated_summary!==item.summary)){
    const details=document.createElement("details"),summary=document.createElement("summary"),p=document.createElement("p");
    summary.textContent=window.AURORA_SUBPAGES?.text("origHeadline")||"Original headline";p.textContent=item.title;details.className="news-original";
    details.append(summary,p);
    if(typeof item.summary==="string"&&item.summary.trim()&&item.translated_summary&&item.translated_summary!==item.summary){
     const originalSummary=document.createElement("p");originalSummary.className="news-original-summary";originalSummary.textContent=item.summary.trim();details.append(originalSummary);
    }
    card.append(details);
   }
   if(typeof item.article_body==="string"&&item.article_body.trim()){
    const details=document.createElement("details"),summary=document.createElement("summary"),body=document.createElement("div");
    summary.textContent=item.article_body_language&&item.article_body_language!==reqLang?
     (window.AURORA_NEWS_UI?.[reqLang]?.originalBody||"Read the article in its original language"):
     (window.AURORA_NEWS_UI?.[reqLang]?.readArticle||"Read article");
    body.className="news-editorial-body";
    for(const paragraph of item.article_body.split(/\n{2,}/).map(value=>value.trim()).filter(Boolean)){
     const p=document.createElement("p");p.textContent=paragraph;body.append(p);
    }
    details.append(summary,body);card.append(details);
   }
   if(typeof item.video_url==="string"){
    try{
     const videoUrl=new URL(item.video_url);
     if(videoUrl.protocol==="https:"&&!videoUrl.username&&!videoUrl.password&&!videoUrl.port){
      const videoLink=document.createElement("a");videoLink.className="news-video-source";videoLink.href=videoUrl.href;videoLink.target="_blank";videoLink.rel="noopener noreferrer";
      videoLink.textContent=copy?.videoSource||"External video source";card.append(videoLink);
     }
    }catch{}
   }
   root.append(card);
  }
  const previous=$("previousNews"),next=$("nextNews"),pageStatus=$("newsPageStatus");
  previous.disabled=currentPage===0||matches.length===0;
  next.disabled=currentPage+1>=pageCount||matches.length===0;
  pageStatus.textContent=matches.length?(copy?.page||"Page")+" "+(currentPage+1)+" / "+pageCount:(copy?.page||"Page")+" 0 / 0";
  if(items.length){
   const end=Math.min(start+root.childElementCount,matches.length);
   $("newsStatus").textContent=end+" / "+matches.length+" · "+(window.AURORA_SUBPAGES?.text("headlines")||"headlines");
  }
 }
 // Translate only the visible source page; the stable provider offsets still refer
 // to the unfiltered source order so search never mixes different snapshots.
 async function translateSourcePage(offset,id,edition,lang){
  if(loadedPages.has(offset)||failedPages.has(offset))return;
  if(pendingPages.has(offset))return pendingPages.get(offset);
  const job=(async()=>{
   try{
    const response=await fetch(fetchUrl(edition,lang,offset),{cache:"no-store"});
    if(!response.ok)throw Error("translation_unavailable");
    const data=await response.json();
    if(id!==requestId||lang!==language()||edition!==$("edition").value)return;
    if(!Array.isArray(data.items)||!["live","cached"].includes(data.status))throw Error("invalid_news");
    for(let i=offset;i<Math.min(items.length,offset+PAGE);i++)if(data.items[i]?.url!==items[i]?.url)return;
    for(let i=offset;i<Math.min(items.length,offset+PAGE);i++){
     if(typeof data.items[i].translated_title==="string")items[i].translated_title=data.items[i].translated_title;
     if(typeof data.items[i].translated_summary==="string")items[i].translated_summary=data.items[i].translated_summary;
     if(typeof data.items[i].source_language==="string")items[i].source_language=data.items[i].source_language;
    }
    loadedPages.add(offset);
    try{localStorage.setItem(key(edition,lang),JSON.stringify({saved_at:Date.now(),updated_at:updatedAt,items}))}catch{}
   }catch{if(id===requestId)failedPages.add(offset)}
  })();
  pendingPages.set(offset,job);
  try{await job}finally{if(pendingPages.get(offset)===job)pendingPages.delete(offset)}
 }
 async function translateVisible(version=searchVersion){
  const id=requestId,edition=$("edition").value,lang=language();
  const visible=filtered().slice(currentPage*PAGE,(currentPage+1)*PAGE);
  const offsets=[...new Set(visible.map(item=>Math.floor(items.indexOf(item)/PAGE)*PAGE))]
   .filter(offset=>offset>=0&&!loadedPages.has(offset)&&!failedPages.has(offset));
  for(let i=0;i<offsets.length;i+=2){
   if(version!==searchVersion||id!==requestId||lang!==language()||edition!==$("edition").value)return;
   await Promise.all(offsets.slice(i,i+2).map(offset=>translateSourcePage(offset,id,edition,lang)));
   if(version!==searchVersion||id!==requestId||lang!==language()||edition!==$("edition").value)return;
   render();
  }
 }
 function restore(edition,lang){
  try{
   const saved=JSON.parse(localStorage.getItem(key(edition,lang))||"null");
   if(!saved||Date.now()-saved.saved_at>12*3600000||!Array.isArray(saved.items)||!saved.items.length)return false;
   items=saved.items;updatedAt=saved.updated_at||"";render(true);
   $("newsStatus").dataset.state="cached";$("newsStatus").textContent=(window.AURORA_SUBPAGES?.text("cached")||"CACHED")+" · "+items.length;
   return true;
  }catch{return false}
 }
 async function load(){
  const edition=$("edition").value,lang=language(),id=++requestId;
  searchVersion++;clearTimeout(searchTimer);currentPage=0;
  loadedPages=new Set();pendingPages=new Map();failedPages=new Set();updatedAt="";
  items=[];$("newsList").replaceChildren();
  const recovered=restore(edition,lang);
  if(!recovered)$("newsStatus").textContent=window.AURORA_SUBPAGES?.text("loading")||"Loading…";
  $("refreshNews").disabled=true;render();
  try{
   const response=await fetch(fetchUrl(edition,lang,0),{cache:"no-store"});
   if(!response.ok)throw Error("news_unavailable");
   const data=await response.json();
   if(id!==requestId||lang!==language()||edition!==$("edition").value||!["live","cached"].includes(data.status)||!Array.isArray(data.items))return;
   items=data.items;updatedAt=data.updated_at||"";loadedPages.add(0);render(true);
   void translateVisible();
   const tr=key=>window.AURORA_SUBPAGES?.text(key);
   $("newsStatus").dataset.state=data.translation?.status==="unavailable"?"original":data.status;
   $("newsStatus").textContent=items.length+" "+(tr("headlines")||"headlines")+" · "+
    (data.translation?.translated?data.translation.translated+" "+(tr("translated")||"translated")+" · ":"")+
    (data.translation?.status==="unavailable"?(tr("origUntranslated")||"Original titles — translation unavailable")+" · ":"")+
    (data.status==="cached"?(tr("cached")||"CACHED")+" · ":"")+new Date(data.updated_at).toLocaleString(lang);
   if(data.status==="live")try{localStorage.setItem(key(edition,lang),JSON.stringify({saved_at:Date.now(),updated_at:data.updated_at,items}))}catch{}
  }catch{
   if(id!==requestId)return;
   if(!recovered){items=[];$("newsList").replaceChildren();$("newsStatus").dataset.state="error";
    $("newsStatus").textContent=window.AURORA_SUBPAGES?.text("offline")||"Source unavailable.";}
  }finally{if(id===requestId)$("refreshNews").disabled=false;render()}
 }
 function changePage(delta){
  const pages=Math.ceil(filtered().length/PAGE);
  const next=Math.max(0,Math.min(Math.max(0,pages-1),currentPage+delta));
  if(next===currentPage)return;
  currentPage=next;searchVersion++;render();void translateVisible(searchVersion);
 }
 updateControls();
 $("edition").addEventListener("change",load);
 $("newsSourceType").addEventListener("change",()=>{currentPage=0;searchVersion++;render(true);void translateVisible(searchVersion)});
 $("newsTopicCategory").addEventListener("change",()=>{currentPage=0;searchVersion++;render(true);void translateVisible(searchVersion)});
 $("newsSearch").addEventListener("input",()=>{
  searchVersion++;clearTimeout(searchTimer);render(true);const version=searchVersion;
  searchTimer=setTimeout(()=>{void translateVisible(version)},180);
 });
 $("previousNews").addEventListener("click",()=>changePage(-1));
 $("nextNews").addEventListener("click",()=>changePage(1));
 $("refreshNews").addEventListener("click",load);
 window.addEventListener("aurora:language-changed",()=>{updateControls();load()});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)load()});
 setInterval(()=>{if(!document.hidden)load()},15*60*1000);
 load();
})();
