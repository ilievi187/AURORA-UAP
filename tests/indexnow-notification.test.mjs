import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildRequest,parseSitemapUrls,makeIndexNowBody,notifyIndexNow} from '../scripts/submit-indexnow.mjs';
const xml=readFileSync(new URL('../sitemap.xml',import.meta.url),'utf8');
const metadata=JSON.parse(readFileSync(new URL('../data/seo/curated.json',import.meta.url),'utf8'));
const countries=JSON.parse(readFileSync(new URL('../data/seo/countries.json',import.meta.url),'utf8'));
test('exact indexed public URL inventory contains only 124 valid same-origin canonical URLs',async()=>{
 const urls=parseSitemapUrls(xml,metadata,countries),body=await buildRequest();
 assert.equal(urls.length,124);assert.equal(body.urlList.length,124);
 assert.deepEqual(urls,body.urlList);
 assert.equal(body.host,'aurorauap.org');
 assert.match(body.keyLocation,/^https:\/\/aurorauap\.org\/[a-f0-9]{32}\.txt$/);
 assert.ok(urls.includes('https://aurorauap.org/archive/westall-1966'));
 assert.ok(urls.includes('https://aurorauap.org/countries/FR'));
 assert.ok(!urls.some(u=>/\/api\/|\/donate|\/report|\/moderation|geipan-|bluebook-/.test(u)));
 for(const u of urls)assert.equal(new URL(u).origin,'https://aurorauap.org');
});
test('reject private, external, unreviewed, duplicate and non-canonical URLs before any outbound request',()=>{
 const replacements=[
  'https://evil.example/',
  'https://aurorauap.org/api/moderation',
  'https://aurorauap.org/archive/geipan-4851',
  'https://aurorauap.org/archive/this-is-unreviewed',
  'https://aurorauap.org/countries/ZZ',
  'https://aurorauap.org/news?admin=true',
  'http://aurorauap.org/',
  'https://aurorauap.org/archive/westall-1966#tracking',
 ];
 for(const value of replacements){
  const injected=xml.replace('<loc>https://aurorauap.org/archive/westall-1966</loc>',`<loc>${value}</loc>`);
  assert.throws(()=>parseSitemapUrls(injected,metadata,countries),/external|private|Unknown|Unreviewed|non-public|Unexpected|Missing|Invalid/i,value);
 }
 const dupe=xml.replace('<loc>https://aurorauap.org/archive/westall-1966</loc>','<loc>https://aurorauap.org/</loc>');
 assert.throws(()=>parseSitemapUrls(dupe,metadata,countries),/Duplicate/);
 assert.throws(()=>makeIndexNowBody(['https://evil.example/'], '0'.repeat(32)),/External/);
 assert.throws(()=>makeIndexNowBody(['https://aurorauap.org/'], 'not-a-key'),/Invalid/);
});
test('explicit public ownership proof is checked before posting notification',async()=>{
 let seen=[];
 await assert.rejects(()=>notifyIndexNow({fetcher:async (url,opts)=>{
  seen.push({url,method:opts?.method});return new Response('Not deployed',{status:404});
 }}),/not deployed/);
 assert.equal(seen.length,1);
 assert.match(seen[0].url,/\.txt$/);
});
test('IndexNow receives exactly 124 canonical public URLs and reports acceptance, not ranking or indexing',async()=>{
 let payload,posted=false;
 const actual=await buildRequest();
 const result=await notifyIndexNow({fetcher:async (url,options)=>{
  if(options.method==='GET'){
   assert.equal(url,actual.keyLocation);
   return new Response(actual.key,{status:200});
  }
  assert.equal(url,'https://api.indexnow.org/indexnow');
  assert.equal(options.method,'POST');
  payload=JSON.parse(options.body);posted=true;
  return new Response('',{status:200});
 }});
 assert.equal(posted,true);
 assert.equal(payload.host,'aurorauap.org');
 assert.equal(payload.key,actual.key);
 assert.equal(payload.keyLocation,actual.keyLocation);
 assert.equal(payload.urlList.length,124);
 assert.equal(result.status,200);
 assert.match(result.note,/not proof of indexing/);
});
test('provider rejection is never mislabeled as a successful indexing request',async()=>{
 const req=await buildRequest();
 await assert.rejects(()=>notifyIndexNow({fetcher:async (_url,opts)=>opts.method==='GET'
  ?new Response(req.key,{status:200}):new Response('Server rejected',{status:429})}),/did not accept/);
});
