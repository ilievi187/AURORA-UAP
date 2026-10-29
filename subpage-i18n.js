/* Localized public newsroom, airspace, country directory, dossier, and report navigation.
   These labels are authored in each supported interface language; sources remain attributed. */
"use strict";
(()=>{
 const packs={
  "bg":{"home":"Начало","news":"Новини","sky":"Авиационен радар","report":"Сигнал","countries":"Държави","newsTitle":"СВЕТОВНИ UAP НОВИНИ","skyTitle":"РАДАР ЗА САМОЛЕТИ","search":"Търси заглавия","refresh":"Обнови","more":"Покажи още","edition":"Обхват","region":"Зона","loading":"Зареждане…","offline":"Източникът временно не отговаря.","newsIntro":"Заглавия от външни медии, подредени по дата. Прочети ги и прецени сам.","skyIntro":"Публични транспондерни позиции за проверка на наблюденията — не UAP детектор.","edGlobal":"🌍 Световен поток","edBulgaria":"🇧🇬 България","edOfficial":"Документи и институции","origHeadline":"ОРИГИНАЛНО ЗАГЛАВИЕ","headlines":"заглавия","translated":"преведени","origUntranslated":"Оригинални заглавия — преводът е недостъпен","cached":"КЕШИРАНО","newsWarning":"Източник: публични RSS резултати от Google News. Показваме само заглавие, медия, дата и връзка към оригинала. Заглавията водят към оригиналните публикации. Източниците може временно да са недостъпни.","openGoogleNews":"Отвори Google News директно ↗","noHeadlines":"В момента няма налични заглавия.","skipForm":"Към формуляра"},
  "en":{"home":"Home","news":"News","sky":"Air traffic","report":"Report","countries":"Countries","newsTitle":"WORLD UAP NEWS","skyTitle":"AIRCRAFT RADAR","search":"Search headlines","refresh":"Refresh","more":"Show more","edition":"Edition","region":"Region","loading":"Loading…","offline":"The source is temporarily unavailable.","newsIntro":"Latest headlines from independent publishers, ordered by date. Explore the original reporting.","skyIntro":"Public transponder positions to cross-check observations — not a UAP detector.","edGlobal":"🌍 Worldwide feed","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Official & institutional topics","origHeadline":"ORIGINAL HEADLINE","headlines":"headlines","translated":"translated","origUntranslated":"Original titles — translation unavailable","cached":"CACHED","newsWarning":"Source: public Google News RSS results. We show only headline, publisher, date and a link to the original article. Sources may be temporarily unavailable.","openGoogleNews":"Open Google News directly ↗","noHeadlines":"No headlines available right now.","skipForm":"Skip to form"},
  "de":{"home":"Startseite","news":"Nachrichten","sky":"Flugverkehr","report":"Meldung","countries":"Länder","newsTitle":"UAP-NACHRICHTEN WELTWEIT","skyTitle":"FLUGZEUGRADAR","search":"Schlagzeilen suchen","refresh":"Aktualisieren","more":"Mehr anzeigen","edition":"Ausgabe","region":"Region","loading":"Wird geladen…","offline":"Quelle derzeit nicht erreichbar.","newsIntro":"Aktuelle Schlagzeilen externer Medien nach Datum. Lesen Sie die Originalberichte.","skyIntro":"Öffentliche Transponderpositionen als Vergleich für Beobachtungen — kein UAP-Detektor.","edGlobal":"🌍 Weltweiter Feed","edBulgaria":"🇧🇬 Bulgarien","edOfficial":"Dokumente & Institutionen","origHeadline":"ORIGINALSCHLAGZEILE","headlines":"Schlagzeilen","translated":"übersetzt","origUntranslated":"Originaltitel — Übersetzung nicht verfügbar","cached":"ZWISCHENGESPEICHERT","newsWarning":"Quelle: öffentliche Google-News-RSS-Ergebnisse. Es werden nur Schlagzeile, Medium, Datum und Originallink angezeigt.","openGoogleNews":"Google News direkt öffnen ↗","noHeadlines":"Derzeit sind keine Schlagzeilen verfügbar.","skipForm":"Zum Formular springen"},
  "ru":{"home":"Главная","news":"Новости","sky":"Авиатрафик","report":"Сообщить","countries":"Страны","newsTitle":"МИРОВЫЕ НОВОСТИ ОБ UAP","skyTitle":"АВИАЦИОННЫЙ РАДАР","search":"Поиск заголовков","refresh":"Обновить","more":"Показать ещё","edition":"Раздел","region":"Регион","loading":"Загрузка…","offline":"Источник временно недоступен.","newsIntro":"Заголовки внешних СМИ по дате. Изучайте оригинальные публикации.","skyIntro":"Открытые данные транспондеров для проверки наблюдений — не детектор UAP.","edGlobal":"🌍 Мировой поток","edBulgaria":"🇧🇬 Болгария","edOfficial":"Документы и ведомства","origHeadline":"ОРИГИНАЛЬНЫЙ ЗАГОЛОВОК","headlines":"заголовков","translated":"переведено","origUntranslated":"Оригинальные заголовки — перевод недоступен","cached":"КЭШ","newsWarning":"Источник: открытые RSS-результаты Google News. Показаны только заголовок, издание, дата и ссылка на оригинал.","openGoogleNews":"Открыть Google News напрямую ↗","noHeadlines":"Сейчас нет доступных заголовков.","skipForm":"Перейти к форме"},
  "zh-CN":{"home":"首页","news":"新闻","sky":"航空交通","report":"报告","countries":"国家/地区","newsTitle":"全球UAP新闻","skyTitle":"航空器雷达","search":"搜索标题","refresh":"刷新","more":"查看更多","edition":"版本","region":"地区","loading":"正在加载…","offline":"消息来源暂时不可用。","newsIntro":"按日期浏览世界各地媒体的最新报道，并查看原始来源。","skyIntro":"公开的飞机应答机位置，可用于核对观测，不是UAP探测器。","edGlobal":"🌍 全球动态","edBulgaria":"🇧🇬 保加利亚","edOfficial":"官方文献与机构","origHeadline":"原始标题","headlines":"条新闻","translated":"已翻译","origUntranslated":"原始标题 — 翻译暂不可用","cached":"缓存","newsWarning":"来源：Google 新闻公开 RSS。仅显示标题、媒体、日期及原文链接。","openGoogleNews":"直接打开 Google 新闻 ↗","noHeadlines":"当前暂无可用新闻。","skipForm":"跳至表单"},
  "fr":{"home":"Accueil","news":"Actualités","sky":"Trafic aérien","report":"Signaler","countries":"Pays","newsTitle":"ACTUALITÉS UAP MONDIALES","skyTitle":"RADAR DES AVIONS","search":"Rechercher les titres","refresh":"Actualiser","more":"Voir plus","edition":"Édition","region":"Région","loading":"Chargement…","offline":"Source temporairement indisponible.","newsIntro":"Les titres récents des médias du monde, classés par date. Consultez les sources.","skyIntro":"Positions publiques des transpondeurs pour comparer les observations — pas un détecteur UAP.","edGlobal":"🌍 Flux mondial","edBulgaria":"🇧🇬 Bulgarie","edOfficial":"Documents et institutions","origHeadline":"TITRE ORIGINAL","headlines":"titres","translated":"traduits","origUntranslated":"Titres originaux — traduction indisponible","cached":"EN CACHE","newsWarning":"Source : flux RSS publics Google Actualités. Seuls le titre, le média, la date et le lien d'origine sont affichés.","openGoogleNews":"Ouvrir Google Actualités ↗","noHeadlines":"Aucun titre disponible pour le moment.","skipForm":"Aller au formulaire"},
  "es":{"home":"Inicio","news":"Noticias","sky":"Tráfico aéreo","report":"Informar","countries":"Países","newsTitle":"NOTICIAS UAP DEL MUNDO","skyTitle":"RADAR DE AVIONES","search":"Buscar titulares","refresh":"Actualizar","more":"Ver más","edition":"Edición","region":"Región","loading":"Cargando…","offline":"Fuente temporalmente no disponible.","newsIntro":"Titulares recientes de medios de todo el mundo, ordenados por fecha. Consulta la fuente.","skyIntro":"Posiciones públicas de transpondedores para contrastar avistamientos, no un detector UAP.","edGlobal":"🌍 Flujo mundial","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Documentos e instituciones","origHeadline":"TITULAR ORIGINAL","headlines":"titulares","translated":"traducidos","origUntranslated":"Titulares originales — traducción no disponible","cached":"EN CACHÉ","newsWarning":"Fuente: resultados RSS públicos de Google Noticias. Solo mostramos titular, medio, fecha y enlace al original.","openGoogleNews":"Abrir Google Noticias directamente ↗","noHeadlines":"No hay titulares disponibles en este momento.","skipForm":"Saltar al formulario"},
  "it":{"home":"Home","news":"Notizie","sky":"Traffico aereo","report":"Segnala","countries":"Paesi","newsTitle":"NOTIZIE UAP DAL MONDO","skyTitle":"RADAR AEREI","search":"Cerca notizie","refresh":"Aggiorna","more":"Mostra altro","edition":"Edizione","region":"Regione","loading":"Caricamento…","offline":"Fonte temporaneamente non disponibile.","newsIntro":"Titoli di notizie da fonti internazionali, ordinati per data. Consulta gli originali.","skyIntro":"Posizioni pubbliche dei transponder per confrontare le osservazioni, non un rilevatore UAP.","edGlobal":"🌍 Flusso globale","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Documenti e istituzioni","origHeadline":"TITOLO ORIGINALE","headlines":"notizie","translated":"tradotte","origUntranslated":"Titoli originali — traduzione non disponibile","cached":"IN CACHE","newsWarning":"Fonte: feed RSS pubblici di Google News. Mostriamo solo titolo, testata, data e link all'articolo originale.","openGoogleNews":"Apri Google News direttamente ↗","noHeadlines":"Nessuna notizia disponibile al momento.","skipForm":"Vai al modulo"},
  "pt":{"home":"Início","news":"Notícias","sky":"Tráfego aéreo","report":"Relatar","countries":"Países","newsTitle":"NOTÍCIAS UAP DO MUNDO","skyTitle":"RADAR DE AVIÕES","search":"Pesquisar notícias","refresh":"Atualizar","more":"Ver mais","edition":"Edição","region":"Região","loading":"Carregando…","offline":"Fonte temporariamente indisponível.","newsIntro":"Manchetes internacionais recentes em ordem cronológica. Consulte as fontes.","skyIntro":"Posições públicas de transponders para comparar observações, não um detetor UAP.","edGlobal":"🌍 Fluxo mundial","edBulgaria":"🇧🇬 Bulgária","edOfficial":"Documentos e instituições","origHeadline":"MANCHETE ORIGINAL","headlines":"manchetes","translated":"traduzidas","origUntranslated":"Títulos originais — tradução indisponível","cached":"EM CACHE","newsWarning":"Fonte: resultados RSS públicos do Google Notícias. Exibimos apenas título, fonte, data e ligação original.","openGoogleNews":"Abrir Google Notícias diretamente ↗","noHeadlines":"Nenhuma manchete disponível no momento.","skipForm":"Ir para o formulário"},
  "tr":{"home":"Ana sayfa","news":"Haberler","sky":"Hava trafiği","report":"Bildirim","countries":"Ülkeler","newsTitle":"DÜNYADAN UAP HABERLERİ","skyTitle":"UÇAK RADARI","search":"Başlıklarda ara","refresh":"Yenile","more":"Daha fazla","edition":"Bölüm","region":"Bölge","loading":"Yükleniyor…","offline":"Kaynak geçici olarak kullanılamıyor.","newsIntro":"Dünya medyasından tarih sıralı haber başlıkları. Özgün kaynakları okuyun.","skyIntro":"Gözlemleri karşılaştırmak için açık transponder konumları; UAP dedektörü değil.","edGlobal":"🌍 Küresel akış","edBulgaria":"🇧🇬 Bulgaristan","edOfficial":"Belgeler ve kurumlar","origHeadline":"ÖZGÜN BAŞLIK","headlines":"başlık","translated":"çevrildi","origUntranslated":"Özgün başlıklar — çeviri kullanılamıyor","cached":"ÖNBELLEK","newsWarning":"Kaynak: herkese açık Google Haberler RSS sonuçları. Yalnızca başlık, yayıncı, tarih ve özgün bağlantı gösterilir.","openGoogleNews":"Google Haberler'i doğrudan aç ↗","noHeadlines":"Şu anda kullanılabilir haber başlığı yok.","skipForm":"Forma geç"},
  "ro":{"home":"Acasă","news":"Știri","sky":"Trafic aerian","report":"Raportează","countries":"Țări","newsTitle":"ȘTIRI UAP DIN LUME","skyTitle":"RADARUL AVIOANELOR","search":"Caută titluri","refresh":"Actualizează","more":"Mai multe","edition":"Ediție","region":"Regiune","loading":"Se încarcă…","offline":"Sursa este temporar indisponibilă.","newsIntro":"Titluri internaționale ordonate după dată. Consultă sursele originale.","skyIntro":"Poziții publice de transponder pentru compararea observațiilor, nu detector UAP.","edGlobal":"🌍 Flux global","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Documente și instituții","origHeadline":"TITLU ORIGINAL","headlines":"titluri","translated":"traduse","origUntranslated":"Titluri originale — traducere indisponibilă","cached":"ÎN CACHE","newsWarning":"Sursă: fluxuri RSS publice Google Știri. Afișăm doar titlul, publicația, data și linkul către original.","openGoogleNews":"Deschide Google Știri direct ↗","noHeadlines":"Nu există știri disponibile momentan.","skipForm":"Mergi la formular"},
  "el":{"home":"Αρχική","news":"Ειδήσεις","sky":"Εναέρια κυκλοφορία","report":"Αναφορά","countries":"Χώρες","newsTitle":"ΠΑΓΚΟΣΜΙΕΣ ΕΙΔΗΣΕΙΣ UAP","skyTitle":"ΡΑΝΤΑΡ ΑΕΡΟΣΚΑΦΩΝ","search":"Αναζήτηση τίτλων","refresh":"Ανανέωση","more":"Περισσότερα","edition":"Έκδοση","region":"Περιοχή","loading":"Φόρτωση…","offline":"Η πηγή δεν είναι προσωρινά διαθέσιμη.","newsIntro":"Διεθνείς τίτλοι με χρονολογική σειρά. Δείτε τις αρχικές πηγές.","skyIntro":"Δημόσιες θέσεις αναμεταδοτών για έλεγχο παρατηρήσεων, όχι ανιχνευτής UAP.","edGlobal":"🌍 Παγκόσμια ροή","edBulgaria":"🇧🇬 Βουλγαρία","edOfficial":"Έγγραφα και θεσμοί","origHeadline":"ΠΡΩΤΟΤΥΠΟΣ ΤΙΤΛΟΣ","headlines":"τίτλοι","translated":"μεταφρασμένοι","origUntranslated":"Πρωτότυποι τίτλοι — η μετάφραση δεν είναι διαθέσιμη","cached":"ΑΠΟΘΗΚΕΥΜΕΝΟ","newsWarning":"Πηγή: δημόσιες ροές RSS του Google News. Εμφανίζονται μόνο τίτλος, μέσο, ημερομηνία και σύνδεσμος προς το πρωτότυπο.","openGoogleNews":"Άνοιγμα Google News απευθείας ↗","noHeadlines":"Δεν υπάρχουν διαθέσιμοι τίτλοι αυτή τη στιγμή.","skipForm":"Μετάβαση στη φόρμα"},
  "sr":{"home":"Почетна","news":"Вести","sky":"Ваздушни саобраћај","report":"Пријави","countries":"Државе","newsTitle":"СВЕТСКЕ UAP ВЕСТИ","skyTitle":"РАДАР АВИОНА","search":"Претражи наслове","refresh":"Освежи","more":"Прикажи још","edition":"Издање","region":"Регион","loading":"Учитавање…","offline":"Извор привремено није доступан.","newsIntro":"Вести из света, поређане по датуму. Отворите изворне објаве.","skyIntro":"Јавне транспондерске позиције за поређење запажања, не UAP детектор.","edGlobal":"🌍 Светски ток","edBulgaria":"🇧🇬 Бугарска","edOfficial":"Документи и институције","origHeadline":"ИЗВОРНИ НАСЛОВ","headlines":"наслова","translated":"преведено","origUntranslated":"Изворни наслови — превод није доступан","cached":"КЕШИРАНО","newsWarning":"Извор: јавни RSS резултати Google вести. Приказујемо само наслов, медиј, датум и везу ка оригиналу.","openGoogleNews":"Отвори Google вести директно ↗","noHeadlines":"Тренутно нема доступних наслова.","skipForm":"Пређи на образац"},
  "uk":{"home":"Головна","news":"Новини","sky":"Авіатрафік","report":"Повідомити","countries":"Країни","newsTitle":"СВІТОВІ НОВИНИ UAP","skyTitle":"РАДАР ЛІТАКІВ","search":"Пошук заголовків","refresh":"Оновити","more":"Більше","edition":"Видання","region":"Регион","loading":"Завантаження…","offline":"Джерело тимчасово недоступне.","newsIntro":"Світові заголовки за датою. Переглядайте оригінальні публікації.","skyIntro":"Публічні позиції транспондерів для перевірки спостережень, не детектор UAP.","edGlobal":"🌍 Світовий потік","edBulgaria":"🇧🇬 Болгарія","edOfficial":"Документи та установи","origHeadline":"ОРИГІНАЛЬНИЙ ЗАГОЛОВОК","headlines":"заголовків","translated":"перекладено","origUntranslated":"Оригінальні заголовки — переклад недоступний","cached":"КЕШОВАНО","newsWarning":"Джерело: публічні RSS-результати Google Новин. Ми показуємо лише заголовок, видання, дату та посилання на оригінал.","openGoogleNews":"Відкрити Google Новини напряму ↗","noHeadlines":"Зараз немає доступних заголовків.","skipForm":"До форми"},
  "pl":{"home":"Strona główna","news":"Wiadomości","sky":"Ruch lotniczy","report":"Zgłoś","countries":"Kraje","newsTitle":"WIADOMOŚCI UAP ZE ŚWIATA","skyTitle":"RADAR SAMOLOTÓW","search":"Szukaj nagłówków","refresh":"Odśwież","more":"Więcej","edition":"Wydanie","region":"Region","loading":"Ładowanie…","offline":"Źródło chwilowo niedostępne.","newsIntro":"Światowe nagłówki według daty. Sprawdź oryginalne publikacje.","skyIntro":"Publiczne pozycje transponderów do porównania obserwacji, nie wykrywacz UAP.","edGlobal":"🌍 Strumień światowy","edBulgaria":"🇧🇬 Bułgaria","edOfficial":"Dokumenty i instytucje","origHeadline":"ORYGINALNY NAGŁÓWEK","headlines":"nagłówków","translated":"przetłumaczono","origUntranslated":"Oryginalne tytuły — tłumaczenie niedostępne","cached":"W PAMIĘCI PODRĘCZNEJ","newsWarning":"Źródło: publiczne wyniki RSS Google News. Wyświetlamy wyłącznie tytuł, wydawcę, datę i link do oryginału.","openGoogleNews":"Otwórz Google News bezpośrednio ↗","noHeadlines":"Brak dostępnych wiadomości w tej chwili.","skipForm":"Przejdź do formularza"},
  "ar":{"home":"الرئيسية","news":"الأخبار","sky":"حركة الطيران","report":"إبلاغ","countries":"الدول","newsTitle":"أخبار UAP العالمية","skyTitle":"رادار الطائرات","search":"البحث في العناوين","refresh":"تحديث","more":"عرض المزيد","edition":"الإصدار","region":"المنطقة","loading":"جار التحميل…","offline":"المصدر غير متاح مؤقتاً.","newsIntro":"عناوين الأخبار العالمية حسب التاريخ. اطلع على المصادر الأصلية.","skyIntro":"مواقع أجهزة الإرسال الجوية العامة للمقارنة مع المشاهدات، وليست كاشفاً للأجسام المجهولة.","edGlobal":"🌍 البث العالمي","edBulgaria":"🇧🇬 بلغاريا","edOfficial":"الوثائق والمؤسسات","origHeadline":"العنوان الأصلي","headlines":"عنوان","translated":"مترجم","origUntranslated":"العناوين الأصلية — الترجمة غير متاحة","cached":"مخزن مؤقتاً","newsWarning":"المصدر: خلاصات RSS العامة من أخبار Google. نعرض فقط العنوان والناشر والتاريخ ورابط المقال الأصلي.","openGoogleNews":"افتح أخبار Google مباشرة ↗","noHeadlines":"لا توجد عناوين متاحة حالياً.","skipForm":"الانتقال إلى النموذج"},
  "ja":{"home":"ホーム","news":"ニュース","sky":"航空交通","report":"報告","countries":"国別一覧","newsTitle":"世界のUAPニュース","skyTitle":"航空機レーダー","search":"見出しを検索","refresh":"更新","more":"もっと見る","edition":"版","region":"地域","loading":"読み込み中…","offline":"情報源に接続できません。","newsIntro":"世界のニュースを日付順に表示。元の記事をご覧ください。","skyIntro":"観測の照合に使う公開航空機トランスポンダー位置であり、UAP検知器ではありません。","edGlobal":"🌍 世界のフィード","edBulgaria":"🇧🇬 ブルガリア","edOfficial":"公文書・公的機関","origHeadline":"元の見出し","headlines":"件の見出し","translated":"件翻訳済み","origUntranslated":"元の見出し — 翻訳は利用できません","cached":"キャッシュ","newsWarning":"出典：Google ニュースの公開 RSS。見出し、媒体名、日付、元記事へのリンクのみを表示します。","openGoogleNews":"Google ニュースを直接開く ↗","noHeadlines":"現在表示できる見出しはありません。","skipForm":"フォームへ移動"},
  "ko":{"home":"홈","news":"뉴스","sky":"항공 교통","report":"제보","countries":"국가별 목록","newsTitle":"세계 UAP 뉴스","skyTitle":"항공기 레이더","search":"제목 검색","refresh":"새로고침","more":"더 보기","edition":"범위","region":"지역","loading":"불러오는 중…","offline":"정보원을 일시적으로 이용할 수 없습니다.","newsIntro":"전 세계 언론의 최신 제목을 날짜순으로 보여줍니다. 원문을 확인하세요.","skyIntro":"관측 비교용 공개 항공기 트랜스폰더 위치이며 UAP 탐지기는 아닙니다.","edGlobal":"🌍 전 세계 피드","edBulgaria":"🇧🇬 불가리아","edOfficial":"공식 문서 및 기관","origHeadline":"원본 제목","headlines":"개의 헤드라인","translated":"개 번역됨","origUntranslated":"원본 제목 — 번역 사용 불가","cached":"캐시됨","newsWarning":"출처: Google 뉴스 공개 RSS 결과. 제목, 언론사, 날짜 및 원문 링크만 표시합니다.","openGoogleNews":"Google 뉴스 직접 열기 ↗","noHeadlines":"현재 표시할 헤드라인이 없습니다.","skipForm":"양식으로 건너뛰기"}
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
  const news=page==="news",sky=page==="sky",report=page==="report",countries=page==="countries",country=page==="country",dossier=page==="dossier";
  if(!news&&!sky&&!report&&!countries&&!country&&!dossier)return;
  const nav=[...document.querySelectorAll(".live-links a")];
  for(const anchor of nav){const href=anchor.getAttribute("href");
   const id=href==="/"? "home":href==="/news.html"?"news":href==="/sky.html"?"sky":href==="/report.html"?"report":href==="/countries.html"?"countries":null;
   if(id)anchor.textContent=text(id);
  }
  if(report){
   const back=document.querySelector(".report-back");if(back)back.textContent="← "+text("home").toUpperCase();
   const skip=document.querySelector(".skip");if(skip)skip.textContent=text("skipForm");
   syncSeoMeta(text("report")+" | AURORA UAP",document.getElementById("reportHeroLead")?.textContent||"");
   return;
  }
  if(countries||country||dossier){
   syncSeoMeta(null,null);
   return;
  }
  const h=document.querySelector(".live-hero h1");if(h)h.textContent=text(news?"newsTitle":"skyTitle");
  const intro=document.querySelector(".live-hero > p:not(.live-eyebrow)");if(intro)intro.textContent=text(news?"newsIntro":"skyIntro");
  const labels=[...document.querySelectorAll(".live-toolbar label")];
  if(labels[0]?.firstChild?.nodeType===3)labels[0].firstChild.textContent=text(news?"edition":"region");
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
  }else{
   const btn=document.getElementById("refreshSky");if(btn)btn.textContent=text("refresh")+" ↻";
  }
  syncSeoMeta(text(news?"newsTitle":"skyTitle")+" | AURORA UAP",text(news?"newsIntro":"skyIntro"));
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
