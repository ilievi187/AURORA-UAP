import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {packBulkListings,syncBulkListings} from '../scripts/build-bulk-listings.mjs';
const data=file=>JSON.parse(readFileSync(new URL('../'+file,import.meta.url),'utf8'));
const original=data('data/bulk/index.json').cases;
const catalog=data('data/bulk/listings.json');
const countries=data('data/bulk/countries.json').countries;
const sandbox={globalThis:{},URL};
runInNewContext(readFileSync(new URL('../public-bulk-listings.js',import.meta.url),'utf8'),sandbox,{timeout:3000});
const unpack=sandbox.globalThis.AURORA_PUBLIC_BULK_LISTINGS.unpack;
test('derived public listings are deterministic and stay in sync with the full source record index',async()=>{
 const result=await syncBulkListings({check:true});
 assert.equal(result.sourceCount,10032);
 assert.equal(result.countryCount,countries.length);
 assert.equal(catalog.records.length,original.length);
 assert.equal(catalog.schema_version,1);
 assert.equal(new Set(catalog.records.map(x=>x[0])).size,original.length);
 const packed=packBulkListings(original);
 assert.deepEqual(JSON.stringify(packed.all),JSON.stringify(catalog));
});
test('unpacking every public listing preserves exact English title, summary, attribution, country and date',()=>{
 const displayed=unpack(catalog);
 assert.equal(displayed.length,original.length);
 for(let i=0;i<displayed.length;i++){
  const a=displayed[i],b=original[i];
  for(const name of ['id','date','country','status'])assert.equal(a[name],b[name],name+' '+i);
  for(const name of ['title','summary','city'])assert.equal(a[name].en,b[name].en,name+' '+i);
  assert.equal(a.source.name,b.source.name);
  assert.equal(a.source.url,b.source.url);
  assert.equal(a.media.length,0);
 }
});
test('country-specific downloads contain only their actual sourced records, without duplicates or made-up locations',()=>{
 const groups=Object.groupBy(original,c=>c.country);
 for(const {code} of countries){
  const country=data(`data/bulk/by-country/${code}.json`);
  const expanded=unpack(country);
  const expected=groups[code]||[];
  assert.equal(expanded.length,expected.length,code);
  assert.equal(new Set(expanded.map(c=>c.id)).size,expanded.length,code);
  for(const row of expanded)assert.equal(row.country,code);
  assert.deepEqual(expanded.map(c=>c.id),expected.map(c=>c.id),code);
 }
});
test('smaller public browser catalog leaves the original full dossier shards and translations untouched',()=>{
 const fullSize=statSync(new URL('../data/bulk/index.json',import.meta.url)).size;
 const liteSize=statSync(new URL('../data/bulk/listings.json',import.meta.url)).size;
 const france=statSync(new URL('../data/bulk/by-country/FR.json',import.meta.url)).size;
 const usa=statSync(new URL('../data/bulk/by-country/US.json',import.meta.url)).size;
 assert.ok(liteSize<fullSize*.6,`compact ${liteSize}/${fullSize}`);
 assert.ok(france<fullSize*.15);
 assert.ok(usa<fullSize*.5);
 const geipan=original.find(c=>c.id==='geipan-4851');
 assert.equal(geipan.summary.fr.length>30,true,'source French remains in authoritative index');
 const shard=data('data/bulk/shards/'+geipan.shard+'.json').cases.find(c=>c.id===geipan.id);
 assert.ok(shard.story?.en?.length>=1);
 assert.ok(shard.summary?.fr?.length>30);
 assert.equal(shard.translation.target_language,'en');
});
test('malformed or unsafe compact listings are rejected rather than silently misrepresented',()=>{
 const bad={...catalog,records:[...catalog.records.slice(0,2),[...catalog.records[2]]]};
 bad.records[2][7]='https://user:password@publisher.example/story';
 assert.throws(()=>unpack(bad),/Unsafe source URL/);
 assert.throws(()=>unpack({...catalog,schema_version:2}),/Unsupported/);
 assert.throws(()=>unpack({...catalog,records:'malformed'}),/Unsupported/);
 assert.throws(()=>unpack({...catalog,records:[['geipan-2']]}),/Invalid/);
 const source=[...original,original[0]];
 assert.throws(()=>packBulkListings(source),/Unsafe or incomplete/);
});
