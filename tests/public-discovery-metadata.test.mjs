import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {dossierMarkup} from '../functions/_lib/public-seo.js';
const load=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const pages={
 'index.html':'/',
 'archive.html':'/archive',
 'countries.html':'/countries',
 'news.html':'/news',
 'media.html':'/media',
 'sources.html':'/sources',
 'privacy.html':'/privacy'
};
function matches(html,pattern){return [...html.matchAll(pattern)]}
for(const [file,route] of Object.entries(pages)){
 test(`crawlable ${route} has matching single canonical and source-honest share preview`,()=>{
  const h=load(file),url='https://aurorauap.org'+route;
  assert.equal(matches(h,/<link rel="canonical" href="([^"]+)"\s*>/g).length,1,file);
  assert.ok(h.includes(`<link rel="canonical" href="${url}">`),route);
  assert.ok(h.includes('<meta name="robots" content="index,follow">'),file);
  for(const [key,content] of [['og:type','website'],['og:site_name','AURORA UAP'],['og:url',url],['og:image','https://aurorauap.org/assets/hero-ufo.webp']]){
   assert.ok(h.includes(`<meta property="${key}" content="${content}">`),`${file}: ${key}`);
  }
  assert.equal(matches(h,/<meta property="og:title" content="[^"]+">/g).length,1);
  assert.equal(matches(h,/<meta property="og:description" content="[^"]+">/g).length,1);
  assert.match(h,/<meta property="og:image:alt" content="[^"]*not evidence of a sighting">/);
  assert.match(h,/<meta name="twitter:card" content="summary">/);
  assert.ok(existsSync(new URL('../assets/hero-ufo.webp',import.meta.url)));
 });
}
test('searchable public pages have comprehensible English headings without JavaScript',()=>{
 const headings={
  'archive.html':'WORLD CASE ARCHIVE',
  'countries.html':'UAP CASES BY COUNTRY',
  'news.html':'WORLD UAP NEWS',
  'media.html':'PHOTOS, VIDEOS & DOCUMENTS',
  'sources.html':'INTERNATIONAL SOURCES'
 };
 for(const [file,heading] of Object.entries(headings)){
  const html=load(file);
  assert.ok(html.includes(heading),`${file}: ${heading}`);
  assert.equal((html.match(/<html[^>]*lang="en"/)||[]).length,1,file);
  const visible=[...html.matchAll(/>([^<>]{2,600})</g)].map(m=>m[1].trim()).filter(x=>/\p{Script=Cyrillic}/u.test(x));
  if(file==='archive.html')assert.deepEqual(visible,['Български','Русский','Српски','Українська']);
  else assert.deepEqual(visible,[],`${file}: no legacy Bulgarian content in server HTML`);
 }
 const home=load('index.html');
 assert.ok(home.includes('WORLDWIDE CASE MAP'));
 assert.ok(home.includes('FOLLOW THE STORY.'));
 assert.ok(home.includes('DOCUMENT. VERIFY. EXPLORE.'));
 assert.ok(home.includes('Countries</a>'));
 assert.ok(home.includes('Support AURORA'));
});
test('SEO sitemap advertises only real public indexable pages, with no private or unreviewed bulk case URLs',()=>{
 const xml=load('sitemap.xml'),canon=Object.values(pages).map(route=>'https://aurorauap.org'+route);
 for(const url of canon)assert.ok(xml.includes(`<loc>${url}</loc>`),url);
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(urls.length,124);
 assert.equal(new Set(urls).size,urls.length);
 assert.ok(!urls.some(u=>/\/api\/|\/donate|\/report|\/moderation|geipan-|bluebook-/.test(u)));
 const robots=load('robots.txt');
 assert.match(robots,/^Allow:\s*\/$/m);
 assert.match(robots,/^Sitemap:\s*https:\/\/aurorauap\.org\/sitemap\.xml/m);
 assert.doesNotMatch(robots,/^Disallow:\s*\/$/m);
});
test('Cloudflare redirects have no malformed or accidental catch-all rewrite rules',()=>{
 const redirects=load('_redirects').split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));
 for(const entry of redirects){
  const chunks=entry.split(/\s+/);
  assert.equal(chunks.length,3,`incomplete redirect: ${entry}`);
  assert.match(chunks[0],/^\//);
  assert.match(chunks[1],/^\//);
  assert.match(chunks[2],/^30[1278]$/);
 }
 assert.equal(redirects.some(x=>x.includes('REWRITE')),false);
});
test('source-linked curated dossiers include a unique escaped H1 and social preview without fabricated photographic evidence',()=>{
 const dossier=dossierMarkup(load('dossier.html'),'roswell-1947',{
  indexable:true,title:'Roswell 1947: Report and source archive',
  summary:'Published archival narrative, independently available for review.',
  source:'https://example.org/original-document'
 });
 assert.match(dossier,/<h1 id="dossierTitle">Roswell 1947: Report and source archive<\/h1>/);
 assert.match(dossier,/<meta property="og:image" content="https:\/\/aurorauap\.org\/assets\/hero-ufo\.webp">/);
 assert.match(dossier,/Illustrative UAP research artwork; not a photograph of this case/);
 const catalog=dossierMarkup(load('dossier.html'),'geipan-4851',{indexable:false,title:'GEIPAN source record'});
 assert.match(catalog,/<meta name="robots" content="noindex,follow">/);
 assert.doesNotMatch(catalog,/<meta property="og:image"/);
});
