import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import "../dossier-content.js";
import {resolveMediaPlayback} from "../media-player.js";

const d=globalThis.AURORA_DOSSIER_CONTENT;
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
test("every public source and document appears only once, without including private or unsafe links",()=>{
 const c={source:{name:"Primary institution",url:"https://institution.example/case/1"},
  sources:[
   {title:{en:"Investigation memo",bg:"Доклад"},url:"https://institution.example/other.pdf",type:"official_document"},
   {title:{en:"Duplicate"},url:"https://institution.example/other.pdf"},
   {title:{en:"Private testimony"},url:"https://private.example/",private:true},
   {name:"Unsafe link",url:"javascript:alert(1)"}
  ],media:[
   {type:"documents",title:{en:"Original notes"},url:"https://archive.example/report.pdf"},
   {type:"archive",title:{en:"Original notes duplicate"},url:"https://archive.example/report.pdf"},
   {type:"photo",url:"https://photos.example/photo.jpg"}
  ]};
 const result=d.sources(c,"bg");
 assert.deepEqual(result.map(x=>x.url),[
  "https://institution.example/case/1","https://institution.example/other.pdf","https://archive.example/report.pdf"
 ]);
 assert.equal(result[1].name,"Доклад");
 assert.equal(result.filter(x=>x.url.includes("private")).length,0);
 assert.equal(d.sources({sources:[{url:"https://site.example/",public:false}]}).length,0);
});

test("secondary source citations expose their verification classification and localized caveat",()=>{
 const note={bg:"Това досие преразказва лицензиран вторичен източник; първичните документи не са независимо прочетени.",
  en:"This dossier paraphrases a licensed secondary source; primary documents were not independently read."};
 const c={source:{name:"disclosure.zone · CC BY 4.0",url:"https://disclosure.zone/cases/socorro-1964"},
  provenance:{source_kind:"licensed secondary case compilation"},
  source_verification_status:"SECONDARY_ATTRIBUTED",source_verification_note:note};
 assert.equal(d.sources(c,"bg")[0].type,"secondary");
 assert.equal(d.sources({source:c.source,provenance:c.provenance},"bg")[0].type,"secondary");
 assert.deepEqual(d.sourceVerification(c,"bg"),{status:"SECONDARY_ATTRIBUTED",note:note.bg,suppressNarrative:false});
 assert.deepEqual(d.sourceVerification(c,"en"),{status:"SECONDARY_ATTRIBUTED",note:note.en,suppressNarrative:false});
 assert.equal(d.sourceVerification({...c,source_verification_status:"UNKNOWN"},"en"),null);
 const html=read("dossier.html"),js=read("dossier.js");
 assert.ok(html.includes('id="dossierSourceVerification"'));
 assert.ok(html.includes('id="dossierSourceVerificationStatus"'));
 assert.ok(html.includes('id="dossierSourceVerificationNote"'));
 assert.match(html,/id="dossierSourceVerification"[^>]*role="note"[^>]*aria-live="polite"/);
 assert.match(js,/contentHelper\?\.sourceVerification\(c,language\)/);
});

test("insufficient source classification suppresses unsupported narrative text",()=>{
 const result=d.sourceVerification({source_verification_status:"INSUFFICIENT_SOURCE",source_verification_note:{bg:"Недостатъчни проверими източници.",en:"Insufficient verifiable sources."}},"bg");
 assert.deepEqual(result,{status:"INSUFFICIENT_SOURCE",note:"Недостатъчни проверими източници.",suppressNarrative:true});
 const js=read("dossier.js"),css=read("dossier.css");
 assert.match(js,/verification\?\.suppressNarrative/);
 assert.match(js,/dossierSummary"\)\.hidden=suppressNarrative/);
 assert.match(js,/story\.hidden=suppressNarrative/);
 assert.match(js,/timelineBox\.hidden=suppressNarrative\|\|/);
 assert.match(css,/\.dossier-summary\[hidden\],\.dossier-story\[hidden\],\.dossier-timeline\[hidden\]\{display:none\}/);
});

test("all supported source media are included and duplicate link cards are filtered",()=>{
 const c={media:[
  {type:"video",url:"https://youtu.be/aqz-KE-bpKQ"},
  {type:"video",url:"https://youtu.be/aqz-KE-bpKQ"},
  {type:"photo",url:"https://publisher.example/photo"},
  {type:"documents",url:"https://publisher.example/document.pdf"},
  {type:"archive",url:"https://publisher.example/document.pdf"},
  {type:"video",url:"http://insecure.example/video"},
  {type:"video",url:"https://hidden.example/private",public:false}
 ]};
 assert.deepEqual(d.media(c).map(x=>x.type),["video","photo","documents","archive"]);
 assert.ok(resolveMediaPlayback(d.media(c)[0]));
});
test("only source-permitted photos can render inline and include verifiable credit",()=>{
 const photo={type:"photo",source_name:"Research agency",url:"https://agency.example/case",
  preview:{url:"https://agency.example/images/evidence.webp",rights_status:"verified",
   hosting_permission:true,authorization_type:"license",
   license_url:"https://agency.example/license",rights_evidence_url:"https://agency.example/permissions",
   attribution:"Agency photographic archive"}};
 const p=d.photoPreview(photo);
 assert.equal(p.url,"https://agency.example/images/evidence.webp");
 assert.equal(p.attribution,"Agency photographic archive");
 assert.equal(d.photoPreview({...photo,preview:{...photo.preview,rights_status:"pending"}}),null);
 assert.equal(d.photoPreview({...photo,preview:{...photo.preview,url:"https://agency.example/case"}}),null);
 assert.equal(d.photoPreview({...photo,preview:{...photo.preview,rights_evidence_url:"javascript:evil()"}}),null);
 assert.equal(d.photoPreview({...photo,preview:{...photo.preview,hosting_permission:false}}),null);
});
test("timeline renders only explicit cited events without generating chronology from uncertain dates",()=>{
 const c={date:"1977",timeline:[
  {date:"1977-07",title:{en:"Public report",bg:"Публичен сигнал"},
   description:{en:"A witness report was filed.",bg:"Постъпил е сигнал."},source_url:"https://archive.example/report"},
  {date:"unknown",title:{en:"Later review"},private:true},
  {date:"2021",description:{en:"Document review."},source_url:"javascript:alert(1)"}
 ]};
 const rows=d.timeline(c,"bg");
 assert.equal(rows.length,2);
 assert.equal(rows[0].title,"Публичен сигнал");
 assert.equal(rows[0].url,"https://archive.example/report");
 assert.equal(rows[1].url,null);
 assert.deepEqual(d.timeline({date:"1986",story:{en:["Events happened."]}}),[]);
});
test("all case views load source content and never invent photos or embed unknown third-party landing pages",()=>{
 const html=read("dossier.html"),js=read("dossier.js");
 assert.ok(html.indexOf('src="/dossier-content.js"')<html.indexOf('src="/dossier.js"'));
 for(const id of ["dossierTimeline","dossierTimelineList","casePhotoGallery","dossierSourcesList"])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(js,/contentHelper\?\.timeline\(c,language\)/);
 assert.match(js,/contentHelper\?\.sources\(c,language\)/);
 assert.match(js,/contentHelper\?\.media\(c\)/);
 assert.match(js,/contentHelper\?\.photoPreview\(m\)/);
 assert.match(js,/img\.loading="lazy"/);
 assert.doesNotMatch(js,/case-watch-button|case-video-frame/);
 assert.match(read("dossier-hero.js"),/button\.addEventListener\("click"/);
 const items=JSON.parse(read("data/cases.json")).cases;
 assert.ok(items.every(c=>c.source?.url&&c.story?.en?.length&&c.story?.bg?.length));
 const nonembeddable=items.find(c=>c.id==="westall-1966");
 assert.ok(nonembeddable.media.every(m=>resolveMediaPlayback(m)===null));
});


test("published video source links remain available without a second player",()=>{
 const cases=JSON.parse(read("data/cases.json")).cases;
 for(const c of cases){
  for(const video of (c.media||[]).filter(x=>x.type==="video"&&x.public!==false)){
   const refs=d.sources(c,"en");
   assert.ok(refs.some(x=>x.url===video.url),"Missing video provenance "+c.id+": "+video.url);
  }
 }
});
