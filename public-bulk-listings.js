/* Display-only expansion of a compact public archive index. Original language
 * and extended narratives remain in the source-linked dossier shards. */
"use strict";
(function(root){
 function unpack(payload){
  if(payload?.schema_version!==1||!Array.isArray(payload.sources)||!Array.isArray(payload.records)||payload.records.length>25000)
   throw Error('Unsupported public bulk listing');
  if(payload.sources.length>100||payload.sources.some(s=>typeof s!=='string'||!s.trim()))
   throw Error('Invalid publisher attribution');
  return payload.records.map(row=>{
   if(!Array.isArray(row)||row.length!==8)throw Error('Invalid public listing row');
   const [id,date,country,city,title,summary,sourceId,sourceUrl]=row;
   if(!/^(?:geipan|bluebook)-[1-9]\d{0,12}$/.test(id)||
      typeof date!=='string'||!/^[A-Z]{2}$/.test(country)||
      typeof city!=='string'||typeof title!=='string'||!title.trim()||
      typeof summary!=='string'||!summary.trim()||
      !Number.isInteger(sourceId)||sourceId<0||sourceId>=payload.sources.length||
      typeof sourceUrl!=='string'||!/^https:\/\//.test(sourceUrl))throw Error('Incomplete public listing row');
   let uri;try{uri=new URL(sourceUrl)}catch{throw Error('Invalid source URL')}
   if(uri.protocol!=='https:'||uri.username||uri.password||uri.port)throw Error('Unsafe source URL');
   return {id,date,country,city:{en:city},title:{en:title},summary:{en:summary},
     status:'reported',source:{name:payload.sources[sourceId],url:sourceUrl},media:[]};
  });
 }
 root.AURORA_PUBLIC_BULK_LISTINGS=Object.freeze({unpack});
})(globalThis);
