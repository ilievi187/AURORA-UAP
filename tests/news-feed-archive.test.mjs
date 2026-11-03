import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {archiveNewsItems,newsFeedArchiveSchemaReady,readNewsArchive} from '../functions/_lib/news-feed-archive.js';
import {onRequestPost as refreshNews} from '../functions/api/news-refresh.js';
import {onRequestGet as publicNews} from '../functions/api/news.js';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
function makeDb(){
 const sql=new DatabaseSync(':memory:');
 for(const migration of ['migrations/0001_init.sql','migrations/0002_intake_quarantine.sql','migrations/0003_newsroom.sql','migrations/0004_news_feed_archive.sql'])sql.exec(read(migration));
 const db={
  prepare(query){const stmt=sql.prepare(query);const make=args=>({bind(...values){return make(values)},async run(){const result=stmt.run(...args);return {meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid||0)}}},async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}}});return make([])},
  async batch(statements){sql.exec('BEGIN IMMEDIATE');try{const result=[];for(const statement of statements)result.push(await statement.run());sql.exec('COMMIT');return result}catch(error){sql.exec('ROLLBACK');throw error}}
 };
 return {db,sql};
}
const now='2026-11-03T12:00:00.000Z';
const items=Array.from({length:5},(_,index)=>({
 title:`Source-reported UAP bulletin number ${index+1}`,
 url:`https://publisher.example/news/story-${index+1}`,
 source:'Example Press',source_id:'example-press',published:'2026-11-02T10:00:00.000Z',
 language:'en',source_role:'news-search',source_region:'north-america'
}));
const refreshToken='test-only-news-refresh-token-never-used-outside-this-fixture';
const rss=()=>'<rss><channel>'+items.map(item=>`<item><title>${item.title}</title><link>${item.url}</link><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate><source>${item.source}</source></item>`).join('')+'</channel></rss>';
const refreshRequest=(host='aurorauap.org',authorization=`Bearer ${refreshToken}`)=>new Request(`https://${host}/api/news-refresh`,{method:'POST',headers:{Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify({edition:'global'})});
const refreshEnv=(DB,overrides={})=>({DB,AURORA_NEWS_ARCHIVE_ENABLED:'enabled',AURORA_NEWS_REFRESH_TOKEN:refreshToken,...overrides});

test('news archive migration retains source metadata without article bodies or visitor data',async()=>{
 const {db,sql}=makeDb();
 assert.equal(await newsFeedArchiveSchemaReady(db),true);
 const columns=sql.prepare('PRAGMA table_info(news_feed_archive)').all().map(row=>row.name);
 assert.ok(['title','source_name','source_url','published_at','first_seen_at','last_seen_at'].every(name=>columns.includes(name)));
 assert.ok(!columns.some(name=>/body|email|ip|attachment|file/i.test(name)));
});

test('archive rejects insecure or undated records and paginates preserved rows',async()=>{
 const {db}=makeDb();
 const result=await archiveNewsItems(db,{edition:'global',items:[
  items[0],{...items[1],url:'http://publisher.example/insecure'},
  {...items[2],published:'not-a-date'}
 ],seenAt:now});
 assert.equal(result.stored_count,1);assert.equal(result.invalid_count,2);assert.equal(result.duplicate_count,0);
 const first=await readNewsArchive(db,{edition:'global',limit:1,offset:0});
 const second=await readNewsArchive(db,{edition:'global',limit:1,offset:1});
 assert.equal(first.count,1);assert.equal(first.items.length,1);assert.equal(first.has_more,false);
 assert.equal(second.count,1);assert.equal(second.items.length,0);
});

test('feed records persist across refreshes and editions while preserving first-seen attribution',async()=>{
 const {db,sql}=makeDb();
 const first=await archiveNewsItems(db,{edition:'global',items:items.slice(0,2),seenAt:now});
 assert.equal(first.stored_count,2);
 const second=await archiveNewsItems(db,{edition:'official',items:[{...items[0],title:'A changed upstream headline'}],seenAt:'2026-11-03T18:00:00.000Z'});
 assert.equal(second.stored_count,1);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM news_feed_archive').get().n,2,'re-seeing an item does not create duplicate records');
 const global=await readNewsArchive(db,{edition:'global',limit:10,offset:0});
 const official=await readNewsArchive(db,{edition:'official',limit:10,offset:0});
 assert.equal(global.items.length,2);assert.equal(official.items.length,1);
 assert.equal(official.items[0].title,items[0].title,'upstream edits do not replace the preserved first-seen title');
 assert.equal(official.items[0].source,items[0].source);assert.equal(official.items[0].url,items[0].url);
 assert.equal(official.items[0].archival,true);
});

test('news refresh endpoint fails closed for missing feature flag, wrong host, and bad token',async()=>{
 const {db}=makeDb();
 assert.equal((await refreshNews({request:refreshRequest(),env:{...refreshEnv(db),AURORA_NEWS_ARCHIVE_ENABLED:'disabled'}})).status,503);
 assert.equal((await refreshNews({request:refreshRequest('preview.aurora-uap.pages.dev'),env:refreshEnv(db)})).status,403);
 assert.equal((await refreshNews({request:refreshRequest('aurorauap.org','Bearer wrong-token-value') ,env:refreshEnv(db)})).status,403);
});

test('news refresh rejects cross-origin, wrong media type, invalid JSON and unsupported methods',async()=>{
 const {db}=makeDb(),env=refreshEnv(db);
 const makeRequest=(options={})=>new Request('https://aurorauap.org/api/news-refresh',{method:'POST',headers:{Authorization:`Bearer ${refreshToken}`,'Content-Type':'application/json',...options.headers},body:options.body??JSON.stringify({edition:'global'})});
 assert.equal((await refreshNews({request:new Request('https://aurorauap.org/api/news-refresh'),env})).status,405);
 assert.equal((await refreshNews({request:makeRequest({headers:{Origin:'https://evil.example'}}),env})).status,403);
 assert.equal((await refreshNews({request:makeRequest({headers:{'Content-Type':'text/plain'}}),env})).status,415);
 assert.equal((await refreshNews({request:makeRequest({body:'{' }),env})).status,400);
 assert.equal((await refreshNews({request:makeRequest({body:JSON.stringify({edition:'arbitrary'})}),env})).status,400);
});

test('authorized scheduled refresh archives source-backed headlines from fixed feeds',async()=>{
 const {db,sql}=makeDb(),env=refreshEnv(db);
 const response=await refreshNews({request:refreshRequest(),env,fetcher:async()=>new Response(rss(),{headers:{'Content-Type':'application/rss+xml'}}),catalogFetcher:async()=>new Response('<rss><channel></channel></rss>',{headers:{'Content-Type':'application/rss+xml'}}),timeoutMs:1500});
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload.status,'refreshed');assert.equal(payload.edition,'global');assert.equal(payload.fetched_count,5);assert.equal(payload.stored_count,5);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM news_feed_archive').get().n,5);
});

test('public news falls back to durable archived headlines when every live source disappears',async()=>{
 const {db}=makeDb();
 await archiveNewsItems(db,{edition:'global',items:items.slice(0,2),seenAt:now});
 const response=await publicNews({request:new Request('https://aurorauap.org/api/news?edition=global'),env:{DB:db,AURORA_NEWS_ARCHIVE_ENABLED:'enabled',ASSETS:{fetch:async()=>new Response('missing',{status:404})}},fetcher:async()=>{throw Error('offline')},catalogFetcher:async()=>{throw Error('offline')}});
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload.status,'cached');assert.equal(payload.cache_source,'news_history_db');assert.equal(payload.items.length,2);
 assert.equal(payload.items[0].archival,true);assert.ok(payload.items.some(item=>item.url===items[1].url));
});
