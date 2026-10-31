/* Actual source-verified video in the dossier's TOP illustration area.
 * Click-to-load; original sources are always available; no autoplay. */
(function(root){
 "use strict";
 const $=id=>document.getElementById(id);
 let revision=0,player=null,mediaImport=null,selectedMedia=null,selectedPlayback=null;
 const words=lang=>lang==="bg"?{
  available:"ПУБЛИКУВАН ВИДЕОЗАПИС",check:"Проверка на наличния плейър…",
  play:"▶ ГЛЕДАЙ ОРИГИНАЛНОТО ВИДЕО",close:"Затвори видеото",
  original:"Оригинален източник ↗",notSupported:"Видеозаписът е достъпен при оригиналния издател, но не може да се възпроизведе директно тук.",
  loading:"Зареждане на видеозаписа…",ready:"Видеото е готово. Използвай контролите за пускане.",
  iframe:"Плейърът е зареден. Ако издателят блокира възпроизвеждането, отвори оригиналния източник.",
  error:"Видеото не може да се зареди тук. Използвай оригиналния източник."
 }:{
  available:"PUBLISHED SOURCE VIDEO",check:"Checking available player…",
  play:"▶ WATCH ORIGINAL VIDEO",close:"Close video",
  original:"Open original source ↗",notSupported:"The source video is available from the publisher, but cannot be played directly on AURORA.",
  loading:"Loading source video…",ready:"Video ready. Use playback controls.",
  iframe:"Player loaded. If the publisher blocks playback, open the original source.",
  error:"Video cannot load here. Open the original source."
 };
 const safeUrl=u=>{try{const x=new URL(u);return x.protocol==="https:"&&!x.username&&!x.password&&!x.port?x.href:null}catch{return null}};
 const title=(value,lang)=>typeof value==="string"?value:typeof value==="object"?value?.[lang]||value?.en||value?.bg||"":""; 
 function stop(){
  if(player?.tagName==="VIDEO"){
   try{player.pause();player.removeAttribute("src");player.load()}catch{}
  }else if(player?.tagName==="IFRAME")player.removeAttribute("src");
  player=null;
  $("caseHeroStage")?.replaceChildren();
  $("caseHeroClose").hidden=true;
 }
 async function render({caseRecord,lang}){
  revision++;const token=revision,w=words(lang);
  stop();selectedMedia=null;selectedPlayback=null;
  const box=$("caseVisual"),img=$("caseVisualImage"),caption=$("caseVisualCaption");
  const hero=$("caseHeroPlayback"),button=$("caseHeroPlay"),close=$("caseHeroClose");
  const status=$("caseHeroStatus"),link=$("caseHeroSource");
  const videos=(Array.isArray(caseRecord?.media)?caseRecord.media:[])
   .filter(m=>m?.type==="video"&&safeUrl(m.url)&&m.private!==true&&m.public!==false);
  // A graphic with a baked-in ▶ should never pose as an actual video player.
  if(!videos.length){
   hero.hidden=true;box.classList.remove("case-visual-video");return;
  }
  box.hidden=false;box.classList.add("case-visual-video");
  img.hidden=true;caption.hidden=true;hero.hidden=false;
  button.hidden=true;close.hidden=true;
  $("caseHeroKicker").textContent=w.available;
  status.textContent=w.check;
  const first=videos[0],source=safeUrl(first.url);
  link.href=source;link.textContent=w.original;link.hidden=false;
  try{
   mediaImport??=import("/media-player.js");
   const module=await mediaImport;
   if(token!==revision)return;
   const candidate=videos.map(media=>({media,playback:module.resolveMediaPlayback(media)})).find(x=>x.playback);
   if(!candidate){
    status.textContent=w.notSupported;
    return;
   }
   selectedMedia=candidate.media;selectedPlayback=candidate.playback;
   const original=safeUrl(candidate.playback.originalUrl)||safeUrl(candidate.media.url);
   link.href=original;
   status.textContent="";
   button.hidden=false;
   button.textContent=w.play;
   button.setAttribute("aria-label",w.play+" · "+title(candidate.media.title,lang));
  }catch{
   if(token===revision)status.textContent=w.notSupported;
  }
 }
 function attach(){
  const button=$("caseHeroPlay"),close=$("caseHeroClose");
  if(!button||!close)return;
  button.addEventListener("click",()=>{
   if(!selectedPlayback||player)return;
   const w=words(document.documentElement.lang);
   const stage=$("caseHeroStage"),status=$("caseHeroStatus");
   stage.replaceChildren();button.hidden=true;close.hidden=false;
   status.textContent=w.loading;
   const playback=selectedPlayback,media=selectedMedia;
   if(playback.kind==="html5"){
    const v=document.createElement("video");
    v.className="case-hero-media";
    v.controls=true;v.preload="metadata";v.playsInline=true;
    v.setAttribute("aria-label",title(media.title,document.documentElement.lang)||"Source video");
    v.addEventListener("loadedmetadata",()=>{if(player===v)status.textContent=w.ready},{once:true});
    v.addEventListener("error",()=>{if(player===v)status.textContent=w.error});
    stage.append(v);player=v;v.src=playback.mediaUrl;
   }else if(playback.kind==="iframe"){
    const frame=document.createElement("iframe");
    frame.className="case-hero-media";frame.title=title(media.title,document.documentElement.lang)||"Original source video";
    frame.allowFullscreen=true;
    frame.allow="encrypted-media; picture-in-picture; fullscreen";
    frame.referrerPolicy="strict-origin-when-cross-origin";
    frame.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");
    frame.addEventListener("load",()=>{if(player===frame)status.textContent=w.iframe},{once:true});
    frame.addEventListener("error",()=>{if(player===frame)status.textContent=w.error},{once:true});
    stage.append(frame);player=frame;frame.src=playback.embedUrl;
   }else{button.hidden=false;close.hidden=true;status.textContent=w.error;return}
   close.focus();
  });
  close.addEventListener("click",()=>{
   stop();const w=words(document.documentElement.lang);
   $("caseHeroPlay").hidden=!selectedPlayback;
   $("caseHeroStatus").textContent="";
   if(selectedPlayback)button.focus();
  });
  window.addEventListener("pagehide",stop);
 }
 attach();
 root.AURORA_DOSSIER_HERO={render,stop};
})(globalThis);
