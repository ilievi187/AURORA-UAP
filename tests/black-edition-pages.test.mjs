import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {selectPublicCase,translatePublishedCase,onRequestGet} from "../functions/api/archive-translation.js";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const pages=["archive","countries","country","dossier","media","news","sources","report","donate"];
test("all nine subpages load the approved final Black Edition skin, home remains unchanged",()=>{
 for(const name of pages){
  const html=read(name+".html");
  const styles=[...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(styles.at(-1),"/aurora-black-pages.css",name);
  assert.ok(html.includes("/aurora-design-refresh.css"),"shared base retained: "+name);
 }
 const home=read("index.html");
 assert.match(home,/aurora-silence\.css/);
 assert.doesNotMatch(home,/aurora-black-pages\.css/);
 const css=read("aurora-black-pages.css");
 assert.match(css,/--aurora-ink:#010305/);
 assert.match(css,/archive-card/);assert.match(css,/media-entry/);
 assert.match(css,/dossier-top/);assert.match(css,/report-hero/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test("source-locked translator denies unpublished and arbitrary strings",async()=>{
 const record={id:"case-a",title:{en:"Lights above the harbor"},summary:{en:"Three bright lights moved slowly."},story:{en:["Witnesses observed them for two minutes."]},source:{url:"https://example.org/1"}};
 assert.equal(selectPublicCase([record],"case-a"),record);
 assert.equal(selectPublicCase([{...record,private:true}],"case-a"),null);
 assert.equal(selectPublicCase([{...record,source:{url:"javascript:alert(1)"}}],"case-a"),null);
 const unsupported=await onRequestGet({request:new Request("https://example.org/api/archive-translation?id=../../secret&lang=de"),env:{}});
 assert.equal(unsupported.status,400);
 const noAI=await translatePublishedCase(record,"de",null,{detail:true});
 assert.equal(noAI.status,"unavailable");
});
test("public-only case translations preserve evidence and translate title, summary and narrative",async()=>{
 const original={id:"example-case",title:{en:"Case title"},summary:{en:"A detailed report of an event."},story:{en:["Original witness narrative."]},source:{url:"https://example.org/case"}};
 const calls=[],ai={async run(model,args){calls.push(args);return {translated_text:"DE: "+args.text};}};
 const translated=await translatePublishedCase(original,"de",ai,{detail:true});
 assert.equal(translated.status,"translated");
 assert.equal(translated.title,"DE: Case title");
 assert.equal(translated.summary,"DE: A detailed report of an event.");
 assert.deepEqual(translated.story,["DE: Original witness narrative."]);
 assert.equal(calls.length,3);
 assert.equal(calls[0].source_lang,"en");
 assert.equal(calls[0].target_lang,"de");
 assert.deepEqual(original.title,{en:"Case title"},"original evidence is untouched");
 const asset={ASSETS:{async fetch(){return Response.json({cases:[original]})}},AI:ai};
 const r=await onRequestGet({request:new Request("https://aurorauap.org/api/archive-translation?id=example-case&lang=fr&detail=1"),env:asset,ctx:{}});
 assert.equal(r.status,200);
 assert.equal((await r.json()).target_language,"fr");
 const denied=await onRequestGet({request:new Request("https://aurorauap.org/api/archive-translation?id=private-case&lang=fr"),env:asset,ctx:{}});
 assert.equal(denied.status,404);
});
test("embedded player respects publisher permissions and fallback labels stay honest",()=>{
 const media=read("media.js"),dossier=read("dossier.js"),archive=read("archive-directory.js");
 assert.match(media,/import\("\/archive-inline-player\.js"\)/);
 assert.match(media,/addArchivePlayback\(card,m/);
 assert.match(archive,/translatePublicCase/);
 assert.match(dossier,/requestNarrativeTranslation/);
 assert.match(read("dossier-hero.js"),/resolveMediaPlayback/);
 assert.match(read("media-player.js"),/hosting_permission/);
 assert.match(read("archive-localization.js"),/translationDisclosure/);
});
