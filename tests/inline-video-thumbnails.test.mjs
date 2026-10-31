import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveMediaPlayback,resolveVideoPoster} from "../media-player.js";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const cases=JSON.parse(read("data/cases.json")).cases;
test("PURSUE public-domain source videos have playable in-site MP4 with credit, without copying them",()=>{
 const dossier=cases.find(x=>x.id==="uap-archive-northeastern-orb-sightings");
 assert.ok(dossier);
 const video=dossier.media.filter(m=>m.type==="video");
 assert.equal(video.length,3);
 for(const m of video){
  const p=resolveMediaPlayback(m);
  assert.equal(p.kind,"html5");
  assert.equal(p.provider,"direct");
  assert.equal(p.mimeType,"video/mp4");
  assert.equal(p.mediaUrl,m.url);
  assert.match(m.source_name,/Defense/);
  assert.match(m.playback.rights_evidence_url,/uap-archive\.org\/uap\/records\/pursue-uap-imagery/);
  assert.equal(m.playback.authorization_type,"public_domain");
  assert.equal(resolveVideoPoster(m),null,"no made-up image from purported video");
 }
});
test("only publicly published playable media gets a Play button; publisher article links stay plain references",()=>{
 const sourceOnly=cases.filter(c=>c.media?.some(m=>m.type==="video"&&!resolveMediaPlayback(m)));
 assert.ok(sourceOnly.some(c=>c.id==="westall-1966"));
 const direct=cases.filter(c=>c.media?.some(m=>resolveMediaPlayback(m)));
 assert.ok(direct.length>=5,"FLIR1 GIMBAL GOFAST DVIDS and PURSUE should be playable");
 assert.equal(resolveMediaPlayback({type:"video",url:"https://www.abc.net.au/news/article"}),null);
 assert.equal(resolveMediaPlayback({type:"video",url:"https://media.uap-archive.org/pursue/dangerous.mp4"}),null);
 assert.equal(resolveMediaPlayback({type:"video",url:"javascript:alert(1)"}),null);
});
test("preview has real provider thumbnail where supported, else honest decorative fallback",()=>{
 const yt={type:"video",url:"https://www.youtube.com/watch?v=aqz-KE-bpKQ"};
 assert.equal(resolveVideoPoster(yt),"https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg");
 assert.equal(resolveVideoPoster({type:"video",url:"https://evil.example/page",playback:{poster_url:"https://evil.example/pretend.jpg"}}),null);
 const playable=cases.find(c=>c.id==="nimitz-2004").media.find(m=>m.type==="video");
 assert.equal(resolveVideoPoster(playable),null,"must never invent a still frame from government footage");
 const js=read("archive-inline-player.js");
 assert.match(js,/\/assets\/video-poster\.svg/);
 assert.match(js,/media\.controls=true/);
 assert.match(js,/media\.allowFullscreen=true/);
 assert.match(js,/safeStop\(\)/);
 const hero=read("dossier-hero.js");
 assert.match(hero,/const candidates=videos\.map/);
 assert.match(hero,/caseHeroPlaylist/);
 assert.match(hero,/select\(item,true\)/);
 assert.match(hero,/selectedPlayback/);
});
test("every archive card and source-player uses a real click handler instead of a redirect",()=>{
 const cards=read("archive-directory.js");
 assert.match(cards,/addArchivePlayback\(article,clip,language/);
 assert.match(cards,/resetArchivePlayback\(\);host\.replaceChildren/);
 const helper=read("archive-inline-player.js");
 assert.match(helper,/play\.addEventListener\("click"/);
 assert.match(helper,/frame\.replaceChildren\(media\)/);
 assert.match(helper,/loadVerifiedVideo\(media,playback/);
 assert.match(helper,/else media\.src=playback\.embedUrl/);
 assert.match(read("archive-directory.css"),/\.archive-video-play/);
 assert.match(read("dossier.css"),/\.case-hero-poster/);
});


test("FLIR1 has an independently published, verified fallback and no arbitrary host can be injected",()=>{
 const m=cases.find(x=>x.id==="nimitz-2004").media.find(x=>x.type==="video");
 const p=resolveMediaPlayback(m);
 assert.equal(p.kind,"html5");
 assert.equal(p.alternatives.length,1);
 assert.match(p.alternatives[0].url,/^https:\/\/www\.navair\.navy\.mil\/foia\/.*FLIR\.mp4$/);
 const injected={...m,playback:{...m.playback,fallback_urls:[{url:"https://evil.example/backdoor.mp4",mime_type:"video/mp4"}]}};
 assert.equal(resolveMediaPlayback(injected).alternatives.length,0);
});
