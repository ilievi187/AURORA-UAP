/* AURORA GLOBE v1.3 — independent Canvas orthographic Earth renderer.
   Historical case markers are curated, approximate map anchors—not verified trajectories.
   No external runtime libraries, analytics, scraping, or live geolocation. */
"use strict";
(()=>{
  const $=selector=>document.querySelector(selector);
  const canvas=$("#caseGlobe");
  if(!canvas)return;
  const ctx=canvas.getContext("2d",{alpha:true});
  if(!ctx)return;
  const ui={
    shell:$("#globeShell"),pins:$("#globePins"),filter:$("#globeFilter"),list:$("#globeCaseList"),
    details:$("#globeDetail"),heading:$("#globeHeading"),rotate:$("#globeRotate"),
    left:$("#globeLeft"),right:$("#globeRight"),counter:$("#globeCount"),
    date:$("#globeCaseDate"),status:$("#globeCaseStatus"),title:$("#globeCaseTitle"),
    location:$("#globeCaseLocation"),summary:$("#globeCaseSummary"),
    precision:$("#globeCasePrecision"),source:$("#globeCaseSource")
  };
  const N=440, S=394, O=(N-S)/2, T_W=1280,T_H=640, RAD=S/2;
  canvas.width=canvas.height=N;
  const projected=document.createElement("canvas");projected.width=projected.height=S;
  const pctx=projected.getContext("2d",{alpha:true});
  const tex=document.createElement("canvas");tex.width=T_W;tex.height=T_H;
  const tctx=tex.getContext("2d",{willReadFrequently:true});
  const deg=Math.PI/180, tilt=19*deg;
  const cTilt=Math.cos(tilt),sTilt=Math.sin(tilt);
  const IDX=new Int32Array(S*S), U=new Float32Array(S*S), LIGHT=new Float32Array(S*S), RIM=new Float32Array(S*S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const i=y*S+x;
    const px=(x+.5-S/2)/RAD,py=(S/2-y-.5)/RAD;
    const rr=px*px+py*py;
    if(rr>=.999){IDX[i]=-1;continue}
    const z=Math.sqrt(1-rr);
    const phi=Math.asin(Math.max(-1,Math.min(1,py*cTilt+z*sTilt)));
    const delta=Math.atan2(px,z*cTilt-py*sTilt);
    const yi=Math.min(T_H-1,Math.max(0,Math.floor((.5-phi/Math.PI)*T_H)));
    IDX[i]=yi*T_W;
    U[i]=(delta/(2*Math.PI)+.5)*T_W;
    const illumination=.42+.55*(z*.7-px*.2+py*.28);
    LIGHT[i]=Math.max(.23,Math.min(1.08,illumination));
    RIM[i]=Math.max(0,(Math.sqrt(rr)-.80)*4.7);
  }
  const T={
    bg:{heading:"ДОКУМЕНТИРАНИ СЛУЧАИ",disclaimer:"Исторически свидетелства и документирани записи, не доказателства за извънземен произход. Маркерите показват приблизителен район, а не точна траектория.",filterLabel:"ФИЛТЪР",all:"Всички",lights:"Светлини",object:"Обекти",instrument:"Записи от прибори",official:"Официално документирани",explained:"С известно обяснение",pause:"Пауза",resume:"Върти",loading:"Зареждане на архива…",noResults:"Няма случаи за този филтър.",source:"ОТВОРИ ОРИГИНАЛНИЯ ИЗТОЧНИК",footer:"Подбрани и преразказани случаи; без копирани статии или изображения.",prec:"Маркерът е приблизителен",reported:"СВИДЕТЕЛСКИ СИГНАЛ",official_record:"ДОКУМЕНТИРАН ЗАПИС",explained_status:"ИЗВЕСТНО ОБЯСНЕНИЕ",dateNote:"Дата",locationNote:"Район",count:"случая"},
    en:{heading:"DOCUMENTED CASES",disclaimer:"Historical reports and documented recordings—not proof of extraterrestrial origin. Markers indicate approximate regions, not exact flight paths.",filterLabel:"FILTER",all:"All",lights:"Lights",object:"Objects",instrument:"Instrument recordings",official:"Officially documented",explained:"Known explanation",pause:"Pause",resume:"Rotate",loading:"Loading sourced cases…",noResults:"No cases match this filter.",source:"OPEN ORIGINAL SOURCE",footer:"Cases are selected and paraphrased; no copied articles or photographs.",prec:"Approximate map anchor",reported:"WITNESS REPORT",official_record:"DOCUMENTED RECORD",explained_status:"KNOWN EXPLANATION",dateNote:"Date",locationNote:"Area",count:"cases"},
    de:{heading:"DOKUMENTIERTE FÄLLE",disclaimer:"Historische Berichte und Aufnahmen sind kein Beweis für außerirdischen Ursprung. Markierungen zeigen nur ungefähre Regionen.",filterLabel:"FILTER",all:"Alle",lights:"Lichter",object:"Objekte",instrument:"Instrumentaufnahmen",official:"Amtlich dokumentiert",explained:"Bekannte Erklärung",pause:"Pause",resume:"Drehen",loading:"Fälle werden geladen…",noResults:"Keine Treffer.",source:"ORIGINALQUELLE ÖFFNEN",footer:"Ausgewählte, eigenständig zusammengefasste Berichte mit Quellen.",prec:"Ungefähre Position",reported:"ZEUGENBERICHT",official_record:"DOKUMENTIERTE AUFNAHME",explained_status:"BEKANNTE ERKLÄRUNG",dateNote:"Datum",locationNote:"Region",count:"Fälle"},
    ru:{heading:"ДОКУМЕНТИРОВАННЫЕ СЛУЧАИ",disclaimer:"Исторические сообщения и записи не доказывают внеземное происхождение. Точки лишь показывают примерный район.",filterLabel:"ФИЛЬТР",all:"Все",lights:"Огни",object:"Объекты",instrument:"Записи приборов",official:"Официальные записи",explained:"Есть объяснение",pause:"Пауза",resume:"Вращать",loading:"Загрузка дел…",noResults:"Нет подходящих случаев.",source:"ОТКРЫТЬ ПЕРВОИСТОЧНИК",footer:"Авторские пересказы с указанием источников.",prec:"Примерная точка",reported:"СВИДЕТЕЛЬСКОЕ СООБЩЕНИЕ",official_record:"ДОКУМЕНТАЛЬНАЯ ЗАПИСЬ",explained_status:"ИЗВЕСТНО ОБЪЯСНЕНИЕ",dateNote:"Дата",locationNote:"Регион",count:"случаев"},
    "zh-CN":{heading:"有来源的历史案例",disclaimer:"历史报告和已公布的影像并非外星来源的证据。标记仅表示近似区域。",filterLabel:"筛选",all:"全部",lights:"光点",object:"物体",instrument:"仪器影像",official:"官方记录",explained:"已有解释",pause:"暂停",resume:"旋转",loading:"正在加载案例…",noResults:"没有符合条件的案例。",source:"查看原始来源",footer:"案例内容均为原创摘要，附有来源链接。",prec:"近似地图位置",reported:"目击报告",official_record:"正式记录",explained_status:"已有解释",dateNote:"日期",locationNote:"区域",count:"个案例"}
  };
  let cases=[],land=[],filtered=[],selected=null,texturePixels=null,pinNodes=new Map();
  let lon=-15,paused=false,temporaryPause=0,wasVisible=false,raf=0,last=0,initialized=false;
  const prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  const l=()=>T[document.documentElement.lang]||T.en;
  const localized=o=>o?.[document.documentElement.lang]||o?.en||"";
  const validUrl=url=>{try{const a=new URL(url);return a.protocol==="https:"&&["nuforc.org","www.nationalarchives.gov.uk","www.abc.net.au","realufo.org","www.defense.gov","www.af.mil"].includes(a.hostname)}catch{return false}};
  function texture(){
    const g=tctx.createLinearGradient(0,0,0,T_H);g.addColorStop(0,"#082a38");g.addColorStop(.4,"#0a3642");g.addColorStop(1,"#061d34");
    tctx.fillStyle=g;tctx.fillRect(0,0,T_W,T_H);
    // Ocean currents / bathymetric field: original procedural visual design, not geophysical data.
    for(let i=0;i<180;i++){
      const xx=(i*719)%T_W,yy=(i*199)%T_H;
      tctx.strokeStyle="rgba(67,192,190,.07)";tctx.beginPath();
      tctx.ellipse(xx,yy,25+(i%7)*16,7+(i%5)*4,-.17,0,Math.PI*2);tctx.stroke();
    }
    tctx.fillStyle="#28776d";tctx.strokeStyle="rgba(136,240,205,.35)";tctx.lineWidth=.7;
    for(const poly of land){
      if(poly.length<3)continue;
      tctx.beginPath();let prev=null,moved=false;
      for(const pair of poly){
        const x=(pair[0]+180)/360*T_W,y=(90-pair[1])/180*T_H;
        if(prev!==null&&Math.abs(x-prev)>T_W*.5){tctx.closePath();tctx.fill();tctx.beginPath();moved=false}
        if(!moved){tctx.moveTo(x,y);moved=true}else tctx.lineTo(x,y);
        prev=x;
      }
      if(moved){tctx.closePath();tctx.fill();tctx.stroke()}
    }
    // Slight land texture depth to avoid flat/cartoon appearance.
    const id=tctx.getImageData(0,0,T_W,T_H),p=id.data;
    for(let y=0;y<T_H;y++)for(let x=0;x<T_W;x++){
      const i=(y*T_W+x)*4;
      const jitter=(((x*37+y*59)^(x*y*11))&15)-8;
      p[i]=Math.max(0,p[i]+jitter*.9);
      p[i+1]=Math.max(0,p[i+1]+jitter*1.3);
      p[i+2]=Math.max(0,p[i+2]+jitter);
    }
    tctx.putImageData(id,0,0);
    texturePixels=tctx.getImageData(0,0,T_W,T_H).data;
  }
  function sphere(){
    if(!texturePixels)return;
    const img=pctx.createImageData(S,S),dst=img.data;
    const shift=Math.round((lon/360)*T_W),tw=T_W,src=texturePixels;
    for(let i=0;i<IDX.length;i++){
      const di=i*4;
      if(IDX[i]<0){dst[di+3]=0;continue}
      const u=((Math.floor(U[i])+shift)%tw+tw)%tw;
      const si=(IDX[i]+u)*4,shade=LIGHT[i],rim=RIM[i]*13;
      dst[di]=Math.min(255,src[si]*shade+rim);
      dst[di+1]=Math.min(255,src[si+1]*shade+rim*1.4);
      dst[di+2]=Math.min(255,src[si+2]*shade+rim*1.8);
      dst[di+3]=255;
    }
    pctx.putImageData(img,0,0);
    ctx.clearRect(0,0,N,N);
    ctx.save();
    ctx.shadowBlur=43;ctx.shadowColor="#49edf0a0";ctx.strokeStyle="#88fffa77";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(N/2,N/2,RAD,0,Math.PI*2);ctx.stroke();ctx.restore();
    ctx.drawImage(projected,O,O);
    // Atmospheric edge and subtle instrumentation.
    const halo=ctx.createRadialGradient(N/2,N/2,RAD*.7,N/2,N/2,RAD*1.06);
    halo.addColorStop(0,"#8fffff00");halo.addColorStop(.7,"#a4ffff00");halo.addColorStop(.94,"#62eff32b");halo.addColorStop(1,"#9cffff00");
    ctx.fillStyle=halo;ctx.fillRect(O-16,O-16,S+32,S+32);
    ctx.strokeStyle="#9df0ed46";ctx.lineWidth=.8;ctx.setLineDash([3,9]);
    ctx.beginPath();ctx.arc(N/2,N/2,RAD*1.045,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  }
  function point(lat,lng){
    const phi=lat*deg,theta=((lng-lon+540)%360-180)*deg;
    const x=Math.cos(phi)*Math.sin(theta);
    const y=Math.sin(phi)*cTilt-Math.cos(phi)*Math.cos(theta)*sTilt;
    const z=Math.sin(phi)*sTilt+Math.cos(phi)*Math.cos(theta)*cTilt;
    return {x:50+x*RAD/N*100,y:50-y*RAD/N*100,visible:z>.055};
  }
  function updatePins(){
    for(const c of filtered){
      const b=pinNodes.get(c.id);
      if(!b)continue;
      const p=point(c.lat,c.lng);
      b.hidden=!p.visible;
      if(p.visible){b.style.left=p.x+"%";b.style.top=p.y+"%"}
    }
    ui.heading.textContent=String((lon+360)%360|0).padStart(3,"0")+"°";
  }
  function matches(c,type){
    return type==="all"||c.category===type||c.status===type;
  }
  function renderList(){
    ui.list.replaceChildren();
    pinNodes.clear();ui.pins.replaceChildren();
    for(const c of filtered){
      const b=document.createElement("button");b.type="button";b.className="atlas-case";
      b.setAttribute("aria-current",String(c.id===selected));
      b.dataset.caseId=c.id;
      const top=document.createElement("span");top.className="atlas-case-top";
      const yr=document.createElement("span");yr.textContent=c.date;
      const code=document.createElement("span");code.textContent=c.country;
      top.append(yr,code);
      const name=document.createElement("strong");name.className="atlas-case-title";name.textContent=localized(c.title);
      const place=document.createElement("span");place.className="atlas-case-place";place.textContent=localized(c.city);
      b.append(top,name,place);b.addEventListener("click",()=>select(c.id,true));
      ui.list.append(b);
      const pin=document.createElement("button");pin.type="button";pin.className="globe-pin";
      pin.textContent="·";pin.title=localized(c.title);
      pin.setAttribute("aria-label",localized(c.title)+" — "+localized(c.city));
      pin.setAttribute("aria-pressed",String(c.id===selected));
      pin.addEventListener("click",()=>select(c.id,true));
      pinNodes.set(c.id,pin);ui.pins.append(pin);
    }
    ui.counter.textContent=filtered.length+" "+l().count;
    updatePins();
  }
  function select(id,orient){
    const c=filtered.find(x=>x.id===id);
    if(!c)return;
    selected=c.id;
    if(orient){lon=c.lng;temporaryPause=performance.now()+9000;sphere()}
    ui.date.textContent=c.date;
    ui.title.textContent=localized(c.title);
    ui.location.textContent=localized(c.city)+" · "+c.country;
    ui.summary.textContent=localized(c.summary);
    ui.precision.textContent=l().prec+": "+c.location_precision;
    ui.status.textContent=c.status==="explained"?l().explained_status:c.status==="official_record"?l().official_record:l().reported;
    ui.status.dataset.status=c.status;
    ui.source.hidden=!validUrl(c.source?.url);
    if(!ui.source.hidden)ui.source.href=c.source.url;
    ui.list.querySelectorAll(".atlas-case").forEach(btn=>btn.setAttribute("aria-current",String(btn.dataset.caseId===id)));
    for(const [key,pin] of pinNodes)pin.setAttribute("aria-pressed",String(key===id));
    updatePins();
  }
  function applyFilter(){
    filtered=cases.filter(c=>matches(c,ui.filter.value));
    if(!filtered.some(c=>c.id===selected))selected=filtered[0]?.id||null;
    renderList();
    if(selected)select(selected,false);
    else{
      ui.title.textContent=l().noResults;ui.summary.textContent="";ui.location.textContent="";
      ui.precision.textContent="";ui.source.hidden=true;
    }
  }
  function updateLanguage(){
    const trans=l();
    document.querySelectorAll("[data-globe-t]").forEach(el=>{
      const key=el.dataset.globeT;
      if(key==="pause"&&paused){el.textContent=trans.resume}
      else if(key!=="loading"&&trans[key])el.textContent=trans[key];
    });
    ui.rotate.setAttribute("aria-label",paused?trans.resume:trans.pause);
    if(cases.length)applyFilter();
  }
  function tick(time){
    raf=0;
    if(document.hidden||!wasVisible)return;
    if(time-last<65){raf=requestAnimationFrame(tick);return}
    const dt=Math.min(time-last,150);last=time;
    if(!prefersReduced.matches&&!paused&&time>temporaryPause)lon=((lon+dt*.0036+540)%360)-180;
    sphere();updatePins();
    if(!prefersReduced.matches)raf=requestAnimationFrame(tick);
  }
  function run(){
    cancelAnimationFrame(raf);raf=0;last=performance.now();sphere();updatePins();
    if(wasVisible&&!document.hidden&&!prefersReduced.matches)raf=requestAnimationFrame(tick);
  }
  ui.rotate.addEventListener("click",()=>{
    paused=!paused;ui.rotate.setAttribute("aria-pressed",String(paused));
    ui.rotate.firstChild.textContent=paused?"▶ ":"Ⅱ ";
    updateLanguage();run();
  });
  function shift(amount){lon=((lon+amount+540)%360)-180;temporaryPause=performance.now()+9000;run()}
  ui.left.addEventListener("click",()=>shift(-22));
  ui.right.addEventListener("click",()=>shift(22));
  ui.filter.addEventListener("change",applyFilter);
  ui.shell.addEventListener("keydown",event=>{
    if(event.key==="ArrowLeft"||event.key==="ArrowRight"){
      event.preventDefault();shift(event.key==="ArrowLeft"?-10:10);
    }
  });
  let drag=null;
  ui.shell.addEventListener("pointerdown",event=>{
    if(event.target.closest("button"))return;
    drag={x:event.clientX,lon};ui.shell.setPointerCapture(event.pointerId);
  });
  ui.shell.addEventListener("pointermove",event=>{
    if(!drag)return;
    lon=((drag.lon-(event.clientX-drag.x)*.35+540)%360)-180;
    temporaryPause=performance.now()+9000;run();
  });
  function stopDrag(){drag=null}
  ui.shell.addEventListener("pointerup",stopDrag);ui.shell.addEventListener("pointercancel",stopDrag);
  document.addEventListener("visibilitychange",run);
  prefersReduced.addEventListener?.("change",run);
  new MutationObserver(()=>updateLanguage()).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  if("IntersectionObserver" in window){
    new IntersectionObserver(entries=>{wasVisible=entries[0]?.isIntersecting||false;run()},{threshold:0}).observe(ui.shell);
  }else wasVisible=true;
  async function load(){
    updateLanguage();
    const [geoRes,caseRes]=await Promise.all([
      fetch("data/earth-land.json",{cache:"force-cache"}),
      fetch("data/cases.json",{cache:"no-cache"})
    ]);
    if(!caseRes.ok)throw Error("Cases HTTP "+caseRes.status);
    const dataset=await caseRes.json();
    cases=(Array.isArray(dataset.cases)?dataset.cases:[]).filter(c=>
      typeof c.id==="string"&&Number.isFinite(c.lat)&&Number.isFinite(c.lng)&&
      c.lat>=-90&&c.lat<=90&&c.lng>=-180&&c.lng<=180&&
      c.title?.en&&c.summary?.en&&validUrl(c.source?.url));
    if(geoRes.ok){
      const geo=await geoRes.json();
      if(Array.isArray(geo.polygons))land=geo.polygons;
    }
    texture();initialized=true;
    applyFilter();run();
  }
  load().catch(error=>{
    console.warn("AURORA case atlas: unable to load sourced dataset",error);
    texture();run();
    ui.summary.textContent=document.documentElement.lang==="bg"?"Архивът не е достъпен в момента. Опитай да презаредиш страницата.":"Archive unavailable. Please refresh the page.";
    ui.title.textContent="AURORA / ATLAS OFFLINE";
  });
})();
