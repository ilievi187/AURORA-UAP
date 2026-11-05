import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const publicPages=["index.html","archive.html","countries.html","country.html","donate.html","dossier.html","media.html","news.html","report.html","sources.html"];

function start(host, initial="bg", query="?lang=bg", storageWorks=true){
 const classes=new Set(),local=new Map([["aurora-lang",initial]]),h={state:null,url:null};
 const languageStatus={textContent:""},allNews={textContent:""};
 const doc={
  documentElement:{lang:"bg",dir:"ltr",classList:{add:(v)=>classes.add(v),contains:(v)=>classes.has(v)}},
  readyState:"complete",
  getElementById:(id)=>id==="homeNewsTitle"?languageStatus:null,
  querySelector:(s)=>s===".home-news-top > a"?allNews:null
 };
 const url="https://"+host+"/news.html"+query+"#headlines";
 const loc=new URL(url);
 const sandbox={
  window:{},document:doc,location:{hostname:host,href:url},
  history:{state:null,replaceState(_state,_title,url){h.url=url}},
  localStorage:{
   getItem(key){if(!storageWorks)throw Error("blocked");return local.get(key)||null},
   setItem(key,val){if(!storageWorks)throw Error("blocked");local.set(key,val)}
  },URL
 };
 runInNewContext(read("english-launch.js"),sandbox,{timeout:1000});
 return {doc,classes,local,h,window:sandbox.window,languageStatus,allNews};
}

test("real domain and Cloudflare previews force English, hide gate, remove old language parameter",()=>{
 for(const host of ["aurorauap.org","www.aurorauap.org","cc3b152c.aurora-uap.pages.dev"]){
  const result=start(host);
  assert.equal(result.window.AURORA_PUBLIC_LANGUAGE,"en");
  assert.equal(result.doc.documentElement.lang,"en");
  assert.equal(result.doc.documentElement.dir,"ltr");
  assert.equal(result.local.get("aurora-lang"),"en");
  assert.ok(result.classes.has("aurora-english-launch"));
  assert.equal(result.h.url,"/news.html#headlines");
  assert.equal(result.languageStatus.textContent,"LATEST NEWS FROM AROUND THE WORLD");
 }
});

test("English edition does not require browser storage",()=>{
 const result=start("aurorauap.org","bg","?lang=de",false);
 assert.equal(result.doc.documentElement.lang,"en");
 assert.equal(result.window.AURORA_PUBLIC_LANGUAGE,"en");
 assert.ok(result.classes.has("aurora-english-launch"));
 assert.equal(result.h.url,"/news.html#headlines");
});

test("local development retains 18-locale QA and first-entry gate",()=>{
 const result=start("127.0.0.1","bg");
 assert.equal(result.window.AURORA_PUBLIC_LANGUAGE,undefined);
 assert.equal(result.local.get("aurora-lang"),"bg");
 assert.equal(result.doc.documentElement.lang,"bg");
 assert.equal(result.classes.has("aurora-english-launch"),false);
 assert.equal(result.h.url,null);
});

test("every public page loads the English-only bootstrap before other scripts",()=>{
 for(const page of publicPages){
  const html=read(page);
  assert.match(html,/<html lang="en">/,page);
  assert.match(html,/<script src="\/english-launch\.js"><\/script>/,page);
  assert.match(html,/<link rel="stylesheet" href="\/english-launch\.css">/,page);
  const boot=html.indexOf('src="/english-launch.js"');
  assert.ok(boot<html.indexOf("</head>"),page+" script in head");
 }
 const css=read("english-launch.css");
 for(const marker of ["#languageGate","#openLanguageGate","#footerLanguageGate","#langToggle",".archive-language",".page-language","#langSelect"]){
  assert.ok(css.includes(marker),marker+" removed from public view");
 }
 assert.match(css,/display:none!important/);
 assert.match(read("aurora-v1.js"),/AURORA_PUBLIC_LANGUAGE==="en"/);
 assert.match(read("subpage-i18n.js"),/AURORA_PUBLIC_LANGUAGE==="en"/);
 assert.match(read("script.js"),/AURORA_PUBLIC_LANGUAGE==="en"/);
 assert.match(read("archive-directory.js"),/AURORA_PUBLIC_LANGUAGE==="en"/);
});

test("English-only public search descriptions never revert to Bulgarian",()=>{
 for(const page of publicPages){
  const html=read(page);
  const meta=html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  if(!meta)continue;
  assert.doesNotMatch(meta[1],/[\u0400-\u04ff]/,page+" search description must be English only");
 }
});
