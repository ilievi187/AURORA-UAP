/** Explicit, owner-authorized IndexNow notification for PUBLIC, INDEXABLE URLs.
 * The public key is an ownership marker, not a server credential. Neither the
 * private intake API nor unreviewed GEIPAN/Blue Book catalog records may enter
 * these submissions. Does NOT notify Google or guarantee search indexing.
 */
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const ROOT=new URL('../',import.meta.url);
const DOMAIN='aurorauap.org';
const ORIGIN='https://'+DOMAIN;
const ENDPOINT='https://api.indexnow.org/indexnow';
const PUBLIC=['/','/archive','/countries','/news','/media','/sources','/privacy'];
export function parseSitemapUrls(xml,metadata,countries){
 if(typeof xml!=='string'||!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')||
    !xml.trim().endsWith('</urlset>')||typeof metadata!=='object'||!Array.isArray(countries))
  throw Error('Invalid or unverified public sitemap');
 const matches=[...xml.matchAll(/<loc>([^<>]+)<\/loc>/g)];
 if(matches.length<50||matches.length>500)throw Error('Unexpected public sitemap URL count');
 const all=[],unique=new Set(),countrySet=new Set(countries);
 for(const [,value] of matches){
  // Search URL notification is only for known, verified public paths.
  if(value.includes('&')||value.includes('%')||value.includes('\\'))throw Error('Unexpected sitemap URL encoding');
  let url;try{url=new URL(value)}catch{throw Error('Invalid sitemap URL')}
  if(url.origin!==ORIGIN||url.username||url.password||url.port||url.search||url.hash||unique.has(url.href))
   throw Error('Duplicate, non-public or external sitemap URL');
  const name=url.pathname;
  if(!PUBLIC.includes(name)){
   if(name.startsWith('/countries/')){
    const code=name.slice('/countries/'.length);
    if(!/^[A-Z]{2}$/.test(code)||!countrySet.has(code))throw Error('Unknown country publication');
   }else if(name.startsWith('/archive/')){
    const id=name.slice('/archive/'.length);
    if(!/^[a-z0-9-]{3,90}$/.test(id)||metadata[id]?.indexable!==true)
     throw Error('Unreviewed, missing or private case cannot be submitted to search');
   }else throw Error('Private, unsupported or noindex path in sitemap: '+name);
  }
  unique.add(url.href);all.push(url.href);
 }
 // Prevent someone adding an extra alternate or redirect version.
 for(const p of PUBLIC)if(!unique.has(ORIGIN+p))throw Error('Missing public baseline route: '+p);
 return all;
}
export function makeIndexNowBody(urls,key){
 if(!Array.isArray(urls)||urls.length<1||urls.length>10000||
    typeof key!=='string'||!/^[a-f0-9]{32}$/.test(key))throw Error('Invalid IndexNow request body');
 for(const url of urls){
  const u=new URL(url);
  if(u.origin!==ORIGIN||u.search||u.hash)throw Error('External or non-canonical IndexNow URL');
 }
 return {host:DOMAIN,key,keyLocation:ORIGIN+'/'+key+'.txt',urlList:urls};
}
export async function findPublicKey(){
 const names=(await readdir(ROOT)).filter(name=>/^[a-f0-9]{32}\.txt$/.test(name));
 if(names.length!==1)throw Error('Expected exactly one root-owned IndexNow key file');
 const key=names[0].slice(0,-4);
 const content=(await readFile(new URL(names[0],ROOT),'utf8')).trim();
 if(key!==content)throw Error('IndexNow key file mismatch');
 return key;
}
export async function buildRequest(){
 const [xml,meta,countries,key]=await Promise.all([
  readFile(new URL('sitemap.xml',ROOT),'utf8'),
  readFile(new URL('data/seo/curated.json',ROOT),'utf8').then(JSON.parse),
  readFile(new URL('data/seo/countries.json',ROOT),'utf8').then(JSON.parse),
  findPublicKey()
 ]);
 const urls=parseSitemapUrls(xml,meta,countries);
 return makeIndexNowBody(urls,key);
}
export async function notifyIndexNow({fetcher=fetch}={}){
 const body=await buildRequest();
 // Verify public proof of ownership is *deployed* before any notifications.
 const proof=await fetcher(body.keyLocation,{method:'GET',signal:AbortSignal.timeout(15000),cache:'no-store'});
 if(!proof.ok||(await proof.text()).trim()!==body.key)
  throw Error('Public IndexNow ownership file not deployed or verified');
 const answer=await fetcher(ENDPOINT,{method:'POST',headers:{'content-type':'application/json; charset=utf-8'},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 const message=(await answer.text()).slice(0,300);
 if(![200,202].includes(answer.status))throw Error('IndexNow did not accept public notifications: HTTP '+answer.status+' '+message);
 return {status:answer.status,submittedUrls:body.urlList.length,endpoint:ENDPOINT,
  note:answer.status===200?'Notification accepted, not proof of indexing':'Notification received; ownership/processing pending'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.includes('--submit'))console.log('IndexNow:',JSON.stringify(await notifyIndexNow()));
  else{const body=await buildRequest();console.log('Public IndexNow dry-run:',JSON.stringify({host:body.host,urls:body.urlList.length,first:body.urlList[0],last:body.urlList.at(-1),proofFile:body.keyLocation}));}
 }catch(e){console.error('IndexNow notification failed closed:',e.message);process.exitCode=1}
}
