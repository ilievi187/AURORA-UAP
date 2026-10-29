import test from "node:test";
import assert from "node:assert/strict";
import {
 NEWS_LANGUAGES,
 PAGE_SIZE,
 normalizeTargetLanguage,
 detectHeadlineLanguage,
 getCachedTranslation,
 clearTranslationCache,
 translateNewsPage
} from "../functions/_lib/news-translation.js";

test("detectHeadlineLanguage identifies Cyrillic, Japanese, Korean, Chinese, Arabic, and Greek scripts",()=>{
 assert.equal(detectHeadlineLanguage("日本で未確認飛行物体が目撃される","en"),"ja");
 assert.equal(detectHeadlineLanguage("한국 상공에서 미확인 비행물체 포착","en"),"ko");
 assert.equal(detectHeadlineLanguage("中国发现不明飞行物报告","en"),"zh");
 assert.equal(detectHeadlineLanguage("رصد جسم طائر مجهول في السماء","en"),"ar");
 assert.equal(detectHeadlineLanguage("Αγνώστου ταυτότητας ιπτάμενο αντικείμενο","en"),"el");
 assert.equal(detectHeadlineLanguage("Невідомий об'єкт у небі України","en"),"uk");
 assert.equal(detectHeadlineLanguage("Непознати летећи објекат","en"),"sr");
 assert.equal(detectHeadlineLanguage("Неопознанный летающий объект это факт","en"),"ru");
 assert.equal(detectHeadlineLanguage("Неидентифициран обект над Шумен","bg"),"bg");
 assert.equal(detectHeadlineLanguage("UAP congressional briefing announced","en-US"),"en");
 assert.equal(normalizeTargetLanguage("zh-CN"),"zh");
 assert.equal(normalizeTargetLanguage("pt-BR"),"pt");
});

test("translateNewsPage translates headlines and summaries, caches results, and falls back gracefully on errors",async()=>{
 clearTranslationCache();
 const calls=[];
 const ai={
  async run(model,args){
   calls.push({model,args});
   return {translated_text:`[${args.source_lang}->${args.target_lang}] ${args.text}`};
  }
 };
 const items=[
  {
   title:"Pentagon releases new UAP report",
   summary:"The annual briefing covers hundreds of reviewed airspace incidents.",
   language:"en-US",
   url:"https://publisher.example.test/1",
   source:"Example News",
   published:"2026-10-29T10:00:00Z"
  },
  {
   title:"日本でUFO目撃情報",
   language:"en",
   url:"https://publisher.example.test/2",
   source:"Tokyo Press",
   published:"2026-10-29T09:00:00Z"
  }
 ];
 const first=await translateNewsPage(items,"de",0,ai);
 assert.equal(first.translation.status,"translated");
 assert.equal(first.translation.translated,2);
 assert.equal(first.items[0].translated_title,"[en->de] Pentagon releases new UAP report");
 assert.equal(first.items[0].translated_summary,"[en->de] The annual briefing covers hundreds of reviewed airspace incidents.");
 assert.equal(first.items[0].title,"Pentagon releases new UAP report","original source headline must remain intact");
 assert.equal(first.items[0].summary,"The annual briefing covers hundreds of reviewed airspace incidents.","original source summary must remain intact");
 assert.equal(first.items[0].source,"Example News","source attribution must remain intact");
 assert.equal(first.items[0].published,"2026-10-29T10:00:00Z","publication timestamp must remain intact");
 assert.equal(first.items[1].source_language,"ja");
 assert.equal(first.items[1].translated_title,"[ja->de] 日本でUFO目撃情報");
 assert.equal(calls.length,3,"1 title + 1 summary + 1 title");

 // Second call with same items and target should hit the in-memory LRU cache without invoking AI
 const second=await translateNewsPage(items,"de",0,ai);
 assert.equal(calls.length,3,"cached items must not re-invoke AI");
 assert.equal(second.translation.cached,2);
 assert.equal(second.items[0].translated_title,"[en->de] Pentagon releases new UAP report");
 assert.equal(second.items[0].translated_summary,"[en->de] The annual briefing covers hundreds of reviewed airspace incidents.");
 assert.ok(getCachedTranslation("en","de","title","Pentagon releases new UAP report"));

 // Summary failure must not discard a valid title translation
 clearTranslationCache();
 const partialAi={
  async run(_model,args){
   if(args.text.includes("summary fails"))throw Error("ai_timeout");
   return {translated_text:"ÜBERSETZT: "+args.text};
  }
 };
 const res=await translateNewsPage([{
  title:"Headline succeeds",
  summary:"This summary fails in AI",
  language:"en",
  url:"https://publisher.example.test/3",
  source:"Example",
  published:"2026-10-29T08:00:00Z"
 }],"de",0,partialAi);
 assert.equal(res.translation.status,"translated");
 assert.equal(res.items[0].translated_title,"ÜBERSETZT: Headline succeeds");
 assert.equal(res.items[0].translated_summary,undefined);
 assert.equal(NEWS_LANGUAGES.size,18);
 assert.equal(PAGE_SIZE,12);
});

test("translation cache enforces 600-entry LRU bound and preserves safe original fallbacks when AI is unavailable or returns invalid output",async()=>{
 clearTranslationCache();
 // 1. Same-language articles skip translation and report status: 'original'
 const sameLang=await translateNewsPage([{
  title:"Нов доклад за неидентифицирани обекти",
  summary:"Резюме на български език.",
  language:"bg",
  url:"https://publisher.example.test/bg1",
  source:"BG Press",
  published:"2026-10-29T12:00:00Z"
 }],"bg",0,{async run(){throw Error("should_not_be_called")}});
 assert.equal(sameLang.translation.status,"original");
 assert.equal(sameLang.items[0].translated_title,undefined);

 // 2. Missing AI binding falls back cleanly to original text with status: 'unavailable'
 const noAi=await translateNewsPage([{
  title:"Unexplained radar contact over the Atlantic",
  summary:"Civilian aviation authorities logged an anomalous return.",
  language:"en",
  url:"https://publisher.example.test/en1",
  source:"Atlantic Desk",
  published:"2026-10-29T12:00:00Z"
 }],"fr",0,null);
 assert.equal(noAi.translation.status,"unavailable");
 assert.equal(noAi.items[0].title,"Unexplained radar contact over the Atlantic");
 assert.equal(noAi.items[0].translated_title,undefined);

 // 3. Upstream AI rate-limit / 500 error mid-batch yields 'partial' status while keeping successful translations
 let count=0;
 const flakyAi={
  async run(_model,args){
   count++;
   if(args.text.includes("Second headline"))throw Error("HTTP 429 rate limited");
   return {translated_text:"FR: "+args.text};
  }
 };
 const partialBatch=await translateNewsPage([
  {title:"First headline succeeds",language:"en",url:"https://publisher.example.test/1",source:"S1",published:"2026-10-29T12:00:00Z"},
  {title:"Second headline fails",language:"en",url:"https://publisher.example.test/2",source:"S2",published:"2026-10-29T12:00:00Z"}
 ],"fr",0,flakyAi);
 assert.equal(partialBatch.translation.status,"partial");
 assert.equal(partialBatch.translation.translated,1);
 assert.equal(partialBatch.items[0].translated_title,"FR: First headline succeeds");
 assert.equal(partialBatch.items[1].translated_title,undefined);
 assert.equal(partialBatch.items[1].title,"Second headline fails");

 // 4. Verify bounded LRU eviction beyond 600 entries
 clearTranslationCache();
 const bulkAi={
  async run(_model,args){
   return {translated_text:"ES: "+args.text};
  }
 };
 for(let batch=0;batch<52;batch++){
  const batchItems=Array.from({length:12},(_,idx)=>({
   title:`Unique headline ${batch * 12 + idx}`,
   language:"en",
   url:`https://publisher.example.test/${batch}/${idx}`,
   source:"Bulk Press",
   published:"2026-10-29T12:00:00Z"
  }));
  // Refresh entry 0 on every batch so it stays MRU while entry 1 gets evicted
  if(batch>0)getCachedTranslation("en","es","title","Unique headline 0");
  await translateNewsPage(batchItems,"es",0,bulkAi);
 }
 assert.equal(getCachedTranslation("en","es","title","Unique headline 0"),"ES: Unique headline 0","frequently accessed entry must remain in LRU cache");
 assert.equal(getCachedTranslation("en","es","title","Unique headline 1"),null,"oldest untouched entry beyond 600 cap must be evicted");
 assert.equal(getCachedTranslation("en","es","title","Unique headline 623"),"ES: Unique headline 623","newest entry must be present in cache");
});
