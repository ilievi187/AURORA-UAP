/* Media browser uses original source links and an offline-friendly static catalog. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const PACKS={
  bg:{
   heading:"СНИМКИ, ВИДЕО И ДОКУМЕНТИ",
   intro:"Снимки, публикувани видеозаписи, интервюта и документи от оригинални архиви. Избери материал или прочети историята.",
   filterLabel:"ФИЛТЪР",searchLabel:"ТЪРСИ ПО СЛУЧАЙ ИЛИ ИЗТОЧНИК",
   all:"Всички материали",video:"Видео",documents:"Документи и архиви",photo:"Фотографии",
   count:n=>"Налични медийни връзки: "+n,empty:"Няма материали за този филтър.",offline:"Медийният каталог временно не се зарежда.",
   case:"ОТВОРИ ПЪЛНОТО ДОСИЕ ↗",view:"ОТВОРИ ОРИГИНАЛНИЯ МАТЕРИАЛ ↗",illustration:"Тематична илюстрация — не оригинална снимка.",
   warning:"Медиите се отварят при издателите и архивите им; AURORA не представя тематичните илюстрации за оригинални фотографии и не качва повторно чужди видеозаписи."
  },
  en:{
   heading:"PHOTOS, VIDEO & DOCUMENTS",
   intro:"Source-published photographs, video footage, interviews and documents. Open the original material or read the case history.",
   filterLabel:"FILTER",searchLabel:"SEARCH BY CASE OR SOURCE",
   all:"All media",video:"Video",documents:"Documents and archives",photo:"Photographs",
   count:n=>"Available source media links: "+n,empty:"No media for this filter.",offline:"Media catalog temporarily unavailable.",
   case:"OPEN FULL CASE DOSSIER ↗",view:"OPEN ORIGINAL MATERIAL ↗",illustration:"Thematic illustration, not an original incident photograph.",
   warning:"Media opens at the original publishers and archives; AURORA never presents thematic illustrations as incident photography and does not re-upload third-party videos."
  },
  de:{
   heading:"FOTOS, VIDEOS & DOKUMENTE",
   intro:"Veröffentlichte Fotografien, Videoaufnahmen, Interviews und Dokumente aus Originalarchiven. Öffnen Sie das Originalmaterial oder das Falldossier.",
   filterLabel:"FILTER",searchLabel:"NACH FALL ODER QUELLE SUCHEN",
   all:"Alle Materialien",video:"Video",documents:"Dokumente und Archive",photo:"Fotografien",
   count:n=>"Verfügbare Medienlinks: "+n,empty:"Keine Materialien für diesen Filter.",offline:"Medienkatalog vorübergehend nicht verfügbar.",
   case:"VOLLSTÄNDIGES DOSSIER ÖFFNEN ↗",view:"ORIGINALMATERIAL ÖFFNEN ↗",illustration:"Thematische Illustration — kein Originalfoto des Vorfalls.",
   warning:"Medien werden bei den Originalverlagen und Archiven geöffnet; AURORA gibt thematische Illustrationen niemals als Originalfotos aus."
  },
  ru:{
   heading:"ФОТО, ВИДЕО И ДОКУМЕНТЫ",
   intro:"Фотографии, опубликованные видеозаписи, интервью и документы из оригинальных архивов. Откройте первоисточник или полное досье.",
   filterLabel:"ФИЛЬТР",searchLabel:"ПОИСК ПО СЛУЧАЮ ИЛИ ИСТОЧНИКУ",
   all:"Все материалы",video:"Видео",documents:"Документы и архивы",photo:"Фотографии",
   count:n=>"Доступных медиа-ссылок: "+n,empty:"Нет материалов для выбранного фильтра.",offline:"Медиакаталог временно недоступен.",
   case:"ОТКРЫТЬ ПОЛНОЕ ДОСЬЕ ↗",view:"ОТКРЫТЬ ОРИГИНАЛЬНЫЙ МАТЕРИАЛ ↗",illustration:"Тематическая иллюстрация — не оригинальный снимок.",
   warning:"Материалы открываются на сайтах издателей и архивов; AURORA не выдаёт иллюстрации за подлинные фотографии и не перезаливает чужие видео."
  },
  "zh-CN":{
   heading:"照片、视频与文档",
   intro:"来自原始档案的公开照片、视频片段、访谈与文献。打开原始材料或阅读完整案例档案。",
   filterLabel:"筛选",searchLabel:"按案例或来源搜索",
   all:"全部资料",video:"视频",documents:"文档与档案",photo:"照片",
   count:n=>"可用原始媒体链接："+n,empty:"该筛选条件下暂无资料。",offline:"媒体目录暂时不可用。",
   case:"打开完整案例档案 ↗",view:"打开原始资料 ↗",illustration:"主题插图——并非事件原始照片。",
   warning:"媒体链接直接跳转至原始发布方与档案馆；AURORA 绝不将主题插图冒充为事件照片，也不会重新上传第三方视频。"
  },
  fr:{
   heading:"PHOTOS, VIDÉOS ET DOCUMENTS",
   intro:"Photographies, séquences vidéo, entretiens et documents publiés par les sources originales. Ouvrez le document original ou le dossier complet.",
   filterLabel:"FILTRE",searchLabel:"RECHERCHER PAR CAS OU SOURCE",
   all:"Tous les médias",video:"Vidéo",documents:"Documents et archives",photo:"Photographies",
   count:n=>"Liens médias disponibles : "+n,empty:"Aucun média pour ce filtre.",offline:"Catalogue média temporairement indisponible.",
   case:"OUVRIR LE DOSSIER COMPLET ↗",view:"OUVRIR LE DOCUMENT ORIGINAL ↗",illustration:"Illustration thématique — pas une photographie originale.",
   warning:"Les médias s'ouvrent chez les éditeurs et archives d'origine ; AURORA ne présente jamais d'illustrations comme des photos d'incident."
  },
  es:{
   heading:"FOTOS, VÍDEOS Y DOCUMENTOS",
   intro:"Fotografías, grabaciones de vídeo, entrevistas y documentos publicados por las fuentes originales. Abra el material original o el expediente.",
   filterLabel:"FILTRO",searchLabel:"BUSCAR POR CASO O FUENTE",
   all:"Todos los materiales",video:"Vídeo",documents:"Documentos y archivos",photo:"Fotografías",
   count:n=>"Enlaces multimedia disponibles: "+n,empty:"No hay materiales para este filtro.",offline:"Catálogo multimedia temporalmente no disponible.",
   case:"ABRIR EXPEDIENTE COMPLETO ↗",view:"ABRIR MATERIAL ORIGINAL ↗",illustration:"Ilustración temática — no es una fotografía original del incidente.",
   warning:"Los medios se abren en las editoriales y archivos originales; AURORA no presenta ilustraciones como fotografías reales."
  },
  it:{
   heading:"FOTO, VIDEO E DOCUMENTI",
   intro:"Fotografie, filmati, interviste e documenti pubblicati dalle fonti originali. Apri il materiale originale o leggi il dossier completo.",
   filterLabel:"FILTRO",searchLabel:"CERCA PER CASO O FONTE",
   all:"Tutti i materiali",video:"Video",documents:"Documenti e archivi",photo:"Fotografie",
   count:n=>"Link multimediali disponibili: "+n,empty:"Nessun materiale per questo filtro.",offline:"Catalogo multimediale temporaneamente non disponibile.",
   case:"APRI DOSSIER COMPLETO ↗",view:"APRI MATERIALE ORIGINALE ↗",illustration:"Illustrazione tematica — non una fotografia originale dell'evento.",
   warning:"I media si aprono presso gli editori e archivi originali; AURORA non presenta illustrazioni tematiche come foto autentiche."
  },
  pt:{
   heading:"FOTOS, VÍDEOS E DOCUMENTOS",
   intro:"Fotografias, gravações de vídeo, entrevistas e documentos publicados pelas fontes originais. Abra o material original ou o dossiê completo.",
   filterLabel:"FILTRO",searchLabel:"PESQUISAR POR CASO OU FONTE",
   all:"Todos os materiais",video:"Vídeo",documents:"Documentos e arquivos",photo:"Fotografias",
   count:n=>"Links de mídia disponíveis: "+n,empty:"Nenhum material para este filtro.",offline:"Catálogo de mídia temporariamente indisponível.",
   case:"ABRIR DOSSIÊ COMPLETO ↗",view:"ABRIR MATERIAL ORIGINAL ↗",illustration:"Ilustração temática — não é uma fotografia original do incidente.",
   warning:"As mídias abrem nos editores e arquivos originais; a AURORA não apresenta ilustrações como fotografias reais."
  },
  tr:{
   heading:"FOTOĞRAF, VİDEO VE BELGELER",
   intro:"Özgün kaynaklar tarafından yayımlanan fotoğraflar, video kayıtları, röportajlar ve belgeler. Özgün materyali veya vaka dosyasını açın.",
   filterLabel:"FİLTRE",searchLabel:"VAKA VEYA KAYNAĞA GÖRE ARA",
   all:"Tüm materyaller",video:"Video",documents:"Belgeler ve arşivler",photo:"Fotoğraflar",
   count:n=>"Kullanılabilir medya bağlantıları: "+n,empty:"Bu filtre için materyal yok.",offline:"Medya kataloğu geçici olarak kullanılamıyor.",
   case:"TAM VAKA DOSYASINI AÇ ↗",view:"ÖZGÜN MATERYALİ AÇ ↗",illustration:"Tematik illüstrasyon — olayın özgün fotoğrafı değildir.",
   warning:"Medya özgün yayıncılarda ve arşivlerde açılır; AURORA tematik illüstrasyonları özgün fotoğraf olarak sunmaz."
  },
  ro:{
   heading:"FOTOGRAFII, VIDEO ȘI DOCUMENTE",
   intro:"Fotografii, înregistrări video, interviuri și documente publicate de sursele originale. Deschide materialul original sau dosarul complet.",
   filterLabel:"FILTRU",searchLabel:"CAUTĂ DUPĂ CAZ SAU SURSĂ",
   all:"Toate materialele",video:"Video",documents:"Documente și arhive",photo:"Fotografii",
   count:n=>"Linkuri media disponibile: "+n,empty:"Niciun material pentru acest filtru.",offline:"Catalogul media este temporar indisponibil.",
   case:"DESCHIDE DOSARUL COMPLET ↗",view:"DESCHIDE MATERIALUL ORIGINAL ↗",illustration:"Ilustrație tematică — nu este o fotografie originală.",
   warning:"Materialele media se deschid la editorii și arhivele originale; AURORA nu prezintă ilustrațiile tematice drept fotografii autentice."
  },
  el:{
   heading:"ΦΩΤΟΓΡΑΦΙΕΣ, ΒΙΝΤΕΟ ΚΑΙ ΕΓΓΡΑΦΑ",
   intro:"Φωτογραφίες, βίντεο, συνεντεύξεις και έγγραφα από τις αρχικές πηγές. Ανοίξτε το πρωτότυπο υλικό ή τον πλήρη φάκελο.",
   filterLabel:"ΦΙΛΤΡΟ",searchLabel:"ΑΝΑΖΗΤΗΣΗ ΑΝΑ ΥΠΟΘΕΣΗ Ή ΠΗΓΗ",
   all:"Όλο το υλικό",video:"Βίντεο",documents:"Έγγραφα και αρχεία",photo:"Φωτογραφίες",
   count:n=>"Διαθέσιμοι σύνδεσμοι πολυμέσων: "+n,empty:"Δεν υπάρχει υλικό για αυτό το φίλτρο.",offline:"Ο κατάλογος πολυμέσων δεν είναι προσωρινά διαθέσιμος.",
   case:"ΑΝΟΙΓΜΑ ΠΛΗΡΟΥΣ ΦΑΚΕΛΟΥ ↗",view:"ΑΝΟΙΓΜΑ ΠΡΩΤΟΤΥΠΟΥ ΥΛΙΚΟΥ ↗",illustration:"Θεματική εικονογράφηση — όχι πρωτότυπη φωτογραφία.",
   warning:"Τα πολυμέσα ανοίγουν στους αρχικούς εκδότες και αρχεία· το AURORA δεν παρουσιάζει εικονογραφήσεις ως αυθεντικές φωτογραφίες."
  },
  sr:{
   heading:"ФОТОГРАФИЈЕ, ВИДЕО И ДОКУМЕНТА",
   intro:"Фотографије, видео-записи, интервјуи и документа из изворних архива. Отворите изворни материјал или комплетан досије.",
   filterLabel:"ФИЛТЕР",searchLabel:"ПРЕТРАЖИ ПО СЛУЧАЈУ ИЛИ ИЗВОРУ",
   all:"Сви материјали",video:"Видео",documents:"Документа и архиве",photo:"Фотографије",
   count:n=>"Доступних медијских веза: "+n,empty:"Нема материјала за овај филтер.",offline:"Медијски каталог привремено није доступан.",
   case:"ОТВОРИ ЦЕО ДОСИЈЕ ↗",view:"ОТВОРИ ИЗВОРНИ МАТЕРИЈАЛ ↗",illustration:"Тематска илустрација — није оригинална фотографија.",
   warning:"Медији се отварају код изворних издавача и архива; AURORA не представља тематске илустрације као оригиналне фотографије."
  },
  uk:{
   heading:"ФОТО, ВІДЕО ТА ДОКУМЕНТИ",
   intro:"Фотографії, опубліковані відеозаписи, інтерв'ю та документи з оригінальних архівів. Відкрийте першоджерело або повне досьє.",
   filterLabel:"ФІЛЬТР",searchLabel:"ПОШУК ЗА ВИПАДКОМ АБО ДЖЕРЕЛОМ",
   all:"Усі матеріали",video:"Відео",documents:"Документи та архіви",photo:"Фотографії",
   count:n=>"Доступних медіапосилань: "+n,empty:"Немає матеріалів для цього фільтра.",offline:"Медіакаталог тимчасово недоступний.",
   case:"ВІДКРИТИ ПОВНЕ ДОСЬЄ ↗",view:"ВІДКРИТИ ОРИГІНАЛЬНИЙ МАТЕРІАЛ ↗",illustration:"Тематична ілюстрація — не оригінальний знімок.",
   warning:"Матеріали відкриваються на сайтах видавців та архівів; AURORA не видає ілюстрації за оригінальні фотографії."
  },
  pl:{
   heading:"ZDJĘCIA, WIDEO I DOKUMENTY",
   intro:"Zdjęcia, nagrania wideo, wywiady i dokumenty opublikowane przez oryginalne źródła. Otwórz materiał źródłowy lub pełne dossier.",
   filterLabel:"FILTR",searchLabel:"SZUKAJ WEDŁUG PRZYPADKU LUB ŹRÓDŁA",
   all:"Wszystkie materiały",video:"Wideo",documents:"Dokumenty i archiwa",photo:"Zdjęcia",
   count:n=>"Dostępne linki multimedialne: "+n,empty:"Brak materiałów dla tego filtra.",offline:"Katalog multimediów jest chwilowo niedostępny.",
   case:"OTWÓRZ PEŁNE DOSSIER ↗",view:"OTWÓRZ MATERIAŁ ŹRÓDŁOWY ↗",illustration:"Ilustracja tematyczna — nie oryginalne zdjęcie z incydentu.",
   warning:"Multimedia otwierają się u oryginalnych wydawców i w archiwach; AURORA nie przedstawia ilustracji jako zdjęć dowodowych."
  },
  ar:{
   heading:"صور وفيديو ووثائق",
   intro:"صور فوتوغرافية ومقاطع فيديو ومقابلات ووثائق منشورة من المصادر الأصلية. افتح المادة الأصلية أو اقرأ ملف الحالة الكامل.",
   filterLabel:"تصفية",searchLabel:"البحث حسب الحالة أو المصدر",
   all:"جميع المواد",video:"فيديو",documents:"وثائق وأرشيف",photo:"صور فوتوغرافية",
   count:n=>"روابط الوسائط المتاحة: "+n,empty:"لا توجد مواد لهذا المرشح.",offline:"دليل الوسائط غير متاح مؤقتاً.",
   case:"فتح الملف الكامل للحالة ↗",view:"فتح المادة الأصلية ↗",illustration:"رسم توضيحي موضوعي — وليس صورة أصلية للحادثة.",
   warning:"تُفتح الوسائط لدى الناشرين والأرشيفات الأصلية؛ لا تقدم AURORA الرسوم التوضيحية على أنها صور أصلية."
  },
  ja:{
   heading:"写真・動画・資料",
   intro:"元の情報源が公開した写真、映像、インタビュー、文書。元の資料を開くか、事例の詳細をご覧ください。",
   filterLabel:"フィルター",searchLabel:"事例または出典で検索",
   all:"すべての資料",video:"動画",documents:"文書・アーカイブ",photo:"写真",
   count:n=>"利用可能なメディアリンク: "+n,empty:"この条件に一致する資料はありません。",offline:"メディアカタログは一時的に利用できません。",
   case:"事例の詳細を開く ↗",view:"元の資料を開く ↗",illustration:"イメージ図 — 実際の現場写真ではありません。",
   warning:"メディアは元の公開元やアーカイブで開きます。AURORAはイメージ図を実際の写真として表示しません。"
  },
  ko:{
   heading:"사진, 영상 및 문서",
   intro:"원본 출처에서 공개한 사진, 영상, 인터뷰 및 문서입니다. 원본 자료를 열거나 전체 사례 기록을 확인하세요.",
   filterLabel:"필터",searchLabel:"사례 또는 출처 검색",
   all:"모든 자료",video:"영상",documents:"문서 및 아카이브",photo:"사진",
   count:n=>"사용 가능한 미디어 링크: "+n,empty:"이 필터에 해당하는 자료가 없습니다.",offline:"미디어 카탈로그를 일시적으로 불러올 수 없습니다.",
   case:"전체 사례 기록 열기 ↗",view:"원본 자료 열기 ↗",illustration:"테마 일러스트레이션 — 실제 사건 사진이 아닙니다.",
   warning:"미디어는 원본 발행처 및 아카이브에서 열립니다. AURORA는 일러스트레이션을 실제 사진으로 제시하지 않습니다."
  }
 };
 function getLocale(){
  try{
   const q=new URLSearchParams(location.search).get("lang");
   if(q&&PACKS[q])return q;
   const saved=localStorage.getItem("aurora-lang");
   if(saved&&PACKS[saved])return saved;
  }catch{}
  return PACKS[document.documentElement.lang]?document.documentElement.lang:"bg";
 }
 let locale=getLocale();
 document.documentElement.lang=locale;
 const valid=u=>{try{const x=new URL(u);return x.protocol==="https:"&&!x.username&&!x.password}catch{return false}};
 let items=[],loadedOk=false;
 function applyChrome(){
  locale=getLocale();
  document.documentElement.lang=locale;
  const words=PACKS[locale]||PACKS.en;
  const heading=window.AURORA_UI?.label?window.AURORA_UI.label("mediaTitle"):words.heading;
  $("mediaHeading").textContent=heading;
  $("mediaIntro").textContent=words.intro;
  document.title=heading+" | AURORA UAP";
  const filterLabel=$("mediaFilterLabel");
  if(filterLabel?.firstChild?.nodeType===3)filterLabel.firstChild.textContent=words.filterLabel;
  const labels=document.querySelectorAll(".live-toolbar label");
  if(labels[1]?.firstChild?.nodeType===3)labels[1].firstChild.textContent=words.searchLabel;
  for(const option of $("mediaType").options)option.textContent=words[option.value]||option.textContent;
  const warn=document.querySelector(".live-warning");
  if(warn)warn.textContent=words.warning;
 }
 function render(){
  applyChrome();
  const words=PACKS[locale]||PACKS.en;
  const root=$("mediaGallery"),kind=$("mediaType").value,search=$("mediaSearch").value.trim().toLocaleLowerCase();
  const matches=items.filter(({c,m})=>{
   if(kind==="video"&&m.type!=="video")return false;
   if(kind==="photo"&&m.type!=="photo")return false;
   if(kind==="documents"&&!["documents","archive"].includes(m.type))return false;
   const hay=[c.title?.bg,c.title?.en,c.summary?.bg,c.summary?.en,m.title?.bg,m.title?.en,c.source?.name,c.country,c.date].filter(Boolean).join(" ").toLocaleLowerCase();
   return !search||hay.includes(search);
  });
  root.replaceChildren();
  for(const {c,m} of matches){
   const card=document.createElement("article");card.className="media-entry";
   const picture=document.createElement("div");picture.className="media-entry-image";
   const img=document.createElement("img");img.loading="lazy";img.decoding="async";
   img.src=/^\/assets\/[a-z0-9-]+\.webp$/.test(c.visual?.src||"")?c.visual.src:"/assets/feature-media.webp";
   img.alt=words.illustration;
   const badge=document.createElement("span");badge.textContent=m.type==="video"?"▶ VIDEO":m.type==="photo"?"▧ PHOTO":"▤ ARCHIVE";
   picture.append(img,badge);
   const body=document.createElement("div");body.className="media-entry-body";
   const meta=document.createElement("small");meta.textContent=c.date+" · "+c.country+" · "+(c.source?.name||"");
   const heading=document.createElement("h2");heading.textContent=c.title?.[locale]||c.title?.en||"";
   const summary=document.createElement("p");summary.textContent=c.summary?.[locale]||c.summary?.en||"";
   const links=document.createElement("div");links.className="media-entry-links";
   const original=document.createElement("a");original.href=m.url;original.target="_blank";original.rel="noopener noreferrer";
   original.textContent=(m.title?.[locale]||m.title?.en||words.view)+" ↗";
   const dossier=document.createElement("a");dossier.href="/archive/"+encodeURIComponent(c.id);dossier.textContent=words.case;
   links.append(original,dossier);
   const caution=document.createElement("small");caution.className="media-caption";caution.textContent=words.illustration;
   body.append(meta,heading,summary,links,caution);card.append(picture,body);root.append(card);
  }
  if(loadedOk)$("mediaStatus").textContent=matches.length?words.count(matches.length):words.empty;
 }
 async function load(){
  applyChrome();
  try{
   const r=await fetch("/data/cases.json",{cache:"force-cache"});if(!r.ok)throw Error("source");
   const data=await r.json();if(!Array.isArray(data.cases))throw Error("archive");
   items=data.cases.flatMap(c=>(Array.isArray(c.media)?c.media:[])
    .filter(m=>m&&["video","documents","archive","photo"].includes(m.type)&&valid(m.url)&&/^[a-z0-9-]{3,90}$/.test(c.id))
    .map(m=>({c,m}))).sort((a,b)=>String(b.c.date).localeCompare(String(a.c.date)));
   loadedOk=true;
   render();
  }catch{$("mediaStatus").textContent=(PACKS[locale]||PACKS.en).offline}
 }
 $("mediaType").addEventListener("change",render);
 $("mediaSearch").addEventListener("input",render);
 window.addEventListener("aurora:language-changed",()=>{if(loadedOk)render();else applyChrome()});
 load();
})();
