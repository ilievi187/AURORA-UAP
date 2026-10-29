/* AURORA / CASE DOSSIERS. Every field is rendered with textContent, never HTML. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const path=location.pathname.split("/").filter(Boolean);
 const kind=path[0],id=path[1]||"";
 const legacy=kind==="archive";
 const base={
  bg:{
   home:"← НАЧАЛО",subtitle:"Оригинално резюме с цитирани източници и изрично обозначена несигурност.",
   loading:"Зареждаме досието…",unavailable:"Публичният D1 регистър още не е активиран или е временно недостъпен. Справочният исторически архив е достъпен от началната страница.",
   missing:"Досието не е налично или не е одобрено за публикуване.",invalid:"Невалиден идентификатор на досие.",
   error:"Неуспешно зареждане. Можеш да се върнеш към глобуса и да опиташ отново.",
   kindLegacy:"ARCHIVE / HISTORICAL REFERENCE / OUTSIDE D1",kindD1:"GLOBAL REGISTER / PUBLIC APPROVED CASE",
   facts:"ПРОВЕРИМИ ДАННИ / CASE FACTS",id:"ИДЕНТИФИКАТОР",date:"ДАТА",location:"РАЙОН",
   category:"ТИП",publication:"ПУБЛИКАЦИЯ",assessment:"ОЦЕНКА НА ЯВЛЕНИЕТО",precision:"ТОЧНОСТ НА МЯСТОТО",
   summary:"СВИДЕТЕЛСТВА И ДОКУМЕНТИРАНИ ФАКТИ",source:"ПРОИЗХОД И ИЗТОЧНИК",
   geography:"ГЕОГРАФСКА НЕСИГУРНОСТ",openSource:"ОТВОРИ ОРИГИНАЛНИЯ ИЗТОЧНИК ↗",
   country:"КЪМ РЕГИСТЪРА НА ДЪРЖАВАТА ↗",back:"← КЪМ ГЛОБУСА",
   reference:"Исторически справочен запис (V1.3). Не е потребителски сигнал, не е импортиран в D1 и не влиза в публичния брояч.",
   approved:"Одобрено за публично показване — това НЕ означава потвърдено необичайно явление.",
   caution:"Свидетелски твърдения и официално публикувани видеозаписи сами по себе си не доказват извънземен произход.",
   noCoords:"Няма публикувани достатъчно точни координати. Не се поставя измислена точка на картата.",
   approx:"Позицията е ориентировъчна, а не измерено местоположение на наблюдавания обект.",
   sourceMissing:"Няма разрешен оригинален HTTPS източник.",
   categoryName:{lights:"Светлини",object:"Обект",instrument:"Запис от прибор",other:"Друго"},
   statusName:{resolved:"Обяснено според цитирания източник",unresolved:"Необяснено според цитирания източник",undetermined:"Без определено заключение",disputed:"Оспорвана оценка",reported:"Свидетелско съобщение",official_record:"Официално документирано",explained:"Има известно обяснение"},
   confidence:{high:"висока",moderate:"умерена",low:"ниска",not_stated:"непосочена"}
  },
  en:{
   home:"← HOME",subtitle:"Original summary with attributed sources and explicit uncertainty.",
   loading:"Loading public dossier…",unavailable:"The D1 public registry is not active or temporarily unavailable. The historical reference archive remains available from the homepage.",
   missing:"This dossier is unavailable or has not been approved for publication.",invalid:"Invalid dossier ID.",
   error:"Could not load dossier. Return to the globe and try again.",
   kindLegacy:"ARCHIVE / HISTORICAL REFERENCE / OUTSIDE D1",kindD1:"GLOBAL REGISTER / PUBLIC APPROVED CASE",
   facts:"SOURCE-CHECKED INFORMATION / CASE FACTS",id:"IDENTIFIER",date:"DATE",location:"REGION",
   category:"CATEGORY",publication:"PUBLICATION",assessment:"SOURCE ASSESSMENT",precision:"LOCATION ACCURACY",
   summary:"WITNESS REPORTS AND DOCUMENTED FACTS",source:"PROVENANCE AND ORIGINAL SOURCE",
   geography:"GEOGRAPHIC UNCERTAINTY",openSource:"OPEN ORIGINAL SOURCE ↗",
   country:"EXPLORE COUNTRY REGISTER ↗",back:"← RETURN TO THE GLOBE",
   reference:"V1.3 historical reference only. Not a user submission, not imported into D1 and not included in registered totals.",
   approved:"Editorially approved for publication — this does NOT mean an anomalous phenomenon was confirmed.",
   caution:"Witness reports and officially released recordings alone do not establish extraterrestrial origin.",
   noCoords:"No sufficiently precise published coordinates. No artificial map position is invented.",
   approx:"Coordinates are an approximate display anchor, not a measured object position.",
   sourceMissing:"No verified original HTTPS source is available.",
   categoryName:{lights:"Lights",object:"Object",instrument:"Instrument recording",other:"Other"},
   statusName:{resolved:"Resolved according to cited source",unresolved:"Unresolved according to cited source",undetermined:"No final assessment",disputed:"Disputed assessment",reported:"Eyewitness report",official_record:"Official documented report",explained:"Known explanation"},
   confidence:{high:"high",moderate:"moderate",low:"low",not_stated:"not stated"}
  }
 };
 const overrides={
  de:{home:"← STARTSEITE",subtitle:"Zusammenfassung mit genannten Quellen und ausgewiesener Unsicherheit.",facts:"GEPRÜFTE ANGABEN / CASE FACTS",id:"KENNUNG",date:"DATUM",location:"REGION",category:"KATEGORIE",publication:"VERÖFFENTLICHUNG",assessment:"BEWERTUNG",precision:"ORTSGENAUIGKEIT",summary:"ZEUGENBERICHTE UND DOKUMENTIERTE FAKTEN",source:"HERKUNFT UND ORIGINALQUELLE",geography:"GEOGRAFISCHE UNSICHERHEIT",openSource:"ORIGINALQUELLE ÖFFNEN ↗",country:"ZUM LÄNDERREGISTER ↗",back:"← ZURÜCK ZUM GLOBUS",caution:"Zeugenberichte und offiziell veröffentlichte Aufnahmen allein belegen keinen außerirdischen Ursprung.",approx:"Koordinaten sind ein ungefährer Orientierungspunkt, keine gemessene Objektposition."},
  ru:{home:"← ГЛАВНАЯ",subtitle:"Резюме с указанием источников и явно обозначенной неопределённостью.",facts:"ПРОВЕРЕННЫЕ ДАННЫЕ / CASE FACTS",id:"ИДЕНТИФИКАТОР",date:"ДАТА",location:"РАЙОН",category:"КАТЕГОРИЯ",publication:"ПУБЛИКАЦИЯ",assessment:"ОЦЕНКА ИСТОЧНИКА",precision:"ТОЧНОСТЬ МЕСТА",summary:"СВИДЕТЕЛЬСТВА И ДОКУМЕНТИРОВАННЫЕ ФАКТЫ",source:"ПРОИСХОЖДЕНИЕ И ПЕРВОИСТОЧНИК",geography:"ГЕОГРАФИЧЕСКАЯ НЕОПРЕДЕЛЁННОСТЬ",openSource:"ОТКРЫТЬ ОРИГИНАЛЬНЫЙ ИСТОЧНИК ↗",country:"К РЕЕСТРУ СТРАНЫ ↗",back:"← НАЗАД К ГЛОБУСУ",caution:"Свидетельства очевидцев и официальные видеозаписи сами по себе не доказывают внеземное происхождение.",approx:"Координаты являются приблизительным ориентиром, а не измеренным положением объекта."},
  "zh-CN":{home:"← 首页",subtitle:"附带来源归属与明确不确定性说明的原始摘要。",facts:"核查信息 / CASE FACTS",id:"标识符",date:"日期",location:"地区",category:"类别",publication:"发布状态",assessment:"来源评估",precision:"位置精度",summary:"目击报告与记录事实",source:"出处与原始来源",geography:"地理不确定性",openSource:"打开原始来源 ↗",country:"浏览国家/地区登记库 ↗",back:"← 返回地球仪",caution:"目击报告和官方发布的录像本身并不能证明地外起源。",approx:"坐标仅为大致显示锚点，而非测得的目标位置。"},
  fr:{home:"← ACCUEIL",subtitle:"Résumé sourcé avec incertitude explicitement indiquée.",facts:"DONNÉES VÉRIFIABLES / CASE FACTS",id:"IDENTIFIANT",date:"DATE",location:"RÉGION",category:"CATÉGORIE",publication:"PUBLICATION",assessment:"ÉVALUATION DE LA SOURCE",precision:"PRÉCISION DU LIEU",summary:"TÉMOIGNAGES ET FAITS DOCUMENTÉS",source:"PROVENANCE ET SOURCE ORIGINALE",geography:"INCERTITUDE GÉOGRAPHIQUE",openSource:"OUVRIR LA SOURCE ORIGINALE ↗",country:"EXPLORER LE REGISTRE DU PAYS ↗",back:"← RETOUR AU GLOBE",caution:"Les témoignages et les enregistrements officiels ne prouvent pas à eux seuls une origine extraterrestre.",approx:"Les coordonnées sont un repère approximatif, pas une position mesurée."},
  es:{home:"← INICIO",subtitle:"Resumen original con fuentes atribuidas e incertidumbre explícita.",facts:"DATOS VERIFICABLES / CASE FACTS",id:"IDENTIFICADOR",date:"FECHA",location:"REGIÓN",category:"CATEGORÍA",publication:"PUBLICACIÓN",assessment:"EVALUACIÓN DE LA FUENTE",precision:"PRECISIÓN DEL LUGAR",summary:"TESTIMONIOS Y HECHOS DOCUMENTADOS",source:"PROCEDENCIA Y FUENTE ORIGINAL",geography:"INCERTIDUMBRE GEOGRÁFICA",openSource:"ABRIR FUENTE ORIGINAL ↗",country:"EXPLORAR REGISTRO DEL PAÍS ↗",back:"← VOLVER AL GLOBO",caution:"Los informes de testigos y las grabaciones oficiales por sí solos no establecen un origen extraterrestre.",approx:"Las coordenadas son una referencia aproximada, no una posición medida."},
  it:{home:"← HOME",subtitle:"Riepilogo con fonti attribuite e incertezza esplicita.",facts:"DATI VERIFICABILI / CASE FACTS",id:"IDENTIFICATORE",date:"DATA",location:"REGIONE",category:"CATEGORIA",publication:"PUBBLICAZIONE",assessment:"VALUTAZIONE DELLA FONTE",precision:"PRECISIONE DELLA POSIZIONE",summary:"TESTIMONIANZE E FATTI DOCUMENTATI",source:"PROVENIENZA E FONTE ORIGINALE",geography:"INCERTEZZA GEOGRAFICA",openSource:"APRI FONTE ORIGINALE ↗",country:"ESPLORA REGISTRO DEL PAESE ↗",back:"← TORNA AL GLOBO",caution:"Le testimonianze e le registrazioni ufficiali da sole non stabiliscono un'origine extraterrestre.",approx:"Le coordinate sono un riferimento approssimativo, non una posizione misurata."},
  pt:{home:"← INÍCIO",subtitle:"Resumo com fontes atribuídas e incerteza explícita.",facts:"DADOS VERIFICÁVEIS / CASE FACTS",id:"IDENTIFICADOR",date:"DATA",location:"REGIÃO",category:"CATEGORIA",publication:"PUBLICAÇÃO",assessment:"AVALIAÇÃO DA FONTE",precision:"PRECISÃO DO LOCAL",summary:"RELATOS E FACTOS DOCUMENTADOS",source:"PROVENIÊNCIA E FONTE ORIGINAL",geography:"INCERTEZA GEOGRÁFICA",openSource:"ABRIR FONTE ORIGINAL ↗",country:"EXPLORAR REGISTO DO PAÍS ↗",back:"← VOLTAR AO GLOBO",caution:"Relatos de testemunhas e gravações oficiais por si só não estabelecem origem extraterrestre.",approx:"As coordenadas são uma referência aproximada, não uma posição medida."},
  tr:{home:"← ANA SAYFA",subtitle:"Kaynakları belirtilmiş ve belirsizliği açıkça ifade edilmiş özet.",facts:"DOĞRULANABİLİR VERİLER / CASE FACTS",id:"KİMLİK",date:"TARİH",location:"BÖLGE",category:"KATEGORİ",publication:"YAYIN",assessment:"KAYNAK DEĞERLENDİRMESİ",precision:"KONUM HASSASİYETİ",summary:"TANIK RAPORLARI VE BELGELENEN GERÇEKLER",source:"KÖKEN VE ÖZGÜN KAYNAK",geography:"COĞRAFİ BELİRSİZLİK",openSource:"ÖZGÜN KAYNAĞI AÇ ↗",country:"ÜLKE KAYDINI İNCELE ↗",back:"← KÜREYE DÖN",caution:"Tanık ifadeleri ve resmî kayıtlar tek başına dünya dışı kökeni kanıtlamaz.",approx:"Koordinatlar ölçülmüş bir konum değil, yaklaşık bir gösterim referansıdır."},
  ro:{home:"← ACASĂ",subtitle:"Rezumat cu surse atribuite și incertitudine explicită.",facts:"DATE VERIFICABILE / CASE FACTS",id:"IDENTIFICATOR",date:"DATĂ",location:"REGIUNE",category:"CATEGORIE",publication:"PUBLICARE",assessment:"EVALUAREA SURSEI",precision:"PRECIZIA LOCAȚIEI",summary:"MĂRTURII ȘI FAPTE DOCUMENTATE",source:"PROVENIENȚĂ ȘI SURSĂ ORIGINALĂ",geography:"INCERTITUDINE GEOGRAFICĂ",openSource:"DESCHIDE SURSA ORIGINALĂ ↗",country:"EXPLOREAZĂ REGISTRUL ȚĂRII ↗",back:"← ÎNAPOI LA GLOB",caution:"Mărturiile și înregistrările oficiale singure nu stabilesc o origine extraterestră.",approx:"Coordonatele sunt un reper aproximativ, nu o poziție măsurată."},
  el:{home:"← ΑΡΧΙΚΗ",subtitle:"Περίληψη με αναφερόμενες πηγές και ρητή αβεβαιότητα.",facts:"ΕΠΑΛΗΘΕΥΣΙΜΑ ΣΤΟΙΧΕΙΑ / CASE FACTS",id:"ΑΝΑΓΝΩΡΙΣΤΙΚΟ",date:"ΗΜΕΡΟΜΗΝΙΑ",location:"ΠΕΡΙΟΧΗ",category:"ΚΑΤΗΓΟΡΙΑ",publication:"ΔΗΜΟΣΙΕΥΣΗ",assessment:"ΑΞΙΟΛΟΓΗΣΗ ΠΗΓΗΣ",precision:"ΑΚΡΙΒΕΙΑ ΤΟΠΟΘΕΣΙΑΣ",summary:"ΜΑΡΤΥΡΙΕΣ ΚΑΙ ΤΕΚΜΗΡΙΩΜΕΝΑ ΓΕΓΟΝΟΤΑ",source:"ΠΡΟΕΛΕΥΣΗ ΚΑΙ ΠΡΩΤΟΤΥΠΗ ΠΗΓΗ",geography:"ΓΕΩΓΡΑΦΙΚΗ ΑΒΕΒΑΙΟΤΗΤΑ",openSource:"ΑΝΟΙΓΜΑ ΠΡΩΤΟΤΥΠΗΣ ΠΗΓΗΣ ↗",country:"ΜΗΤΡΩΟ ΧΩΡΑΣ ↗",back:"← ΕΠΙΣΤΡΟΦΗ ΣΤΗΝ ΥΔΡΟΓΕΙΟ",caution:"Οι μαρτυρίες και οι επίσημες καταγραφές από μόνες τους δεν αποδεικνύουν εξωγήινη προέλευση.",approx:"Οι συντεταγμένες είναι προσεγγιστικό σημείο αναφοράς."},
  sr:{home:"← ПОЧЕТНА",subtitle:"Резиме са наведеним изворима и јасно назначеном несигурношћу.",facts:"ПРОВЕРЉИВИ ПОДАЦИ / CASE FACTS",id:"ИДЕНТИФИКАТОР",date:"ДАТУМ",location:"РЕГИОН",category:"КАТЕГОРИЈА",publication:"ПУБЛИКАЦИЈА",assessment:"ПРОЦЕНА ИЗВОРА",precision:"ПРЕЦИЗНОСТ ЛОКАЦИЈЕ",summary:"СВЕДОЧЕЊА И ДОКУМЕНТОВАНИ ФАКТИ",source:"ПОРЕКЛО И ИЗВОРНИ ИЗВОР",geography:"ГЕОГРАФСКА НЕСИГУРНОСТ",openSource:"ОТВОРИ ИЗВОРНИ ИЗВОР ↗",country:"ИСТРАЖИ РЕГИСТАР ДРЖАВЕ ↗",back:"← НАЗАД НА ГЛОБУС",caution:"Изјаве сведока и званични снимци сами по себи не доказују ванземаљско порекло.",approx:"Координате су приближна тачка приказа, а не измерена позиција објекта."},
  uk:{home:"← ГОЛОВНА",subtitle:"Резюме із зазначеними джерелами та явною невизначеністю.",facts:"ПЕРЕВІРЕНІ ДАНІ / CASE FACTS",id:"ІДЕНТИФІКАТОР",date:"ДАТА",location:"РАЙОН",category:"КАТЕГОРІЯ",publication:"ПУБЛІКАЦІЯ",assessment:"ОЦІНКА ДЖЕРЕЛА",precision:"ТОЧНІСТЬ МІСЦЯ",summary:"СВІДЧЕННЯ ТА ДОКУМЕНТОВАНІ ФАКТИ",source:"ПОХОДЖЕННЯ ТА ПЕРШОДЖЕРЕЛО",geography:"ГЕОГРАФІЧНА НЕВИЗНАЧЕНІСТЬ",openSource:"ВІДКРИТИ ОРИГІНАЛЬНЕ ДЖЕРЕЛО ↗",country:"ДО РЕЄСТРУ КРАЇНИ ↗",back:"← НАЗАД ДО ГЛОБУСА",caution:"Свідчення очевидців та офіційні відеозаписи самі по собі не доводять позаземне походження.",approx:"Координати є орієнтовною точкою, а не виміряним положенням об’єкта."},
  pl:{home:"← STRONA GŁÓWNA",subtitle:"Podsumowanie z przypisanymi źródłami i wyraźnie zaznaczoną niepewnością.",facts:"ZWERYFIKOWANE DANE / CASE FACTS",id:"IDENTYFIKATOR",date:"DATA",location:"REGION",category:"KATEGORIA",publication:"PUBLIKACJA",assessment:"OCENA ŹRÓDŁA",precision:"DOKŁADNOŚĆ LOKALIZACJI",summary:"RELACJE ŚWIADKÓW I UDOKUMENTOWANE FAKTY",source:"POCHODZENIE I ŹRÓDŁO ORYGINALNE",geography:"NIEPEWNOŚĆ GEOGRAFICZNA",openSource:"OTWÓRZ ŹRÓDŁO ORYGINALNE ↗",country:"ZOBACZ REJESTR KRAJU ↗",back:"← POWRÓT DO GLOBUSA",caution:"Relacje świadków i oficjalnie opublikowane nagrania same w sobie nie dowodzą pochodzenia pozaziemskiego.",approx:"Współrzędne są przybliżonym punktem orientacyjnym, a nie zmierzoną pozycją obiektu."},
  ar:{home:"← الرئيسية",subtitle:"ملخص أصلي مع مصادر موثقة وعدم يقين موضح صراحة.",facts:"معلومات موثقة / CASE FACTS",id:"المعرف",date:"التاريخ",location:"المنطقة",category:"الفئة",publication:"النشر",assessment:"تقييم المصدر",precision:"دقة الموقع",summary:"تقارير الشهود والحقائق الموثقة",source:"الأصل والمصدر الأصلي",geography:"عدم اليقين الجغرافي",openSource:"افتح المصدر الأصلي ↗",country:"استكشف سجل الدولة ↗",back:"← العودة إلى الكرة الأرضية",caution:"تقارير الشهود والتسجيلات الرسمية وحدها لا تثبت أصلاً خارج الأرض.",approx:"الإحداثيات هي نقطة عرض تقريبية وليست موقعاً مقاساً للجسم."},
  ja:{home:"← ホーム",subtitle:"出典を明記し、不確実性を明確に示した要約。",facts:"検証可能な情報 / CASE FACTS",id:"識別子",date:"日付",location:"地域",category:"カテゴリ",publication:"公開区分",assessment:"出典の評価",precision:"位置の精度",summary:"目撃報告と記録された事実",source:"来歴と元の出典",geography:"地理的不確実性",openSource:"元の出典を開く ↗",country:"国別レジストリを見る ↗",back:"← 地球儀に戻る",caution:"目撃証言や公式に公開された映像だけでは、地球外起源を証明することにはなりません。",approx:"座標は概略の表示位置であり、測定された物体の位置ではありません。"},
  ko:{home:"← 홈",subtitle:"출처가 명시되고 불확실성이 명확히 표시된 요약.",facts:"검증된 정보 / CASE FACTS",id:"식별자",date:"날짜",location:"지역",category:"분류",publication:"게시 상태",assessment:"출처 평가",precision:"위치 정확도",summary:"목격 보고 및 기록된 사실",source:"출처 및 원본 자료",geography:"지리적 불확실성",openSource:"원본 출처 열기 ↗",country:"국가 레지스트리 탐색 ↗",back:"← 지구본으로 돌아가기",caution:"목격자 진술과 공식 공개 영상만으로는 외계 기원을 입증할 수 없습니다.",approx:"좌표는 대략적인 표시 기준점이며 측정된 물체 위치가 아닙니다."}
 };
 let language=(()=>{try{return localStorage.getItem("aurora-lang")||"bg"}catch{return "bg"}})();
 document.documentElement.lang=language;
 const getPack=()=>language==="bg"?base.bg:{...base.en,...(overrides[language]||{})};
 const local=x=>x?.[language]||x?.en||"";
 let currentCase=null,feedbackState="loading";
 function feedback(stateKey,error=false){
  feedbackState=stateKey;
  const t=getPack();
  $("dossierFeedback").textContent=t[stateKey]||stateKey;
  $("dossierFeedback").classList.toggle("error",error);
  $("dossierFeedback").hidden=false;
  $("dossierContent").hidden=true;
  $("dossierActions").hidden=true;
 }
 function sourceUrl(raw){
  try{
   const u=new URL(raw);
   if(u.protocol!=="https:"||u.username||u.password||u.port||!u.hostname.includes("."))return null;
   return u.href;
  }catch{return null}
 }
 function label(id,value){$(id).textContent=value}
 function render(c){
  currentCase=c;
  const t=getPack();
  const title=local(c.title)||c.title||id;
  const summary=local(c.summary)||c.description||"";
  const area=local(c.city)||c.location||"—";
  const country=c.country_code||c.country||"";
  const assessment=c.assessment_status||c.status||"undetermined";
  document.title=title+" | AURORA UAP";
  label("dossierTitle",title);
  label("dossierKind",legacy?t.kindLegacy:t.kindD1);
  label("dossierSubtitle",t.subtitle);
  label("factIdentifier",c.id);
  label("factDate",c.date+" · "+(c.date_precision||""));
  label("factLocation",area+(country?" · "+country:""));
  label("factCategory",t.categoryName[c.category]||c.category||"—");
  label("factPublication",legacy?t.reference:t.approved);
  label("factAssessment",t.statusName[assessment]||t.statusName.undetermined);
  label("factPrecision",c.location_precision||"—");
  label("dossierSummary",summary);
  // Source provenance is preserved; visuals are labelled if illustrative.
  const visual=c.visual;
  const visualBox=$("caseVisual"),visualImage=$("caseVisualImage");
  const allowedVisual=typeof visual?.src==="string"&&/^\/assets\/[a-z0-9-]+\.webp$/.test(visual.src);
  visualBox.hidden=!allowedVisual;
  if(allowedVisual){
   visualImage.src=visual.src;
   visualImage.alt=local(visual.caption)||"Case illustration";
   $("caseVisualCaption").textContent=local(visual.caption)||"Illustrative image";
  }else{visualImage.removeAttribute("src")}
  const story=$("dossierStory");story.replaceChildren();
  const narrative=c.story?.[language]||c.story?.en;
  if(Array.isArray(narrative)){
   for(const passage of narrative.slice(0,10)){
    if(typeof passage!=="string"||passage.length<15)continue;
    const paragraph=document.createElement("p");
    paragraph.textContent=passage;story.append(paragraph);
   }
  }
  const mediaBox=$("caseMediaSection"),mediaGrid=$("caseMediaGrid");
  const existingIframe=mediaGrid.querySelector("iframe");
  mediaGrid.replaceChildren();
  $("caseMediaTitle").textContent=window.AURORA_UI?.label("mediaTitle")||(language==="bg"?"СНИМКИ, ВИДЕО И ДОКУМЕНТИ":"PHOTOS, VIDEO & SOURCE DOCUMENTS");
  const approvedTypes=new Set(["video","documents","archive","photo"]);
  for(const m of (Array.isArray(c.media)?c.media:[]).slice(0,12)){
   if(!approvedTypes.has(m.type))continue;
   const safe=sourceUrl(m.url);if(!safe)continue;
   const anchor=document.createElement("a");anchor.href=safe;anchor.target="_blank";anchor.rel="noopener noreferrer";
   anchor.className="case-media-link";
   const icon=document.createElement("span");
   icon.className="case-media-icon";icon.setAttribute("aria-hidden","true");
   icon.textContent=m.type==="video"?"▶":m.type==="photo"?"▧":"▤";
   const text=document.createElement("strong");
   text.textContent=local(m.title)||m.type;
   const type=document.createElement("small");
   type.textContent=({video:"VIDEO",photo:"PHOTO",documents:"DOCUMENTS",archive:"ARCHIVE"})[m.type];
   anchor.append(icon,text,type);mediaGrid.append(anchor);
  }
  // Native viewing for the one verified public-domain DVIDS video. The player
  // is intentionally created only after an explicit user click (no third-party
  // cookie or media request on initial page load).
  if(c.id==="al-taqaddum-2017"&&legacy){
   const watch=document.createElement("button");
   watch.type="button";watch.className="case-watch-button";
   watch.textContent=window.AURORA_UI?.label("watch")||(language==="bg"?"▶ ГЛЕДАЙ ОРИГИНАЛНИЯ ЗАПИС":"▶ WATCH THE ORIGINAL FOOTAGE");
   watch.addEventListener("click",()=>{
    if(mediaGrid.querySelector("iframe"))return;
    const frame=document.createElement("iframe");
    frame.src="https://www.dvidshub.net/video/embed/960331";
    frame.title="DVIDS — Al Taqaddum original AARO video";
    frame.className="case-video-frame";
    frame.loading="lazy";frame.allowFullscreen=true;
    frame.referrerPolicy="strict-origin-when-cross-origin";
    frame.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");
    mediaGrid.append(frame);
    watch.disabled=true;
   });
   mediaGrid.prepend(watch);
   if(existingIframe){mediaGrid.append(existingIframe);watch.disabled=true}
  }
  mediaBox.hidden=mediaGrid.childElementCount===0;

  label("dossierCaution",t.caution);
  const provenance = c.provenance || {};
  const source=sourceUrl(c.source_url||c.source?.url||provenance.source_url);
  label("dossierSourceName",c.source_name||c.source?.name||provenance.source_name||t.sourceMissing);
  const src=$("dossierSourceUrl");
  src.hidden=!source;
  if(source){src.href=source;src.textContent=t.openSource}
  label("dossierLicense",legacy?t.reference:(c.license||provenance.license||""));
  const authority=c.assessment_authority?
   c.assessment_authority+" · "+(t.confidence[c.assessment_confidence]||t.confidence.not_stated):"";
  label("dossierAssessmentAuthority",authority);
  const lat=c.latitude??c.lat,lng=c.longitude??c.lng;
  if(typeof lat==="number"&&Number.isFinite(lat)&&Math.abs(lat)<=90&&
     typeof lng==="number"&&Number.isFinite(lng)&&Math.abs(lng)<=180){
   label("dossierCoordinate",lat.toFixed(3)+"°, "+lng.toFixed(3)+"°");
   label("dossierLocationCaveat",t.approx+" "+(c.location_precision||""));
  }else{
   label("dossierCoordinate","N/A — POSITION NOT PUBLISHED");
   label("dossierLocationCaveat",t.noCoords+" "+(c.location_precision||""));
  }
  const countryLink=$("dossierCountry");
  countryLink.hidden=legacy||!/^[A-Z]{2}$/.test(country);
  if(!countryLink.hidden){countryLink.href="/countries/"+country;countryLink.textContent=t.country}
  label("dossierArchiveLink",t.back);
  $("dossierFeedback").hidden=true;
  $("dossierContent").hidden=false;$("dossierActions").hidden=false;
 }
 function translateStatic(){
  const t=getPack();
  const ids={dossierBack:"home",factsHeading:"facts",labelIdentifier:"id",labelDate:"date",
   labelLocation:"location",labelCategory:"category",labelPublication:"publication",labelAssessment:"assessment",
   labelPrecision:"precision",summaryHeading:"summary",sourceHeading:"source",locationHeading:"geography"};
  for(const [id,key] of Object.entries(ids))label(id,t[key]);
  document.querySelector(".skip").textContent=language==="bg"?"Към съдържанието":"Skip to content";
 }
 window.addEventListener("aurora:language-changed",e=>{
  language=e?.detail?.language||document.documentElement.lang||"bg";
  translateStatic();
  if(currentCase&&!$("dossierContent").hidden)render(currentCase);
  else if(!$("dossierFeedback").hidden)feedback(feedbackState,$("dossierFeedback").classList.contains("error"));
 });
 async function load(){
  translateStatic();
  if(!["archive","cases"].includes(kind)||!/^[a-z0-9-]{3,90}$/.test(id)||path.length!==2){
   feedback("invalid",true);return;
  }
  feedback("loading");
  try{
   let c;
   if(legacy){
    const res=await fetch("/data/cases.json",{cache:"force-cache"});
    if(!res.ok)throw Error("archive");
    const data=await res.json();
    c=(Array.isArray(data.cases)?data.cases:[]).find(x=>x.id===id);
   }else{
    const res=await fetch("/api/cases/"+encodeURIComponent(id),{cache:"no-store"});
    if(res.status===503){feedback("unavailable");return}
    if(res.status===404){feedback("missing",true);return}
    if(!res.ok)throw Error("case");
    c=await res.json();
    if(c.review_status!=="approved"||c.record_kind==="demo"){feedback("missing",true);return}
   }
   if(!c){feedback("missing",true);return}
   render(c);
  }catch{feedback("error",true)}
 }
 load();
})();
