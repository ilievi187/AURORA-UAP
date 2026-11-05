import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet as archive} from '../functions/archive/[id].js';
import {onRequestGet as country} from '../functions/countries/[code].js';
import {dossierMarkup,shardFor,escapeHtml} from '../functions/_lib/public-seo.js';
import {syncPublicSeo} from '../scripts/build-public-seo.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const curated=JSON.parse(read('data/seo/curated.json'));
const aliases={
 '/dossier':'dossier.html','/country':'country.html','/404.html':'404.html'
};
const env={ASSETS:{async fetch(request){
 const path=new URL(request.url).pathname;
 try{
  const data=read(aliases[path]||path.slice(1));
  const json=path.endsWith('.json');
  return new Response(data,{status:200,headers:{'Content-Type':json?'application/json':'text/html','Cache-Control':'public, max-age=120','X-Frame-Options':'DENY','Content-Length':String(data.length),'ETag':'stale-after-injection'}});
 }catch{return new Response('not found',{status:404})}
}}};
const invoke=(id)=>archive({request:new Request('https://aurorauap.org/archive/'+encodeURIComponent(id)),params:{id},env});
test('public SEO files stay exactly synchronized with current case archive and source country data',async()=>{
 const result=await syncPublicSeo({check:true});
 assert.equal(result.curated,101);
 assert.equal(result.bulk,10032);
 assert.equal(result.indexed,85);
 assert.ok(result.countries>=31);
});
test('curated high-quality case responds 200 with unique canonical, server summary and source attribution',async()=>{
 const id='uap-archive-aaro-atmospheric-wakes-case';
 assert.equal(curated[id].indexable,true);
 const response=await invoke(id);assert.equal(response.status,200);
 assert.match(response.headers.get('content-type'),/text\/html/);
 assert.equal(response.headers.get('x-frame-options'),'DENY');
 assert.equal(response.headers.get('content-length'),null,'rewritten HTML cannot retain stale byte count');
 assert.equal(response.headers.get('etag'),null,'rewritten HTML cannot retain original asset ETag');
 const html=await response.text();
 assert.match(html,/<meta name="robots" content="index,follow">/);
 assert.match(html,/<link rel="canonical" href="https:\/\/aurorauap\.org\/archive\/uap-archive-aaro-atmospheric-wakes-case">/);
 assert.match(html,/<section class="dossier-server-summary" id="serverDossierIntro"/);
 assert.match(html,/Atmospheric Wakes/);
 assert.match(html,/Original public reference/);
 assert.match(html,/<meta property="og:title"/);
});
test('source-only catalog record exists but remains noindex; missing records return actual 404',async()=>{
 const bulk=await invoke('geipan-4851');assert.equal(bulk.status,200);
 const body=await bulk.text();
 assert.match(body,/<meta name="robots" content="noindex,follow">/);
 assert.match(body,/<link rel="canonical" href="https:\/\/aurorauap\.org\/archive\/geipan-4851">/);
 assert.doesNotMatch(body,/id="serverDossierIntro"/);
 for(const id of ['geipan-9999999999','bluebook-9999999999','uap-archive-fabricated-entry','hacking-incorrect-123']){
  const res=await invoke(id);assert.equal(res.status,404,id);
  assert.match(await res.text(),/This page isn't in the archive/);
  assert.match(res.headers.get('x-robots-tag'),/noindex/);
 }
});
test('source-only page with invalid ID cannot accidentally become a 200',async()=>{
 const r=await invoke('../../admin');assert.equal(r.status,404);
});
test('countries with actual published archives work and fabricated country returns 404',async()=>{
 for(const code of ['US','FR','BR','GB','AU']){
  const r=await country({request:new Request('https://aurorauap.org/countries/'+code),params:{code},env});assert.equal(r.status,200,code);
  const page=await r.text();
  assert.ok(page.includes(`<link rel="canonical" href="https://aurorauap.org/countries/${code}">`));
  assert.match(page,/<meta property="og:title"/);
  assert.match(page,/<h1 id="countryName">[^<]+ — Country Explorer<\/h1>/);
 }
 for(const code of ['ZZ','AA','99']){
  const r=await country({request:new Request('https://aurorauap.org/countries/'+code),params:{code},env});assert.equal(r.status,404,code);
 }
});
test('publisher-authored metadata is HTML-escaped and never executable source markup',()=>{
 const html=dossierMarkup(read('dossier.html'),'test-valid',{indexable:true,title:'An <img src=x onerror=alert(1)>',summary:'<script>alert(2)</script> (& ok)',source:'https://example.org/?q=1&x=2'});
 assert.doesNotMatch(html,/<script>alert\(2\)<\/script>/);
 assert.doesNotMatch(html,/<img src=x onerror=/);
 assert.match(html,/&lt;script&gt;alert/);
 assert.match(html,/&amp; ok/);
 assert.match(html,/https:\/\/example\.org\/\?q=1&amp;x=2/);
 assert.equal(escapeHtml('A&B'), 'A&amp;B');
 assert.equal(shardFor('geipan-4851'),shardFor('geipan-4851'));
});
test('root 404.html stops Cloudflare Pages SPA fallback and links back to real public sections',()=>{
 const html=read('404.html');
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 assert.match(html,/<h1>This page isn't in the archive\.<\/h1>/);
 for(const link of ['/','/archive','/countries'])assert.ok(html.includes('href="'+link+'"'));
});
