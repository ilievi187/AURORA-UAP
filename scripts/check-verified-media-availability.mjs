// Bounded read-only media source availability check, not a playback guarantee.
// Does not bypass publisher access controls or download full video files.
import {readFileSync} from "node:fs";
import {resolveMediaPlayback} from "../media-player.js";
const data=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8"));
const wanted=new Set(["uap-archive-northeastern-orb-sightings","nimitz-2004","gimbal-2015","gofast-2015","al-taqaddum-2017"]);
let failed=0;
for(const c of data.cases.filter(x=>wanted.has(x.id))){
 for(const m of c.media.filter(x=>x.type==="video")){
  const playback=resolveMediaPlayback(m);
  if(!playback)continue;
  const endpoint=playback.kind==="html5"?playback.mediaUrl:playback.embedUrl;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),13000);
  try{
   const r=await fetch(endpoint,{headers:{Range:"bytes=0-1023",Accept:"video/*,text/html;q=0.8,*/*;q=0.5"},redirect:"follow",signal:controller.signal});
   const ct=r.headers.get("content-type")||"";
   const result={case:c.id,provider:playback.provider,status:r.status,
    contentType:ct,acceptRanges:r.headers.get("accept-ranges"),length:r.headers.get("content-length")};
   console.log(JSON.stringify(result));
   if(!r.ok||!(playback.kind==="html5"?/video|octet-stream/i.test(ct):/text\/html/i.test(ct)))failed++;
   if(r.body)await r.body.cancel().catch(()=>{});
  }catch(e){failed++;console.log(JSON.stringify({case:c.id,source:endpoint,error:String(e?.name||e),note:"publisher/network refusal; no bypass"}))}
  finally{clearTimeout(timer)}
 }
}
console.log("REMOTE_SOURCE_FAILURE_COUNT="+failed);
if(failed)process.exitCode=1;
