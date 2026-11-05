import {discoverMatches} from "../_lib/discovery.js";
import {REGIONS} from "../_lib/source-catalog.js";

const SECURITY = {"X-Content-Type-Options": "nosniff"};

const SNAPSHOT_MAX_AGE=14*24*60*60*1000;
async function readCompiledSnapshot(request,region,assets){
 if(!assets||typeof assets.fetch!=="function")return null;
 try{
  const target=new URL("/data/discovery-last-good.json",request.url);
  const response=await assets.fetch(new Request(target.toString()));
  if(!response.ok)return null;
  const data=await response.json();
  if(data?.schema_version!==1||!/^(?:20)\d{2}-\d{2}-\d{2}$/.test(data.checked_on||''))return null;
  const checked=Date.parse(data.checked_on+"T00:00:00.000Z");
  if(!Number.isFinite(checked)||checked>Date.now()||Date.now()-checked>SNAPSHOT_MAX_AGE)return null;
  const result=data.regions?.[region];
  if(!result||!Array.isArray(result.items)||result.items.length>40||!Array.isArray(result.checked)||!Array.isArray(result.failed))return null;
  const valid=result.items.every(item=>{
   try{const url=new URL(item.url);return url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&
    typeof item.title==="string"&&item.title.length>=8&&typeof item.source==="string"&&
    Number.isFinite(Date.parse(item.published));}catch{return false}
  });
  if(!valid)return null;
  return {status:result.status,region,checked_on:data.checked_on,checked:result.checked,failed:result.failed,
   count:result.items.length,items:result.items,cache_source:"scheduled_publisher_snapshot",notice:data.notice};
 }catch{return null}
}
export async function onRequestGet({request, env, fetcher} = {}) {
  const url = new URL(request.url);
  const unexpected = [...url.searchParams.keys()].filter((key) => key !== "region");
  if (unexpected.length) {
    return Response.json({error: "invalid_query"}, {status: 400, headers: {"Cache-Control": "no-store", ...SECURITY}});
  }
  const region = url.searchParams.get("region") || "all";
  if (!REGIONS.includes(region)) {
    return Response.json({error: "invalid_region"}, {status: 400, headers: {"Cache-Control": "no-store", ...SECURITY}});
  }
  // Production Pages always provides ASSETS. Visitors receive a bounded,
  // dated snapshot instead of making 24+ RSS requests in a CPU-limited Worker.
  if(env?.ASSETS){
    const snapshot=await readCompiledSnapshot(request,region,env.ASSETS);
    if(snapshot){
      const code=snapshot.status==="unavailable"?503:200;
      return Response.json(snapshot,{status:code,headers:{"Cache-Control":code===200?"public, max-age=60, s-maxage=300":"no-store",...SECURITY}});
    }
    return Response.json({status:"unavailable",region,count:0,items:[],checked:[],failed:[],
      error:"source_snapshot_unavailable",notice:"Dated publisher snapshot temporarily unavailable; no fabricated headlines."},
     {status:503,headers:{"Cache-Control":"no-store",...SECURITY}});
  }
  // Offline/unit tests without the Pages ASSETS binding retain bounded feed verification.
  const result = await discoverMatches({region, fetcher});
  const status = result.status === "unavailable" ? 503 : 200;
  const cache = status === 200 ? "public, max-age=60, s-maxage=300" : "no-store";
  return Response.json(result, {status, headers: {"Cache-Control": cache, ...SECURITY}});
}
