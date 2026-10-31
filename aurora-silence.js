/* AURORA / SILENCE — truthful public-archive snapshot + discreet parallax.
 * No invented telemetry, tracking endpoints, session polling or external assets. */
"use strict";
(()=>{
 const hero=document.getElementById("silenceHero");
 if(!hero)return;
 const counters={
  cases:document.getElementById("auroraArchiveCount"),
  mapped:document.getElementById("auroraMappedCount")
 };
 const copy={
  bg:{cases:"АРХИВНИ СЛУЧАИ",mapped:"НА КАРТАТА",languages:"ЕЗИКА",open:"ОТВОРЕН АРХИВ",openValue:"ОТВОРЕН"},
  en:{cases:"ARCHIVED CASES",mapped:"GEOLOCATED",languages:"LANGUAGES",open:"PUBLIC ARCHIVE",openValue:"OPEN"},
  de:{cases:"ARCHIVIERTE FÄLLE",mapped:"AUF DER KARTE",languages:"SPRACHEN",open:"OFFENES ARCHIV",openValue:"OFFEN"},
  ru:{cases:"СЛУЧАЕВ В АРХИВЕ",mapped:"НА КАРТЕ",languages:"ЯЗЫКОВ",open:"ОТКРЫТЫЙ АРХИВ",openValue:"ОТКРЫТ"},
  "zh-CN":{cases:"档案案例",mapped:"地图位置",languages:"种语言",open:"公开档案",openValue:"开放"},
  fr:{cases:"CAS ARCHIVÉS",mapped:"GÉOLOCALISÉS",languages:"LANGUES",open:"ARCHIVES OUVERTES",openValue:"OUVERT"},
  es:{cases:"CASOS ARCHIVADOS",mapped:"EN EL MAPA",languages:"IDIOMAS",open:"ARCHIVO ABIERTO",openValue:"ABIERTO"},
  it:{cases:"CASI ARCHIVIATI",mapped:"SULLA MAPPA",languages:"LINGUE",open:"ARCHIVIO APERTO",openValue:"APERTO"},
  pt:{cases:"CASOS ARQUIVADOS",mapped:"NO MAPA",languages:"IDIOMAS",open:"ARQUIVO ABERTO",openValue:"ABERTO"},
  tr:{cases:"ARŞİV VAKALARI",mapped:"HARİTALANDI",languages:"DİL",open:"AÇIK ARŞİV",openValue:"AÇIK"},
  ro:{cases:"CAZURI ARHIVATE",mapped:"PE HARTĂ",languages:"LIMBI",open:"ARHIVĂ DESCHISĂ",openValue:"DESCHIS"},
  el:{cases:"ΑΡΧΕΙΟΘΕΤΗΜΕΝΑ",mapped:"ΣΤΟΝ ΧΑΡΤΗ",languages:"ΓΛΩΣΣΕΣ",open:"ΑΝΟΙΧΤΟ ΑΡΧΕΙΟ",openValue:"ΑΝΟΙΧΤΟ"},
  sr:{cases:"АРХИВИРАНИ СЛУЧАЈЕВИ",mapped:"НА МАПИ",languages:"ЈЕЗИКА",open:"ОТВОРЕНА АРХИВА",openValue:"ОТВОРЕНО"},
  uk:{cases:"АРХІВНІ ВИПАДКИ",mapped:"НА КАРТІ",languages:"МОВ",open:"ВІДКРИТИЙ АРХІВ",openValue:"ВІДКРИТО"},
  pl:{cases:"PRZYPADKI W ARCHIWUM",mapped:"NA MAPIE",languages:"JĘZYKÓW",open:"OTWARTE ARCHIWUM",openValue:"OTWARTE"},
  ar:{cases:"حالات الأرشيف",mapped:"على الخريطة",languages:"لغة",open:"أرشيف مفتوح",openValue:"مفتوح"},
  ja:{cases:"アーカイブ事例",mapped:"地図に掲載",languages:"言語",open:"公開アーカイブ",openValue:"公開"},
  ko:{cases:"보관된 사례",mapped:"지도에 표시",languages:"언어",open:"공개 자료실",openValue:"공개"}
 };
 function updateLabels(){
  const lang=document.documentElement.lang||"bg";
  const set=copy[lang]||copy.en;
  hero.querySelectorAll("[data-stat-label]").forEach(el=>{
   const key=el.dataset.statLabel;if(set[key])el.textContent=set[key];
  });
 }
 updateLabels();
 const observer=new MutationObserver(updateLabels);
 observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 function hasMapAnchor(record){
  return Number.isFinite(record?.lat)&&Number.isFinite(record?.lng)&&
    record.lat>=-90&&record.lat<=90&&record.lng>=-180&&record.lng<=180;
 }
 async function refreshArchiveStats(){
  try{
   const response=await fetch("/data/cases.json",{cache:"no-cache"});
   if(!response.ok)throw new Error("archive status "+response.status);
   const data=await response.json();
   if(!Array.isArray(data.cases))throw new Error("no public case collection");
   const filtered=data.cases.filter(c=>c&&typeof c.id==="string");
   counters.cases.textContent=String(filtered.length);
   counters.mapped.textContent=String(filtered.filter(hasMapAnchor).length);
   hero.dataset.stats="sourced";
  }catch(_){
   counters.cases.textContent="—";
   counters.mapped.textContent="—";
   hero.dataset.stats="unavailable";
  }
 }
 refreshArchiveStats();
 // Tiny decorative movement only; no scroll lock, GPU loop or overlaid controls.
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
 const ship=hero.querySelector(".silence-ship");
 if(ship&&window.matchMedia("(pointer:fine)").matches&&!reduced.matches){
  hero.addEventListener("pointermove",event=>{
   const rect=hero.getBoundingClientRect();
   const x=(event.clientX-rect.left)/Math.max(rect.width,1)-.5;
   const y=(event.clientY-rect.top)/Math.max(rect.height,1)-.5;
   ship.style.setProperty("--silence-shift-x",(-x*9).toFixed(1)+"px");
   ship.style.setProperty("--silence-shift-y",(-y*6).toFixed(1)+"px");
  },{passive:true});
  hero.addEventListener("pointerleave",()=>{
   ship.style.removeProperty("--silence-shift-x");
   ship.style.removeProperty("--silence-shift-y");
  });
 }
})();
