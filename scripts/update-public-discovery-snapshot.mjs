// Compile source-catalog RSS matches OUTSIDE Cloudflare's public Worker.
// This is a list of attributed publisher headlines, NOT verified sightings.
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {discoverMatches} from '../functions/_lib/discovery.js';
import {REGIONS,SOURCE_CATALOG} from '../functions/_lib/source-catalog.js';
const DEST=new URL('../data/discovery-last-good.json',import.meta.url);
const sourceById=new Map(SOURCE_CATALOG.map(s=>[s.id,s]));
export function normalizeDiscoveryItems(rows){
 if(!Array.isArray(rows))return [];
 const result=[],seen=new Set;
 for(const item of rows){
  if(!item||typeof item!=='object'||typeof item.title!=='string'||typeof item.url!=='string'||typeof item.source_id!=='string')continue;
  const source=sourceById.get(item.source_id);
  if(!source)continue;
  let uri;try{uri=new URL(item.url)}catch{continue}
  const allowed=new Set([source.feed_host,...(source.link_hosts||[]),...(source.redirect_hosts||[])]);
  if(uri.protocol!=='https:'||uri.username||uri.password||uri.port||!allowed.has(uri.hostname.toLowerCase()))continue;
  const published=Date.parse(item.published);
  const title=item.title.replace(/\s+/gu,' ').trim().slice(0,240);
  if(!Number.isFinite(published)||title.length<8||seen.has(uri.href))continue;
  seen.add(uri.href);
  result.push({title,url:uri.href,source:item.source||source.publisher,
   source_id:source.id,source_role:source.role,source_region:source.region,
   feed_host:source.feed_host,published:new Date(published).toISOString(),language:source.language||'en'});
  if(result.length>=40)break;
 }
 return result;
}
export async function buildDiscoverySnapshot(collector=discoverMatches,now=new Date()){
 const regions={};
 for(const region of REGIONS){
  const raw=await collector({region,maxConcurrency:3,maxAttempts:1,timeoutMs:11000,now:now.getTime()});
  if(!raw||!Array.isArray(raw.checked)||!Array.isArray(raw.failed))throw Error('Malformed discovery response for '+region);
  const items=normalizeDiscoveryItems(raw.items);
  const unavailable=raw.status==='unavailable';
  regions[region]={status:unavailable?'unavailable':raw.status==='empty_region'?'empty_region':items.length?'cached':'no_matches',
   checked:raw.checked,failed:raw.failed.map(f=>({id:f.id,error:'fetch_failed'})),count:items.length,items};
 }
 if(regions.all.count<2)throw Error('Not enough sourced global publisher matches; keep previous discovery snapshot');
 return {schema_version:1,checked_on:now.toISOString().slice(0,10),collected_at:now.toISOString(),
  notice:'Publisher-feed keyword matches from a dated source-backed snapshot; no automatic verification or proof of non-human origin.',regions};
}
export async function refreshDiscoverySnapshot({collector=discoverMatches,now=new Date(),destination=DEST}={}){
 const data=await buildDiscoverySnapshot(collector,now);
 const contents=JSON.stringify(data,null,2)+'\n';JSON.parse(contents);
 await writeFile(destination,contents,'utf8');
 return Object.fromEntries(Object.entries(data.regions).map(([key,row])=>[key,row.count]));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log('Updated public discovery snapshot:',JSON.stringify(await refreshDiscoverySnapshot()))}
 catch(error){console.error('Keeping previous public discovery snapshot:',error?.message||String(error));process.exitCode=1}
}
