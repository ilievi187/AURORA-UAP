import {urlKey} from './headline-dedup.js';

const EDITIONS=new Set(['global','bulgaria','official']);
const clean=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.trim().length<=max&&!/[\u0000-\u001f\u007f]/.test(value)?value.trim():'';
function safeSourceUrl(value){
 if(typeof value!=='string'||value.length>1200)return null;
 try{
  const url=new URL(value);
  const host=url.hostname.toLowerCase();
  if(url.protocol!=='https:'||url.username||url.password||url.port||host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal'))return null;
  if(/^127\.|^10\.|^192\.168\.|^169\.254\.|^0\./.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host))return null;
  return url.href;
 }catch{return null}
}
function validIso(value){
 const timestamp=Date.parse(value);
 return typeof value==='string'&&Number.isFinite(timestamp)?new Date(timestamp).toISOString():null;
}
export function newsFeedArchiveSchemaReady(db){
 if(!db||typeof db.prepare!=='function')return Promise.resolve(false);
 return (async()=>{
  try{
   const rows=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('news_feed_archive','news_feed_archive_editions')").all();
   const names=new Set((rows?.results||[]).map(row=>row.name));
   return names.has('news_feed_archive')&&names.has('news_feed_archive_editions');
  }catch{return false}
 })();
}
function normalizeItem(item){
 if(!item||typeof item!=='object')return null;
 const title=clean(item.title,280),source_name=clean(item.source,100),source_url=safeSourceUrl(item.url),published_at=validIso(item.published);
 if(title.length<8||!source_name||!source_url||!published_at)return null;
 const source_key=urlKey(source_url);
 if(!source_key||source_key.length<12||source_key.length>1200)return null;
 const language=clean(item.language||'en',5);
 return {
  source_key,title,source_name,source_url,
  source_id:clean(item.source_id||'',100),
  source_language:language.length>=2?language:'und',
  source_role:clean(item.source_role||'',60),
  source_region:clean(item.source_region||'',120),
  published_at
 };
}
export async function archiveNewsItems(db,{edition,items,seenAt=new Date().toISOString()}={}){
 if(!EDITIONS.has(edition)||!Array.isArray(items)||typeof db?.prepare!=='function'||typeof db?.batch!=='function')throw Error('invalid_news_archive_request');
 const seen_at=validIso(seenAt);if(!seen_at)throw Error('invalid_seen_at');
 const unique=new Map;let invalid_count=0,duplicate_count=0;
 for(const item of items){
  const normalized=normalizeItem(item);
  if(!normalized){invalid_count++;continue}
  if(unique.has(normalized.source_key)){duplicate_count++;continue}
  unique.set(normalized.source_key,normalized);
 }
 const rows=[...unique.values()];
 let stored_count=0;
 // Keep D1 batches below provider statement caps; retries are idempotent by source URL.
 for(let index=0;index<rows.length;index+=40){
  const batchRows=rows.slice(index,index+40),statements=[];
  for(const item of batchRows){
   statements.push(db.prepare(`INSERT INTO news_feed_archive
    (source_key,title,source_name,source_url,source_id,source_language,source_role,source_region,published_at,first_seen_at,last_seen_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(source_key) DO UPDATE SET last_seen_at=excluded.last_seen_at`).bind(
     item.source_key,item.title,item.source_name,item.source_url,item.source_id,item.source_language,item.source_role,item.source_region,item.published_at,seen_at,seen_at));
   statements.push(db.prepare(`INSERT INTO news_feed_archive_editions(source_key,edition,first_seen_at,last_seen_at)
    VALUES(?,?,?,?) ON CONFLICT(source_key,edition) DO UPDATE SET last_seen_at=excluded.last_seen_at`).bind(item.source_key,edition,seen_at,seen_at));
  }
  const result=await db.batch(statements);
  stored_count+=batchRows.length;
  if(!Array.isArray(result)||result.length!==statements.length)throw Error('news_archive_batch_incomplete');
 }
 return {stored_count,unique_count:rows.length,invalid_count,duplicate_count};
}
export async function readNewsArchive(db,{edition,limit=200,offset=0}={}){
 if(!EDITIONS.has(edition)||!Number.isInteger(limit)||limit<1||limit>200||!Number.isInteger(offset)||offset<0||offset>1000000||!db||typeof db.prepare!=='function')return {items:[],count:0,has_more:false};
 try{
  const count=await db.prepare('SELECT COUNT(*) AS count FROM news_feed_archive a JOIN news_feed_archive_editions e ON e.source_key=a.source_key WHERE e.edition=?').bind(edition).first();
  const result=await db.prepare(`SELECT a.*,e.first_seen_at AS edition_first_seen_at,e.last_seen_at AS edition_last_seen_at
   FROM news_feed_archive a JOIN news_feed_archive_editions e ON e.source_key=a.source_key
   WHERE e.edition=? ORDER BY a.published_at DESC,a.source_key ASC LIMIT ? OFFSET ?`).bind(edition,limit+1,offset).all();
  const rows=(result?.results||[]),has_more=rows.length>limit;
  const items=rows.slice(0,limit).map(row=>({
   title:row.title,source:row.source_name,url:row.source_url,published:row.published_at,
   language:row.source_language,source_id:row.source_id||undefined,
   source_role:row.source_role||undefined,source_region:row.source_region||undefined,
   archival:true,first_seen_at:row.first_seen_at,last_seen_at:row.last_seen_at,
   edition_first_seen_at:row.edition_first_seen_at,edition_last_seen_at:row.edition_last_seen_at
  }));
  return {items,count:Number(count?.count)||0,has_more};
 }catch{return {items:[],count:0,has_more:false}}
}
