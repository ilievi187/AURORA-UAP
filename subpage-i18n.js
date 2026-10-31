/* Localized public newsroom, country directory, dossier, and report navigation.
   These labels are authored in each supported interface language; sources remain attributed. */
"use strict";
(()=>{
 const packs={
  "bg":{"home":"Начало","news":"Новини","report":"Сигнал","countries":"Държави","newsTitle":"СВЕТОВНИ UAP НОВИНИ","search":"Търси заглавия","refresh":"Обнови","more":"Покажи още","edition":"Обхват","region":"Зона","loading":"Зареждане…","offline":"Източникът временно не отговаря.","newsIntro":"Заглавия от външни медии, подредени по дата. Прочети ги и прецени сам.","edGlobal":"🌍 Световен поток","edBulgaria":"🇧🇬 България","edOfficial":"Документи и институции","origHeadline":"ОРИГИНАЛНО ЗАГЛАВИЕ","headlines":"заглавия","translated":"преведени","origUntranslated":"Оригинални заглавия — преводът е недостъпен","cached":"КЕШИРАНО","newsWarning":"Google News · RSS/Atom · Заглавия от международни медии и публични RSS емисии. Отвори оригиналните публикации и разгледай различните гледни точки.","openGoogleNews":"Отвори Google News директно ↗","noHeadlines":"В момента няма налични заглавия.","skipForm":"Към формуляра"},
  "en":{"home":"Home","news":"News","report":"Report","countries":"Countries","newsTitle":"WORLD UAP NEWS","search":"Search headlines","refresh":"Refresh","more":"Show more","edition":"Edition","region":"Region","loading":"Loading…","offline":"The source is temporarily unavailable.","newsIntro":"Latest headlines from independent publishers, ordered by date. Explore the original reporting.","edGlobal":"🌍 Worldwide feed","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Official & institutional topics","origHeadline":"ORIGINAL HEADLINE","headlines":"headlines","translated":"translated","origUntranslated":"Original titles — translation unavailable","cached":"CACHED","newsWarning":"Google News · RSS/Atom · Headlines from international publishers and public RSS feeds. Follow the original articles and explore different perspectives.","openGoogleNews":"Open Google News directly ↗","noHeadlines":"No headlines available right now.","skipForm":"Skip to form"},
  "de":{"home":"Startseite","news":"Nachrichten","report":"Meldung","countries":"Länder","newsTitle":"UAP-NACHRICHTEN WELTWEIT","search":"Schlagzeilen suchen","refresh":"Aktualisieren","more":"Mehr anzeigen","edition":"Ausgabe","region":"Region","loading":"Wird geladen…","offline":"Quelle derzeit nicht erreichbar.","newsIntro":"Aktuelle Schlagzeilen externer Medien nach Datum. Lesen Sie die Originalberichte.","edGlobal":"🌍 Weltweiter Feed","edBulgaria":"🇧🇬 Bulgarien","edOfficial":"Dokumente & Institutionen","origHeadline":"ORIGINALSCHLAGZEILE","headlines":"Schlagzeilen","translated":"übersetzt","origUntranslated":"Originaltitel — Übersetzung nicht verfügbar","cached":"ZWISCHENGESPEICHERT","newsWarning":"Google News · RSS/Atom · Schlagzeilen internationaler Medien und öffentlicher RSS-Feeds. Entdecken Sie die Originalartikel und verschiedene Perspektiven.","openGoogleNews":"Google News direkt öffnen ↗","noHeadlines":"Derzeit sind keine Schlagzeilen verfügbar.","skipForm":"Zum Formular springen"},
  "ru":{"home":"Главная","news":"Новости","report":"Сообщить","countries":"Страны","newsTitle":"МИРОВЫЕ НОВОСТИ ОБ UAP","search":"Поиск заголовков","refresh":"Обновить","more":"Показать ещё","edition":"Раздел","region":"Регион","loading":"Загрузка…","offline":"Источник временно недоступен.","newsIntro":"Заголовки внешних СМИ по дате. Изучайте оригинальные публикации.","edGlobal":"🌍 Мировой поток","edBulgaria":"🇧🇬 Болгария","edOfficial":"Документы и ведомства","origHeadline":"ОРИГИНАЛЬНЫЙ ЗАГОЛОВОК","headlines":"заголовков","translated":"переведено","origUntranslated":"Оригинальные заголовки — перевод недоступен","cached":"КЭШ","newsWarning":"Google News · RSS/Atom · Заголовки международных издательств и открытых RSS-лент. Читайте оригинальные статьи и изучайте разные точки зрения.","openGoogleNews":"Открыть Google News напрямую ↗","noHeadlines":"Сейчас нет доступных заголовков.","skipForm":"Перейти к форме"},
  "zh-CN":{"home":"首页","news":"新闻","report":"报告","countries":"国家/地区","newsTitle":"全球UAP新闻","search":"搜索标题","refresh":"刷新","more":"查看更多","edition":"版本","region":"地区","loading":"正在加载…","offline":"消息来源暂时不可用。","newsIntro":"按日期浏览世界各地媒体的最新报道，并查看原始来源。","edGlobal":"🌍 全球动态","edBulgaria":"🇧🇬 保加利亚","edOfficial":"官方文献与机构","origHeadline":"原始标题","headlines":"条新闻","translated":"已翻译","origUntranslated":"原始标题 — 翻译暂不可用","cached":"缓存","newsWarning":"Google 新闻 · RSS/Atom · 来自国际媒体和公开 RSS 订阅源的报道。阅读原文，探索不同视角。","openGoogleNews":"直接打开 Google 新闻 ↗","noHeadlines":"当前暂无可用新闻。","skipForm":"跳至表单"},
  "fr":{"home":"Accueil","news":"Actualités","report":"Signaler","countries":"Pays","newsTitle":"ACTUALITÉS UAP MONDIALES","search":"Rechercher les titres","refresh":"Actualiser","more":"Voir plus","edition":"Édition","region":"Région","loading":"Chargement…","offline":"Source temporairement indisponible.","newsIntro":"Les titres récents des médias du monde, classés par date. Consultez les sources.","edGlobal":"🌍 Flux mondial","edBulgaria":"🇧🇬 Bulgarie","edOfficial":"Documents et institutions","origHeadline":"TITRE ORIGINAL","headlines":"titres","translated":"traduits","origUntranslated":"Titres originaux — traduction indisponible","cached":"EN CACHE","newsWarning":"Google Actualités · RSS/Atom · Titres des médias internationaux et des flux RSS publics. Lisez les articles originaux et explorez différents points de vue.","openGoogleNews":"Ouvrir Google Actualités ↗","noHeadlines":"Aucun titre disponible pour le moment.","skipForm":"Aller au formulaire"},
  "es":{"home":"Inicio","news":"Noticias","report":"Informar","countries":"Países","newsTitle":"NOTICIAS UAP DEL MUNDO","search":"Buscar titulares","refresh":"Actualizar","more":"Ver más","edition":"Edición","region":"Región","loading":"Cargando…","offline":"Fuente temporalmente no disponible.","newsIntro":"Titulares recientes de medios de todo el mundo, ordenados por fecha. Consulta la fuente.","edGlobal":"🌍 Flujo mundial","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Documentos e instituciones","origHeadline":"TITULAR ORIGINAL","headlines":"titulares","translated":"traducidos","origUntranslated":"Titulares originales — traducción no disponible","cached":"EN CACHÉ","newsWarning":"Google Noticias · RSS/Atom · Titulares de medios internacionales y fuentes RSS públicas. Lee los artículos originales y explora otras perspectivas.","openGoogleNews":"Abrir Google Noticias directamente ↗","noHeadlines":"No hay titulares disponibles en este momento.","skipForm":"Saltar al formulario"},
  "it":{"home":"Home","news":"Notizie","report":"Segnala","countries":"Paesi","newsTitle":"NOTIZIE UAP DAL MONDO","search":"Cerca notizie","refresh":"Aggiorna","more":"Mostra altro","edition":"Edizione","region":"Regione","loading":"Caricamento…","offline":"Fonte temporaneamente non disponibile.","newsIntro":"Titoli di notizie da fonti internazionali, ordinati per data. Consulta gli originali.","edGlobal":"🌍 Flusso globale","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Documenti e istituzioni","origHeadline":"TITOLO ORIGINALE","headlines":"notizie","translated":"tradotte","origUntranslated":"Titoli originali — traduzione non disponibile","cached":"IN CACHE","newsWarning":"Google News · RSS/Atom · Notizie da editori internazionali e feed RSS pubblici. Apri gli articoli originali ed esplora diversi punti di vista.","openGoogleNews":"Apri Google News direttamente ↗","noHeadlines":"Nessuna notizia disponibile al momento.","skipForm":"Vai al modulo"},
  "pt":{"home":"Início","news":"Notícias","report":"Relatar","countries":"Países","newsTitle":"NOTÍCIAS UAP DO MUNDO","search":"Pesquisar notícias","refresh":"Atualizar","more":"Ver mais","edition":"Edição","region":"Região","loading":"Carregando…","offline":"Fonte temporariamente indisponível.","newsIntro":"Manchetes internacionais recentes em ordem cronológica. Consulte as fontes.","edGlobal":"🌍 Fluxo mundial","edBulgaria":"🇧🇬 Bulgária","edOfficial":"Documentos e instituições","origHeadline":"MANCHETE ORIGINAL","headlines":"manchetes","translated":"traduzidas","origUntranslated":"Títulos originais — tradução indisponível","cached":"EM CACHE","newsWarning":"Google Notícias · RSS/Atom · Manchetes de editoras internacionais e feeds RSS públicos. Leia as publicações originais e explore outras perspectivas.","openGoogleNews":"Abrir Google Notícias diretamente ↗","noHeadlines":"Nenhuma manchete disponível no momento.","skipForm":"Ir para o formulário"},
  "tr":{"home":"Ana sayfa","news":"Haberler","report":"Bildirim","countries":"Ülkeler","newsTitle":"DÜNYADAN UAP HABERLERİ","search":"Başlıklarda ara","refresh":"Yenile","more":"Daha fazla","edition":"Bölüm","region":"Bölge","loading":"Yükleniyor…","offline":"Kaynak geçici olarak kullanılamıyor.","newsIntro":"Dünya medyasından tarih sıralı haber başlıkları. Özgün kaynakları okuyun.","edGlobal":"🌍 Küresel akış","edBulgaria":"🇧🇬 Bulgaristan","edOfficial":"Belgeler ve kurumlar","origHeadline":"ÖZGÜN BAŞLIK","headlines":"başlık","translated":"çevrildi","origUntranslated":"Özgün başlıklar — çeviri kullanılamıyor","cached":"ÖNBELLEK","newsWarning":"Google Haberler · RSS/Atom · Uluslararası yayıncılardan ve açık RSS akışlarından başlıklar. Özgün haberleri açıp farklı bakış açılarını keşfedin.","openGoogleNews":"Google Haberler'i doğrudan aç ↗","noHeadlines":"Şu anda kullanılabilir haber başlığı yok.","skipForm":"Forma geç"},
  "ro":{"home":"Acasă","news":"Știri","report":"Raportează","countries":"Țări","newsTitle":"ȘTIRI UAP DIN LUME","search":"Caută titluri","refresh":"Actualizează","more":"Mai multe","edition":"Ediție","region":"Regiune","loading":"Se încarcă…","offline":"Sursa este temporar indisponibilă.","newsIntro":"Titluri internaționale ordonate după dată. Consultă sursele originale.","edGlobal":"🌍 Flux global","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Documente și instituții","origHeadline":"TITLU ORIGINAL","headlines":"titluri","translated":"traduse","origUntranslated":"Titluri originale — traducere indisponibilă","cached":"ÎN CACHE","newsWarning":"Google Știri · RSS/Atom · Titluri din presa internațională și fluxuri RSS publice. Citește articolele originale și descoperă perspective diferite.","openGoogleNews":"Deschide Google Știri direct ↗","noHeadlines":"Nu există știri disponibile momentan.","skipForm":"Mergi la formular"},
  "el":{"home":"Αρχική","news":"Ειδήσεις","report":"Αναφορά","countries":"Χώρες","newsTitle":"ΠΑΓΚΟΣΜΙΕΣ ΕΙΔΗΣΕΙΣ UAP","search":"Αναζήτηση τίτλων","refresh":"Ανανέωση","more":"Περισσότερα","edition":"Έκδοση","region":"Περιοχή","loading":"Φόρτωση…","offline":"Η πηγή δεν είναι προσωρινά διαθέσιμη.","newsIntro":"Διεθνείς τίτλοι με χρονολογική σειρά. Δείτε τις αρχικές πηγές.","edGlobal":"🌍 Παγκόσμια ροή","edBulgaria":"🇧🇬 Βουλγαρία","edOfficial":"Έγγραφα και θεσμοί","origHeadline":"ΠΡΩΤΟΤΥΠΟΣ ΤΙΤΛΟΣ","headlines":"τίτλοι","translated":"μεταφρασμένοι","origUntranslated":"Πρωτότυποι τίτλοι — η μετάφραση δεν είναι διαθέσιμη","cached":"ΑΠΟΘΗΚΕΥΜΕΝΟ","newsWarning":"Google News · RSS/Atom · Τίτλοι από διεθνή μέσα και δημόσιες ροές RSS. Διαβάστε τα πρωτότυπα άρθρα και εξερευνήστε διαφορετικές οπτικές.","openGoogleNews":"Άνοιγμα Google News απευθείας ↗","noHeadlines":"Δεν υπάρχουν διαθέσιμοι τίτλοι αυτή τη στιγμή.","skipForm":"Μετάβαση στη φόρμα"},
  "sr":{"home":"Почетна","news":"Вести","report":"Пријави","countries":"Државе","newsTitle":"СВЕТСКЕ UAP ВЕСТИ","search":"Претражи наслове","refresh":"Освежи","more":"Прикажи још","edition":"Издање","region":"Регион","loading":"Учитавање…","offline":"Извор привремено није доступан.","newsIntro":"Вести из света, поређане по датуму. Отворите изворне објаве.","edGlobal":"🌍 Светски ток","edBulgaria":"🇧🇬 Бугарска","edOfficial":"Документи и институције","origHeadline":"ИЗВОРНИ НАСЛОВ","headlines":"наслова","translated":"преведено","origUntranslated":"Изворни наслови — превод није доступан","cached":"КЕШИРАНО","newsWarning":"Google вести · RSS/Atom · Наслови међународних медија и јавних RSS извора. Отворите изворне чланке и истражите различита гледишта.","openGoogleNews":"Отвори Google вести директно ↗","noHeadlines":"Тренутно нема доступних наслова.","skipForm":"Пређи на образац"},
  "uk":{"home":"Головна","news":"Новини","report":"Повідомити","countries":"Країни","newsTitle":"СВІТОВІ НОВИНИ UAP","search":"Пошук заголовків","refresh":"Оновити","more":"Більше","edition":"Видання","region":"Регион","loading":"Завантаження…","offline":"Джерело тимчасово недоступне.","newsIntro":"Світові заголовки за датою. Переглядайте оригінальні публікації.","edGlobal":"🌍 Світовий потік","edBulgaria":"🇧🇬 Болгарія","edOfficial":"Документи та установи","origHeadline":"ОРИГІНАЛЬНИЙ ЗАГОЛОВОК","headlines":"заголовків","translated":"перекладено","origUntranslated":"Оригінальні заголовки — переклад недоступний","cached":"КЕШОВАНО","newsWarning":"Google Новини · RSS/Atom · Заголовки міжнародних видань і відкритих RSS-стрічок. Читайте оригінали й досліджуйте різні погляди.","openGoogleNews":"Відкрити Google Новини напряму ↗","noHeadlines":"Зараз немає доступних заголовків.","skipForm":"До форми"},
  "pl":{"home":"Strona główna","news":"Wiadomości","report":"Zgłoś","countries":"Kraje","newsTitle":"WIADOMOŚCI UAP ZE ŚWIATA","search":"Szukaj nagłówków","refresh":"Odśwież","more":"Więcej","edition":"Wydanie","region":"Region","loading":"Ładowanie…","offline":"Źródło chwilowo niedostępne.","newsIntro":"Światowe nagłówki według daty. Sprawdź oryginalne publikacje.","edGlobal":"🌍 Strumień światowy","edBulgaria":"🇧🇬 Bułgaria","edOfficial":"Dokumenty i instytucje","origHeadline":"ORYGINALNY NAGŁÓWEK","headlines":"nagłówków","translated":"przetłumaczono","origUntranslated":"Oryginalne tytuły — tłumaczenie niedostępne","cached":"W PAMIĘCI PODRĘCZNEJ","newsWarning":"Google News · RSS/Atom · Nagłówki z mediów międzynarodowych i publicznych kanałów RSS. Otwórz oryginalne artykuły i poznaj inne perspektywy.","openGoogleNews":"Otwórz Google News bezpośrednio ↗","noHeadlines":"Brak dostępnych wiadomości w tej chwili.","skipForm":"Przejdź do formularza"},
  "ar":{"home":"الرئيسية","news":"الأخبار","report":"إبلاغ","countries":"الدول","newsTitle":"أخبار UAP العالمية","search":"البحث في العناوين","refresh":"تحديث","more":"عرض المزيد","edition":"الإصدار","region":"المنطقة","loading":"جار التحميل…","offline":"المصدر غير متاح مؤقتاً.","newsIntro":"عناوين الأخبار العالمية حسب التاريخ. اطلع على المصادر الأصلية.","edGlobal":"🌍 البث العالمي","edBulgaria":"🇧🇬 بلغاريا","edOfficial":"الوثائق والمؤسسات","origHeadline":"العنوان الأصلي","headlines":"عنوان","translated":"مترجم","origUntranslated":"العناوين الأصلية — الترجمة غير متاحة","cached":"مخزن مؤقتاً","newsWarning":"أخبار Google · RSS/Atom · عناوين من وسائل إعلام دولية وخلاصات RSS عامة. اقرأ المقالات الأصلية واكتشف وجهات نظر مختلفة.","openGoogleNews":"افتح أخبار Google مباشرة ↗","noHeadlines":"لا توجد عناوين متاحة حالياً.","skipForm":"الانتقال إلى النموذج"},
  "ja":{"home":"ホーム","news":"ニュース","report":"報告","countries":"国別一覧","newsTitle":"世界のUAPニュース","search":"見出しを検索","refresh":"更新","more":"もっと見る","edition":"版","region":"地域","loading":"読み込み中…","offline":"情報源に接続できません。","newsIntro":"世界のニュースを日付順に表示。元の記事をご覧ください。","edGlobal":"🌍 世界のフィード","edBulgaria":"🇧🇬 ブルガリア","edOfficial":"公文書・公的機関","origHeadline":"元の見出し","headlines":"件の見出し","translated":"件翻訳済み","origUntranslated":"元の見出し — 翻訳は利用できません","cached":"キャッシュ","newsWarning":"Google ニュース · RSS/Atom · 国際メディアと公開 RSS からの見出し。元の記事を開き、さまざまな視点を探ってください。","openGoogleNews":"Google ニュースを直接開く ↗","noHeadlines":"現在表示できる見出しはありません。","skipForm":"フォームへ移動"},
  "ko":{"home":"홈","news":"뉴스","report":"제보","countries":"국가별 목록","newsTitle":"세계 UAP 뉴스","search":"제목 검색","refresh":"새로고침","more":"더 보기","edition":"범위","region":"지역","loading":"불러오는 중…","offline":"정보원을 일시적으로 이용할 수 없습니다.","newsIntro":"전 세계 언론의 최신 제목을 날짜순으로 보여줍니다. 원문을 확인하세요.","edGlobal":"🌍 전 세계 피드","edBulgaria":"🇧🇬 불가리아","edOfficial":"공식 문서 및 기관","origHeadline":"원본 제목","headlines":"개의 헤드라인","translated":"개 번역됨","origUntranslated":"원본 제목 — 번역 사용 불가","cached":"캐시됨","newsWarning":"Google 뉴스 · RSS/Atom · 국제 언론과 공개 RSS 피드의 주요 기사입니다. 원문을 확인하고 다양한 관점을 탐색하세요.","openGoogleNews":"Google 뉴스 직접 열기 ↗","noHeadlines":"현재 표시할 헤드라인이 없습니다.","skipForm":"양식으로 건너뛰기"}
 },choices=["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ja"==="ja"?"ja":"ja","ko"].filter((v,i,a)=>a.indexOf(v)===i);
 function code(){
  try{
   const q=new URLSearchParams(location.search).get("lang");
   if(q&&choices.includes(q)){
    try{localStorage.setItem("aurora-lang",q)}catch{}
    return q;
   }
   const v=localStorage.getItem("aurora-lang");
   return choices.includes(v)?v:"bg";
  }catch{return "bg"}
 }
 function pack(){return packs[document.documentElement.lang]||packs.en}
 function text(key){return pack()[key]||packs.en[key]||key}
 function detectRoute(){
  const clean=location.pathname.replace(/\/+$/,"");
  const segs=clean.split("/").filter(Boolean);
  const last=(segs[segs.length-1]||"").replace(/\.html$/,"");
  if(segs[0]==="countries"&&segs.length>=2)return "country";
  if(segs[0]==="archive"||segs[0]==="cases"||last==="dossier")return "dossier";
  return last;
 }
 function canonicalHref(){
  const p=location.pathname.replace(/\/index\.html$/,"/").replace(/\.html$/,"");
  return "https://aurorauap.org"+(p.startsWith("/")?p:"/"+p);
 }
 function syncSeoMeta(titleText,descText){
  if(titleText)document.title=titleText;
  let canonical=document.querySelector('link[rel="canonical"]');
  if(!canonical){
   canonical=document.createElement("link");
   canonical.setAttribute("rel","canonical");
   document.head.append(canonical);
  }
  canonical.setAttribute("href",canonicalHref());
  if(descText){
   let metaDesc=document.querySelector('meta[name="description"]');
   if(!metaDesc){
    metaDesc=document.createElement("meta");
    metaDesc.setAttribute("name","description");
    document.head.append(metaDesc);
   }
   metaDesc.setAttribute("content",descText);
   const ogDesc=document.querySelector('meta[property="og:description"]');
   if(ogDesc)ogDesc.setAttribute("content",descText);
  }
  if(titleText){
   const ogTitle=document.querySelector('meta[property="og:title"]');
   if(ogTitle)ogTitle.setAttribute("content",titleText);
  }
 }
 function apply(){
  const page=detectRoute();
  const news=page==="news",report=page==="report",countries=page==="countries",country=page==="country",dossier=page==="dossier",media=page==="media";
  if(!news&&!report&&!countries&&!country&&!dossier&&!media)return;
  const nav=[...document.querySelectorAll(".live-links a")];
  for(const anchor of nav){const href=anchor.getAttribute("href");
   const id=href==="/"? "home":href==="/news.html"?"news":href==="/report.html"?"report":href==="/countries.html"?"countries":null;
   if(id)anchor.textContent=text(id);
  }
  if(report){
   const back=document.querySelector(".report-back");if(back)back.textContent="← "+text("home").toUpperCase();
   const skip=document.querySelector(".skip");if(skip)skip.textContent=text("skipForm");
   syncSeoMeta(text("report")+" | AURORA UAP",document.getElementById("reportHeroLead")?.textContent||"");
   return;
  }
  if(countries||country||dossier||media){
   syncSeoMeta(null,null);
   return;
  }
  const h=document.querySelector(".live-hero h1");if(h)h.textContent=text("newsTitle");
  const intro=document.querySelector(".live-hero > p:not(.live-eyebrow)");if(intro)intro.textContent=text("newsIntro");
  const labels=[...document.querySelectorAll(".live-toolbar label")];
  if(labels[0]?.firstChild?.nodeType===3)labels[0].firstChild.textContent=text("edition");
  if(news){
   if(labels[1]?.firstChild?.nodeType===3)labels[1].firstChild.textContent=text("search");
   const field=document.getElementById("newsSearch");if(field)field.placeholder=text("search");
   const btn=document.getElementById("refreshNews");if(btn)btn.textContent=text("refresh");
   const more=document.getElementById("showMoreNews");if(more)more.textContent=text("more")+" ↓";
   const ed=document.getElementById("edition");
   if(ed){
    const map={global:"edGlobal",bulgaria:"edBulgaria",official:"edOfficial"};
    for(const opt of ed.options)if(map[opt.value])opt.textContent=text(map[opt.value]);
   }
   const warn=document.querySelector(".live-warning");if(warn)warn.textContent=text("newsWarning");
   const gnews=document.querySelector('a[href*="news.google.com"]');if(gnews)gnews.textContent=text("openGoogleNews");
   document.querySelectorAll(".news-original > summary").forEach(s=>{s.textContent=text("origHeadline")});
  }
  syncSeoMeta(text("newsTitle")+" | AURORA UAP",text("newsIntro"));
 }
 function init(){
  let sel=document.getElementById("pageLanguage");
  if(!sel){
   sel=document.createElement("select");sel.id="pageLanguage";sel.setAttribute("aria-label","Language");sel.className="page-language";
   const names=new Intl.DisplayNames(["en"],{type:"language"});
   for(const lang of choices){const opt=document.createElement("option");opt.value=lang;opt.textContent=lang==="zh-CN"?"简体中文":names.of(lang)||lang;sel.append(opt)}
   const holder=document.querySelector(".live-header,.directory-header,.country-header,.dossier-nav,.report-nav");
   if(holder)holder.append(sel);
  }
  const saved=code();document.documentElement.lang=saved;sel.value=saved;apply();
  sel.addEventListener("change",()=>{
   const value=sel.value;document.documentElement.lang=value;
   try{localStorage.setItem("aurora-lang",value)}catch{}
   apply();
   window.dispatchEvent(new CustomEvent("aurora:language-changed",{detail:{language:value}}));
  });
 }
 window.AURORA_SUBPAGES={text,apply,choices,code,canonicalHref};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
