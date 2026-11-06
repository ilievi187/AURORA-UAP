/** Derive small, read-only PUBLIC browser indexes from the licensed full archive.
 * No translation, reclassification, or media invention; full originals stay in
 * data/bulk/shards and the authoritative data/bulk/index.json.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const ROOT=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const relative=(name)=>path.join(ROOT,name);
const ID=/^(?:geipan|bluebook)-[1-9]\d{0,12}$/;
const COUNTRY=/^[A-Z]{2}$/;
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname.includes('.')}catch{return false}};
export function packBulkListings(cases){
 if(!Array.isArray(cases)||cases.length<9000||cases.length>25000)throw Error('Incomplete source archive');
 const names=[],seenSources=new Map(),ids=new Set(),byCountry=new Map(),records=[];
 for(const c of cases){
  if(!ID.test(c?.id||'')||ids.has(c.id)||typeof c.date!=='string'||!COUNTRY.test(c.country)||
    !safeUrl(c.source?.url)||typeof c.source?.name!=='string'||
    !c.title?.en?.trim()||!c.summary?.en?.trim()||typeof c.city?.en!=='string')throw Error('Unsafe or incomplete source record: '+String(c?.id).slice(0,55));
  ids.add(c.id);
  let source=seenSources.get(c.source.name);
  if(source===undefined){source=names.length;names.push(c.source.name);seenSources.set(c.source.name,source)}
  // Stable schema. English display only; original French and complete evidence
  // remain in per-dossier shards, not dropped from the source collection.
  const row=[c.id,c.date,c.country,c.city.en,c.title.en,c.summary.en,source,c.source.url];
  records.push(row);
  if(!byCountry.has(c.country))byCountry.set(c.country,[]);
  byCountry.get(c.country).push(row);
 }
 const build=rows=>({schema_version:1,sources:names,records:rows});
 const countryFiles=Object.fromEntries([...byCountry].map(([code,rows])=>[code,build(rows)]));
 return {all:build(records),countries:countryFiles,counts:Object.fromEntries([...byCountry].map(([code,rows])=>[code,rows.length]))};
}
export async function expectedBulkListings(){
 const source=JSON.parse(await readFile(relative('data/bulk/index.json'),'utf8'));
 const result=packBulkListings(source.cases);
 // Some published countries have only curated dossiers. Serve an empty,
 // valid source shard for them rather than making their visitors request a 404.
 const published=JSON.parse(await readFile(relative('data/bulk/countries.json'),'utf8'));
 if(!Array.isArray(published.countries))throw Error('Missing published country inventory');
 for(const entry of published.countries){
  const code=entry.code;
  if(!/^[A-Z]{2}$/.test(code)||!Number.isSafeInteger(entry.count)||entry.count<1)throw Error('Invalid published country');
  if(!Object.hasOwn(result.countries,code))result.countries[code]={schema_version:1,sources:result.all.sources,records:[]};
 }
 const files={'data/bulk/listings.json':JSON.stringify(result.all)+'\n'};
 for(const [code,rows] of Object.entries(result.countries))files[`data/bulk/by-country/${code}.json`]=JSON.stringify(rows)+'\n';
 return {files,counts:result.counts,sourceCount:source.cases.length};
}
export async function syncBulkListings({check=false}={}){
 const {files,counts,sourceCount}=await expectedBulkListings();
 if(!check)await mkdir(relative('data/bulk/by-country'),{recursive:true});
 for(const [file,data] of Object.entries(files)){
  if(check){let current;try{current=await readFile(relative(file),'utf8')}catch{throw Error('Missing bulk listing: '+file)}
   if(current!==data)throw Error('Stale bulk listing: '+file);
  }else await writeFile(relative(file),data,'utf8');
 }
 return {sourceCount,bytes:Buffer.byteLength(files['data/bulk/listings.json']),countryCount:Object.keys(files).length-1,us:counts.US,fr:counts.FR};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await syncBulkListings({check:process.argv.includes('--check')})))}
 catch(e){console.error(e.message);process.exitCode=1}
}
