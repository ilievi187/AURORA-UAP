import {moderatorQueueConfigured} from './intake.js';
import {NEWS_LANGUAGES} from './news-translation.js';
import {urlKey} from './headline-dedup.js';

export const NEWS_TIP_POLICY_VERSION='news-tip-v1-reviewed';
const TIP_KEYS=new Set(['title','url','consent','turnstile_token','website']);
const ARTICLE_KEYS=new Set(['id','language_code','category','title','summary','body','source_name','source_url','source_published_at','image_url','video_url','media_rights_confirmed','media_rights_note']);
const TRANSLATION_KEYS=new Set(['article_id','language_code','title','summary','body']);
const CATEGORIES=new Set(['sightings','official','research','history','policy','other']);
const cleanText=(value,min,max)=>typeof value==='string'&&value.trim().length>=min&&value.trim().length<=max&&!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)?value.trim():null;
const safeUrl=value=>{
 if(typeof value!=='string'||value.trim().length<12||value.trim().length>1200)return null;
 try{
  const url=new URL(value.trim());
  const host=url.hostname.toLowerCase();
  if(url.protocol!=='https:'||url.username||url.password||url.port||host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal'))return null;
  if(/^127\.|^10\.|^192\.168\.|^169\.254\.|^0\./.test(host)||/^172\.(1[6-9]|2\d|3[01])\./.test(host))return null;
  return url.href;
 }catch{return null}
};
const validDate=value=>{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+'T00:00:00.000Z');
 return Number.isFinite(date.valueOf())&&date.toISOString().slice(0,10)===value;
};
export function newsroomSchemaReady(db){
 if(!db||typeof db.prepare!=='function')return Promise.resolve(false);
 return (async()=>{
  try{
   const expected=['news_tips','news_tip_events','news_articles','news_article_localizations','news_article_events'];
   const rows=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('news_tips','news_tip_events','news_articles','news_article_localizations','news_article_events')").all();
   const actual=new Set((rows?.results||[]).map(row=>row.name));
   return expected.every(name=>actual.has(name));
  }catch{return false}
 })();
}
export function newsTipsEnabled(env,hostname){
 return Boolean(env?.DB&&moderatorQueueConfigured(env)&&hostname==='aurorauap.org'&&
  env.AURORA_NEWS_TIPS_ENABLED==='enabled'&&env.AURORA_NEWS_TIPS_LEGAL_APPROVED==='yes'&&
  env.AURORA_NEWS_TIPS_WAF_REVIEWED==='yes'&&env.AURORA_NEWS_TIPS_POLICY_VERSION===NEWS_TIP_POLICY_VERSION&&
  env.AURORA_NEWS_TIPS_POLICY_URL==='https://aurorauap.org/privacy'&&
  typeof env.AURORA_NEWS_TIPS_SECRET==='string'&&env.AURORA_NEWS_TIPS_SECRET.length>10&&
  typeof env.AURORA_NEWS_TIPS_SITE_KEY==='string'&&env.AURORA_NEWS_TIPS_SITE_KEY.length>10);
}
export function newsEditorEnabled(env,hostname){
 return Boolean(env?.DB&&moderatorQueueConfigured(env)&&hostname==='aurorauap.org'&&
  env.AURORA_MODERATION_ENABLED==='enabled'&&env.AURORA_NEWS_EDITOR_ENABLED==='enabled');
}
export function normalizeNewsTip(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!TIP_KEYS.has(key)))throw Error('invalid_tip');
 if(input.consent!==true||input.website!==undefined&&input.website!=='')throw Error('invalid_tip');
 const title=cleanText(input.title,8,200),url=safeUrl(input.url);
 if(!title||!url)throw Error('invalid_tip');
 const source_key=urlKey(url);
 if(!source_key)throw Error('invalid_tip');
 const token=cleanText(input.turnstile_token,1,2048);
 if(!token)throw Error('invalid_tip');
 return {title,url,source_key,turnstile_token:token};
}
export function normalizeNewsArticle(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!ARTICLE_KEYS.has(key)))throw Error('invalid_article');
 const id=input.id===undefined||input.id===null||input.id===''?null:cleanText(input.id,18,90);
 if(input.id&&!/^aur-news-[a-f0-9-]{36}$/.test(id||''))throw Error('invalid_article');
 const language_code=typeof input.language_code==='string'?input.language_code:'';
 const category=typeof input.category==='string'?input.category:'';
 const title=cleanText(input.title,8,200),summary=cleanText(input.summary,30,700),body=cleanText(input.body,120,30000);
 const source_name=cleanText(input.source_name,2,160),source_url=safeUrl(input.source_url);
 if(!NEWS_LANGUAGES.has(language_code)||!CATEGORIES.has(category)||!title||!summary||!body||!source_name||!source_url)throw Error('invalid_article');
 const source_published_at=input.source_published_at===''||input.source_published_at===null||input.source_published_at===undefined?null:input.source_published_at;
 if(source_published_at!==null&&!validDate(source_published_at))throw Error('invalid_article');
 const image_url=input.image_url===''||input.image_url===null||input.image_url===undefined?null:safeUrl(input.image_url);
 const video_url=input.video_url===''||input.video_url===null||input.video_url===undefined?null:safeUrl(input.video_url);
 if(input.image_url&&!image_url||input.video_url&&!video_url)throw Error('invalid_article');
 const media_rights_confirmed=input.media_rights_confirmed===true;
 const media_rights_note=input.media_rights_note===''||input.media_rights_note===undefined?'':cleanText(input.media_rights_note,12,500);
 if((image_url||video_url)&&(!media_rights_confirmed||!media_rights_note))throw Error('media_rights_required');
 return {id,language_code,category,title,summary,body,source_name,source_url,source_published_at,image_url,video_url,media_rights_confirmed,media_rights_note:media_rights_note||''};
}
export function normalizeNewsTranslation(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!TRANSLATION_KEYS.has(key)))throw Error('invalid_translation');
 const article_id=cleanText(input.article_id,18,90),language_code=typeof input.language_code==='string'?input.language_code:'';
 const title=cleanText(input.title,8,200),summary=cleanText(input.summary,30,700),body=cleanText(input.body,120,30000);
 if(!/^aur-news-[a-f0-9-]{36}$/.test(article_id||'')||!NEWS_LANGUAGES.has(language_code)||!title||!summary||!body)throw Error('invalid_translation');
 return {article_id,language_code,title,summary,body};
}
export async function verifyNewsTipTurnstile(token,env,hostname,fetcher=fetch){
 const params=new URLSearchParams({secret:env.AURORA_NEWS_TIPS_SECRET,response:token});
 const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString(),redirect:'manual',signal:AbortSignal.timeout(9000)
 });
 if(!response.ok)throw Error('turnstile_unavailable');
 const result=await response.json();
 return result.success===true&&result.hostname===hostname&&result.action==='news_tip';
}
export async function saveNewsTip(db,tip){
 if(typeof db?.batch!=='function')throw Error('transaction_required');
 const id='aur-tip-'+crypto.randomUUID();
 const results=await db.batch([
  db.prepare("INSERT INTO news_tips(id,source_url,source_key,title) VALUES(?,?,?,?) ON CONFLICT(source_key) DO NOTHING").bind(id,tip.url,tip.source_key,tip.title),
  db.prepare("INSERT INTO news_tip_events(tip_id,actor,action,rationale) SELECT id,'visitor','received','Queued for human editorial review' FROM news_tips WHERE id=? AND changes()=1").bind(id)
 ]);
 const row=await db.prepare('SELECT id,status FROM news_tips WHERE source_key=?').bind(tip.source_key).first();
 if(!row)throw Error('tip_storage_failed');
 return {receipt_id:row.id,status:row.status,duplicate:row.id!==id,changes:results?.[0]?.meta?.changes};
}
export async function readPublishedNewsArticles(db,language,limit=200){
 if(!NEWS_LANGUAGES.has(language)||!db||typeof db.prepare!=='function')return [];
 try{
  const result=await db.prepare("SELECT a.*,l.title AS localized_title,l.summary AS localized_summary,l.body AS localized_body,l.language_code AS localized_language FROM news_articles a LEFT JOIN news_article_localizations l ON l.article_id=a.id AND l.language_code=? WHERE a.status='published' ORDER BY COALESCE(a.source_published_at,a.published_at) DESC,a.id DESC LIMIT ?").bind(language,Math.min(200,Math.max(1,limit))).all();
  return (result?.results||[]).map(row=>{
   const localized=row.localized_language===language&&language!==row.language_code;
   return {
    article_id:row.id,title:row.title,summary:row.summary,article_body:localized?row.localized_body:row.body,
    article_body_language:localized?language:row.language_code,
    ...(localized?{translated_title:row.localized_title,translated_summary:row.localized_summary,editorial_translation:true}:{}),
    source_language:row.language_code,language:row.language_code,source:row.source_name,url:row.source_url,
    published:row.source_published_at||row.published_at,published_by_aurora:!row.source_published_at,
    source_role:'editorial',category:row.category,image:row.image_url||undefined,video_url:row.video_url||undefined,
    media_rights_confirmed:Boolean(row.media_rights_confirmed),editorial:true
   };
  });
 }catch{return []}
}
