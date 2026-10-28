// Translate sourced headlines only. Never accept arbitrary user-provided text.
export const NEWS_LANGUAGES=new Set(["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ko"]);
export const PAGE_SIZE=12;
export async function translateNewsPage(items,target,offset,ai){
 const copy=items.map(item=>({...item})),todo=[];
 const requested=target==="zh-CN"?"zh":target;
 for(let i=offset;i<Math.min(copy.length,offset+PAGE_SIZE);i++){
  const item=copy[i],source=String(item.language||"en").split("-")[0];
  if(typeof item.title!=="string"||!item.title.trim()||source===requested)continue;
  todo.push({item,source});
 }
 if(!ai||typeof ai.run!=="function")
  return {items:copy,translation:{target,status:todo.length?"unavailable":"original",translated:0}};
 let pointer=0,translated=0,failed=0;
 async function worker(){
  while(pointer<todo.length){
   const task=todo[pointer++];
   try{
    const result=await ai.run("@cf/meta/m2m100-1.2b",{
     text:task.item.title.slice(0,240),source_lang:task.source,target_lang:requested
    });
    const answer=typeof result?.translated_text==="string"?result.translated_text.trim():"";
    if(answer.length>=2&&answer.length<=600){task.item.translated_title=answer;translated++}
    else failed++;
   }catch{failed++}
  }
 }
 await Promise.all(Array.from({length:Math.min(3,todo.length)},()=>worker()));
 return {items:copy,translation:{
  target,status:failed?(translated?"partial":"unavailable"):(translated?"translated":"original"),translated
 }};
}
