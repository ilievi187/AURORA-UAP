/* One public-case translation transport shared by archive, dossiers and media.
 * A missing Workers AI binding must never be represented as a completed
 * translation. Source links and observations stay unchanged. */
const accepted=new Set(["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ko"]);
const requests=new Map();
export function isLegacyPlaceholder(record,language){
 if(language!=="bg")return false;
 const summary=String(record?.summary?.bg||"");
 const story=Array.isArray(record?.story?.bg)?record.story.bg:[];
 return /(?:е случай, описан в публичния каталог|Публикуваните сведения се отнасят|Маркерът, ако има такъв)/i.test(summary)||
  story.some(p=>/^EN\s*[·:]/.test(String(p))||/Следва оригиналното описание на английски/.test(String(p)));
}
export function caseTextLanguage(record,language){
 const t=record?.title?.[language],s=record?.summary?.[language];
 return t&&s&&!isLegacyPlaceholder(record,language)?language:"en";
}
export function translationDisclosure(language){
 const labels={
  bg:"Оригинален текст на английски · автоматичният превод не е наличен",
  en:"Original source narrative · English",
  de:"Englischer Originaltext · Übersetzung nicht verfügbar",
  ru:"Оригинальный текст на английском · перевод недоступен",
  "zh-CN":"英语原文 · 暂无翻译",
  fr:"Texte original en anglais · traduction indisponible",
  es:"Texto original en inglés · traducción no disponible",
  it:"Testo originale in inglese · traduzione non disponibile",
  pt:"Texto original em inglês · tradução indisponível",
  tr:"İngilizce özgün metin · çeviri kullanılamıyor",
  ro:"Textul original în engleză · traducere indisponibilă",
  el:"Αγγλικό πρωτότυπο · η μετάφραση δεν είναι διαθέσιμη",
  sr:"Оригинални текст на енглеском · превод није доступан",
  uk:"Оригінал англійською · переклад недоступний",
  pl:"Oryginalny tekst po angielsku · tłumaczenie niedostępne",
  ar:"النص الأصلي باللغة الإنجليزية · الترجمة غير متاحة",
  ja:"英語の原文 · 翻訳は利用できません",
  ko:"영어 원문 · 번역을 사용할 수 없습니다"
 };
 return labels[language]||labels.en;
}
export function isFullTranslation(record,language,detail=false){
 if(!accepted.has(language))return false;
 if(!record?.title?.[language]||!record?.summary?.[language])return false;
 if(isLegacyPlaceholder(record,language)&&!(record.translationSummaryReady&&!detail))return false;
 if(!detail)return true;
 const translated=record.story?.[language];
 const source=Array.isArray(record.story?.en)?record.story.en:[];
 // Curated Bulgarian paragraphs are authored separately and do not need to
 // mirror the English author's paragraph boundaries. Machine output does.
 const authoredBg=language==="bg"&&!record.translationStatus;
 return Array.isArray(translated)&&
  (authoredBg?translated.length>=3:translated.length===source.length)&&
  translated.every(p=>typeof p==="string"&&p.trim().length>=2&&p.length<=6000);
}
export async function translatePublicCase(record,language,{detail=false}={}){
 if(!record||typeof record.id!=="string"||!accepted.has(language)||language==="en")return null;
 if(isFullTranslation(record,language,detail))return null;
 if(!/^[a-z0-9-]{3,90}$/.test(record.id))return null;
 const key=record.id+"/"+language+"/"+Number(detail);
 if(requests.has(key))return requests.get(key);
 const q=new URLSearchParams({id:record.id,lang:language,detail:detail?"1":"0"});
 const controller=new AbortController();
 // Avoid a permanently stuck card when an edge worker times out.
 const timeout=setTimeout(()=>controller.abort(),30000);
 const request=fetch("/api/archive-translation?"+q.toString(),{
  signal:controller.signal,headers:{Accept:"application/json"}
 }).then(async response=>response.ok?response.json():null).then(data=>{
  if(!data||!["translated","partial","original"].includes(data.status)||
     data.id!==record.id||data.target_language!==language)return null;
  const valid=(x,n)=>typeof x==="string"&&x.trim().length>=2&&x.length<=n;
  if(!valid(data.title,750)||!valid(data.summary,6000))return null;
  // The API is untrusted input: never copy HTML, media, statuses or URLs.
  record.title??={};record.summary??={};
  record.title[language]=data.title;record.summary[language]=data.summary;
  record.translationSummaryReady=true;
  const source=Array.isArray(record.story?.en)?record.story.en:[];
  const fullStory=detail&&Array.isArray(data.story)&&data.story.length===source.length&&
   data.story.every(p=>valid(p,6000));
  if(fullStory){
   record.story??={};record.story[language]=[...data.story];
  }
  // A partially translated story is displayed in the original language,
  // explicitly identified as such; no mixed-language paragraphs are inserted.
  record.translationPartial=Boolean(detail&&!fullStory&&source.length);
  record.translationStatus=data.status==="translated"&&!record.translationPartial?
   "translated":data.status==="original"&&!record.translationPartial?"original":"partial";
  return data;
 }).catch(()=>null).finally(()=>{
  clearTimeout(timeout);
  requests.delete(key); // Failed or partial translations can be retried on navigation.
 });
 requests.set(key,request);
 return request;
}
