/* Media browser uses original source links and an offline-friendly static catalog. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const locale=(()=>{try{return localStorage.getItem("aurora-lang")||"bg"}catch{return "bg"}})();
 document.documentElement.lang=locale;
 const bg=locale==="bg";
 const words=bg?{
  heading:"СНИМКИ, ВИДЕО И ДОКУМЕНТИ",
  intro:"Снимки, публикувани видеозаписи, интервюта и документи от оригинални архиви. Избери материал или прочети историята.",
  all:"Всички материали",video:"Видео",documents:"Документи и архиви",photo:"Фотографии",
  count:n=>"Налични медийни връзки: "+n,empty:"Няма материали за този филтър.",offline:"Медийният каталог временно не се зарежда.",
  case:"ОТВОРИ ПЪЛНОТО ДОСИЕ ↗",view:"ОТВОРИ ОРИГИНАЛНИЯ МАТЕРИАЛ ↗",illustration:"Тематична илюстрация — не оригинална снимка."
 }:{
  heading:"PHOTOS, VIDEO & DOCUMENTS",intro:"Source-published photographs, video footage, interviews and documents. Open the original material or read the case history.",
  all:"All media",video:"Video",documents:"Documents and archives",photo:"Photographs",
  count:n=>"Available source media links: "+n,empty:"No media for this filter.",offline:"Media catalog temporarily unavailable.",
  case:"OPEN FULL CASE DOSSIER ↗",view:"OPEN ORIGINAL MATERIAL ↗",illustration:"Thematic illustration, not an original incident photograph."
 };
 if(window.AURORA_UI?.label)words.heading=window.AURORA_UI.label("mediaTitle");
 $("mediaHeading").textContent=words.heading;$("mediaIntro").textContent=words.intro;
 for(const option of $("mediaType").options)option.textContent=words[option.value]||option.textContent;
 const valid=u=>{try{const x=new URL(u);return x.protocol==="https:"&&!x.username&&!x.password}catch{return false}};
 let items=[];
 function render(){
  const root=$("mediaGallery"),kind=$("mediaType").value,search=$("mediaSearch").value.trim().toLocaleLowerCase();
  const matches=items.filter(({c,m})=>{
   if(kind==="video"&&m.type!=="video")return false;
   if(kind==="photo"&&m.type!=="photo")return false;
   if(kind==="documents"&&!["documents","archive"].includes(m.type))return false;
   const hay=[c.title?.bg,c.title?.en,c.summary?.bg,c.summary?.en,m.title?.bg,m.title?.en,c.source?.name,c.country,c.date].filter(Boolean).join(" ").toLocaleLowerCase();
   return !search||hay.includes(search);
  });
  root.replaceChildren();
  for(const {c,m} of matches){
   const card=document.createElement("article");card.className="media-entry";
   const picture=document.createElement("div");picture.className="media-entry-image";
   const img=document.createElement("img");img.loading="lazy";img.decoding="async";
   img.src=/^\/assets\/[a-z0-9-]+\.webp$/.test(c.visual?.src||"")?c.visual.src:"/assets/feature-media.webp";
   img.alt=words.illustration;
   const badge=document.createElement("span");badge.textContent=m.type==="video"?"▶ VIDEO":m.type==="photo"?"▧ PHOTO":"▤ ARCHIVE";
   picture.append(img,badge);
   const body=document.createElement("div");body.className="media-entry-body";
   const meta=document.createElement("small");meta.textContent=c.date+" · "+c.country+" · "+(c.source?.name||"");
   const heading=document.createElement("h2");heading.textContent=c.title?.[locale]||c.title?.en||"";
   const summary=document.createElement("p");summary.textContent=c.summary?.[locale]||c.summary?.en||"";
   const links=document.createElement("div");links.className="media-entry-links";
   const original=document.createElement("a");original.href=m.url;original.target="_blank";original.rel="noopener noreferrer";
   original.textContent=(m.title?.[locale]||m.title?.en||words.view)+" ↗";
   const dossier=document.createElement("a");dossier.href="/archive/"+encodeURIComponent(c.id);dossier.textContent=words.case;
   links.append(original,dossier);
   const caution=document.createElement("small");caution.className="media-caption";caution.textContent=words.illustration;
   body.append(meta,heading,summary,links,caution);card.append(picture,body);root.append(card);
  }
  $("mediaStatus").textContent=matches.length?words.count(matches.length):words.empty;
 }
 async function load(){
  try{
   const r=await fetch("/data/cases.json",{cache:"force-cache"});if(!r.ok)throw Error("source");
   const data=await r.json();if(!Array.isArray(data.cases))throw Error("archive");
   items=data.cases.flatMap(c=>(Array.isArray(c.media)?c.media:[])
    .filter(m=>m&&["video","documents","archive","photo"].includes(m.type)&&valid(m.url)&&/^[a-z0-9-]{3,90}$/.test(c.id))
    .map(m=>({c,m}))).sort((a,b)=>String(b.c.date).localeCompare(String(a.c.date)));
   render();
  }catch{$("mediaStatus").textContent=words.offline}
 }
 $("mediaType").addEventListener("change",render);
 $("mediaSearch").addEventListener("input",render);
 load();
})();
