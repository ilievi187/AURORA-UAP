import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveMediaPlayback} from "../media-player.js";

const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const cases=JSON.parse(read("data/cases.json")).cases;
test("all editorial historical dossiers contain sourced expanded bilingual narratives",()=>{
 assert.ok(cases.length>=15);
 const editorial=cases.filter(c=>c.content_depth==="editorial");
 assert.equal(editorial.length,15,"original 15 editorial cases must retain full narratives");
 for(const c of editorial){
  assert.equal(c.content_depth,"editorial",c.id);
  assert.match(c.source.url,/^https:\/\//,c.id+" provenance");
  assert.ok(c.story&&Array.isArray(c.story.bg)&&Array.isArray(c.story.en),c.id);
  for(const lang of ["bg","en"]){
   assert.ok(c.story[lang].length>=3,c.id+" "+lang+" needs a real narrative beyond summary");
   assert.ok(c.story[lang].every(x=>typeof x==="string"&&x.length>=75),c.id+" contains an empty paragraph");
   assert.ok(c.story[lang].join(" ").length>=600,c.id+" "+lang+" content too thin");
  }
 }
});
test("the Navy videos use the same rights-checked playable HTML5 source as the media library",()=>{
 const navy=["nimitz-2004","gimbal-2015","gofast-2015"];
 for(const id of navy){
  const c=cases.find(x=>x.id===id);
  assert.ok(c,id+" missing");
  const media=c.media.find(x=>x.type==="video");
  const playback=resolveMediaPlayback(media);
  assert.ok(playback,id+" not embeddable");
  assert.equal(playback.kind,"html5");
  assert.equal(media.playback.rights_status,"verified");
  assert.equal(media.playback.hosting_permission,true);
  assert.match(playback.originalUrl,/^https:\/\/www\.defense\.gov\//);
 }
});
test("publisher landing pages are never misrepresented as playable footage",()=>{
 for(const id of ["westall-1966","puerto-rico-2013","etna-2018"]){
  const media=cases.find(c=>c.id===id).media.filter(x=>x.type==="video");
  assert.ok(media.length);
  for(const item of media)assert.equal(resolveMediaPlayback(item),null,id+" illegally inferred embed");
 }
});
test("only the hero mounts a verified player, never the lower archive",()=>{
 const hero=read("dossier-hero.js"),dossier=read("dossier.js"),page=read("dossier.html");
 assert.match(hero,/import\("\/media-player\.js"\)/);
 assert.match(hero,/resolveMediaPlayback\(media\)/);
 assert.match(hero,/button\.addEventListener\("click"/);
 assert.match(hero,/v\.controls=true/);
 assert.match(hero,/v\.preload="metadata"/);
 assert.match(hero,/sandbox","allow-scripts allow-same-origin allow-presentation"/);
 assert.doesNotMatch(dossier,/case-watch-button|case-video-frame|mediaGrid\.append\(video\)|mediaGrid\.append\(frame\)/);
 assert.match(dossier,/new Set\(\["documents","archive","photo"\]\)/);
 assert.ok(page.includes('id="caseHeroStage"'));
 assert.ok(page.includes('id="caseMediaGrid"'));
});

test("official DVIDS Al Taqaddum recording is real in-page source media, not a fake badge",()=>{
 const c=cases.find(x=>x.id==="al-taqaddum-2017");
 assert.ok(c);
 const m=c.media.find(x=>x.type==="video");
 const playback=resolveMediaPlayback(m);
 assert.equal(playback?.kind,"iframe");
 assert.equal(playback?.provider,"dvids");
 assert.equal(playback?.embedUrl,"https://www.dvidshub.net/video/embed/960331");
 assert.equal(playback?.originalUrl,"https://www.dvidshub.net/video/960331/al-taqaddum-object");
 assert.equal(resolveMediaPlayback({type:"video",url:"https://www.dvidshub.net/video/12345/other"}),null);
});

test("twelve real DVIDS/AARO public video embeds are preserved across six new case dossiers",()=>{
 const imported=cases.filter(c=>c.provenance?.source_name==="disclosure.zone");
 const clips=imported.flatMap(c=>(c.media||[]).filter(m=>m.type==="video").map(m=>({id:c.id,media:m})));
 assert.equal(clips.length,12,"all original video links must survive into source-rich case archive");
 assert.equal(new Set(clips.map(c=>c.id)).size,6);
 for(const {id,media} of clips){
  const playback=resolveMediaPlayback(media);
  assert.equal(playback?.kind,"iframe",id+" should embed publisher's official player");
  assert.equal(playback?.provider,"dvids");
  assert.match(playback.embedUrl,/^https:\/\/www\.dvidshub\.net\/video\/embed\/[1-9]\d{5,8}$/);
  assert.equal(playback.originalUrl,media.url);
  assert.equal(media.playback.permission,"public_embed");
 }
 const sample=clips[0].media;
 assert.equal(resolveMediaPlayback({...sample,playback:null}),null,"arbitrary unapproved video source is not auto-embedded");
 assert.equal(resolveMediaPlayback({...sample,playback:{...sample.playback,source_url:"https://elsewhere.example/"}}),null);
});
