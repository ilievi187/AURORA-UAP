// Public archived cases only. Real 404 for absent records and server-generated
// SEO for the independently sourced editorial dossiers. No private D1 queries.
import {publicAssetJSON,public404,dossierMarkup,SEO_HEADERS,shardFor} from '../_lib/public-seo.js';
export async function onRequestGet({request,params,env}){
 const id=params?.id;
 if(typeof id!=='string'||!/^[a-z0-9-]{3,90}$/.test(id))return public404(request,env);
 let metadata=null;
 try{
  if(/^(?:geipan|bluebook)-[1-9]\d{0,12}$/.test(id)){
   const names=await publicAssetJSON(request,env,`/data/seo/bulk/${shardFor(id)}.json`);
   if(!Array.isArray(names)||!names.includes(id))return public404(request,env);
   // Bulk records are historical catalog references, not editorial features.
   metadata={title:'Source archive record '+id,indexable:false};
  }else{
   const curated=await publicAssetJSON(request,env,'/data/seo/curated.json');
   if(!curated||!Object.hasOwn(curated,id))return public404(request,env);
   metadata=curated[id];
  }
  const u=new URL(request.url);u.pathname='/dossier';u.search='';
  const asset=await env.ASSETS.fetch(new Request(u.toString()));
  if(!asset.ok)return new Response('Dossier template unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
  const html=dossierMarkup(await asset.text(),id,metadata);
  const headers=new Headers(asset.headers);
  headers.delete('Content-Length');headers.delete('ETag');
  headers.set('Content-Type','text/html; charset=utf-8');
  for(const [key,value] of Object.entries(SEO_HEADERS))headers.set(key,value);
  return new Response(html,{status:200,headers});
 }catch(error){
  console.error('public SEO route unavailable',String(error?.message||error).slice(0,140));
  return new Response('Public case temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
