// Non-commercial research reference data from OpenSky, NOT a UAP detector.
// Fixed, coarse geographic presets prevent arbitrary expensive/global API queries.
export const REGIONS={
 bg:{name:"Bulgaria",lamin:41.1,lamax:44.3,lomin:22.2,lomax:28.7},
 eu:{name:"Central Europe",lamin:47,lamax:54,lomin:5,lomax:16},
 us:{name:"US East",lamin:35,lamax:44,lomin:-83,lomax:-72},
 jp:{name:"Japan",lamin:30,lamax:40,lomin:130,lomax:142},
 au:{name:"Australia East",lamin:-38,lamax:-29,lomin:146,lomax:155}
};
export function normalizeTraffic(data,region){
 const bounds=REGIONS[region];if(!bounds||!data||!Array.isArray(data.states))return null;
 const time=Number(data.time);
 if(!Number.isInteger(time)||time<0)return null;
 const aircraft=data.states.slice(0,1500).filter(Array.isArray).map(s=>{
  const lat=s[6],lon=s[5];
  if(typeof lat!=="number"||typeof lon!=="number"||!Number.isFinite(lat)||!Number.isFinite(lon)||lat<bounds.lamin||lat>bounds.lamax||lon<bounds.lomin||lon>bounds.lomax)return null;
  return {icao24:String(s[0]||"").slice(0,8).replace(/[^a-z0-9]/gi,""),
   callsign:String(s[1]||"").trim().slice(0,14).replace(/[^a-zA-Z0-9 -]/g,""),
   latitude:Math.round(lat*1000)/1000,longitude:Math.round(lon*1000)/1000,
   altitude_m:Number.isFinite(s[7])?Math.round(s[7]):null,
   speed_ms:Number.isFinite(s[9])?Math.round(s[9]):null,
   heading:Number.isFinite(s[10])?Math.round(s[10]):null,
   on_ground:s[8]===true};
 }).filter(Boolean).slice(0,250);
 return {status:"live",source:"OpenSky Network",region,region_name:bounds.name,bounds,observed_at:new Date(time*1000).toISOString(),count:aircraft.length,aircraft,
  disclaimer:"Air-traffic transponder data only; not a UFO/UAP detection system. Coverage is incomplete and positions may be delayed."};
}
export async function fetchTraffic(region,fetcher=fetch){
 const b=REGIONS[region];if(!b)return null;
 const u=new URL("https://opensky-network.org/api/states/all");
 for(const k of ["lamin","lamax","lomin","lomax"])u.searchParams.set(k,String(b[k]));
 const r=await fetcher(u.toString(),{headers:{Accept:"application/json"},signal:AbortSignal.timeout(9000)});
 if(!r.ok)throw Error("traffic_upstream_"+r.status);
 return normalizeTraffic(await r.json(),region);
}
export async function onRequestGet({request,ctx}){
 const region=new URL(request.url).searchParams.get("region")||"bg";
 if(!Object.hasOwn(REGIONS,region))return Response.json({error:"invalid_region"},{status:400});
 const key=new Request("https://aurora-cache.invalid/traffic/"+region);
 let cache;try{cache=caches.default;const found=await cache.match(key);if(found)return found}catch{}
 try{
  const data=await fetchTraffic(region);
  if(!data)return Response.json({status:"unavailable",error:"invalid_upstream_data"},{status:503,headers:{"Cache-Control":"no-store"}});
  const response=Response.json(data,{headers:{"Cache-Control":"public, max-age=60, s-maxage=300","X-Content-Type-Options":"nosniff"}});
  if(cache&&ctx?.waitUntil)ctx.waitUntil(cache.put(key,response.clone()).catch(()=>{}));
  return response;
 }catch{
  return Response.json({status:"unavailable",error:"traffic_source_unavailable",region},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
