"use strict";
(()=>{
 const $=id=>document.getElementById(id),NS="http://www.w3.org/2000/svg";
 const map=$("skyMap");let rows=[],requestGeneration=0;
 const round=(x,u="")=>Number.isFinite(x)?Math.round(x)+u:"—";
 function render(data){
  rows=data.aircraft;map.replaceChildren();
  const make=(name,attrs)=>{const e=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));map.append(e);return e};
  make("rect",{x:0,y:0,width:1000,height:480,fill:"transparent"});
  for(let i=1;i<10;i++)make("line",{x1:i*100,y1:0,x2:i*100,y2:480,class:"gridline"});
  for(let i=1;i<6;i++)make("line",{x1:0,y1:i*80,x2:1000,y2:i*80,class:"gridline"});
  const b=data.bounds;
  const x=lon=>20+(lon-b.lomin)/(b.lomax-b.lomin)*960;
  const y=lat=>460-(lat-b.lamin)/(b.lamax-b.lamin)*440;
  for(let i=0;i<rows.length;i++){
   const r=rows[i],dot=make("circle",{cx:x(r.longitude),cy:y(r.latitude),r:5,class:"plane",tabindex:"0",role:"button","aria-label":r.callsign||r.icao24});
   dot.addEventListener("click",()=>select(i));
   dot.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(i)}});
  }
  const list=$("skyList");list.replaceChildren();
  for(let i=0;i<Math.min(60,rows.length);i++){
   const r=rows[i],button=document.createElement("button");button.type="button";
   button.dataset.index=i;button.setAttribute("aria-pressed","false");
   const strong=document.createElement("strong");strong.textContent=r.callsign||r.icao24||"Без позивна";
   const small=document.createElement("small");small.textContent=round(r.altitude_m," m")+" · "+round(r.speed_ms," m/s");
   button.append(strong,small);button.addEventListener("click",()=>select(i));list.append(button);
  }
  $("skyDetail").textContent=rows.length?"Избери маркер или самолет за техническите данни.":"Няма достъпни публични транспондерни позиции за тази зона в този момент.";
  $("skyStatus").textContent=data.source+" · "+rows.length+" aircraft · "+new Date(data.observed_at).toLocaleString(document.documentElement.lang||"en");
 }
 function select(i){
  const r=rows[i];if(!r)return;
  $("skyDetail").textContent=(r.callsign||r.icao24||"Неизвестна позивна")+" · ICAO "+r.icao24+" · "+r.latitude.toFixed(3)+"°, "+r.longitude.toFixed(3)+"° · височина "+round(r.altitude_m," m")+" · скорост "+round(r.speed_ms," m/s")+" · посока "+round(r.heading,"°")+(r.on_ground?" · на земята":"");
  $("skyList").querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.index)===i)));
 }
 async function load(){
  const region=$("skyRegion").value,generation=++requestGeneration;
  $("skyStatus").dataset.state="loading";$("skyStatus").textContent=window.AURORA_SUBPAGES?.text("loading")||"Loading…";$("refreshSky").disabled=true;
  try{
   const res=await fetch("/api/air-traffic?region="+encodeURIComponent(region),{cache:"no-store"});
   if(!res.ok)throw Error("unavailable");
   const data=await res.json();if(data.status!=="live"||!Array.isArray(data.aircraft))throw Error("invalid");
   if(generation!==requestGeneration)return;
   $("skyStatus").dataset.state="live";render(data);
  }catch{
   if(generation!==requestGeneration)return;
   rows=[];map.replaceChildren();$("skyList").replaceChildren();$("skyDetail").textContent="Няма потвърдени данни за показване.";
   $("skyStatus").dataset.state="error";
   $("skyStatus").textContent=window.AURORA_SUBPAGES?.text("offline")||"OpenSky unavailable";
  }finally{if(generation===requestGeneration)$("refreshSky").disabled=false}
 }
 $("skyRegion").addEventListener("change",load);$("refreshSky").addEventListener("click",load);load();
})();