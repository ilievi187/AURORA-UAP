/* Rebuild derived, source-attributed country counts and geographical map anchors.
 * Original Blue Book records lacking event coordinates are never assigned a point. */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const read=async(path)=>JSON.parse(await readFile(join(root,path),'utf8'));
const curated=(await read('data/cases.json')).cases;
const records=(await read('data/bulk/index.json')).cases;
const counts=new Map();
const validCode=code=>typeof code==='string'&&/^[A-Z]{2}$/.test(code)&&code!=='XZ';
for(const c of [...curated,...records]){
 const code=c.country;
 if(!validCode(code)||!c.source?.url?.startsWith('https://'))continue;
 counts.set(code,(counts.get(code)||0)+1);
}
const countries=[...counts.entries()].map(([code,count])=>({code,count})).sort((a,b)=>b.count-a.count||a.code.localeCompare(b.code));
const locations=[];
for(let i=0;i<64;i++){
 const file='data/bulk/shards/'+String(i).padStart(2,'0')+'.json';
 for(const c of (await read(file)).cases){
  if(!validCode(c.country)||!Number.isFinite(c.lat)||!Number.isFinite(c.lng)||
     Math.abs(c.lat)>90||Math.abs(c.lng)>180||c.location_precision!=='GEIPAN city-level reference')continue;
  locations.push({id:c.id,country:c.country,lat:c.lat,lng:c.lng,
    city:c.city?.en||'',date:c.date,
    precision:'city',source:'CNES GEIPAN',source_url:c.source.url});
 }
}
locations.sort((a,b)=>a.country.localeCompare(b.country)||a.id.localeCompare(b.id));
if(locations.length<2500||countries.find(c=>c.code==='US')?.count<7300||
   countries.find(c=>c.code==='FR')?.count<2700)throw Error('Partial or invalid archive; derived navigation not written');
if(new Set(locations.map(c=>c.id)).size!==locations.length)throw Error('Duplicate georeferenced source record');
const now={source:'UAPDrop CC BY 4.0 · CNES GEIPAN and US National Archives',country_assigned:countries.reduce((s,c)=>s+c.count,0),
 geo_anchors:locations.length,precision:'source city-level; not exact sighting position'};
await writeFile(join(root,'data/bulk/countries.json'),JSON.stringify({...now,countries})+'\n');
await writeFile(join(root,'data/bulk/geo-points.json'),JSON.stringify({...now,points:locations})+'\n');
console.log(JSON.stringify({...now,countries:countries.slice(0,10)}));
