// Rights-gated, human-reviewed and idempotent D1 import. No remote scraping.
export const SOURCE_ID="aaro-official-resolution";
export function validateManifest(m) {
 if(m?.schema_version!==1||m.source?.id!==SOURCE_ID||m.source?.approved_for_ingest!==true)throw Error("Unapproved source");
 if(!m.source.license_url?.startsWith("https://www.copyright.gov/")||!m.source.rights_checked_at)throw Error("Rights review missing");
 if(!Array.isArray(m.cases)||!m.cases.length||m.cases.length>100)throw Error("Invalid batch");
 const ids=new Set();
 for(const x of m.cases){
  if(!/^aaro-[a-z0-9-]{3,80}$/.test(x.id)||!/^[a-z0-9-]{3,80}$/.test(x.source_record_id)||ids.has(x.source_record_id))throw Error("Bad duplicate/id");
  ids.add(x.source_record_id);
  if(x.curation_status!=="editor_approved"||x.review_status!=="approved")throw Error("Not editor-approved");
  if(!["resolved","unresolved","undetermined","disputed"].includes(x.assessment_status)||!["high","moderate","low","not_stated"].includes(x.assessment_confidence)||!x.assessment_authority?.includes("AARO"))throw Error("Missing evidence assessment");
  if(!x.source_url?.startsWith("https://www.aaro.mil/"))throw Error("Unapproved source URL");
  if(x.title?.length<6||x.title?.length>220||x.description?.length<50||x.description?.length>2500||x.description_bg?.length<35)throw Error("Bad summary");
  if(!/^\d{4}(-\d{2})?(-\d{2})?$/.test(x.date)||!["day","month","year"].includes(x.date_precision))throw Error("Bad date");
  if(x.country_code!==null&&!/^[A-Z]{2}$/.test(x.country_code))throw Error("Bad country");
  if(!["lights","object","instrument","other"].includes(x.category))throw Error("Bad category");
  if((x.latitude===null)!==(x.longitude===null))throw Error("Partial coordinates");
  if(x.latitude!==null&&(!Number.isFinite(x.latitude)||Math.abs(x.latitude)>90||!Number.isFinite(x.longitude)||Math.abs(x.longitude)>180))throw Error("Bad coordinates");
  if(!x.location_precision||x.location_precision.length<20||x.media?.length)throw Error("Uncertain location or unapproved media");
 }
 return m;
}
export async function importReviewed(db,m,kind="manual_import"){
 validateManifest(m);
 const id=crypto.randomUUID(),start=new Date().toISOString(),s=m.source;
 await db.prepare("INSERT INTO sources(id,name,publisher,homepage_url,license,license_url,rights_note,rights_checked_at,approved_for_ingest) VALUES(?,?,?,?,?,?,?,?,1) ON CONFLICT(id) DO UPDATE SET name=excluded.name,publisher=excluded.publisher,homepage_url=excluded.homepage_url,license=excluded.license,license_url=excluded.license_url,rights_note=excluded.rights_note,rights_checked_at=excluded.rights_checked_at,approved_for_ingest=1").bind(s.id,s.name,s.publisher,s.homepage_url,s.license,s.license_url,s.rights_note,s.rights_checked_at).run();
 await db.prepare("INSERT INTO import_runs(id,source_id,run_type,status,started_at) VALUES(?,?,?,'started',?)").bind(id,s.id,kind,start).run();
 let inserted=0,updated=0;
 try{
  for(const x of m.cases){
   const previous=await db.prepare("SELECT id FROM cases WHERE id=?").bind(x.id).first();
   const sql="INSERT INTO cases(id,record_kind,title,title_bg,description,description_bg,date,date_precision,country_code,region,location,latitude,longitude,location_precision,category,review_status,publication_status,source_name,source_url,license,media) "+
    "VALUES(?,'historical_import',?,?,?,?,?,?,?,?,?,?,?,?,?,'approved','published',?,?,?,'[]') "+
    "ON CONFLICT(id) DO UPDATE SET title=excluded.title,title_bg=excluded.title_bg,description=excluded.description,description_bg=excluded.description_bg,date=excluded.date,date_precision=excluded.date_precision,country_code=excluded.country_code,region=excluded.region,location=excluded.location,latitude=excluded.latitude,longitude=excluded.longitude,location_precision=excluded.location_precision,category=excluded.category,source_name=excluded.source_name,source_url=excluded.source_url,license=excluded.license,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') "+
    "WHERE cases.record_kind='historical_import' AND cases.review_status='approved' AND cases.publication_status='published'";
   await db.prepare(sql).bind(x.id,x.title,x.title_bg,x.description,x.description_bg,x.date,x.date_precision,x.country_code,x.region,x.location,x.latitude,x.longitude,x.location_precision,x.category,s.name,x.source_url,x.license).run();
   await db.prepare("UPDATE cases SET assessment_status=?,assessment_authority=?,assessment_confidence=? WHERE id=? AND record_kind='historical_import' AND review_status='approved' AND publication_status='published'").bind(x.assessment_status,x.assessment_authority,x.assessment_confidence,x.id).run();
   // Keep all original cross-references, even after a case is manually withdrawn.
   await db.prepare("INSERT INTO case_sources(case_id,source_id,source_record_id,source_url) VALUES(?,?,?,?) ON CONFLICT(source_id,source_record_id) DO UPDATE SET source_url=excluded.source_url").bind(x.id,s.id,x.source_record_id,x.source_url).run();
   if(previous)updated++;else inserted++;
  }
  await db.prepare("UPDATE import_runs SET status='success',inserted_count=?,updated_count=?,completed_at=? WHERE id=?").bind(inserted,updated,new Date().toISOString(),id).run();
  return {status:"success",inserted,updated,run_id:id};
 }catch(e){
  await db.prepare("UPDATE import_runs SET status='failed',details=?,completed_at=? WHERE id=?").bind(String(e).slice(0,600),new Date().toISOString(),id).run().catch(()=>{});
  throw e;
 }
}
export async function monthlyAudit(db){
 const id=crypto.randomUUID();
 await db.prepare("INSERT INTO import_runs(id,source_id,run_type,status,started_at) VALUES(?,?,'monthly_audit','started',?)").bind(id,SOURCE_ID,new Date().toISOString()).run();
 const issues=await db.prepare("SELECT (SELECT COUNT(*) FROM cases WHERE publication_status='published' AND (review_status!='approved' OR record_kind='demo')) AS exposed,(SELECT COUNT(*) FROM cases WHERE publication_status='published' AND (source_url='' OR license='')) AS unattributed").first();
 const ok=Number(issues.exposed)===0&&Number(issues.unattributed)===0;
 await db.prepare("UPDATE import_runs SET status=?,details=?,completed_at=? WHERE id=?").bind(ok?"success":"failed",JSON.stringify(issues),new Date().toISOString(),id).run();
 if(!ok)throw Error("Publication integrity audit failed");
 return {status:"success",issues};
}
