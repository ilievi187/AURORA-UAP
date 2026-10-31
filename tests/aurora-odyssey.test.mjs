import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const page=read("index.html"),render=read("aurora-experience.js"),css=read("aurora-design-refresh.css");

test("cinematic story is a genuine GPU scene and NOT a copied/video placeholder",()=>{
 assert.match(page,/id="odyssey"[^>]+data-chapter="0"/);
 assert.match(page,/id="auroraSceneCanvas"[^>]+aria-hidden="true"/);
 assert.match(page,/src="\/aurora-experience\.js"/);
 assert.match(render,/getContext\("webgl"/);
 assert.match(render,/distanceField/);
 assert.match(render,/uniform float uProgress/);
 assert.match(render,/gl\.drawArrays\(gl\.TRIANGLES,0,6\)/);
 assert.doesNotMatch(render,/https?:\/\/|fetch\(|audio\.play/);
 assert.doesNotThrow(()=>new Script(render,{filename:"aurora-experience.js"}));
});

test("scroll-directed two-phase navigation preserves real sourced archive and DOM semantics",()=>{
 for(const id of ["hero-title","worldAtlas","worldMapCanvas","worldMapResults","homeNewsGrid","controlTabs","caseGlobe","reportGrid","languageGate"]){
  assert.ok(page.includes('id="'+id+'"'),id+" should be retained");
 }
 assert.match(page,/class="odyssey-scene odyssey-chapter" aria-hidden="true" inert/);
 assert.match(page,/href="\/archive\.html" class="button button-primary"/);
 assert.match(page,/href="#worldAtlas" class="odyssey-link"/);
 assert.match(render,/getBoundingClientRect/);
 assert.match(render,/progress>.49\?1:0/);
 assert.match(render,/chapter\.inert=next===0/);
 assert.doesNotMatch(page,/igloo\.inc|igloo\.glb|three\.min\.js/);
});

test("responsive performance/accessibility fallback prevents 3D blocking core content",()=>{
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/data-renderer="webgl"/);
 assert.match(render,/webglcontextlost/);
 assert.match(render,/webglcontextrestored/);
 assert.match(render,/document\.hidden/);
 assert.match(render,/IntersectionObserver/);
 assert.match(render,/reduce\.matches/);
 assert.match(render,/requestAnimationFrame/);
 assert.match(render,/dataset\.renderer="fallback"/);
 for(const other of ["archive.html","news.html","dossier.html","country.html","media.html"]){
  assert.ok(read(other).includes("/aurora-design-refresh.css"),other+" keeps unified non-WebGL UI");
 }
});
