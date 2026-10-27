/* AURORA Country Explorer / read-only public D1 data. No personal submissions. */
"use strict";
(()=>{
 const el=id=>document.getElementById(id),status=el("countryFeedback");
 const names="AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
 const code=decodeURIComponent(location.pathname.split("/")[2]||"").toUpperCase();
 const language=(()=>{try{return localStorage.getItem("aurora-lang")||"bg"}catch{return "bg"}})();
 const isBg=language==="bg",locale=language==="zh-CN"?"zh-Hans":language;
 document.documentElement.lang=language;
 const d=new Intl.DisplayNames([locale,"en"],{type:"region"});
 const label=key=>({
  loading:isBg?"Зареждаме регистрираните случаи…":"Loading registered cases…",
  error:isBg?"Базата данни още не е свързана или временно не отговаря. Не показваме измислени числа.":"D1 is not connected or temporarily unavailable. No fabricated statistics are shown.",
  empty:isBg?"Няма публикувани случаи за тези филтри.":"No published cases match these filters.",
  more:isBg?"ПОКАЖИ ОЩЕ ↓":"LOAD MORE ↓",
  verified:isBg?"ПУБЛИЧНО ОДОБРЕН":"PUBLICLY APPROVED",
  source:isBg?"ПЪРВИЧЕН ИЗТОЧНИК":"ORIGINAL SOURCE",
  approx:isBg?"Координатите са ориентир, а не потвърдена точка на наблюдение.":"Coordinates are approximate anchors, not verified observation points.",
  node:isBg?"РЕГИСТЪР НА СЛУЧАИТЕ":"REGISTERED CASES"
 })[key];
 if(!/^[A-Z]{2}$/.test(code)||!names.includes(code)){status.textContent="Invalid ISO country code";status.classList.add("error");return}
 const countryName=d.of(code)||code;
 document.title="AURORA — "+countryName+" | Country Explorer";
 el("countryCode").textContent=code;el("countryName").textContent=countryName;
 el("countryIntro").textContent=isBg?"Публичен архив за "+countryName+". Данните се зареждат от реалния регистър; демо случаите не се броят.":"Public registry for "+countryName+". Counts come from D1; demonstration cases are excluded.";
 const txt={backLabel:["НАЧАЛО","HOME"],sightingsLabel:["РЕГИСТРИРАНИ СЛУЧАИ","REGISTERED CASES"],yearsLabel:["ГОДИНИ СЪС СЛУЧАИ","YEARS WITH CASES"],regionsLabel:["РЕГИОНИ","REGIONS"],chooseCountryLabel:["ДЪРЖАВА","COUNTRY"],yearLabel:["ГОДИНА","YEAR"],regionLabel:["РЕГИОН","REGION"],typeLabel:["ТИП","TYPE"],statusLabel:["СТАТУС","STATUS"],searchLabel:["ТЪРСЕНЕ","SEARCH"],resultsHeading:["РЕГИСТЪР НА СЛУЧАИТЕ","CASE REGISTER"],reportLabel:["✦ ПОДАЙ НАБЛЮДЕНИЕ","✦ REPORT A SIGHTING"],reportNotice:["Засега само локална чернова — публичното изпращане не е активно.","Local draft only — submissions are not enabled."],mapCaveat:["Приблизителни райони, не точни траектории и лични адреси.","Approximate regions, not flight paths or personal addresses."]};
 for(const [key,values] of Object.entries(txt))el(key).textContent=values[isBg?0:1];
 el("reportLink").href="/?report=draft&country="+code;
 const choose=el("chooseCountry");
 for(const c of names){
  const option=document.createElement("option");option.value=c;option.textContent=d.of(c)||c;
  choose.append(option);
 }
 choose.value=code;
 choose.addEventListener("change",()=>{location.href="/countries/"+encodeURIComponent(choose.value)});
 el("caseSearch").placeholder=isBg?"Търси по място или описание":"Search place or description";
 let land=[],entries=[],page=0,total=0,requestToken=0,controller=null,loadMoreBusy=false;
 const PAGE=30;
 const canvas=el("countryMap"),ctx=canvas.getContext("2d");
 function paint(){
  if(!ctx)return;
  ctx.clearRect(0,0,1000,480);
  const gradient=ctx.createLinearGradient(0,0,0,480);gradient.addColorStop(0,"#05202a");gradient.addColorStop(1,"#05121d");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,1000,480);
  ctx.strokeStyle="#29617455";ctx.lineWidth=1;
  for(let i=0;i<=1000;i+=50){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,480);ctx.stroke()}
  for(let i=0;i<=480;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(1000,i);ctx.stroke()}
  ctx.fillStyle="#164851";ctx.strokeStyle="#428f8e7e";ctx.lineWidth=.6;
  for(const poly of land){
   if(poly.length<3)continue;
   ctx.beginPath();let last=null,started=false;
   for(const [lng,lat] of poly){
    const x=(lng+180)/360*1000,y=(90-lat)/180*480;
    if(last!==null&&Math.abs(x-last)>500){ctx.fill();ctx.stroke();ctx.beginPath();started=false}
    if(!started){ctx.moveTo(x,y);started=true}else ctx.lineTo(x,y);
    last=x;
   }
   if(started){ctx.fill();ctx.stroke()}
  }
 }
 const pinHolder=el("mapPoints");
 function renderPins(){
  pinHolder.replaceChildren();
  pinHolder.style.top=canvas.offsetTop+"px";
  pinHolder.style.left=canvas.offsetLeft+"px";
  pinHolder.style.width=canvas.clientWidth+"px";
  pinHolder.style.height=canvas.clientHeight+"px";
  pinHolder.style.right="auto";pinHolder.style.bottom="auto";
  const clusters=new Map();
  for(const item of entries){
   if(!Number.isFinite(item.latitude)||!Number.isFinite(item.longitude))continue;
   const cell=Math.round(item.latitude/5)+":"+Math.round(item.longitude/5);
   const cluster=clusters.get(cell)||{lat:0,lng:0,items:[]};cluster.lat+=item.latitude;cluster.lng+=item.longitude;cluster.items.push(item);
   clusters.set(cell,cluster);
  }
  for(const cluster of clusters.values()){
   const lat=cluster.lat/cluster.items.length,lng=cluster.lng/cluster.items.length;
   const pin=document.createElement("button");pin.type="button";pin.className="map-point";
   pin.style.left=((lng+180)/360*100)+"%";pin.style.top=((90-lat)/180*100)+"%";
   pin.textContent=cluster.items.length>1?String(cluster.items.length):"";
   pin.title=cluster.items.map(x=>x.title[language]||x.title.en).slice(0,3).join(", ");
   pin.setAttribute("aria-label",pin.title);
   pin.addEventListener("click",()=>document.getElementById("case-"+cluster.items[0].id)?.focus());
   pinHolder.append(pin);
  }
  el("visibleMapCount").textContent=pinHolder.children.length+" "+(isBg?"групи точки":"marker groups");
 }
 function formatCase(x){
  const wrap=document.createElement("div");
  const button=document.createElement("button");button.type="button";button.className="case-card";button.id="case-"+x.id;
  button.setAttribute("aria-expanded","false");
  const top=document.createElement("span");top.className="case-top";top.textContent=x.date+" · "+(x.region||x.location)+" · "+(x.assessment_status==="resolved"?(isBg?"ОБЯСНЕН СПОРЕД ИЗТОЧНИКА":"ASSESSED RESOLVED"):(isBg?"ОЦЕНКА: ":"ASSESSMENT: ")+String(x.assessment_status||"undetermined").toUpperCase());
  const title=document.createElement("strong");title.className="case-title";title.textContent=x.title[language]||x.title.en;
  const excerpt=document.createElement("span");excerpt.className="case-excerpt";excerpt.textContent=(x.summary[language]||x.summary.en).slice(0,165)+"…";
  button.append(top,title,excerpt);
  const details=document.createElement("div");details.className="case-details";details.hidden=true;
  const p=document.createElement("p");p.textContent=x.summary[language]||x.summary.en;
  const precision=document.createElement("p");precision.textContent=label("approx")+" "+x.location_precision;
  details.append(p,precision);
  if(x.assessment_authority){const finding=document.createElement("p");finding.textContent=(isBg?"Оценка: ":"Assessment: ")+x.assessment_authority+" · "+x.assessment_status+" ("+x.assessment_confidence+")";details.append(finding)}
  if(x.media?.length){const media=document.createElement("p");media.textContent=isBg?"Медийни материали с потвърдени права:":"Rights-verified media:";details.append(media)}
  try{
   const u=new URL(x.source_url);
   if(u.protocol==="https:"){
    const link=document.createElement("a");link.href=u.href;link.target="_blank";link.rel="noopener noreferrer";
    link.textContent=label("source")+": "+x.source_name+" ↗";details.append(link);
   }
  }catch{}
  button.addEventListener("click",()=>{
   const visible=details.hidden;details.hidden=!visible;button.setAttribute("aria-expanded",String(visible));
  });
  wrap.append(button,details);
  return wrap;
 }
 function queryParams(requestedPage){
  const p=new URLSearchParams({country:code,limit:String(PAGE),offset:String(requestedPage*PAGE)});
  const val=[["yearFilter","year"],["regionFilter","region"],["typeFilter","type"],["statusFilter","assessment"],["caseSearch","q"]];
  for(const [id,key] of val){const value=el(id).value.trim();if(value)p.set(key,value)}
  return p;
 }
 async function api(path,signal){
  const resp=await fetch(path,{headers:{accept:"application/json"},cache:"no-store",...(signal?{signal}:{})});
  if(!resp.ok)throw Error("HTTP "+resp.status);
  return resp.json();
 }
 async function load(reset=true){
  // A new filter selection must win even when an older network request finishes later.
  if(!reset&&loadMoreBusy)return;
  const token=reset?++requestToken:requestToken;
  if(reset){
   controller?.abort();controller=new AbortController();
   page=0;entries=[];el("countryCases").replaceChildren();
  }
  if(!controller)controller=new AbortController();
  const requestedPage=reset?0:page+1;
  loadMoreBusy=true;
  el("loadMore").disabled=true;
  status.classList.remove("error");
  status.textContent=label("loading");
  try{
   const response=await api("/api/cases?"+queryParams(requestedPage),controller.signal);
   if(token!==requestToken)return;
   if(!Array.isArray(response.cases)||!Number.isInteger(response.total))throw Error("Invalid API response");
   page=requestedPage;
   total=response.total;
   entries.push(...response.cases);
   for(const item of response.cases)el("countryCases").append(formatCase(item));
   renderPins();
   status.textContent=total+" "+(isBg?"публикувани случая":"published cases")+" · "+countryName;
   if(total===0)status.textContent=label("empty");
   el("loadMore").hidden=!response.has_more;
   el("loadMore").textContent=label("more");
  }catch(error){
   if(token!==requestToken||error.name==="AbortError")return;
   status.classList.add("error");status.textContent=label("error");
   el("loadMore").hidden=true;
  }finally{
   if(token===requestToken){loadMoreBusy=false;el("loadMore").disabled=false}
  }
 }
 async function init(){
  const local=names.includes(code);
  if(!local)return;
  try{
   const [region,world]=await Promise.all([
    api("/api/countries/"+code),
    fetch("/data/earth-land.json").then(r=>r.ok?r.json():{polygons:[]})
   ]);
   land=world.polygons||[];paint();
   el("countryTotal").textContent=region.total;
   el("countryYears").textContent=region.years.length;
   el("countryRegions").textContent=region.regions.length;
   for(const item of region.years){const op=document.createElement("option");op.value=item.year;op.textContent=item.year+" ("+item.n+")";el("yearFilter").append(op)}
   for(const item of region.regions){const op=document.createElement("option");op.value=item.region;op.textContent=item.region+" ("+item.n+")";el("regionFilter").append(op)}
  }catch{
   status.classList.add("error");status.textContent=label("error");paint();
  }
  await load();
 }
 for(const id of ["yearFilter","regionFilter","typeFilter","statusFilter"])el(id).addEventListener("change",()=>load());
 let timer;
 el("caseSearch").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>load(),280)});
 el("loadMore").addEventListener("click",()=>load(false));
 window.addEventListener("resize",renderPins,{passive:true});
 init();
})();
