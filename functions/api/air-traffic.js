// Real transponder observations only. Not a UAP detector or flight schedule.
// Sources: OpenSky Network; adsb.lol (ODbL 1.0, https://www.adsb.lol).
// All queries are bounded to fixed regions. Never generate fake aircraft.
export const REGIONS={
 bg:{name:"Bulgaria",lamin:41.1,lamax:44.3,lomin:22.2,lomax:28.7},
 eu:{name:"Central Europe",lamin:47,lamax:54,lomin:5,lomax:16},
 us:{name:"US East",lamin:35,lamax:44,lomin:-83,lomax:-72},
 jp:{name:"Japan",lamin:30,lamax:40,lomin:130,lomax:142},
 au:{name:"Australia East",lamin:-38,lamax:-29,lomin:146,lomax:155}
};
const MAX_AIRCRAFT=250;
const NOW=()=>Date.now();
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const safeText=(value,length=14)=>String(value||"").trim().slice(0,length).replace(/[^a-zA-Z0-9 -]/g,"");
const coord=(n)=>Math.round(n*1000)/1000;
const latestTime=(raw)=>{
 const n=Number(raw);
 const seconds=n>1e11?n/1000:n;
 if(!Number.isFinite(seconds)||seconds<=0)return null;
 const ms=seconds*1000;
 if(ms>NOW()+5*60_000||ms<NOW()-30*60_000)return null;
 return new Date(ms).toISOString();
};
const validPosition=(lat,lon,b)=>finite(lat)&&finite(lon)&&lat>=b.lamin&&lat<=b.lamax&&lon>=b.lomin&&lon<=b.lomax;
const base=(source,region,observed_at,aircraft,extra={})=>({
 status:"live",source,region,region_name:REGIONS[region].name,bounds:REGIONS[region],
 observed_at,count:aircraft.length,aircraft,
 disclaimer:"Public transponder positions only, not a UFO/UAP detector. Data may be incomplete or delayed.",
 ...extra
});
export function normalizeTraffic(data,region){
 const bounds=REGIONS[region];if(!bounds||!data||!Array.isArray(data.states))return null;
 const observed_at=latestTime(data.time);if(!observed_at)return null;
 const aircraft=data.states.slice(0,1500).filter(Array.isArray).map(s=>{
  const lat=s[6],lon=s[5];if(!validPosition(lat,lon,bounds))return null;
  return {icao24:safeText(s[0],8),callsign:safeText(s[1]),
   latitude:coord(lat),longitude:coord(lon),
   altitude_m:finite(s[7])?Math.round(s[7]):null,
   speed_ms:finite(s[9])?Math.round(s[9]):null,
   heading:finite(s[10])?Math.round(s[10]):null,on_ground:s[8]===true};
 }).filter(Boolean).slice(0,MAX_AIRCRAFT);
 return base("OpenSky Network",region,observed_at,aircraft,{
  source_url:"https://opensky-network.org/",license:"OpenSky citation and terms"});
}
export function normalizeAdsb(data,region){
 const bounds=REGIONS[region];if(!bounds||!data||!Array.isArray(data.ac))return null;
 const observed_at=latestTime(data.now);if(!observed_at)return null;
 const aircraft=data.ac.slice(0,1500).map(s=>{
  if(!s||typeof s!=="object"||!validPosition(s.lat,s.lon,bounds))return null;
  if(finite(s.seen_pos)&&s.seen_pos>120)return null;
  const alt=finite(s.alt_baro)?s.alt_baro:finite(s.alt_geom)?s.alt_geom:null;
  const speed=finite(s.gs)?s.gs:null;
  return {icao24:safeText(s.hex,8),callsign:safeText(s.flight),
   latitude:coord(s.lat),longitude:coord(s.lon),
   altitude_m:alt===null?null:Math.round(alt*0.3048),
   speed_ms:speed===null?null:Math.round(speed*0.514444),
   heading:finite(s.track)?Math.round(s.track):null,
   on_ground:s.alt_baro==="ground"};
 }).filter(Boolean).slice(0,MAX_AIRCRAFT);
 return base("adsb.lol",region,observed_at,aircraft,{
  source_url:"https://www.adsb.lol/",license:"ODbL 1.0",
  coverage_note:"Community receiver coverage; regional point-radius queries may omit aircraft near the edges."
 });
}
async function getJson(url,fetcher,opts={}){
 const r=await fetcher(url,{headers:{Accept:"application/json","User-Agent":"AURORA-UAP/1.0 (+https://aurorauap.org)"},signal:AbortSignal.timeout(8000),...opts});
 if(!r.ok)throw Error("traffic_upstream_"+r.status);
 const len=Number(r.headers?.get?.("content-length")||0);
 if(len>1_500_000)throw Error("traffic_response_too_large");
 const raw=await r.text();
 if(raw.length>1_500_000)throw Error("traffic_response_too_large");
 return JSON.parse(raw);
}
export async function fetchTraffic(region,fetcher=fetch){
 const b=REGIONS[region];if(!b)return null;
 const u=new URL("https://opensky-network.org/api/states/all");
 for(const k of ["lamin","lamax","lomin","lomax"])u.searchParams.set(k,String(b[k]));
 return normalizeTraffic(await getJson(u.toString(),fetcher),region);
}
export async function fetchAdsbTraffic(region,fetcher=fetch){
 const b=REGIONS[region];if(!b)return null;
 const lat=(b.lamin+b.lamax)/2,lon=(b.lomin+b.lomax)/2;
 const kmLat=(b.lamax-b.lamin)*111.2/2,kmLon=(b.lomax-b.lomin)*111.2*Math.cos(lat*Math.PI/180)/2;
 const radiusNm=clamp(Math.ceil(Math.hypot(kmLat,kmLon)/1.852),10,250);
 const url="https://api.adsb.lol/v2/lat/"+lat.toFixed(3)+"/lon/"+lon.toFixed(3)+"/dist/"+radiusNm;
 return normalizeAdsb(await getJson(url,fetcher),region);
}
const publicCacheHeaders={"Cache-Control":"public, max-age=30, s-maxage=180","X-Content-Type-Options":"nosniff"};
export async function onRequestGet({request,ctx,env={},fetcher=fetch}){
 const region=new URL(request.url).searchParams.get("region")||"bg";
 if(!Object.hasOwn(REGIONS,region))return Response.json({error:"invalid_region"},{status:400});
 const key=new Request("https://aurora-cache.invalid/traffic/v2/"+region);
 let cache;
 try{if(typeof caches!=="undefined"){cache=caches.default;const stored=cache&&await cache.match(key);if(stored)return stored}}catch{}
 let result=null;let openSkyFailed=false;
 try{result=await fetchTraffic(region,fetcher)}
 catch{openSkyFailed=true}
 // A legitimately empty OpenSky result can reflect poor sensor coverage.
 // The optional second source is only used for an upstream failure/empty area,
 // never to replace a valid populated observation with another feed.
 if((!result||result.count===0)&&env.AURORA_ADSB_FALLBACK_DISABLED!=="true"){
  try{
   const alternative=await fetchAdsbTraffic(region,fetcher);
   if(alternative&&(alternative.count>0||!result))result=alternative;
  }catch{}
 }
 if(!result)return Response.json({
  status:"unavailable",error:"traffic_source_unavailable",region,
  help:"Upstream sources unavailable or rate-limited; this does not imply an empty sky."
 },{status:503,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 const response=Response.json(result,{headers:publicCacheHeaders});
 if(cache&&ctx?.waitUntil)ctx.waitUntil(cache.put(key,response.clone()).catch(()=>{}));
 return response;
}
