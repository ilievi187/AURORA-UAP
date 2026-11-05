import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSourceSnapshot,normalizeSourceItems} from '../scripts/update-public-news-snapshot.mjs';
const now=new Date('2026-11-06T12:00:00Z');
const valid=i=>({title:'Sourced UAP story '+i,source:'Example Publisher',url:'https://publisher.example/'+i,published:'2026-11-05T11:00:00Z',language:'en',source_role:'news-search'});
test('news snapshot builder keeps source links and dates, without inventing stories',async()=>{
 let calls=0;
 const snapshot=await buildSourceSnapshot(async({edition})=>{calls++;return {items:Array.from({length:9},(_,i)=>valid(edition+'-'+i))}},now);
 assert.equal(calls,3);
 assert.equal(snapshot.schema_version,1);
 assert.equal(snapshot.checked_on,'2026-11-06');
 assert.equal(snapshot.collected_at,'2026-11-06T12:00:00.000Z');
 for(const edition of ['global','bulgaria','official']){
  assert.equal(snapshot.editions[edition].length,9);
  assert.equal(snapshot.editions[edition][0].source_role,'news-search');
  assert.match(snapshot.editions[edition][0].url,/^https:\/\/publisher\.example\//);
 }
 assert.ok(!JSON.stringify(snapshot).includes('reporter_email'));
});
test('headlines reject duplicate, insecure, undated, stale or tampered source URLs',()=>{
 const rows=[valid('safe'),valid('safe'),{...valid('http'),url:'http://evil.example/x'},
  {...valid('creds'),url:'https://user:pass@publisher.example/x'},
  {...valid('dated'),published:'not-a-date'},
  {...valid('future'),published:'2028-11-07'},
  {...valid('ancient'),published:'2024-11-07'},valid('also-safe')];
 assert.deepEqual(normalizeSourceItems(rows,100,now).map(x=>x.title),['Sourced UAP story safe','Sourced UAP story also-safe']);
});
test('no empty/incomplete refresh may overwrite last-good snapshot',async()=>{
 await assert.rejects(()=>buildSourceSnapshot(async({edition})=>({items:edition==='official'?[]:Array.from({length:7},(_,i)=>valid(edition+'-'+i))}),now),/Insufficient source-backed official coverage/);
});
