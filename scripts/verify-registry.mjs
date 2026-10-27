// AURORA V1.4.2: read-only remote release verification. No credentials or writes.
const seedIds=["aaro-pr-2013","aaro-iraq-2017","aaro-west-us-2021"];
export function validateTarget(base){
 let url;
 try{url=new URL(base)}catch{throw Error("Invalid deployment URL")}
 const host=url.hostname.toLowerCase();
 const allowed=host==="aurorauap.org"||host.endsWith(".aurora-uap.pages.dev");
 if(url.protocol!=="https:"||!allowed||url.username||url.password||url.port||url.pathname!=="/"||url.search||url.hash)
  throw Error("Refusing non-AURORA HTTPS deployment target");
 return url.origin;
}
function ensure(condition,message){if(!condition)throw Error("Release gate: "+message)}
export async function verifyDeployment({base,mode,fetcher=fetch,logger=()=>{}}){
 const origin=validateTarget(base);
 ensure(["staged","active"].includes(mode),"mode must be staged or active");
 const read=async(path)=>{
  const url=new URL(path,origin);
  ensure(url.origin===origin,"external request not permitted");
  const response=await fetcher(url.href,{
   headers:{accept:"application/json","cache-control":"no-cache"},
   cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)
  });
  let body;
  try{body=await response.json()}catch{throw Error("Invalid JSON from "+path+" (HTTP "+response.status+")")}
  return {status:response.status,body};
 };
 const html=async(path)=>{
  const url=new URL(path,origin);
  const response=await fetcher(url.href,{redirect:"error",signal:AbortSignal.timeout(15000),cache:"no-store"});
  ensure(response.status===200,path+" must be HTTP 200");
  const body=await response.text();
  return body;
 };
 const results=[];
 // Always check that Pages still serves the country template and the original
 // source archive separately from D1.
 const countryHTML=await html("/countries/DE");
 ensure(countryHTML.includes('id="countryName"'),"country route must serve its actual explorer template");
 results.push("country template: OK");
 if(mode==="staged"){
  for(const path of ["/api/stats","/api/cases?limit=1","/api/countries/DE","/api/cases/aaro-pr-2013"]){
   const {status,body}=await read(path);
   ensure(status===503&&body?.error==="database_unavailable",path+" must stay closed (503 database_unavailable) while staged");
   results.push(path+": correctly gated");
  }
  const {status,body}=await read("/data/cases.json");
  ensure(status===200&&Array.isArray(body.cases)&&body.cases.length>=8,"separate V1.3 sourced reference archive must remain available");
  ensure(body.cases.every(c=>c.source?.url?.startsWith("https://")),"legacy reference cases require HTTPS source links");
  results.push("reference archive: "+body.cases.length+" sourced cases, excluded from D1");
  logger({mode,origin,results});
  return {mode,origin,results,sightings:null,countries:null};
 }
 const {status:statCode,body:stats}=await read("/api/stats");
 ensure(statCode===200,"active registry stats must respond 200");
 ensure(stats?.source==="D1"&&stats?.includes_demo===false,"statistics must be sourced from D1 without demos");
 ensure(Number.isInteger(stats.sightings)&&stats.sightings>=3,"active D1 must have at least 3 reviewed cases");
 ensure(Number.isInteger(stats.countries)&&stats.countries>=3,"at least three sourced countries must exist");
 ensure(Array.isArray(stats.by_country)&&Array.isArray(stats.by_year),"country/year facets missing");
 ensure(stats.by_country.every(r=>/^[A-Z]{2}$/.test(r.code)&&Number.isInteger(r.count)&&r.count>0),"invalid country facet");
 ensure(stats.by_country.reduce((n,r)=>n+r.count,0)<=stats.sightings,"country sums exceed total");
 ensure(stats.by_country.length===stats.countries,"country count does not equal facet entries");
 ensure(stats.by_year.reduce((n,r)=>n+r.count,0)===stats.sightings,"year facet totals do not equal published count");
 ensure(typeof stats.last_successful_sync==="string"&&!Number.isNaN(Date.parse(stats.last_successful_sync)),"last successful sync missing");
 ensure(Date.parse(stats.last_successful_sync)<=Date.now()+5*60*1000,"last sync is in the future");
 results.push("live D1 stats: "+stats.sightings+" cases / "+stats.countries+" country codes");
 const {status:listStatus,body:listing}=await read("/api/cases?limit=50");
 ensure(listStatus===200&&Number.isInteger(listing.total)&&listing.total===stats.sightings,"list/statistics mismatch");
 ensure(Array.isArray(listing.cases)&&listing.cases.length>=1&&listing.cases.length<=50,"invalid cases page");
 for(const c of listing.cases){
  ensure(c.record_kind!=="demo"&&c.review_status==="approved","demo or unapproved case leaked into public API");
  ensure(/^https:\/\//.test(c.source_url)&&c.source_name,"public case missing cited source");
 }
 results.push("public case page: no demo or unapproved records");
 for(const id of seedIds){
  const {status,body}=await read("/api/cases/"+id);
  ensure(status===200&&body?.id===id&&body.record_kind==="historical_import","missing historical seed "+id);
  ensure(body.review_status==="approved"&&body.assessment_status==="resolved","mislabelled source assessment for "+id);
  ensure(body.source_url?.startsWith("https://www.aaro.mil/"),"seed source URL invalid "+id);
  const code=body.country_code;
  const byCountry=await read("/api/countries/"+code);
  ensure(byCountry.status===200&&byCountry.body?.country_code===code&&byCountry.body.total>=1,"country API inconsistent "+code);
  results.push(id+": verified in "+code);
 }
 const {status:prStatus,body:pr}=await read("/api/cases?country=PR&limit=1");
 ensure(prStatus===200&&pr.total>=1&&pr.cases[0].country_code==="PR","PR query filter is broken");
 results.push("country filter: consistent");
 logger({mode,origin,results});
 return {mode,origin,results,sightings:stats.sightings,countries:stats.countries,last_sync:stats.last_successful_sync};
}
