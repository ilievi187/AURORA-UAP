/**
 * Capture direct publisher-supplied video-preview URLs for the DVIDS records
 * that are already in AURORA's sourced public archive. No arbitrary scrape,
 * rehosting, synthetic image, or unsupported title matching is allowed.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const ROOT=new URL('../',import.meta.url);
const OUT=new URL('../data/media-source-posters.json',import.meta.url);
const SOURCE_HOST='www.dvidshub.net';
const IMAGE_HOST='d1ldvf68ux039x.cloudfront.net';
const read=async url=>JSON.parse(await readFile(url,'utf8'));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function providerVideoId(value){
 try{
  const u=new URL(value);
  if(u.protocol!=='https:'||u.hostname!==SOURCE_HOST||u.port||u.username||u.password||u.hash)return null;
  const m=u.pathname.match(/^\/video\/([1-9]\d{5,8})(?:\/[a-z0-9-]+)?\/?$/);
  return m?.[1]??null;
 }catch{return null}
}
export function approvedPublisherPoster(image,source){
 const id=providerVideoId(source);if(!id||typeof image!=='string')return false;
 try{
  const u=new URL(image);
  return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash&&u.hostname===IMAGE_HOST&&
   new RegExp(`^/thumbs/frames/video/\\d{4}/${id}/[A-Za-z0-9._-]{5,90}/(?:486x274_q95|1000w_q95)\\.jpg$`).test(u.pathname);
 }catch{return false}
}
export function extractPublisherPoster(html,source){
 if(typeof html!=='string'||html.length>400_000)throw Error('Invalid provider page');
 const matches=[...html.matchAll(/<meta\s+([^>]{1,1200})>/gi)];
 for(const kind of ['twitter:image','og:image']){
  for(const [,attributes] of matches){
   const name=(attributes.match(/(?:name|property)=["']([^"']+)["']/i)||[])[1];
   if(name!==kind)continue;
   const raw=(attributes.match(/content=["']([^"']+)["']/i)||[])[1];
   if(!raw||!approvedPublisherPoster(raw,source))continue;
   return raw;
  }
 }
 throw Error('No source-approved publisher video still found');
}
export function expectedVideos(cases){
 const videos=new Map();
 for(const c of cases){
  if(!Array.isArray(c.media))continue;
  for(const media of c.media){
   const id=providerVideoId(media.url);
   if(media.type!=='video'||!id)continue;
   if(videos.has(media.url))throw Error('Duplicate media source URL');
   videos.set(media.url,id);
  }
 }
 if(videos.size<10||videos.size>50)throw Error('Unexpected DVIDS video inventory');
 return videos;
}
export function validatePosterData(data,cases,{requireCoverage=true}={}){
 const videos=expectedVideos(cases);
 if(data?.schema_version!==1||data.provider!=='dvids'||!Array.isArray(data.items))throw Error('Invalid publisher poster manifest');
 const unique=new Set();
 for(const x of data.items){
  if(!x||!videos.has(x.source_url)||videos.get(x.source_url)!==x.video_id||
    !approvedPublisherPoster(x.poster_url,x.source_url)||unique.has(x.source_url))
   throw Error('Invalid or unverified source image');
  unique.add(x.source_url);
 }
 if(requireCoverage&&unique.size!==videos.size)throw Error('Publisher poster inventory incomplete');
 return {total:videos.size,withSourceImage:unique.size};
}
export async function buildPublisherPosters({fetcher=fetch,now=new Date(),output=OUT}={}){
 const cases=(await read(new URL('../data/cases.json',import.meta.url))).cases;
 const sources=[...expectedVideos(cases).entries()];
 const posters=[];
 let next=0;
 const worker=async()=>{
  while(next<sources.length){
   const [url,id]=sources[next++];let last;
   for(let n=0;n<3;n++){
    try{
     const response=await fetcher(url,{headers:{Accept:'text/html','User-Agent':'AURORA-UAP-Source-Preview-Check/1.0'},signal:AbortSignal.timeout(15000)});
     if(!response.ok)throw Error('Publisher HTTP '+response.status);
     const html=await response.text();
     const poster=extractPublisherPoster(html,url);
     posters.push({source_url:url,video_id:id,poster_url:poster});
     last=null;break;
    }catch(e){last=e;if(n<2)await wait(550*(n+1))}
   }
   if(last)throw Error('Cannot verify publisher poster for '+id+': '+last.message);
   await wait(180);
  }
 };
 await Promise.all(Array.from({length:3},()=>worker()));
 posters.sort((a,b)=>a.source_url.localeCompare(b.source_url));
 const data={schema_version:1,provider:'dvids',checked_on:now.toISOString().slice(0,10),
  notice:'Each image URL comes from the original publisher video-page Open Graph metadata and is linked directly, never rehosted or presented as independent case evidence.',items:posters};
 const result=validatePosterData(data,cases);
 await writeFile(output,JSON.stringify(data,null,2)+'\n');
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.includes('--check')){
   const cases=(await read(new URL('../data/cases.json',import.meta.url))).cases;
   console.log('Source image integrity:',JSON.stringify(validatePosterData(await read(OUT),cases)));
  }else console.log('Publisher video stills:',JSON.stringify(await buildPublisherPosters()));
 }catch(e){console.error(e.message);process.exitCode=1}
}
