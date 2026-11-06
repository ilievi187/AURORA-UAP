/** Translate PUBLIC source-linked publisher headlines into English during the
 * scheduled GitHub feed build, never from a visitor's Cloudflare Worker request.
 * Original headlines, URLs, source language and publication dates are retained.
 * Fail closed on translator failures: old known-good snapshot stays deployed.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const OUTPUT=fileURLToPath(new URL('../data/news-last-good.json',import.meta.url));
const LANGUAGE=/^(?:bg|de|es|fr|it|ja|pt|ru|en)$/;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const safeHeadline=s=>typeof s==='string'&&s.trim().length>=4&&s.trim().length<=650&&!/[\u0000-\u001f]/.test(s);
const verifiedEnglish=item=>{
 if(!safeHeadline(item?.translated_title)||item.translation?.status!=='machine_translated'||item.translation?.target_language!=='en'||item.translation?.source_language!==item.language)return false;
 // A Cyrillic/Japanese title cannot be mislabeled as an English translation.
 if(/[\u0400-\u052f\u3040-\u30ff\u4e00-\u9fff]/.test(item.translated_title))return false;
 return true;
};
export async function translatePublicHeadline(title,source,{fetcher=fetch}={}){
 if(!safeHeadline(title)||!LANGUAGE.test(source)||source==='en')throw Error('Invalid headline/source language');
 const uri=new URL('https://translate.googleapis.com/translate_a/single');
 for(const [key,value] of Object.entries({client:'gtx',sl:source,tl:'en',dt:'t',q:title}))uri.searchParams.set(key,value);
 const response=await fetcher(uri.toString(),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(11000)});
 if(!response.ok)throw Error('Machine translator unavailable '+response.status);
 const data=await response.json();
 if(!Array.isArray(data)||!Array.isArray(data[0]))throw Error('Malformed machine translation');
 const result=data[0].map(part=>Array.isArray(part)&&typeof part[0]==='string'?part[0]:'').join('').replace(/\s+/g,' ').trim();
 if(!safeHeadline(result)||/[\u0400-\u052f\u3040-\u30ff\u4e00-\u9fff]/.test(result))throw Error('Non-English translation output');
 return result;
}
export function validateTranslatedSnapshot(data){
 if(data?.schema_version!==1||!data.editions||typeof data.editions!=='object')throw Error('Missing news editions');
 let total=0,nonEnglish=0,translated=0;
 for(const edition of ['global','bulgaria','official']){
  const rows=data.editions[edition];if(!Array.isArray(rows)||rows.length<5)throw Error('Insufficient '+edition+' source records');
  for(const item of rows){
   if(!safeHeadline(item.title)||!LANGUAGE.test(item.language)||!/^https:\/\//.test(item.url||''))throw Error('Invalid attributed headline');
   total++;
   if(item.language==='en')continue;
   nonEnglish++;
   if(!verifiedEnglish(item))throw Error('Untranslated source headline: '+item.language+' · '+item.title.slice(0,65));
   translated++;
  }
 }
 return {total,nonEnglish,translated};
}
export async function translateSnapshot({file=OUTPUT,fetcher=fetch,concurrency=3,attempts=3,now=new Date()}={}){
 const data=JSON.parse(await readFile(file,'utf8'));
 const jobs=[];
 for(const [edition,rows] of Object.entries(data.editions||{})){
  if(!['global','bulgaria','official'].includes(edition))continue;
  for(const item of rows){
   if(item.language==='en'||verifiedEnglish(item))continue;
   jobs.push({item,edition});
  }
 }
 let next=0;
 const worker=async()=>{
  while(next<jobs.length){
   const {item}=jobs[next++];let lastError;
   for(let tries=1;tries<=attempts;tries++){
    try{
     const translated_title=await translatePublicHeadline(item.title,item.language,{fetcher});
     item.translated_title=translated_title;
     item.source_language=item.language;
     item.translation={source_language:item.language,target_language:'en',status:'machine_translated',method:'automated',provider:'machine_translation',editorial_reviewed:false};
     lastError=null;break;
    }catch(e){lastError=e;if(tries<attempts)await wait(500*tries)}
   }
   if(lastError)throw Error('English translation failed for public headline '+item.language+': '+lastError.message);
   await wait(115); // Bounded provider traffic; do not overload a public endpoint.
  }
 };
 await Promise.all(Array.from({length:Math.min(concurrency,Math.max(1,jobs.length))},()=>worker()));
 const totals=validateTranslatedSnapshot(data);
 data.translations={target_language:'en',status:'complete',translated:totals.translated,
  method:'automated_machine_translation',editorial_reviewed:false,checked_at:now.toISOString()};
 // Don't replace a working public snapshot unless every foreign headline has
 // a source-preserving, independently validated English machine translation.
 await writeFile(file,JSON.stringify(data,null,2)+'\n','utf8');
 return { ...totals,translatedThisRun:jobs.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.includes('--check')){
   const result=validateTranslatedSnapshot(JSON.parse(await readFile(OUTPUT,'utf8')));
   console.log('Verified English source headline translations:',JSON.stringify(result));
  }else console.log('Translated public news snapshot:',JSON.stringify(await translateSnapshot()));
 }catch(e){console.error('Refusing incomplete English news publish:',e.message);process.exitCode=1}
}
