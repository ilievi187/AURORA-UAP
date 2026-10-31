// Read-only comparison of public AURORA archive data vs committed source.
// Never attempts to bypass Cloudflare bot protection or mutate production.
import { readFile } from 'node:fs/promises';
const local = JSON.parse(await readFile(new URL('../data/cases.json',import.meta.url), 'utf8'));
const expected = local.cases.length;
const urls = [
 'https://aurorauap.org/data/cases.json',
 'https://aurora-uap.pages.dev/data/cases.json',
 'https://e7a80214.aurora-uap.pages.dev/data/cases.json'
];
console.log('Repository committed cases:',expected);
for(const url of urls){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(url,{
   headers:{'Accept':'application/json','User-Agent':'AURORA-UAP-deployment-health/1.0','Cache-Control':'no-cache'},
   signal:controller.signal,redirect:'follow'
  });
  const result={url,status:response.status,contentType:response.headers.get('content-type'),
   age:response.headers.get('age'),cfCacheStatus:response.headers.get('cf-cache-status'),
   cacheControl:response.headers.get('cache-control')};
  if(response.ok){
   const data=await response.json();
   result.cases=Array.isArray(data.cases)?data.cases.length:null;
   result.matchesCommit=result.cases===expected;
  }else result.note='HTTP blocked or unavailable; no WAF retry or bypass';
  console.log(JSON.stringify(result));
 }catch(error){
  console.log(JSON.stringify({url,error:String(error?.name||error).slice(0,90),note:'inconclusive; no retry/bypass'}));
 }finally{clearTimeout(timer)}
}
