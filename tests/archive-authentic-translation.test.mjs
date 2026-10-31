import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isFullTranslation,isLegacyPlaceholder} from "../archive-localization.js";
import {selectPublicCase,translatePublishedCase} from "../functions/api/archive-translation.js";
const cases=JSON.parse(readFileSync(new URL("../data/cases.json",import.meta.url),"utf8")).cases;

test("the historic Harare report is an actual fully translated, seven-part Bulgarian dossier",()=>{
 const c=cases.find(x=>x.id==="disclosure-harare-2008");
 assert.ok(c&&c.story.bg.length===7);
 assert.ok(c.story.bg.join(" ").length>1600);
 assert.equal(isLegacyPlaceholder(c,"bg"),false);
 assert.equal(isFullTranslation(c,"bg",true),true);
 assert.ok(c.story.bg.some(p=>p.includes("47")));
});

test("101 archived cases stay public, sourced and safe for the translation service",()=>{
 assert.equal(cases.length,101);
 assert.equal(cases.filter(c=>selectPublicCase(cases,c.id)===c).length,101);
 assert.equal(selectPublicCase([{id:"private",private:true,source:{url:"https://example.org/"}}],"private"),null);
});

test("all original narrative paragraphs can be translated, not just the first six",async()=>{
 const c={id:"mock-archival-case",source:{url:"https://source.example/case"},title:{en:"Published case",bg:"Published case"},
  summary:{en:"Original source report",bg:"Това е случай, описан в публичния каталог."},
  story:{en:Array.from({length:8},(_,i)=>"Documented source paragraph "+i),
   bg:["Следва оригиналното описание на английски.","EN · Original source report"]}};
 assert.equal(isLegacyPlaceholder(c,"bg"),true);
 assert.equal(isFullTranslation(c,"bg",true),false);
 const requests=[];
 const ai={async run(_model,input){requests.push(input);return {translated_text:"translated "+input.text}}};
 const result=await translatePublishedCase(c,"bg",ai,{detail:true});
 assert.equal(result.status,"translated");
 assert.equal(result.story.length,8);
 assert.ok(result.story.every(s=>s.startsWith("translated ")));
 assert.equal(requests.length,10,"title, summary and all eight paragraphs sent to AI");
 assert.equal(requests[0].target_lang,"bg");
});

test("without an AI binding the service must never claim all languages were translated",async()=>{
 const c={id:"mock",source:{url:"https://source.example/case"},
  title:{en:"Original English title"},summary:{en:"Original English summary"},
  story:{en:["Source account in English."]}};
 const result=await translatePublishedCase(c,"de",null,{detail:true});
 assert.equal(result.status,"unavailable");
 assert.equal(result.source_language,"en");
});
