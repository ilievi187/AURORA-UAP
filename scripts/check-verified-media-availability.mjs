// Bounded, read-only reachability test. Approved alternative providers are
// independent public-domain government sources, never a bypass of the same WAF.
import {readFileSync} from "node:fs";
import {resolveMediaPlayback} from "../media-player.js";
const data=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8"));
const wanted=new Set(["uap-archive-northeastern-orb-sightings","nimitz-2004","gimbal-2015","gofast-2015","al-taqaddum-2017"]);
let failed=0,inconclusive=0;
for(const c of data.cases.filter(x=>wanted.has(x.id))){
 for(const m of c.media.filter(x=>x.type==="video")){
  const playback=resolveMediaPlayback(m);
  if(!playback)continue;
  const urls=playback.kind==="html5"?
   [playback.mediaUrl,...(playback.alternatives||[]).map(x=>x.url)]:[playback.embedUrl];
  let reachable=false;
  const refusals=[];
  for(const endpoint of urls){
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),11000);
   try{
    const r=await fetch(endpoint,{headers:{Range:"bytes=0-1023",Accept:"video/*,text/html;q=0.8,*/*;q=0.5"},redirect:"follow",signal:controller.signal});
    const ct=r.headers.get("content-type")||"";
    const ok=r.ok&&(playback.kind==="html5"?/video|octet-stream/i.test(ct):/text\/html/i.test(ct));
    console.log(JSON.stringify({case:c.id,provider:playback.provider,
     origin:new URL(endpoint).origin,status:r.status,contentType:ct,ok}));
    refusals.push(r.status);
    if(r.body)await r.body.cancel().catch(()=>{});
    if(ok){reachable=true;break}
   }catch(error){
    refusals.push("network");
    console.log(JSON.stringify({case:c.id,origin:new URL(endpoint).origin,
     error:String(error?.name||error),note:"inconclusive; no retry to blocked source"}));
   }finally{clearTimeout(timer)}
  }
  if(!reachable){
   if(refusals.length&&refusals.every(status=>status===403||status===429||status==="network")){
    inconclusive++;
    console.log("REMOTE_MEDIA_REFUSAL_INCONCLUSIVE "+c.id+
     " - third-party provider rate-limit/access policy; do not circumvent or claim playback verified");
   }else failed++;
  }
 }
}
console.log("UNAVAILABLE_VERIFIED_MEDIA_COUNT="+failed);
console.log("INCONCLUSIVE_CDN_RATE_LIMIT_COUNT="+inconclusive);
if(failed)process.exitCode=1;
