// Source-backed, scheduled snapshot built off the request path in GitHub Actions.
// Never transcribe articles or invent accounts; store headlines, attribution,
// publication timestamps and original HTTPS links only.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {collectNewsEdition} from '../functions/api/news.js';

const EDITIONS=['global','bulgaria','official'];
const LIMITS={global:120,bulgaria:60,official:80};
const DATA_PATH=new URL('../data/news-last-good.json',import.meta.url);
const validString=(value,max=280)=>typeof value==='string'?value.replace(/\s+/gu,' ').trim().slice(0,max):'';
export function normalizeSourceItems(rows,limit=120,now=new Date()){
  if(!Array.isArray(rows))return [];
  const seen=new Set(),result=[];
  for(const row of rows){
    if(!row || typeof row!=='object')continue;
    const title=validString(row.title),source=validString(row.source,100),published=validString(row.published,40);
    if(title.length<8||!source||!published)continue;
    let u;try{u=new URL(row.url)}catch{continue}
    if(u.protocol!=='https:'||u.username||u.password||u.port)continue;
    const date=Date.parse(published);
    if(!Number.isFinite(date)||date>now.getTime()+48*3600000||date<now.getTime()-92*86400000)continue;
    if(seen.has(u.href))continue;
    seen.add(u.href);
    result.push({title,source,url:u.href,published:new Date(date).toISOString(),
      language:/^[a-z]{2}(?:-[A-Za-z]{2,5})?$/.test(row.language||'')?row.language:'en',
      ...(typeof row.source_role==='string'&&row.source_role.length<55?{source_role:row.source_role}:{}),
      ...(typeof row.source_region==='string'&&row.source_region.length<55?{source_region:row.source_region}:{})});
    if(result.length>=limit)break;
  }
  return result;
}
export async function buildSourceSnapshot(collector=collectNewsEdition,now=new Date()){
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error('Invalid snapshot date');
  const editions={};
  for(const edition of EDITIONS){
    const collected=await collector({edition,timeoutMs:11000});
    const rows=normalizeSourceItems(collected?.items,LIMITS[edition],now);
    if(rows.length<5)throw Error('Insufficient source-backed '+edition+' coverage; old snapshot is retained');
    editions[edition]=rows;
  }
  return {schema_version:1,checked_on:now.toISOString().slice(0,10),collected_at:now.toISOString(),
    provenance:'RSS/Atom publisher and Google News search headlines collected by AURORA GitHub Actions; articles are external third-party publications.',
    notice:'Dated source-linked headline snapshot, not real-time reporting and not verification of a sighting. Original publisher links and published timestamps preserved.',
    editions};
}
export async function refreshSourceSnapshot({collector=collectNewsEdition,now=new Date(),destination=DATA_PATH}={}){
  const data=await buildSourceSnapshot(collector,now);
  // Reuse only exact previously machine-translated headlines. Publisher, URL,
  // original title and original language must all remain unchanged.
  let older=null;try{older=JSON.parse(await readFile(destination,'utf8'))}catch{}
  const lookup=new Map;
  for(const edition of ['global','bulgaria','official'])for(const row of older?.editions?.[edition]||[]){
    if(row?.translation?.status==='machine_translated'&&row.translation.target_language==='en'&&
       row.translation.source_language===row.language&&typeof row.translated_title==='string'&&row.translated_title.trim())
      lookup.set([row.url,row.title,row.language,row.source].join('\u0001'),row);
  }
  for(const edition of ['global','bulgaria','official'])for(const row of data.editions[edition]){
    const previous=lookup.get([row.url,row.title,row.language,row.source].join('\u0001'));
    if(previous){row.translated_title=previous.translated_title;row.source_language=previous.source_language||row.language;row.translation=previous.translation}
  }
  // Validation finishes before replacing the known-good file.
  const content=JSON.stringify(data,null,2)+'\n';
  JSON.parse(content);
  await writeFile(destination,content,'utf8');
  return Object.fromEntries(Object.entries(data.editions).map(([key,rows])=>[key,rows.length]));
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const rows=await refreshSourceSnapshot();
    console.log('Updated dated public news snapshot:',JSON.stringify(rows));
  }catch(error){
    console.error('Keeping last good news snapshot:',error?.message||String(error));
    process.exitCode=1;
  }
}
