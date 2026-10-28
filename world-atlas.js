/* AURORA WORLD ATLAS — all case locations shown at once. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id),canvas=$("worldMapCanvas"),pinHost=$("worldMapPins");
 if(!canvas||!pinHost)return;
 const ctx=canvas.getContext("2d"),W=1000,H=500;
 canvas.width=W;canvas.height=H;
 let base=[],approved=[],current=[],country="",selected=null;
 const lang=()=>document.documentElement.lang==="bg"?"bg":"en";
 const local=(v)=>v?.[document.documentElement.lang]||v?.en||v?.bg||"";
 const toX=lon=>(lon+180)/360*W,toY=lat=>(90-lat)/180*H;
 const valid=c=>typeof c.id==="string"&&Number.isFinite(c.lat)&&Number.isFinite(c.lng)&&Math.abs(c.lat)<=90&&Math.abs(c.lng)<=180&&c.title?.en;
 const safe=u=>{try{const x=new URL(u);return x.protocol==="https:"&&!x.username&&!x.password}catch{return false}};
 function paint(land){
  const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#092d40");grad.addColorStop(.5,"#0c3948");grad.addColorStop(1,"#072332");
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle="#47798b66";ctx.lineWidth=.7;
  for(let x=0;x<=W;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
  for(let y=0;y<=H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  ctx.fillStyle="#1d6c6c";ctx.strokeStyle="#8cdbc186";ctx.lineWidth=.65;
  for(const poly of land){
    if(!Array.isArray(poly)||poly.length<3)continue;
    let last=null,started=false;
    ctx.beginPath();
    for(const p of poly){
      if(!Array.isArray(p)||p.length<2)continue;
      const x=toX(p[0]),y=toY(p[1]);
      if(last!==null&&Math.abs(x-last)>W/2){ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();started=false}
      if(!started){ctx.moveTo(x,y);started=true}else ctx.lineTo(x,y);
      last=x;
    }
    if(started){ctx.closePath();ctx.fill();ctx.stroke()}
  }
 }
 function refresh(){
  const byId=new Map();
  for(const c of base)byId.set(c.id,c);
  for(const c of approved)byId.set(c.id,c);
  current=[...byId.values()].filter(c=>!country||c.country===country).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  pinHost.replaceChildren();
  $("worldMapCount").textContent=current.length;
  for(const c of current){
   const b=document.createElement("button");
   b.type="button";b.style.left=(toX(c.lng)/W*100)+"%";b.style.top=(toY(c.lat)/H*100)+"%";
   b.title=local(c.title);b.setAttribute("aria-label",local(c.title)+" — "+local(c.city));
   b.setAttribute("aria-pressed",String(selected===c.id));
   b.addEventListener("click",()=>{selected=c.id;choose()});
   pinHost.append(b);
  }
  if(!current.some(c=>c.id===selected))selected=current[0]?.id||null;
  choose();
 }
 function choose(){
  const c=current.find(x=>x.id===selected),d=$("worldCaseDetail");
  if(!c){d.replaceChildren();d.textContent="—";return}
  const tag=document.createElement("span");tag.className="world-tag";tag.textContent=c.country+" · "+c.date;
  const h=document.createElement("h3");h.textContent=local(c.title);
  const p=document.createElement("p");p.textContent=local(c.summary);
  const a=document.createElement("a");a.href=(c.recordOrigin==="d1"?"/cases/":"/archive/")+encodeURIComponent(c.id);
  a.textContent=window.AURORA_UI?.label("readCase")||(lang()==="bg"?"ПРОЧЕТИ ЦЯЛОТО ДОСИЕ ↗":"READ FULL CASE FILE ↗");
  d.replaceChildren(tag,h,p,a);
  [...pinHost.children].forEach((b,i)=>b.setAttribute("aria-pressed",String(current[i].id===selected)));
 }
 function filters(){
  const drop=$("worldCountry"),old=drop.value,codes=[...new Set([...base,...approved].map(c=>c.country))].filter(c=>/^[A-Z]{2}$/.test(c)).sort();
  drop.length=1;
  let display;try{display=new Intl.DisplayNames([document.documentElement.lang,"en"],{type:"region"})}catch{}
  for(const code of codes){
   const option=document.createElement("option");option.value=code;option.textContent=(display?.of(code)||code)+" · "+code;drop.append(option);
  }
  drop.value=codes.includes(old)?old:"";
 }
 async function start(){
  // Self-hosted case data is the default data layer; never requires a manual refresh.
  const results=await Promise.allSettled([
   fetch("/data/cases.json",{cache:"force-cache"}).then(async r=>{if(!r.ok)throw Error("cases");return r.json()}),
   fetch("/data/earth-land.json",{cache:"force-cache"}).then(async r=>{if(!r.ok)throw Error("land");return r.json()})
  ]);
  paint(results[1].status==="fulfilled"&&Array.isArray(results[1].value?.polygons)?results[1].value.polygons:[]);
  if(results[0].status!=="fulfilled"){$("worldMapState").textContent="Archive temporarily unavailable";return}
  base=(results[0].value.cases||[]).filter(valid).map(c=>({...c,recordOrigin:"archive"}));
  filters();refresh();
  $("worldMapState").textContent=(lang()==="bg"?"Заредени ":"Loaded ")+base.length+(lang()==="bg"?" архивни досиета":" historical case files");
  try{
   const r=await fetch("/api/stats",{cache:"no-store"});if(!r.ok)return;
   const stats=await r.json();if(stats.includes_demo!==false)return;
   const res=await fetch("/api/cases?limit=250",{cache:"no-store"});if(!res.ok)return;
   const data=await res.json();
   approved=(data.cases||[]).filter(valid).map(c=>({...c,recordOrigin:"d1"}));
   filters();refresh();
  }catch{/* preserve sourced atlas when registry is unavailable */}
 }
 $("worldCountry").addEventListener("change",e=>{country=e.target.value;selected=null;refresh()});
 new MutationObserver(()=>{filters();refresh()}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 start();
})();
