import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
const base=new URL("../data/",import.meta.url);
const load=path=>JSON.parse(readFileSync(new URL(path,base),"utf8"));
const foreignScript=/[\u0400-\u052f\u0600-\u06ff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u;

function validateEnglishFields(value,recordId,path="record"){
 if(Array.isArray(value)){value.forEach((item,i)=>validateEnglishFields(item,recordId,path+"["+i+"]"));return}
 if(!value||typeof value!=="object")return;
 for(const [key,item] of Object.entries(value)){
  if(key==="en"){
   const texts=Array.isArray(item)?item:[item];
   for(const text of texts){
    if(typeof text!=="string")continue;
    assert.doesNotMatch(text,foreignScript,
      recordId+" "+path+".en must be an English UI field, not a non-Latin translation/source-language label");
   }
  }else validateEnglishFields(item,recordId,path+"."+key);
 }
}

test("all 10,133 case files keep English-only display fields and source-language originals separately",()=>{
 const curated=load("cases.json").cases;
 const files=readdirSync(new URL("bulk/shards/",base)).filter(file=>/^\d\d\.json$/.test(file));
 let count=curated.length;
 for(const item of curated)validateEnglishFields(item,item.id);
 for(const file of files){
  const records=load("bulk/shards/"+file).cases;
  for(const item of records)validateEnglishFields(item,item.id);
  count+=records.length;
 }
 assert.equal(curated.length,101);
 assert.equal(files.length,64);
 assert.equal(count,10133);
});
