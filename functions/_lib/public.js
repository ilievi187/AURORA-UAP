// Shared read-only D1 queries. NEVER query demo or unapproved records.
export function reply(data,status=200){
 return Response.json(data,{status,headers:{"Cache-Control":status===200?"public, max-age=90":"no-store","X-Content-Type-Options":"nosniff"}});
}
export const unavailable=()=>reply({error:"database_unavailable",message:"D1 binding DB is not configured. No demo data are used as registered cases."},503);
export const invalid=reason=>reply({error:"invalid_query",message:reason},400);
const PUBLIC="publication_status='published' AND review_status='approved' AND record_kind!='demo'";
const fields="id,record_kind,title,title_bg,description,description_bg,date,date_precision,country_code,region,location,latitude,longitude,location_precision,category,review_status,source_name,source_url,license,media,created_at,updated_at";
export const countryCode=value=>typeof value==="string"&&/^[A-Z]{2}$/.test(value.toUpperCase())?value.toUpperCase():null;
const year=value=>/^(?:19|20)\d{2}$/.test(value||"")?String(value):null;
function adapt(row){
 let media=[];try{const raw=JSON.parse(row.media||"[]");if(Array.isArray(raw))media=raw.filter(x=>x&&x.is_public&&x.rights_status==="verified").map(x=>({url:x.url,type:x.type}))}catch{}
 return {
 id:row.id,title:{en:row.title,bg:row.title_bg||row.title},
 description:row.description,summary:{en:row.description,bg:row.description_bg||row.description},
 date:row.date,date_precision:row.date_precision,
 country:row.country_code,country_code:row.country_code,
 region:row.region,city:{en:row.location,bg:row.location},
 location:row.location,lat:row.latitude,lng:row.longitude,
 latitude:row.latitude,longitude:row.longitude,location_precision:row.location_precision,
 category:row.category,review_status:row.review_status,status:row.review_status,
 source_name:row.source_name,source_url:row.source_url,
 source:{name:row.source_name,url:row.source_url},license:row.license,media,
 created_at:row.created_at,updated_at:row.updated_at,record_kind:row.record_kind
 };
}
function conditions(params){
 let where=PUBLIC,bind=[];
 if(params.has("country")){
  const c=countryCode(params.get("country"));if(!c)throw Error("Invalid country");
  where+=" AND country_code=?";bind.push(c);
 }
 if(params.has("year")){
  const y=year(params.get("year"));if(!y)throw Error("Invalid year");
  where+=" AND substr(date,1,4)=?";bind.push(y);
 }
 if(params.has("type")){
  const type=params.get("type");if(!["lights","object","instrument","other"].includes(type))throw Error("Invalid type");
  where+=" AND category=?";bind.push(type);
 }
 if(params.has("status")){
  const status=params.get("status");if(status!=="approved")throw Error("Only public approved status is available");
  where+=" AND review_status=?";bind.push(status);
 }
 if(params.has("region")){
  const r=params.get("region")?.trim();if(!r||r.length>80)throw Error("Invalid region");
  where+=" AND region=?";bind.push(r);
 }
 if(params.has("q")){
  const q=params.get("q")?.trim();if(!q||q.length>100)throw Error("Invalid search");
  where+=" AND (title LIKE ? OR description LIKE ? OR location LIKE ?)";
  const escape=q.replace(/[\\%_]/g,"\\$&");const like="%"+escape+"%";
  // Escaping wildcard characters works with explicit ESCAPE clause below.
  where=where.replace(/title LIKE \? OR description LIKE \? OR location LIKE \?/,"title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\' OR location LIKE ? ESCAPE '\\'");
  bind.push(like,like,like);
 }
 return {where,bind};
}
export async function getCases(db,params){
 const {where,bind}=conditions(params);
 const limitParam=params.get("limit")??"100",offsetParam=params.get("offset")??"0";
 if(!/^\d{1,4}$/.test(limitParam)||!/^\d{1,7}$/.test(offsetParam))throw Error("Invalid pagination");
 const limit=Number(limitParam),offset=Number(offsetParam);
 if(limit<1||limit>250||offset>100000)throw Error("Pagination out of range");
 const [rows,total]=await Promise.all([
  db.prepare("SELECT "+fields+" FROM cases WHERE "+where+" ORDER BY date DESC,id LIMIT ? OFFSET ?").bind(...bind,limit,offset).all(),
  db.prepare("SELECT COUNT(*) AS n FROM cases WHERE "+where).bind(...bind).first()
 ]);
 return {cases:(rows.results||[]).map(adapt),total:total?.n||0,limit,offset,has_more:offset+limit<(total?.n||0)};
}
export async function getCase(db,id){
 if(!/^[a-z0-9-]{3,90}$/.test(id))throw Error("Invalid case id");
 const row=await db.prepare("SELECT "+fields+" FROM cases WHERE id=? AND "+PUBLIC).bind(id).first();
 return row?adapt(row):null;
}
export async function getStats(db){
 const [overall,countries,last]=await Promise.all([
  db.prepare("SELECT COUNT(*) AS sightings,COUNT(DISTINCT country_code) AS countries FROM cases WHERE "+PUBLIC).first(),
  db.prepare("SELECT country_code AS code,COUNT(*) AS count FROM cases WHERE "+PUBLIC+" AND country_code IS NOT NULL GROUP BY country_code ORDER BY count DESC,code").all(),
  db.prepare("SELECT MAX(completed_at) AS last_successful_sync FROM import_runs WHERE status='success' AND run_type IN ('manual_import','weekly_import')").first()
 ]);
 return {sightings:overall?.sightings||0,countries:overall?.countries||0,by_country:countries.results||[],last_successful_sync:last?.last_successful_sync||null,source:"D1",includes_demo:false};
}
export async function countryStats(db,code){
 const c=countryCode(code);if(!c)throw Error("Invalid country");
 const [total,years,regions]=await Promise.all([
  db.prepare("SELECT COUNT(*) AS n FROM cases WHERE "+PUBLIC+" AND country_code=?").bind(c).first(),
  db.prepare("SELECT substr(date,1,4) AS year,COUNT(*) AS n FROM cases WHERE "+PUBLIC+" AND country_code=? GROUP BY 1 ORDER BY 1 DESC").bind(c).all(),
  db.prepare("SELECT region,COUNT(*) AS n FROM cases WHERE "+PUBLIC+" AND country_code=? AND region IS NOT NULL GROUP BY region ORDER BY n DESC LIMIT 100").bind(c).all()
 ]);
 return {country_code:c,total:total?.n||0,years:years.results||[],regions:regions.results||[],includes_demo:false};
}
