import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('index.html');

test('entry route includes full-viewport accessible language picker',()=>{
  assert.match(html,/id="languageGate"[^>]+role="dialog"[^>]+aria-modal="true"/);
  assert.match(html,/id="gateLanguageGrid"/);
  assert.match(html,/id="openLanguageGate"/);
  assert.match(html,/id="gateContinue"[^>]+disabled/);
  assert.match(html,/id="gateCanvas"/);
  assert.match(html,/id="heroHudCanvas"/);
  assert.match(read('aurora-v1.js'),/localStorage\.setItem\("aurora-lang"/);
});

test('cinematic visual assets load from repository',()=>{
  assert.match(html,/href="aurora-v1\.css"/);
  assert.match(html,/src="aurora-v1\.js"/);
  assert.match(html,/class="orbital-stage"/);
  for(const name of ['aurora-v1.css','aurora-v1.js','jarvis-hud.css','jarvis-hud.js','assets/hero-ufo.webp','assets/favicon.svg']){
    assert.ok(existsSync(new URL('../'+name,import.meta.url)),name+' missing');
  }
});

test('no duplicate HTML ids or broken in-page links',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length);
  const links=[...html.matchAll(/href="#([^"]+)"/g)].map(x=>x[1]);
  links.forEach(id=>assert.ok(ids.includes(id),'Missing #'+id));
});

test('Javascript syntax parses without external toolchain',()=>{
  for(const file of ['script.js','i18n-extra.js','aurora-v1.js','jarvis-hud.js','donate.js','donate-i18n.js','payment-config.js']){
    assert.doesNotThrow(()=>new Script(read(file),{filename:file}),file);
  }
});

test('visitors are never misled into thinking example cases are verified',()=>{
  assert.match(html,/Демонстрационни локации/);
  assert.match(html,/нищо не се изпраща към сървър/);
  assert.match(read('payment-config.js'),/AURORA_PAYMENT_LINK\s*=\s*null/);
});

test('motion respects reduced-motion accessibility preference',()=>{
  assert.match(read('aurora-v1.css'),/prefers-reduced-motion:reduce/);
  assert.match(read('aurora-v1.js'),/prefers-reduced-motion: reduce/);
});

test('Cloudflare Pages remains configured as a static site',()=>{
  assert.ok(existsSync(new URL('../index.html',import.meta.url)));
  assert.ok(existsSync(new URL('../_headers',import.meta.url)));
});

test('language gate is mandatory even when saved and Continue is a separate click',()=>{
  const source=read('aurora-v1.js');
  assert.match(source,/openGate\(true\)/);
  assert.match(source,/continueButton\.addEventListener\("click",continueToAurora\)/);
  assert.match(source,/function selectLanguage\(code\)/);
  assert.doesNotMatch(source,/if\(!stored\|\|!languages\.some\(x=>x\[0\]===stored\)\)openGate\(\)/);
});
test('real procedural HUD is present and honors OS reduced-motion',()=>{
  assert.match(html,/src="jarvis-hud\.js"/);
  assert.match(html,/href="jarvis-hud\.css"/);
  assert.match(read('jarvis-hud.js'),/requestAnimationFrame/);
  assert.match(read('jarvis-hud.js'),/prefers-reduced-motion: reduce/);
  assert.match(read('jarvis-hud.css'),/gate-scan-line/);
});
