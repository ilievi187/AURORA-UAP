import test from "node:test";
import assert from "node:assert/strict";
import {
 NEWS_LANGUAGES,
 PAGE_SIZE,
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
