import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveMediaPlayback} from "../media-player.js";

const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const cases=JSON.parse(read("data/cases.json")).cases;
test("all editorial historical dossiers contain sourced expanded bilingual narratives",()=>{
 assert.ok(cases.length>=15);
 for(const c of cases){
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
test("DVIDS exception remains narrowly scoped; players load only on deliberate click",()=>{
 const dossier=read("dossier.js");
 assert.match(dossier,/import\("\/media-player\.js"\)/);
 assert.match(dossier,/resolveMediaPlayback\(media\)/);
 assert.match(dossier,/watch\.addEventListener\("click",async/);
 assert.match(dossier,/c\.id==="al-taqaddum-2017"/);
 assert.match(dossier,/960331/);
 assert.match(dossier,/sandbox","allow-scripts allow-same-origin allow-presentation"/);
 assert.match(dossier,/video\.controls=true/);
 assert.match(dossier,/video\.preload="metadata"/);
 assert.match(dossier,/media\.playback\?\.rights_status==="verified"/);
 const page=read("dossier.html");
 assert.match(page,/id="dossierDepth"/);
 assert.match(page,/id="caseMediaGrid"/);
 assert.match(read("dossier.css"),/case-video-frame/);
});
