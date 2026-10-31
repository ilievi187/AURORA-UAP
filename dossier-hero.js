/* Actual source-verified video in the dossier's TOP illustration area.
 * Click-to-load; original sources are always available; no autoplay. */
(function(root){
 "use strict";
 const $=id=>document.getElementById(id);
 let revision=0,player=null,mediaImport=null,playerModule=null,selectedMedia=null,selectedPlayback=null;
 const words=lang=>{
 const base=lang==="bg"?{
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
 // Preserve the established Bulgarian/English labels while extending the other locales.
 const copy=(lang==="bg"||lang==="en")?null:playerModule?.mediaWordsFor?.(lang);
 return copy?{...base,
  available:copy.fallbackTitle.toUpperCase(),
  check:copy.iframeLoading,
  play:"▶ "+copy.play.toUpperCase(),
  close:copy.close,
  original:copy.original+" ↗",
  notSupported:copy.iframeError,
  loading:copy.videoLoading,
  ready:copy.videoReady,
  iframe:copy.iframeReady,
  error:copy.videoError
 }:base;
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
  revision++;const token=revision;let w=words(lang);
  stop();selectedMedia=null;selectedPlayback=null;
  const box=$("caseVisual"),img=$("caseVisualImage"),caption=$("caseVisualCaption");
  const hero=$("caseHeroPlayback"),button=$("caseHeroPlay"),close=$("caseHeroClose");
  const status=$("caseHeroStatus"),link=$("caseHeroSource");
  const playlist=$("caseHeroPlaylist"),poster=$("caseHeroPoster");
  playlist.replaceChildren();playlist.hidden=true;
  poster.src="/assets/media-ufo-earth-preview.svg";poster.dataset.actualFrame="false";
  const videos=(Array.isArray(caseRecord?.media)?caseRecord.media:[])
   .filter(m=>m?.type==="video"&&safeUrl(m.url)&&m.private!==true&&m.public!==false);
  // A graphic with a baked-in ▶ should never pose as an actual video player.
  if(!videos.length){
   hero.hidden=true;box.classList.remove("case-visual-video");return;
  }
  box.hidden=false;box.classList.add("case-visual-video");
  img.hidden=true;caption.hidden=true;hero.hidden=false;
  button.hidden=true;close.hidden=true;close.textContent=w.close+" ×";close.setAttribute("aria-label",w.close);
  $("caseHeroKicker").textContent=w.available;
  status.textContent=w.check;
  const first=videos[0],source=safeUrl(first.url);
  link.href=source;link.textContent=w.original;link.hidden=false;
  try{
   mediaImport??=import("/media-player.js");
   const module=await mediaImport;
   if(token!==revision)return;
   playerModule=module;
   w=words(lang);
   $("caseHeroKicker").textContent=w.available;
   close.textContent=w.close+" ×";close.setAttribute("aria-label",w.close);
   link.textContent=w.original;status.textContent=w.check;
   const candidates=videos.map(media=>({media,playback:module.resolveMediaPlayback(media)})).filter(x=>x.playback);
   if(!candidates.length){
    status.textContent=w.notSupported;
    return;
   }
   const controls=[];
   function select(item,chosen){
    stop();selectedMedia=item.media;selectedPlayback=item.playback;
    link.href=safeUrl(item.playback.originalUrl)||safeUrl(item.media.url);
    status.textContent="";button.hidden=false;button.textContent=w.play;
    button.setAttribute("aria-label",w.play+" · "+title(item.media.title,lang));
    const thumbnail=module.resolveVideoPoster(item.media);
    poster.src=thumbnail||"/assets/media-ufo-earth-preview.svg";
    poster.dataset.actualFrame=thumbnail?"true":"false";
    poster.alt=thumbnail?("Published video thumbnail · "+title(item.media.title,lang)):
      (lang==="bg"?"Тематичен преглед, не кадър от наблюдението":"Decorative preview, not an incident frame");
    for(const {control,entry} of controls)control.setAttribute("aria-pressed",String(entry===item));
    if(chosen)button.focus();
   }
   if(candidates.length>1){
    playlist.hidden=false;
    const intro=document.createElement("p");
    intro.textContent=lang==="bg"?"ИЗБЕРИ ЗАПИС · ЕДИН ПЛЕЙЪР":"CHOOSE RECORDING · ONE PLAYER";
    playlist.append(intro);
    for(const [idx,item] of candidates.entries()){
     const control=document.createElement("button");control.type="button";
     control.className="case-hero-clip";control.setAttribute("aria-pressed","false");
     const thumb=module.resolveVideoPoster(item.media);
     const img=document.createElement("img");
     img.src=thumb||"/assets/media-ufo-earth-preview.svg";img.loading="lazy";
     img.alt=thumb?"Video thumbnail":"Decorative source video preview";
     const label=document.createElement("span");
     label.textContent=String(idx+1).padStart(2,"0")+" · "+(title(item.media.title,lang)||"Official recording");
     control.append(img,label);
     control.addEventListener("click",()=>select(item,true));
     controls.push({control,entry:item});playlist.append(control);
    }
   }
   select(candidates[0],false);
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
    stage.append(v);player=v;
    playerModule?.loadVerifiedVideo(v,playback,state=>{if(player===v)status.textContent=state==="fallback"?(document.documentElement.lang==="bg"?"Зарежда се официалното резервно видео…":"Trying official video backup…"):w.error;});
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
