/** Produce a small, exact, public-only Pages lookup and a conservative sitemap.
 * Run when curated/bulk archive data changes. CI checks that output matches.
 * Only substantial edited dossiers are indexable; imported catalog metadata is not.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=new URL('../',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
export const shardFor=id=>{let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619)>>>0;return String(h%64).padStart(2,'0')};
const base=['/','/archive','/countries','/news','/media','/sources','/privacy'];
const lang=(v)=>typeof v==='string'?v.trim():'';
const goodSource=url=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname.includes('.')}catch{return false}};
export function buildSeoAssets(curated,bulk,countries){
 if(!Array.isArray(curated?.cases)||!Array.isArray(bulk?.cases)||!Array.isArray(countries?.countries))throw Error('Invalid public archive source');
 const curatedMeta={},countryCodes=new Set,shards={};
 for(let n=0;n<64;n++)shards[String(n).padStart(2,'0')]=[];
 const ids=new Set();
 for(const row of curated.cases){
  if(typeof row.id!=='string'||!/^[a-z0-9-]{3,90}$/.test(row.id)||ids.has(row.id)||row.private===true||row.record_kind==='demo')throw Error('Invalid, private or duplicate curated record');
  ids.add(row.id);
  const title=lang(row.title?.en),summary=lang(row.summary?.en),source=lang(row.source?.url);
  const sourceOk=goodSource(source);
  const paragraphs=Array.isArray(row.story?.en)?row.story.en.filter(s=>typeof s==='string'&&s.trim().length>0):[];
  const indexable=title.length>=8&&summary.length>=110&&paragraphs.length>0&&sourceOk;
  curatedMeta[row.id]={title,summary,source:sourceOk?source:'',indexable};
  const country=row.country_code||row.country;
  if(typeof country==='string'&&/^[A-Z]{2}$/.test(country))countryCodes.add(country);
 }
 for(const row of bulk.cases){
  const id=row.id;
  if(typeof id!=='string'||!/^(?:geipan|bluebook)-[1-9]\d{0,12}$/.test(id)||ids.has(id))throw Error('Invalid or duplicate sourced catalog record');
  ids.add(id);shards[shardFor(id)].push(id);
 }
 for(const entry of countries.countries){if(entry?.count>0&&/^[A-Z]{2}$/.test(entry.code||''))countryCodes.add(entry.code)}
 for(const ids of Object.values(shards))ids.sort();
 const codes=[...countryCodes].sort(),indexed=Object.keys(curatedMeta).filter(id=>curatedMeta[id].indexable).sort();
 const paths=[...base,...codes.map(code=>'/countries/'+code),...indexed.map(id=>'/archive/'+id)];
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+paths.map(p=>'  <url><loc>https://aurorauap.org'+p+'</loc></url>\n').join('')+'</urlset>\n';
 return {curated:curatedMeta,countries:codes,shards,xml,totals:{curated:Object.keys(curatedMeta).length,bulk:bulk.cases.length,indexed:indexed.length,countries:codes.length,urls:paths.length}};
}
const stable=value=>JSON.stringify(value,null,0)+'\n';
export async function expectedFiles(){
 const assets=buildSeoAssets(await read('data/cases.json'),await read('data/bulk/index.json'),await read('data/bulk/countries.json'));
 const files={'sitemap.xml':assets.xml,'data/seo/curated.json':stable(assets.curated),'data/seo/countries.json':stable(assets.countries)};
 for(const [n,ids] of Object.entries(assets.shards))files[`data/seo/bulk/${n}.json`]=stable(ids);
 return {files,totals:assets.totals};
}
export async function syncPublicSeo({check=false}={}){
 const {files,totals}=await expectedFiles();
 if(!check){await mkdir(new URL('data/seo/bulk/',root),{recursive:true})}
 for(const [name,content] of Object.entries(files)){
  const url=new URL(name,root);
  if(check){let existing;try{existing=await readFile(url,'utf8')}catch{throw Error('SEO artifact missing: '+name)}
   if(existing!==content)throw Error('SEO artifact stale: '+name);
  }else await writeFile(url,content,'utf8');
 }
 return totals;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const check=process.argv.slice(2).includes('--check');const totals=await syncPublicSeo({check});console.log(check?'Verified public SEO data:':'Built public SEO data:',JSON.stringify(totals))}
 catch(error){console.error(error.message);process.exitCode=1}
}
