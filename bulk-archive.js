/* Lazy public dossiers. Never fetch thousands of full narratives on archive entry. */
"use strict";
(function(root){
 const SHARDS=64;
 function shardFor(id){
  let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619)>>>0;
  return String(h%SHARDS).padStart(2,"0");
 }
 async function load(id,fetcher=fetch){
  if(!/^(?:geipan|bluebook)-[1-9]\d{0,12}$/.test(id))return null;
  const response=await fetcher("/data/bulk/shards/"+shardFor(id)+".json",{cache:"force-cache"});
  if(!response.ok)return null;
  const data=await response.json();
  if(!Array.isArray(data.cases)||data.cases.length>500)return null;
  return data.cases.find(c=>c?.id===id&&
    typeof c.source?.url==="string"&&c.source.url.startsWith("https://"))||null;
 }
 root.AURORA_BULK_ARCHIVE=Object.freeze({shardFor,load});
})(globalThis);
