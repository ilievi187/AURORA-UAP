import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {translatePublicHeadline,validateTranslatedSnapshot,translateSnapshot} from '../scripts/translate-public-news-snapshot.mjs';
import {translateNewsPage} from '../functions/_lib/news-translation.js';
import {onRequestGet as getNews} from '../functions/api/news.js';
const fixture=(language='bg')=>({title:'Свидетели съобщиха за необичаен обект',source:'Example News',url:'https://publisher.example/uap',published:new Date().toISOString(),language,source_role:'specialist-press'});
const sample={schema_version:1,checked_on:new Date().toISOString().slice(0,10),editions:{
 global:Array.from({length:8},(_,i)=>({...fixture(i===0?'bg':'en'),title:i===0?fixture().title:'English UAP source report '+i,url:`https://publisher.example/global-${i}`})),
 bulgaria:Array.from({length:8},(_,i)=>({...fixture('bg'),url:`https://publisher.example/bg-${i}`})),
 official:Array.from({length:8},(_,i)=>({...fixture('en'),title:'Source-backed UAP research '+i,url:`https://publisher.example/official-${i}`}))
}};
test('public headline translation preserves attribution and validates provider JSON',async()=>{
 const calls=[];
 const translated=await translatePublicHeadline('НЛО над Шумен','bg',{fetcher:async (uri,options)=>{
  const u=new URL(uri);calls.push(u);
  assert.equal(u.hostname,'translate.googleapis.com');assert.equal(u.searchParams.get('sl'),'bg');assert.equal(u.searchParams.get('tl'),'en');assert.equal(u.searchParams.get('q'),'НЛО над Шумен');
  assert.ok(options.signal);
  return Response.json([[['UFO over Shumen','НЛО над Шумен']]]);
 }});
 assert.equal(translated,'UFO over Shumen');assert.equal(calls.length,1);
 await assert.rejects(()=>translatePublicHeadline('НЛО над Шумен','bg',{fetcher:async()=>Response.json([[]])}),/Malformed|Non-English/);
 await assert.rejects(()=>translatePublicHeadline('НЛО над Шумен','bg',{fetcher:async()=>Response.json([[['НЛО над Шумен']]])}),/Non-English/);
});
test('complete source-linked feed translations retain originals and make visitor AI unnecessary',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'aurora-news-translation-'));
 const file=path.join(dir,'news.json');
 try{
  await writeFile(file,JSON.stringify(sample));let calls=0;
  const result=await translateSnapshot({file,attempts:1,concurrency:2,fetcher:async()=>{calls++;return Response.json([[['Witnesses report unusual object','original']]])}});
  assert.equal(result.nonEnglish,9);assert.equal(result.translated,9);assert.equal(calls,9);
  const data=JSON.parse(await readFile(file,'utf8'));
  assert.equal(data.editions.global[0].title,fixture().title);
  assert.equal(data.editions.global[0].source,fixture().source);
  assert.equal(data.editions.global[0].url,'https://publisher.example/global-0');
  assert.equal(data.editions.global[0].translated_title,'Witnesses report unusual object');
  assert.equal(data.editions.global[0].translation.editorial_reviewed,false);
  const served=await translateNewsPage(data.editions.global,'en',0,undefined);
  assert.equal(served.translation.status,'translated');
  assert.equal(served.items[0].source_language,'bg','Bulgarian Ъ must not be guessed as Russian');
  assert.equal(served.items[0].translated_title,'Witnesses report unusual object');
  const requestedFrench=await translateNewsPage(data.editions.global,'fr',0,undefined);
  assert.equal(requestedFrench.items[0].translated_title,undefined,'English MT cannot masquerade as French');
  assert.equal(requestedFrench.items[0].title,fixture().title);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('bad external translation leaves last good public snapshot bytes unchanged',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'aurora-news-failclosed-')),file=path.join(dir,'snapshot.json');
 try{
  const raw=JSON.stringify(sample);await writeFile(file,raw);
  await assert.rejects(()=>translateSnapshot({file,attempts:1,concurrency:1,fetcher:async()=>new Response('translator offline',{status:503})}),/translation failed/);
  assert.equal(await readFile(file,'utf8'),raw);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('Cloudflare serves precomputed verified English headline from a source snapshot',async()=>{
 const original=fixture();original.translated_title='Witnesses report unusual object';
 original.source_language='bg';
 original.translation={status:'machine_translated',source_language:'bg',target_language:'en',method:'automated',editorial_reviewed:false};
 const snapshot={schema_version:1,checked_on:new Date().toISOString().slice(0,10),editions:{global:[original,{...fixture('en'),title:'English public case report',url:'https://publisher.example/english'}]}};
 const r=await getNews({request:new Request('https://aurorauap.org/api/news?edition=global&lang=en&offset=0'),env:{ASSETS:{fetch:async()=>Response.json(snapshot)}},fetcher:async()=>{throw Error('Visitor must not fetch feeds')}});
 assert.equal(r.status,200);const d=await r.json();
 assert.equal(d.items[0].translated_title,'Witnesses report unusual object');
 assert.equal(d.items[0].title,fixture().title);
 assert.equal(d.items[0].source_language,'bg');
 assert.equal(d.translation.status,'translated');
});
