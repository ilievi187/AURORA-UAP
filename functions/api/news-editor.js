import {NEWS_LANGUAGES} from '../_lib/news-translation.js';
import {accessIdentity} from '../_lib/access.js';
import {newsEditorEnabled,newsroomSchemaReady,normalizeNewsArticle,normalizeNewsTranslation} from '../_lib/newsroom.js';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'};
const reply=(body,status=200)=>Response.json(body,{status,headers});
async function authenticate(request,env,accessFetcher){
 const url=new URL(request.url);
 if(url.protocol!=='https:'||!newsEditorEnabled(env,url.hostname)||!await newsroomSchemaReady(env.DB))return null;
 return accessIdentity(request,env,accessFetcher);
}
export async function onRequestGet({request,env,accessFetcher=fetch}){
 const user=await authenticate(request,env,accessFetcher);if(!user)return reply({error:'unavailable'},403);
 const params=new URL(request.url).searchParams,kind=params.get('kind')||'articles',status=params.get('status')||'all',offsetText=params.get('offset')||'0';
 if(!['articles','tips','translation'].includes(kind)||!(/^(0|[1-9]\d{0,5})$/).test(offsetText)||Number(offsetText)>100000||[...params.keys()].some(key=>!['kind','status','offset','article_id','language_code'].includes(key)))return reply({error:'invalid_query'},400);
 if(kind==='translation'){
  const articleId=params.get('article_id')||'',language=params.get('language_code')||'';
  if(!/^aur-news-[a-f0-9-]{36}$/.test(articleId)||!NEWS_LANGUAGES.has(language))return reply({error:'invalid_translation'},400);
  try{
   const source=await env.DB.prepare('SELECT language_code FROM news_articles WHERE id=?').bind(articleId).first();
   if(!source)return reply({error:'article_not_found'},404);
   const translation=await env.DB.prepare('SELECT article_id,language_code,title,summary,body,updated_at FROM news_article_localizations WHERE article_id=? AND language_code=?').bind(articleId,language).first();
   return reply({source_language:source.language_code,translation:translation||null});
  }catch{return reply({error:'newsroom_unavailable'},503)}
 }
 const allowed=kind==='tips'?new Set(['all','pending','approved','rejected']):new Set(['all','draft','published','unpublished']);
 if(!allowed.has(status))return reply({error:'invalid_status'},400);
 const offset=Number(offsetText),limit=30;
 try{
  if(kind==='tips'){
   const statement=status==='all'
    ?env.DB.prepare('SELECT id,title,source_url,status,submitted_at,reviewed_at,reviewed_by,rationale FROM news_tips ORDER BY submitted_at DESC,id DESC LIMIT ? OFFSET ?').bind(limit+1,offset)
    :env.DB.prepare('SELECT id,title,source_url,status,submitted_at,reviewed_at,reviewed_by,rationale FROM news_tips WHERE status=? ORDER BY submitted_at DESC,id DESC LIMIT ? OFFSET ?').bind(status,limit+1,offset);
   const rows=(await statement.all()).results||[];
   return reply({kind,tips:rows.slice(0,limit),offset,limit,has_more:rows.length>limit,next_offset:rows.length>limit?offset+limit:null});
  }
  const statement=status==='all'
   ?env.DB.prepare('SELECT * FROM news_articles ORDER BY updated_at DESC,id DESC LIMIT ? OFFSET ?').bind(limit+1,offset)
   :env.DB.prepare('SELECT * FROM news_articles WHERE status=? ORDER BY updated_at DESC,id DESC LIMIT ? OFFSET ?').bind(status,limit+1,offset);
  const rows=(await statement.all()).results||[];
  return reply({kind,articles:rows.slice(0,limit),offset,limit,has_more:rows.length>limit,next_offset:rows.length>limit?offset+limit:null});
 }catch{return reply({error:'newsroom_unavailable'},503)}
}
function validateAction(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||typeof input.action!=='string')throw Error('invalid_action');
 if(input.action==='save_article'||input.action==='publish_article'||input.action==='unpublish_article')return input.action;
 if(input.action==='save_translation'||input.action==='review_tip')return input.action;
 throw Error('invalid_action');
}
export async function onRequestPost({request,env,accessFetcher=fetch}){
 const user=await authenticate(request,env,accessFetcher);if(!user)return reply({error:'unavailable'},403);
 const url=new URL(request.url);
 if(request.headers.get('Origin')!==url.origin||!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return reply({error:'rejected'},403);
 const declared=Number(request.headers.get('Content-Length')||'0');if(declared>50000)return reply({error:'payload_too_large'},413);
 let input;try{const raw=await request.text();if(raw.length>40000||new TextEncoder().encode(raw).length>50000)return reply({error:'payload_too_large'},413);input=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400)}
 let action;try{action=validateAction(input)}catch{return reply({error:'invalid_action'},400)}
 try{
  if(action==='save_article'){
   const article=normalizeNewsArticle(input.article);
   const id=article.id||'aur-news-'+crypto.randomUUID();
   if(article.id){
    const result=await env.DB.prepare("UPDATE news_articles SET language_code=?,category=?,title=?,summary=?,body=?,source_name=?,source_url=?,source_published_at=?,image_url=?,video_url=?,media_rights_confirmed=?,media_rights_note=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
     .bind(article.language_code,article.category,article.title,article.summary,article.body,article.source_name,article.source_url,article.source_published_at,article.image_url,article.video_url,Number(article.media_rights_confirmed),article.media_rights_note,id).run();
    if(result?.meta?.changes!==1)return reply({error:'article_not_found'},404);
    await env.DB.prepare("INSERT INTO news_article_events(article_id,actor,action,rationale) VALUES(?,?,'updated','Editorial fields updated')").bind(id,user.email).run();
   }else{
    await env.DB.batch([
     env.DB.prepare("INSERT INTO news_articles(id,status,language_code,category,title,summary,body,source_name,source_url,source_published_at,image_url,video_url,media_rights_confirmed,media_rights_note,created_by) VALUES(?,'draft',?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id,article.language_code,article.category,article.title,article.summary,article.body,article.source_name,article.source_url,article.source_published_at,article.image_url,article.video_url,Number(article.media_rights_confirmed),article.media_rights_note,user.email),
     env.DB.prepare("INSERT INTO news_article_events(article_id,actor,action,rationale) VALUES(?,?,'created','Saved as draft')").bind(id,user.email)
    ]);
   }
   return reply({id,status:article.id?'updated':'draft',published:false});
  }
  if(action==='publish_article'||action==='unpublish_article'){
   const id=typeof input.id==='string'&&/^aur-news-[a-f0-9-]{36}$/.test(input.id)?input.id:'';
   if(!id)return reply({error:'invalid_article_id'},400);
   const event=action==='publish_article'?'published':'unpublished';
   const status=action==='publish_article'?'published':'unpublished';
   const result=await env.DB.batch([
    env.DB.prepare("UPDATE news_articles SET status=?,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ELSE published_at END,published_by=CASE WHEN ?='published' THEN ? ELSE published_by END,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?")
     .bind(status,status,status,user.email,id),
    env.DB.prepare("INSERT INTO news_article_events(article_id,actor,action,rationale) SELECT id,?,?,? FROM news_articles WHERE id=? AND changes()=1")
     .bind(user.email,event,typeof input.rationale==='string'?input.rationale.slice(0,1000):'',id)
   ]);
   if(result?.[0]?.meta?.changes!==1)return reply({error:'article_not_found'},404);
   return reply({id,status,published:status==='published'});
  }
  if(action==='save_translation'){
   const translated=normalizeNewsTranslation(input.translation);
   const article=await env.DB.prepare('SELECT id,language_code FROM news_articles WHERE id=?').bind(translated.article_id).first();
   if(!article)return reply({error:'article_not_found'},404);
   if(article.language_code===translated.language_code)return reply({error:'translation_matches_source_language'},400);
   await env.DB.prepare("INSERT INTO news_article_localizations(article_id,language_code,title,summary,body,updated_by) VALUES(?,?,?,?,?,?) ON CONFLICT(article_id,language_code) DO UPDATE SET title=excluded.title,summary=excluded.summary,body=excluded.body,updated_by=excluded.updated_by,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')")
    .bind(translated.article_id,translated.language_code,translated.title,translated.summary,translated.body,user.email).run();
   await env.DB.prepare("INSERT INTO news_article_events(article_id,actor,action,rationale) VALUES(?,?,'localized',?)").bind(translated.article_id,user.email,'Human-authored '+translated.language_code+' localization').run();
   return reply({id:translated.article_id,language:translated.language_code,status:'localized'});
  }
  if(action==='review_tip'){
   const id=typeof input.id==='string'&&/^aur-tip-[a-f0-9-]{36}$/.test(input.id)?input.id:'';
   const decision=input.decision,rationale=typeof input.rationale==='string'?input.rationale.trim():'';
   if(!id||!['approved','rejected'].includes(decision)||rationale.length<12||rationale.length>1000)return reply({error:'invalid_review'},400);
   const old=await env.DB.prepare('SELECT status FROM news_tips WHERE id=?').bind(id).first();
   if(!old||old.status!=='pending')return reply({error:'tip_not_reviewable'},409);
   const results=await env.DB.batch([
    env.DB.prepare("UPDATE news_tips SET status=?,reviewed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),reviewed_by=?,rationale=? WHERE id=? AND status='pending'").bind(decision,user.email,rationale,id),
    env.DB.prepare('INSERT INTO news_tip_events(tip_id,actor,action,rationale) SELECT id,?,?,? FROM news_tips WHERE id=? AND status=? AND changes()=1').bind(user.email,decision,rationale,id,decision)
   ]);
   if(results?.[0]?.meta?.changes!==1)return reply({error:'tip_review_conflict'},409);
   return reply({id,status:decision,published:false});
  }
  return reply({error:'invalid_action'},400);
 }catch(error){
  if(error?.message==='media_rights_required')return reply({error:'media_rights_required'},400);
  if(['invalid_article','invalid_translation'].includes(error?.message))return reply({error:error.message},400);
  console.error('AURORA newsroom editorial operation failed',error?.name||'Error');
  return reply({error:'newsroom_operation_failed'},503);
 }
}
