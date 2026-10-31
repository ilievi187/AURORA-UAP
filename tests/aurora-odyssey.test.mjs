
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),render=read("aurora-experience.js"),css=read("aurora-cinematic.css");
test("Earth-centered original WebGL space, not a static demo background",()=>{
  assert.match(html,/id="odyssey"[^>]+data-chapter="0"/);
  assert.match(html,/id="auroraSceneCanvas"[^>]*aria-hidden="true"/);
  assert.match(html,/src="\/aurora-experience\.js"/);
  assert.match(render,/getContext\("webgl"/);
  assert.match(render,/hitSphere/);
  assert.match(render,/gl\.drawArrays\(gl\.TRIANGLES,0,6\)/);
  assert.match(render,/scenePixels/);
  assert.doesNotThrow(()=>new Script(render,{filename:"aurora-experience.js"}));
  assert.doesNotMatch(render,/igloo\.inc|audio\.play\(/);
});
test("Earth land shape texture is 4K and source-geographic, planets are true 3D",()=>{
  assert.match(render,/fetch\("\/data\/earth-land\.json"/);
  assert.match(render,/tex\.width=4096;tex\.height=2048/);
  assert.match(render,/gl\.generateMipmap/);
  assert.match(render,/uEarth/);
  assert.match(render,/tMoon=hitSphere/);
  assert.match(render,/tMars=hitSphere/);
  assert.match(render,/tSat=hitSphere/);
  assert.match(render,/ringN/);
  assert.match(render,/Math\.min\(box\.width\*scale,limit\)/);
  assert.match(render,/window\.devicePixelRatio/);
  assert.match(render,/4096/);
});
test("Three immersive chapters are accessible and real archive follows",()=>{
  for(const id of ["hero-title","worldAtlas","worldMapCanvas","homeNewsGrid","controlTabs","caseGlobe","reportGrid","languageGate"]){
    assert.ok(html.includes('id="'+id+'"'),id+" retained");
  }
  assert.match(html,/class="odyssey-scene odyssey-intro"/);
  assert.match(html,/class="odyssey-scene odyssey-chapter" aria-hidden="true" inert/);
  assert.match(html,/class="odyssey-scene odyssey-archive-chapter" aria-hidden="true" inert/);
  assert.match(render,/progress<\.24\?0:progress<\.66\?1:2/);
  assert.match(render,/s\.inert=hidden/);
  assert.match(html,/href="\/archive\.html" class="button button-primary"/);
  assert.match(html,/class="odyssey-link" href="#worldAtlas"/);
});
test("Native scene respects accessibility, performance, fallback and reduced motion",()=>{
  assert.match(css,/@media\(max-width:680px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/data-renderer="webgl"/);
  assert.match(css,/body:has\(#odyssey\)/);
  for(const regex of [/webglcontextlost/,/webglcontextrestored/,/document\.hidden/,/IntersectionObserver/,/reduce\.matches/,/requestAnimationFrame/,/dataset\.renderer="fallback"/])assert.match(render,regex);
  assert.doesNotMatch(html,/igloo\.inc|igloo\.glb|three\.min\.js/);
});
