import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {onRequestGet as tipStatus,onRequestPost as submitTip} from '../functions/api/news-tips.js';
import {onRequestGet as editorGet,onRequestPost as editorPost} from '../functions/api/news-editor.js';
import {onRequestGet as publicNews} from '../functions/api/news.js';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
function makeDb(){
 const sql=new DatabaseSync(':memory:');
 for(const migration of ['migrations/0001_init.sql','migrations/0002_intake_quarantine.sql','migrations/0003_newsroom.sql'])sql.exec(read(migration));
 const db={
  prepare(query){const stmt=sql.prepare(query);const make=args=>({bind(...values){return make(values)},async run(){const result=stmt.run(...args);return {meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid||0)}}},async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}}});return make([])},
  async batch(statements){sql.exec('BEGIN IMMEDIATE');try{const result=[];for(const statement of statements)result.push(await statement.run());sql.exec('COMMIT');return result}catch(error){sql.exec('ROLLBACK');throw error}}
 };
 return {db,sql};
}
const baseEnv={
 AURORA_NEWS_TIPS_ENABLED:'enabled',AURORA_NEWS_TIPS_LEGAL_APPROVED:'yes',AURORA_NEWS_TIPS_WAF_REVIEWED:'yes',
 AURORA_NEWS_TIPS_POLICY_VERSION:'news-tip-v1-reviewed',AURORA_NEWS_TIPS_POLICY_URL:'https://aurorauap.org/privacy',
 AURORA_NEWS_TIPS_SITE_KEY:'site-key-test-12345',AURORA_NEWS_TIPS_SECRET:'secret-test-12345',
 AURORA_NEWS_EDITOR_ENABLED:'enabled',AURORA_MODERATION_ENABLED:'enabled',
 AURORA_ACCESS_TEAM:'https://example.cloudflareaccess.com',AURORA_ACCESS_AUD:'a'.repeat(64),
 AURORA_MODERATOR_EMAIL:'editor@example.com'
};
const turnstile=async()=>Response.json({success:true,hostname:'aurorauap.org',action:'news_tip'});
const b64=value=>Buffer.from(value).toString('base64url');
const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'newsroom',alg:'RS256'};
const accessFetch=async()=>Response.json({keys:[jwk]});
async function accessToken(){
 const now=Math.floor(Date.now()/1000),head=b64(JSON.stringify({alg:'RS256',kid:'newsroom'}));
 const payload=b64(JSON.stringify({iss:baseEnv.AURORA_ACCESS_TEAM,aud:[baseEnv.AURORA_ACCESS_AUD],email:baseEnv.AURORA_MODERATOR_EMAIL,iat:now,exp:now+300}));
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(head+'.'+payload));
 return head+'.'+payload+'.'+b64(signature);
}
const tipRequest=(body,overrides={})=>new Request('https://aurorauap.org/api/news-tips',{method:'POST',headers:{Origin:'https://aurorauap.org','Content-Type':'application/json'},body:JSON.stringify(body),...overrides});
const article={language_code:'en',category:'research',title:'A source-reviewed UAP policy update',summary:'An editorially reviewed summary that attributes the report to its named publisher.',body:'A source-attributed article body records what the publisher reported, preserves uncertainty and provides context. It does not present claims as established facts.',source_name:'Example Research Desk',source_url:'https://publisher.example/story/123',source_published_at:'2026-10-30'};
function editorRequest(path,token,body){return new Request('https://aurorauap.org'+path,{method:body?'POST':'GET',headers:{'Cf-Access-Jwt-Assertion':token,...(body?{Origin:'https://aurorauap.org','Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})}

test('newsroom migration creates a quarantined tip queue and editorial article/localization tables',()=>{
 const {sql}=makeDb(),tables=sql.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row=>row.name);
 for(const name of ['news_tips','news_tip_events','news_articles','news_article_localizations','news_article_events'])assert.ok(tables.includes(name),name);
 const tipColumns=sql.prepare('PRAGMA table_info(news_tips)').all().map(row=>row.name);
 assert.ok(!tipColumns.some(name=>/email|name|ip|attachment|file/i.test(name)),'the news-tip table stores no contact, network, or file data');
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM news_articles").get().n,0);
});

test('news-tip status fails closed unless privacy, abuse, storage, and moderation gates are configured',async()=>{
 const {db}=makeDb();
 const blocked=await tipStatus({request:new Request('https://aurorauap.org/api/news-tips'),env:{DB:db}});
 assert.equal(blocked.status,200);assert.equal((await blocked.json()).accepting,false);
 const allowed=await tipStatus({request:new Request('https://aurorauap.org/api/news-tips'),env:{...baseEnv,DB:db}});
 const state=await allowed.json();assert.equal(state.accepting,true);assert.equal(state.automatic_publication,false);assert.equal(state.site_key,baseEnv.AURORA_NEWS_TIPS_SITE_KEY);
});

test('public news tips require same-origin HTTPS, consent and Turnstile and remain pending',async()=>{
 const {db,sql}=makeDb(),env={...baseEnv,DB:db};
 const payload={title:'A new public report about UAP',url:'https://publisher.example/news/story?utm_source=tip',consent:true,turnstile_token:'challenge-token',website:''};
 const denied=await submitTip({request:tipRequest(payload,{headers:{Origin:'https://elsewhere.example','Content-Type':'application/json'}}),env,fetcher:turnstile});
 assert.equal(denied.status,403);
 const response=await submitTip({request:tipRequest(payload),env,fetcher:turnstile});
 assert.equal(response.status,202);const receipt=await response.json();assert.equal(receipt.status,'pending');assert.equal(receipt.published,false);
 const row=sql.prepare('SELECT * FROM news_tips').get();assert.equal(row.status,'pending');assert.equal(row.source_url,payload.url);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM news_articles').get().n,0,'a tip is never auto-published as an article');
 const duplicate=await submitTip({request:tipRequest(payload),env,fetcher:turnstile});assert.equal((await duplicate.json()).duplicate,true);
 for(const invalid of [
  {...payload,url:'http://publisher.example/story'},
  {...payload,url:'https://user:pass@publisher.example/story'},
  {...payload,consent:false},
  {...payload,website:'filled-by-bot'},
  {...payload,title:'short'}
 ])assert.equal((await submitTip({request:tipRequest(invalid),env,fetcher:turnstile})).status,400);
 const token=await accessToken(),tipId=sql.prepare('SELECT id FROM news_tips').get().id;
 const reviewed=await editorPost({request:editorRequest('/api/news-editor',token,{action:'review_tip',id:tipId,decision:'approved',rationale:'Source is relevant for editorial verification.'}),env,accessFetcher:accessFetch});
 assert.equal(reviewed.status,200);assert.equal((await reviewed.json()).status,'approved');
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM news_articles').get().n,0,'approving a tip does not create an article');
});

test('editorial article is draft until explicitly published, then appears in the public news API',async()=>{
 const {db,sql}=makeDb(),env={...baseEnv,DB:db},token=await accessToken();
 const noAuth=await editorGet({request:new Request('https://aurorauap.org/api/news-editor'),env});assert.equal(noAuth.status,403);
 const saved=await editorPost({request:editorRequest('/api/news-editor',token,{action:'save_article',article}),env,accessFetcher:accessFetch});
 assert.equal(saved.status,200);const draft=await saved.json();assert.equal(draft.status,'draft');
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM news_articles WHERE status='published'").get().n,0);
 const translation={article_id:draft.id,language_code:'es',title:'Actualización editorial sobre UAP',summary:'Resumen revisado y atribuido a la fuente original para lectores en español.',body:'El editor conserva la atribución original y el contexto, distingue las afirmaciones de los hechos confirmados y no presenta conclusiones sin evidencia. Esta traducción completa ha sido revisada por una persona.'};
 const localized=await editorPost({request:editorRequest('/api/news-editor',token,{action:'save_translation',translation}),env,accessFetcher:accessFetch});
 assert.equal(localized.status,200);assert.equal((await localized.json()).status,'localized');
 const publish=await editorPost({request:editorRequest('/api/news-editor',token,{action:'publish_article',id:draft.id}),env,accessFetcher:accessFetch});
 assert.equal(publish.status,200);assert.equal((await publish.json()).status,'published');
 const feed=await publicNews({request:new Request('https://aurorauap.org/api/news?edition=global&lang=en'),env,fetcher:async()=>{throw Error('offline')},catalogFetcher:async()=>{throw Error('offline')}});
 const payload=await feed.json();assert.ok(['live','cached'].includes(payload.status));
 const published=payload.items.find(item=>item.article_id===draft.id);
 assert.ok(published);assert.equal(published.title,article.title);assert.equal(published.article_body,article.body);assert.equal(published.source,article.source_name);assert.equal(published.category,article.category);
 const localizedFeed=await publicNews({request:new Request('https://aurorauap.org/api/news?edition=global&lang=es'),env,fetcher:async()=>{throw Error('offline')},catalogFetcher:async()=>{throw Error('offline')}});
 const spanish=(await localizedFeed.json()).items.find(item=>item.article_id===draft.id);
 assert.equal(spanish.title,article.title,'the original title is retained for attribution');assert.equal(spanish.translated_title,translation.title);
 assert.equal(spanish.translated_summary,translation.summary);assert.equal(spanish.article_body,translation.body);assert.equal(spanish.article_body_language,'es');
 assert.equal(spanish.url,article.source_url,'translation never replaces the original source URL');
 const unpublish=await editorPost({request:editorRequest('/api/news-editor',token,{action:'unpublish_article',id:draft.id,rationale:'Publisher corrected the underlying report.'}),env,accessFetcher:accessFetch});
 assert.equal((await unpublish.json()).status,'unpublished');
});

test('media requires editor rights confirmation and a citation; unsafe URLs are rejected',async()=>{
 const {db}=makeDb(),env={...baseEnv,DB:db},token=await accessToken();
 const noRights={...article,image_url:'https://cdn.example/image.jpg',media_rights_confirmed:false};
 assert.equal((await editorPost({request:editorRequest('/api/news-editor',token,{action:'save_article',article:noRights}),env,accessFetcher:accessFetch})).status,400);
 const noSource={...article,source_url:'javascript:alert(1)'};
 assert.equal((await editorPost({request:editorRequest('/api/news-editor',token,{action:'save_article',article:noSource}),env,accessFetcher:accessFetch})).status,400);
});
