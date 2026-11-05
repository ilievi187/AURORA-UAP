import {countryCode} from '../_lib/public.js';
import {publicAssetJSON,public404} from '../_lib/public-seo.js';
// Only serve countries that have PUBLIC records in the curated/source archive.
export async function onRequestGet({request,params,env}){
 const code=countryCode(params?.code);
 if(!code)return public404(request,env);
 try{
  const countries=await publicAssetJSON(request,env,'/data/seo/countries.json');
  if(!Array.isArray(countries)||!countries.includes(code))return public404(request,env);
  const url=new URL(request.url);url.pathname='/country';url.search='';
  const response=await env.ASSETS.fetch(new Request(url.toString(),{method:'GET'}));
  return new Response(response.body,{status:response.status,headers:response.headers});
 }catch(error){
  console.error('country SEO lookup unavailable',String(error?.message||error).slice(0,140));
  return new Response('Country index temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
