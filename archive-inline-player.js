import {resolveMediaPlayback,resolveVideoPoster,loadVerifiedVideo} from "./media-player.js";

// Lightweight, native in-card player. Only one active card can stream at a time.
// A player is never started until someone deliberately presses Play.
let active=null;
const safeStop=()=>{
 if(!active)return;
 const {media,frame,close,play,preview,status}=active;
 if(media.tagName==="VIDEO"){
  try{media.pause();media.removeAttribute("src");media.load()}catch{}
 }else media.removeAttribute("src");
 frame.replaceChildren();frame.hidden=true;
 close.hidden=true;play.hidden=false;preview.hidden=false;status.textContent="";
 active=null;
};
export function resetArchivePlayback(){safeStop()}
export function addArchivePlayback(card,video,lang="bg",title="Video"){
 const playback=resolveMediaPlayback(video);
 if(!playback)return false;
 const bg=lang==="bg";
 const box=document.createElement("div");box.className="archive-video-box";
 const preview=document.createElement("img");
 preview.className="archive-video-thumb";preview.loading="lazy";preview.decoding="async";
 const poster=resolveVideoPoster(video);preview.src=poster||"/assets/video-poster.svg";
 preview.alt=poster?
  (bg?"Публикувана миниатюра на видеото":"Published video thumbnail"):
  (bg?"Тематична илюстрация — не кадър от наблюдението":"Decorative preview, not original footage");
 const play=document.createElement("button");
 play.type="button";play.className="archive-video-play";
 play.textContent=bg?"▶ ГЛЕДАЙ ТУК":"▶ WATCH HERE";
 play.setAttribute("aria-label",(bg?"Гледай в AURORA: ":"Watch in AURORA: ")+title);
 const frame=document.createElement("div");frame.className="archive-video-frame";frame.hidden=true;
 const close=document.createElement("button");close.type="button";
 close.className="archive-video-close";close.textContent="×";
 close.setAttribute("aria-label",bg?"Затвори видеото":"Close video");close.hidden=true;
 const status=document.createElement("p");status.className="archive-video-status";status.setAttribute("role","status");
 const credit=document.createElement("small");credit.className="archive-video-credit";
 credit.textContent=poster?(bg?"Миниатюра от видеоизточника":"Video source thumbnail"):
  (bg?"Графичен преглед · не е оригинален кадър":"Preview art · not an original video frame");
 const original=document.createElement("a");original.className="archive-video-original";
 original.href=playback.originalUrl;original.target="_blank";original.rel="noopener noreferrer";
 original.textContent=bg?"Оригинален източник ↗":"Original source ↗";
 box.append(preview,play,frame,close,status,credit,original);card.append(box);
 play.addEventListener("click",()=>{
  safeStop();
  let media;
  if(playback.kind==="html5"){
   media=document.createElement("video");media.controls=true;media.playsInline=true;media.preload="metadata";
   media.setAttribute("aria-label",title);
   media.addEventListener("loadedmetadata",()=>{if(active?.media===media)status.textContent=""},{once:true});
   media.addEventListener("error",()=>{if(active?.media===media)status.textContent=bg?
    "Неуспешно зареждане. Използвай оригиналния източник.":"Playback failed. Open the original source."});
  }else{
   media=document.createElement("iframe");media.title=title;
   media.allow="encrypted-media; picture-in-picture; fullscreen";
   media.allowFullscreen=true;media.referrerPolicy="strict-origin-when-cross-origin";
   media.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");
   media.addEventListener("load",()=>{if(active?.media===media)status.textContent=""},{once:true});
   media.addEventListener("error",()=>{if(active?.media===media)status.textContent=bg?
    "Издателят не позволи вграждане.":"Publisher embed is unavailable."});
  }
  media.className="archive-video-media";frame.replaceChildren(media);
  preview.hidden=true;play.hidden=true;frame.hidden=false;close.hidden=false;
  status.textContent=bg?"Зареждане на плейъра…":"Loading source player…";
  active={media,frame,close,play,preview,status};
  if(playback.kind==="html5")loadVerifiedVideo(media,playback,state=>{status.textContent=state==="fallback"?(bg?"Основният източник е ограничен. Зарежда се официалното резервно копие…":"Trying official video backup…"):(bg?"Видеото не може да се зареди.":"Video unavailable.")});
  else media.src=playback.embedUrl;
  close.focus();
 });
 close.addEventListener("click",()=>{safeStop();play.focus()});
 return true;
}
