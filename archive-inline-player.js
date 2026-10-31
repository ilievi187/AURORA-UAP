import "./video-ui-text.js";
import {resolveMediaPlayback,resolveVideoPoster,loadVerifiedVideo} from "./media-player.js";

// Lightweight, native in-card player. Only one active card can stream at a time.
// A player is never started until someone deliberately presses Play.
let active=null;
const labels=lang=>globalThis.AURORA_VIDEO_UI?.[lang]||globalThis.AURORA_VIDEO_UI?.en;
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
 const w=labels(lang);
 const box=document.createElement("div");box.className="archive-video-box";
 const preview=document.createElement("img");
 preview.className="archive-video-thumb";preview.loading="lazy";preview.decoding="async";
 const poster=resolveVideoPoster(video);preview.src=poster||"/assets/video-poster.svg";
 preview.alt=poster?w.sourceThumb:w.preview;
 const play=document.createElement("button");
 play.type="button";play.className="archive-video-play";
 play.textContent=w.watchHere;
 play.setAttribute("aria-label",w.watchHere+" · "+title);
 const frame=document.createElement("div");frame.className="archive-video-frame";frame.hidden=true;
 const close=document.createElement("button");close.type="button";
 close.className="archive-video-close";close.textContent="×";
 close.setAttribute("aria-label",w.close);close.hidden=true;
 const status=document.createElement("p");status.className="archive-video-status";status.setAttribute("role","status");
 const credit=document.createElement("small");credit.className="archive-video-credit";
 credit.textContent=poster?w.sourceThumb:w.preview;
 const original=document.createElement("a");original.className="archive-video-original";
 original.href=playback.originalUrl;original.target="_blank";original.rel="noopener noreferrer";
 original.textContent=w.original;
 box.append(preview,play,frame,close,status,credit,original);card.append(box);
 play.addEventListener("click",()=>{
  safeStop();
  let media;
  if(playback.kind==="html5"){
   media=document.createElement("video");media.controls=true;media.playsInline=true;media.preload="metadata";
   media.setAttribute("aria-label",title);
   media.addEventListener("loadedmetadata",()=>{if(active?.media===media)status.textContent=""},{once:true});
   media.addEventListener("error",()=>{if(active?.media===media)status.textContent=w.notSupported});
  }else{
   media=document.createElement("iframe");media.title=title;
   media.allow="encrypted-media; picture-in-picture; fullscreen";
   media.allowFullscreen=true;media.referrerPolicy="strict-origin-when-cross-origin";
   media.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");
   media.addEventListener("load",()=>{if(active?.media===media)status.textContent=""},{once:true});
   media.addEventListener("error",()=>{if(active?.media===media)status.textContent=w.notSupported});
  }
  media.className="archive-video-media";frame.replaceChildren(media);
  preview.hidden=true;play.hidden=true;frame.hidden=false;close.hidden=false;
  status.textContent=w.loading;
  active={media,frame,close,play,preview,status};
  if(playback.kind==="html5")loadVerifiedVideo(media,playback,state=>{if(active?.media===media)status.textContent=state==="fallback"?w.loading:w.notSupported});
  else media.src=playback.embedUrl;
  close.focus();
 });
 close.addEventListener("click",()=>{safeStop();play.focus()});
 return true;
}
