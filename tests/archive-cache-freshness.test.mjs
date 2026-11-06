import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const src=name=>readFileSync(new URL(name,root),'utf8');
const data=JSON.parse(src('data/cases.json'));

test('published case dataset has over ten pages of sourced dossiers',()=>{
 assert.ok(data.cases.length>=100,'AURORA public archive needs at least 100 cases');
 assert.equal(new Set(data.cases.map(c=>c.id)).size,data.cases.length);
});
test('all public case collection consumers revalidate JSON instead of using stale force-cache',()=>{
 const consumers=[
  'archive-directory.js','globe.js','world-atlas.js',
  'country.js','dossier.js','media.js'
 ];
 for(const name of consumers){
  const js=src(name);
  const calls=[...js.matchAll(/fetch\(\s*['"]\/data\/cases\.json['"]\s*,\s*\{\s*cache:\s*['"]([^'"]+)['"]\s*\}\s*\)/g)];
  assert.ok(calls.length>0,name+': public case JSON fetch missing or altered');
  for(const call of calls)
   assert.equal(call[1],'no-cache',name+': old cached case inventory must be revalidated');
 }
});
test('immutable map geometry may still use force-cache without freezing case inventory',()=>{
 assert.match(src('world-atlas.js'),/earth-land\.json/);
 assert.match(src('archive-directory.js'),/cache:"no-cache"/);
});


test('derived country, source map and expanded archive indexes revalidate on later releases',()=>{
 const file=src('countries.js');
 assert.ok(file.includes('fetch("/data/bulk/countries.json",{cache:"no-cache"})'));
 const world=src('world-atlas.js');
 assert.ok(world.includes("fetch('/data/bulk/geo-points.json',{cache:'no-cache'})"));
 assert.ok(world.includes("fetch('/data/bulk/countries.json',{cache:'no-cache'})"));
 const country=src('country.js');
 assert.ok(country.includes('fetch("/data/bulk/by-country/"+code+".json",{cache:"no-cache"})'));
 assert.ok(src('archive-directory.js').includes('fetch("/data/bulk/listings.json",{cache:"no-cache"})'));
});
