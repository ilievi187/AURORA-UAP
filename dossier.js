/* AURORA / CASE DOSSIERS. Every field is rendered with textContent, never HTML. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const path=location.pathname.split("/").filter(Boolean);
 const kind=path[0],id=path[1]||"";
 const legacy=kind==="archive";
 const language=(()=>{try{return localStorage.getItem("aurora-lang")||"bg"}catch{return "bg"}})();
 const bg=language==="bg",lang=bg?"bg":"en";
 document.documentElement.lang=language;
 const tr={
  bg:{
   home:"← НАЧАЛО",subtitle:"Оригинално резюме с цитирани източници и изрично обозначена несигурност.",
   loading:"Зареждаме досието…",unavailable:"Публичният D1 регистър още не е активиран или е временно недостъпен. Справочният исторически архив е достъпен от началната страница.",
   missing:"Досието не е налично или не е одобрено за публикуване.",invalid:"Невалиден идентификатор на досие.",
   error:"Неуспешно зареждане. Можеш да се върнеш към глобуса и да опиташ отново.",
   kindLegacy:"ARCHIVE / HISTORICAL REFERENCE / OUTSIDE D1",kindD1:"GLOBAL REGISTER / PUBLIC APPROVED CASE",
   facts:"ПРОВЕРИМИ ДАННИ / CASE FACTS",id:"ИДЕНТИФИКАТОР",date:"ДАТА",location:"РАЙОН",
   category:"ТИП",publication:"ПУБЛИКАЦИЯ",assessment:"ОЦЕНКА НА ЯВЛЕНИЕТО",precision:"ТОЧНОСТ НА МЯСТОТО",
   summary:"СВИДЕТЕЛСТВА И ДОКУМЕНТИРАНИ ФАКТИ",source:"ПРОИЗХОД И ИЗТОЧНИК",
   geography:"ГЕОГРАФСКА НЕСИГУРНОСТ",openSource:"ОТВОРИ ОРИГИНАЛНИЯ ИЗТОЧНИК ↗",
   country:"КЪМ РЕГИСТЪРА НА ДЪРЖАВАТА ↗",back:"← КЪМ ГЛОБУСА",
   reference:"Исторически справочен запис (V1.3). Не е потребителски сигнал, не е импортиран в D1 и не влиза в публичния брояч.",
   approved:"Одобрено за публично показване — това НЕ означава потвърдено необичайно явление.",
   caution:"Свидетелски твърдения и официално публикувани видеозаписи сами по себе си не доказват извънземен произход.",
   noCoords:"Няма публикувани достатъчно точни координати. Не се поставя измислена точка на картата.",
   approx:"Позицията е ориентировъчна, а не измерено местоположение на наблюдавания обект.",
   sourceMissing:"Няма разрешен оригинален HTTPS източник.",
   categoryName:{lights:"Светлини",object:"Обект",instrument:"Запис от прибор",other:"Друго"},
   statusName:{resolved:"Обяснено според цитирания източник",unresolved:"Необяснено според цитирания източник",undetermined:"Без определено заключение",disputed:"Оспорвана оценка",reported:"Свидетелско съобщение",official_record:"Официално документирано",explained:"Има известно обяснение"},
   confidence:{high:"висока",moderate:"умерена",low:"ниска",not_stated:"непосочена"}
  },
  en:{
   home:"← HOME",subtitle:"Original summary with attributed sources and explicit uncertainty.",
   loading:"Loading public dossier…",unavailable:"The D1 public registry is not active or temporarily unavailable. The historical reference archive remains available from the homepage.",
   missing:"This dossier is unavailable or has not been approved for publication.",invalid:"Invalid dossier ID.",
   error:"Could not load dossier. Return to the globe and try again.",
   kindLegacy:"ARCHIVE / HISTORICAL REFERENCE / OUTSIDE D1",kindD1:"GLOBAL REGISTER / PUBLIC APPROVED CASE",
   facts:"SOURCE-CHECKED INFORMATION / CASE FACTS",id:"IDENTIFIER",date:"DATE",location:"REGION",
   category:"CATEGORY",publication:"PUBLICATION",assessment:"SOURCE ASSESSMENT",precision:"LOCATION ACCURACY",
   summary:"WITNESS REPORTS AND DOCUMENTED FACTS",source:"PROVENANCE AND ORIGINAL SOURCE",
   geography:"GEOGRAPHIC UNCERTAINTY",openSource:"OPEN ORIGINAL SOURCE ↗",
   country:"EXPLORE COUNTRY REGISTER ↗",back:"← RETURN TO THE GLOBE",
   reference:"V1.3 historical reference only. Not a user submission, not imported into D1 and not included in registered totals.",
   approved:"Editorially approved for publication — this does NOT mean an anomalous phenomenon was confirmed.",
   caution:"Witness reports and officially released recordings alone do not establish extraterrestrial origin.",
   noCoords:"No sufficiently precise published coordinates. No artificial map position is invented.",
   approx:"Coordinates are an approximate display anchor, not a measured object position.",
   sourceMissing:"No verified original HTTPS source is available.",
   categoryName:{lights:"Lights",object:"Object",instrument:"Instrument recording",other:"Other"},
   statusName:{resolved:"Resolved according to cited source",unresolved:"Unresolved according to cited source",undetermined:"No final assessment",disputed:"Disputed assessment",reported:"Eyewitness report",official_record:"Official documented report",explained:"Known explanation"},
   confidence:{high:"high",moderate:"moderate",low:"low",not_stated:"not stated"}
  }
 };
 const t=tr[lang],local=x=>x?.[language]||x?.en||"";
 function feedback(message,error=false){
  $("dossierFeedback").textContent=message;
  $("dossierFeedback").classList.toggle("error",error);
  $("dossierFeedback").hidden=false;
  $("dossierContent").hidden=true;
  $("dossierActions").hidden=true;
 }
 function sourceUrl(raw){
  try{
   const u=new URL(raw);
   if(u.protocol!=="https:"||u.username||u.password||u.port||!u.hostname.includes("."))return null;
   return u.href;
  }catch{return null}
 }
 function label(id,value){$(id).textContent=value}
 function render(c){
  const title=local(c.title)||c.title||id;
  const summary=local(c.summary)||c.description||"";
  const area=local(c.city)||c.location||"—";
  const country=c.country_code||c.country||"";
  const assessment=c.assessment_status||c.status||"undetermined";
  document.title=title+" | AURORA UAP";
  label("dossierTitle",title);
  label("dossierKind",legacy?t.kindLegacy:t.kindD1);
  label("dossierSubtitle",t.subtitle);
  label("factIdentifier",c.id);
  label("factDate",c.date+" · "+c.date_precision);
  label("factLocation",area+(country?" · "+country:""));
  label("factCategory",t.categoryName[c.category]||c.category||"—");
  label("factPublication",legacy?t.reference:t.approved);
  label("factAssessment",t.statusName[assessment]||t.statusName.undetermined);
  label("factPrecision",c.location_precision||"—");
  label("dossierSummary",summary);
  // Source provenance is preserved; visuals are labelled if illustrative.
  const visual=c.visual;
  const visualBox=$("caseVisual"),visualImage=$("caseVisualImage");
  const allowedVisual=typeof visual?.src==="string"&&/^\/assets\/[a-z0-9-]+\.webp$/.test(visual.src);
  visualBox.hidden=!allowedVisual;
  if(allowedVisual){
   visualImage.src=visual.src;
   visualImage.alt=local(visual.caption)||"Case illustration";
   $("caseVisualCaption").textContent=local(visual.caption)||"Illustrative image";
  }else{visualImage.removeAttribute("src")}
  const story=$("dossierStory");story.replaceChildren();
  const narrative=c.story?.[language]||c.story?.en;
  if(Array.isArray(narrative)){
   for(const passage of narrative.slice(0,10)){
    if(typeof passage!=="string"||passage.length<15)continue;
    const paragraph=document.createElement("p");
    paragraph.textContent=passage;story.append(paragraph);
   }
  }
  const mediaBox=$("caseMediaSection"),mediaGrid=$("caseMediaGrid");
  mediaGrid.replaceChildren();
  $("caseMediaTitle").textContent=lang==="bg"?"СНИМКИ, ВИДЕО И ДОКУМЕНТИ":"PHOTOS, VIDEO & SOURCE DOCUMENTS";
  const approvedTypes=new Set(["video","documents","archive","photo"]);
  for(const m of (Array.isArray(c.media)?c.media:[]).slice(0,12)){
   if(!approvedTypes.has(m.type))continue;
   const safe=sourceUrl(m.url);if(!safe)continue;
   const anchor=document.createElement("a");anchor.href=safe;anchor.target="_blank";anchor.rel="noopener noreferrer";
   anchor.className="case-media-link";
   const icon=document.createElement("span");
   icon.className="case-media-icon";icon.setAttribute("aria-hidden","true");
   icon.textContent=m.type==="video"?"▶":m.type==="photo"?"▧":"▤";
   const text=document.createElement("strong");
   text.textContent=local(m.title)||m.type;
   const type=document.createElement("small");
   type.textContent=({video:"VIDEO",photo:"PHOTO",documents:"DOCUMENTS",archive:"ARCHIVE"})[m.type];
   anchor.append(icon,text,type);mediaGrid.append(anchor);
  }
  mediaBox.hidden=mediaGrid.childElementCount===0;

  label("dossierCaution",t.caution);
  const source=sourceUrl(c.source_url||c.source?.url);
  label("dossierSourceName",c.source_name||c.source?.name||t.sourceMissing);
  const src=$("dossierSourceUrl");
  src.hidden=!source;
  if(source){src.href=source;src.textContent=t.openSource}
  label("dossierLicense",legacy?t.reference:(c.license||""));
  const authority=c.assessment_authority?
   c.assessment_authority+" · "+(t.confidence[c.assessment_confidence]||t.confidence.not_stated):"";
  label("dossierAssessmentAuthority",authority);
  const lat=c.latitude??c.lat,lng=c.longitude??c.lng;
  if(typeof lat==="number"&&Number.isFinite(lat)&&Math.abs(lat)<=90&&
     typeof lng==="number"&&Number.isFinite(lng)&&Math.abs(lng)<=180){
   label("dossierCoordinate",lat.toFixed(3)+"°, "+lng.toFixed(3)+"°");
   label("dossierLocationCaveat",t.approx+" "+(c.location_precision||""));
  }else{
   label("dossierCoordinate","N/A — POSITION NOT PUBLISHED");
   label("dossierLocationCaveat",t.noCoords+" "+(c.location_precision||""));
  }
  const countryLink=$("dossierCountry");
  countryLink.hidden=legacy||!/^[A-Z]{2}$/.test(country);
  if(!countryLink.hidden){countryLink.href="/countries/"+country;countryLink.textContent=t.country}
  label("dossierArchiveLink",t.back);
  $("dossierFeedback").hidden=true;
  $("dossierContent").hidden=false;$("dossierActions").hidden=false;
 }
 function translateStatic(){
  const ids={dossierBack:"home",factsHeading:"facts",labelIdentifier:"id",labelDate:"date",
   labelLocation:"location",labelCategory:"category",labelPublication:"publication",labelAssessment:"assessment",
   labelPrecision:"precision",summaryHeading:"summary",sourceHeading:"source",locationHeading:"geography"};
  for(const [id,key] of Object.entries(ids))label(id,t[key]);
  document.querySelector(".skip").textContent=bg?"Към съдържанието":"Skip to content";
 }
 async function load(){
  translateStatic();
  if(!["archive","cases"].includes(kind)||!/^[a-z0-9-]{3,90}$/.test(id)||path.length!==2){
   feedback(t.invalid,true);return;
  }
  feedback(t.loading);
  try{
   let c;
   if(legacy){
    const res=await fetch("/data/cases.json",{cache:"force-cache"});
    if(!res.ok)throw Error("archive");
    const data=await res.json();
    c=(Array.isArray(data.cases)?data.cases:[]).find(x=>x.id===id);
   }else{
    const res=await fetch("/api/cases/"+encodeURIComponent(id),{cache:"no-store"});
    if(res.status===503){feedback(t.unavailable);return}
    if(res.status===404){feedback(t.missing,true);return}
    if(!res.ok)throw Error("case");
    c=await res.json();
    if(c.review_status!=="approved"||c.record_kind==="demo"){feedback(t.missing,true);return}
   }
   if(!c){feedback(t.missing,true);return}
   render(c);
  }catch{feedback(t.error,true)}
 }
 load();
})();
