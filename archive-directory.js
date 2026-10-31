import {resolveMediaPlayback} from "./media-player.js";
import {addArchivePlayback,resetArchivePlayback} from "./archive-inline-player.js";
import {translatePublicCase,translationDisclosure,isFullTranslation} from "./archive-localization.js";
// 10 records per page; 101 published dossiers provide 11 navigable pages.
const PAGE_SIZE=10,$=id=>document.getElementById(id),storageKey="aurora-lang";
const supported=new Set(["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ko"]);
let language="bg";try{language=localStorage.getItem(storageKey)||"bg"}catch{}
if(!supported.has(language))language="en";
let records=[],currentPage=1,search="",country="",mediaType="",sourceError=false;
const packs={
 bg:{home:"Начало",countries:"Държави",news:"Новини",language:"Език",
 heading:"СВЕТОВЕН АРХИВ UAP",intro:"Публикувани случаи и архивни документи от посочени източници. Отвори досието за подробни описания, оценки, документи и вградени видеа, когато има такива.",
 caseCount:"ДОСИЕТА",pageCount:"СТРАНИЦИ",countryCount:"ДЪРЖАВИ",
 browse:"РАЗГЛЕДАЙ СЛУЧАИТЕ",search:"ТЪРСИ",filterCountry:"ДЪРЖАВА",filterMedia:"МАТЕРИАЛИ",
 allCountries:"Всички държави",allMedia:"Всички",hasPlayable:"С вградено видео",hasVideo:"С видеоизточник",hasDocuments:"С документи",
 loading:"Зареждане на световния архив…",offline:"Архивът временно не отговаря.",empty:"Няма случаи по избраните критерии.",
 results:"случая",page:"Страница",of:"от",prev:"← Предишна",next:"Следваща →",view:"ОТВОРИ ПЪЛНОТО ДОСИЕ",
 source:"ОРИГИНАЛЕН ИЗТОЧНИК",video:"▶ ВГРАДИМО ВИДЕО",linkedVideo:"ВИДЕОИЗТОЧНИК",documents:"ДОКУМЕНТИ",
 disclaimer:"Това са публикации и свидетелства, не доказателства за извънземен произход. Географските точки могат да са приблизителни референтни райони, не измерени траектории.",
 undated:"Без точна дата",unknown:"Неуточнен район",count:"Общо",go:"Отиди на страница"},
 en:{home:"Home",countries:"Countries",news:"News",language:"Language",
 heading:"WORLD UAP ARCHIVE",intro:"Published case records and original documents from attributed sources. Open each dossier for detailed context, assessments, documents and embedded video when playback is available.",
 caseCount:"CASE FILES",pageCount:"PAGES",countryCount:"COUNTRIES",
 browse:"EXPLORE CASES",search:"SEARCH",filterCountry:"COUNTRY",filterMedia:"MATERIALS",
 allCountries:"All countries",allMedia:"All records",hasPlayable:"With embedded player",hasVideo:"With video source",hasDocuments:"With documents",
 loading:"Loading the world archive…",offline:"Archive temporarily unavailable.",empty:"No cases match your filters.",
 results:"records",page:"Page",of:"of",prev:"← Previous",next:"Next →",view:"OPEN FULL DOSSIER",
 source:"ORIGINAL SOURCE",video:"▶ PLAYABLE VIDEO",linkedVideo:"VIDEO SOURCE",documents:"DOCUMENTS",
 disclaimer:"Published reports are not proof of extraterrestrial origin. Map positions may be approximate locality anchors, not measured flight paths.",
 undated:"Undated",unknown:"Location not specified",count:"Total",go:"Go to page"}
};
const T=()=>packs[language]||packs.en;
const local=v=>typeof v==="string"?v:typeof v==="object"&&v?String(v[language]||v.en||v.bg||""):"";
const safeUrl=v=>{try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
const num=n=>new Intl.NumberFormat(language).format(n);
function countryOptions(){
 const s=new Set(records.map(x=>x.country).filter(x=>/^[A-Z]{2}$/.test(x||"")));
 const lang=language;let names;
 try{names=new Intl.DisplayNames([lang],{type:"region"})}catch{names=new Intl.DisplayNames(["en"],{type:"region"})}
 return [...s].sort((a,b)=>names.of(a).localeCompare(names.of(b),lang)).map(code=>({code,label:names.of(code)+" · "+code}));
}
const playable=x=>(x.media||[]).some(m=>m.type==="video"&&resolveMediaPlayback(m));
function filtered(){
 return records.filter(r=>{
  if(country&&r.country!==country)return false;
  if(mediaType==="playable"&&!playable(r))return false;
  if(mediaType==="video"&&!(r.media||[]).some(m=>m.type==="video"))return false;
  if(mediaType==="documents"&&!(r.media||[]).some(m=>["documents","archive"].includes(m.type)))return false;
  const searchable=[local(r.title),local(r.summary),local(r.city),r.date,r.country,
   ...(r.story?.en||[]),...(r.sources||[]).map(s=>s.name||"")].join(" ").toLocaleLowerCase();
  return !search||searchable.includes(search);
 });
}
const el=(tag,cl,txt)=>{
 const e=document.createElement(tag);if(cl)e.className=cl;if(txt!==undefined)e.textContent=txt;return e;
};
function card(r){
 const article=el("article","archive-card");
 article.dataset.caseId=r.id;
 const top=el("div","card-top");
 top.append(el("span","card-meta",(r.date&&r.date!=="undated"?r.date:T().undated)+" · "+(local(r.city)||r.country||T().unknown)));
 top.append(el("span","card-status",r.publisher_assessment||r.status||"reported"));
 const title=el("h3","card-title",local(r.title));
 const summary=el("p","card-description",local(r.summary));
 article.append(top,title,summary);
 // An English source fallback is never misrepresented as translated content.
 if(language!=="en"&&!isFullTranslation(r,language)){
   const disclosure=el("small","archive-translation-disclosure",translationDisclosure(language));
   disclosure.dataset.translationDisclosure="1";
   article.append(disclosure);
   const renderedLang=language;
   void translatePublicCase(r,renderedLang).then(result=>{
     if(!result||!article.isConnected||language!==renderedLang)return;
     title.textContent=local(r.title);
     summary.textContent=local(r.summary);
     if(isFullTranslation(r,renderedLang))disclosure.remove();
   });
 }
 const paragraphs=Array.isArray(r.story?.[language])?r.story[language]:Array.isArray(r.story?.en)?r.story.en:[];
 const detail=paragraphs.find(p=>typeof p==="string"&&p!==local(r.summary)&&p.length>95);
 if(detail)article.append(el("p","card-context",detail.slice(0,350)+(detail.length>350?"…":"")));
 // Play directly on the archive card instead of redirecting to a publisher.
 const clip=(r.media||[]).find(m=>m.type==="video"&&resolveMediaPlayback(m));
 if(clip)addArchivePlayback(article,clip,language,local(clip.title)||local(r.title));
 const tags=el("div","card-tags");
 const sources=new Set([r.source?.url,...(r.sources||[]).map(s=>s.url),...(r.media||[]).map(m=>m.url)].filter(safeUrl));
 tags.append(el("span","tag",num(sources.size)+" · "+T().source));
 if((r.media||[]).some(m=>["documents","archive"].includes(m.type)))tags.append(el("span","tag",T().documents));
 if(playable(r))tags.append(el("span","tag tag-video",T().video));
 else if((r.media||[]).some(m=>m.type==="video"))tags.append(el("span","tag",T().linkedVideo));
 const foot=el("div","card-foot"),link=el("a","case-open",T().view+" ↗");
 link.href="/archive/"+encodeURIComponent(r.id);foot.append(link);
 const source=safeUrl(r.source?.url);
 if(source){const a=el("a","original-link",T().source+" ↗");a.href=source;a.target="_blank";a.rel="noopener noreferrer";foot.append(a)}
 article.append(tags,foot);
 return article;
}
function jump(page){
 currentPage=page;
 render();
 const u=new URL(location.href);
 if(page>1)u.searchParams.set("page",String(page));else u.searchParams.delete("page");
 history.replaceState(null,"",u);
 $("archiveListTitle").focus({preventScroll:true});
}
function pageButton(text,page,active=false){
 const btn=el("button","archive-page-btn"+(active?" is-active":""),text);
 btn.type="button";btn.dataset.page=String(page);
 btn.setAttribute("aria-label",T().go+" "+page);
 btn.setAttribute("aria-current",active?"page":"false");
 btn.addEventListener("click",()=>jump(page));
 return btn;
}
function pagination(total){
 const nav=$("archivePagination");nav.replaceChildren();
 const pages=Math.ceil(total/PAGE_SIZE);if(pages<2)return;
 const prev=pageButton(T().prev,Math.max(1,currentPage-1));prev.disabled=currentPage===1;nav.append(prev);
 const visible=pages<=11?Array.from({length:pages},(_,i)=>i+1):[...new Set([1,pages,...Array.from({length:7},(_,i)=>currentPage-3+i).filter(x=>x>0&&x<=pages)])].sort((a,b)=>a-b);
 let last=0;
 for(const page of visible){
  if(page-last>1)nav.append(el("span","page-gap","…"));
  nav.append(pageButton(String(page),page,page===currentPage));last=page;
 }
 const next=pageButton(T().next,Math.min(pages,currentPage+1));next.disabled=currentPage===pages;nav.append(next);
}
function render(){
 const matches=filtered(),total=matches.length,pages=Math.ceil(total/PAGE_SIZE);
 currentPage=Math.max(1,Math.min(currentPage,Math.max(1,pages)));
 const host=$("archiveResults");resetArchivePlayback();host.replaceChildren();
 $("archiveStatus").textContent=sourceError?T().offline:total?
  T().count+": "+num(total)+" "+T().results+" · "+T().page+" "+currentPage+" "+T().of+" "+pages:T().empty;
 for(const r of matches.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE))host.append(card(r));
 pagination(total);
 $("archiveCount").textContent=num(records.length);
 $("archivePageCount").textContent=num(Math.ceil(records.length/PAGE_SIZE));
 $("archiveCountryCount").textContent=num(countryOptions().length);
}
function labels(){
 document.documentElement.lang=language;document.documentElement.dir=language==="ar"?"rtl":"ltr";
 const t=T();
 document.querySelectorAll("[data-archive-label]").forEach(e=>{const key=e.dataset.archiveLabel;if(t[key])e.textContent=t[key]});
 document.title="AURORA · "+t.heading;$("archiveLanguage").value=language;
}
function populateCountries(){
 const sel=$("archiveCountry"),old=sel.value;sel.replaceChildren();
 const empty=el("option","",T().allCountries);empty.value="";sel.append(empty);
 for(const o of countryOptions()){const x=el("option","",o.label);x.value=o.code;sel.append(x)}
 sel.value=old;
}
function filterChanged(){
 search=$("archiveSearch").value.trim().toLocaleLowerCase();
 country=$("archiveCountry").value;mediaType=$("archiveMedia").value;
 currentPage=1;render();
 const u=new URL(location.href);u.searchParams.delete("page");history.replaceState(null,"",u);
}
async function start(){
 labels();populateCountries();
 $("archiveLanguage").addEventListener("change",e=>{
  language=supported.has(e.target.value)?e.target.value:"en";
  try{localStorage.setItem(storageKey,language)}catch{}
  labels();populateCountries();render();
 });
 $("archiveSearch").addEventListener("input",filterChanged);
 $("archiveCountry").addEventListener("change",filterChanged);
 $("archiveMedia").addEventListener("change",filterChanged);
 try{
  const response=await fetch("/data/cases.json",{cache:"no-cache"});
  if(!response.ok)throw Error("Archive HTTP "+response.status);
  const data=await response.json();if(!Array.isArray(data.cases))throw Error("Invalid cases payload");
  records=globalThis.AURORA_ARCHIVE?.prepareArchiveCases(data.cases)||data.cases;
  records=records.filter(c=>c?.id&&local(c.title)&&safeUrl(c.source?.url));
  records.sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.id).localeCompare(String(b.id)));
  const requested=Number(new URL(location.href).searchParams.get("page"));
  currentPage=Number.isInteger(requested)&&requested>0?requested:1;
  populateCountries();
 }catch(e){sourceError=true;console.warn("Public archive unavailable",e)}
 render();
}
start();
