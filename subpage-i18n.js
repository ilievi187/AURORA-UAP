/* Localized public newsroom, country directory, dossier, and report navigation.
   These labels are authored in each supported interface language; sources remain attributed. */
"use strict";
(()=>{
 const packs={
  "bg":{"home":"Начало","news":"Новини","report":"Сигнал","countries":"Държави","newsTitle":"СВЕТОВНИ UAP НОВИНИ","search":"Търси заглавия","refresh":"Обнови","more":"Покажи още","edition":"Обхват","region":"Зона","loading":"Зареждане…","offline":"Източникът временно не отговаря.","newsIntro":"Заглавия от външни медии, подредени по дата. Прочети ги и прецени сам.","edGlobal":"🌍 Световен поток","edBulgaria":"🇧🇬 България","edOfficial":"Документи и институции","origHeadline":"ОРИГИНАЛНО ЗАГЛАВИЕ","headlines":"заглавия","translated":"преведени","origUntranslated":"Оригинални заглавия — преводът е недостъпен","cached":"КЕШИРАНО","newsWarning":"Източници: публични RSS резултати от Google News и проверени RSS/Atom емисии на издатели. Заглавията са съвпадения по ключови думи, а не са потвърдени случаи на UAP. Показваме само заглавие, медия, дата и връзка към оригинала. Източниците може временно да са недостъпни.","openGoogleNews":"Отвори Google News директно ↗","noHeadlines":"В момента няма налични заглавия.","skipForm":"Към формуляра"},
  "en":{"home":"Home","news":"News","report":"Report","countries":"Countries","newsTitle":"WORLD UAP NEWS","search":"Search headlines","refresh":"Refresh","more":"Show more","edition":"Edition","region":"Region","loading":"Loading…","offline":"The source is temporarily unavailable.","newsIntro":"Latest headlines from independent publishers, ordered by date. Explore the original reporting.","edGlobal":"🌍 Worldwide feed","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Official & institutional topics","origHeadline":"ORIGINAL HEADLINE","headlines":"headlines","translated":"translated","origUntranslated":"Original titles — translation unavailable","cached":"CACHED","newsWarning":"Sources: public Google News RSS results and checked publisher RSS/Atom feeds. Headlines are keyword matches, not verified UAP cases. We show only the headline, publisher, date, and a link to the original article. Some sources may be temporarily unavailable.","openGoogleNews":"Open Google News directly ↗","noHeadlines":"No headlines available right now.","skipForm":"Skip to form"},
  "de":{"home":"Startseite","news":"Nachrichten","report":"Meldung","countries":"Länder","newsTitle":"UAP-NACHRICHTEN WELTWEIT","search":"Schlagzeilen suchen","refresh":"Aktualisieren","more":"Mehr anzeigen","edition":"Ausgabe","region":"Region","loading":"Wird geladen…","offline":"Quelle derzeit nicht erreichbar.","newsIntro":"Aktuelle Schlagzeilen externer Medien nach Datum. Lesen Sie die Originalberichte.","edGlobal":"🌍 Weltweiter Feed","edBulgaria":"🇧🇬 Bulgarien","edOfficial":"Dokumente & Institutionen","origHeadline":"ORIGINALSCHLAGZEILE","headlines":"Schlagzeilen","translated":"übersetzt","origUntranslated":"Originaltitel — Übersetzung nicht verfügbar","cached":"ZWISCHENGESPEICHERT","newsWarning":"Quellen: öffentliche Google News-RSS-Ergebnisse und geprüfte RSS-/Atom-Feeds von Verlagen. Die Schlagzeilen sind Stichworttreffer, keine bestätigten UAP-Fälle. Angezeigt werden nur Titel, Medium, Datum und ein Link zum Originalartikel. Einige Quellen können vorübergehend nicht erreichbar sein.","openGoogleNews":"Google News direkt öffnen ↗","noHeadlines":"Derzeit sind keine Schlagzeilen verfügbar.","skipForm":"Zum Formular springen"},
  "ru":{"home":"Главная","news":"Новости","report":"Сообщить","countries":"Страны","newsTitle":"МИРОВЫЕ НОВОСТИ ОБ UAP","search":"Поиск заголовков","refresh":"Обновить","more":"Показать ещё","edition":"Раздел","region":"Регион","loading":"Загрузка…","offline":"Источник временно недоступен.","newsIntro":"Заголовки внешних СМИ по дате. Изучайте оригинальные публикации.","edGlobal":"🌍 Мировой поток","edBulgaria":"🇧🇬 Болгария","edOfficial":"Документы и ведомства","origHeadline":"ОРИГИНАЛЬНЫЙ ЗАГОЛОВОК","headlines":"заголовков","translated":"переведено","origUntranslated":"Оригинальные заголовки — перевод недоступен","cached":"КЭШ","newsWarning":"Источники: открытые RSS-результаты Google News и проверенные RSS/Atom-ленты издателей. Заголовки подобраны по ключевым словам и не являются подтверждёнными случаями UAP. Показываются только заголовок, издание, дата и ссылка на оригинал. Некоторые источники могут быть временно недоступны.","openGoogleNews":"Открыть Google News напрямую ↗","noHeadlines":"Сейчас нет доступных заголовков.","skipForm":"Перейти к форме"},
  "zh-CN":{"home":"首页","news":"新闻","report":"报告","countries":"国家/地区","newsTitle":"全球UAP新闻","search":"搜索标题","refresh":"刷新","more":"查看更多","edition":"版本","region":"地区","loading":"正在加载…","offline":"消息来源暂时不可用。","newsIntro":"按日期浏览世界各地媒体的最新报道，并查看原始来源。","edGlobal":"🌍 全球动态","edBulgaria":"🇧🇬 保加利亚","edOfficial":"官方文献与机构","origHeadline":"原始标题","headlines":"条新闻","translated":"已翻译","origUntranslated":"原始标题 — 翻译暂不可用","cached":"缓存","newsWarning":"来源：Google 新闻公开 RSS 结果和经核验的媒体 RSS/Atom 订阅。标题按关键词匹配，并非已核实的UAP案例。我们仅显示标题、媒体、日期和原文链接。部分来源可能暂时无法访问。","openGoogleNews":"直接打开 Google 新闻 ↗","noHeadlines":"当前暂无可用新闻。","skipForm":"跳至表单"},
  "fr":{"home":"Accueil","news":"Actualités","report":"Signaler","countries":"Pays","newsTitle":"ACTUALITÉS UAP MONDIALES","search":"Rechercher les titres","refresh":"Actualiser","more":"Voir plus","edition":"Édition","region":"Région","loading":"Chargement…","offline":"Source temporairement indisponible.","newsIntro":"Les titres récents des médias du monde, classés par date. Consultez les sources.","edGlobal":"🌍 Flux mondial","edBulgaria":"🇧🇬 Bulgarie","edOfficial":"Documents et institutions","origHeadline":"TITRE ORIGINAL","headlines":"titres","translated":"traduits","origUntranslated":"Titres originaux — traduction indisponible","cached":"EN CACHE","newsWarning":"Sources : résultats RSS publics de Google Actualités et flux RSS/Atom vérifiés de médias. Les titres sont des correspondances par mots-clés, pas des cas UAP vérifiés. Seuls le titre, le média, la date et le lien vers l'article original sont affichés. Certaines sources peuvent être temporairement indisponibles.","openGoogleNews":"Ouvrir Google Actualités ↗","noHeadlines":"Aucun titre disponible pour le moment.","skipForm":"Aller au formulaire"},
  "es":{"home":"Inicio","news":"Noticias","report":"Informar","countries":"Países","newsTitle":"NOTICIAS UAP DEL MUNDO","search":"Buscar titulares","refresh":"Actualizar","more":"Ver más","edition":"Edición","region":"Región","loading":"Cargando…","offline":"Fuente temporalmente no disponible.","newsIntro":"Titulares recientes de medios de todo el mundo, ordenados por fecha. Consulta la fuente.","edGlobal":"🌍 Flujo mundial","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Documentos e instituciones","origHeadline":"TITULAR ORIGINAL","headlines":"titulares","translated":"traducidos","origUntranslated":"Titulares originales — traducción no disponible","cached":"EN CACHÉ","newsWarning":"Fuentes: resultados RSS públicos de Google Noticias y feeds RSS/Atom verificados de medios. Los titulares son coincidencias por palabras clave, no son casos UAP verificados. Solo mostramos el titular, el medio, la fecha y el enlace al artículo original. Algunas fuentes pueden no estar disponibles temporalmente.","openGoogleNews":"Abrir Google Noticias directamente ↗","noHeadlines":"No hay titulares disponibles en este momento.","skipForm":"Saltar al formulario"},
  "it":{"home":"Home","news":"Notizie","report":"Segnala","countries":"Paesi","newsTitle":"NOTIZIE UAP DAL MONDO","search":"Cerca notizie","refresh":"Aggiorna","more":"Mostra altro","edition":"Edizione","region":"Regione","loading":"Caricamento…","offline":"Fonte temporaneamente non disponibile.","newsIntro":"Titoli di notizie da fonti internazionali, ordinati per data. Consulta gli originali.","edGlobal":"🌍 Flusso globale","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Documenti e istituzioni","origHeadline":"TITOLO ORIGINALE","headlines":"notizie","translated":"tradotte","origUntranslated":"Titoli originali — traduzione non disponibile","cached":"IN CACHE","newsWarning":"Fonti: risultati RSS pubblici di Google News e feed RSS/Atom verificati degli editori. I titoli sono corrispondenze per parole chiave, non sono casi UAP verificati. Mostriamo solo titolo, testata, data e link all'articolo originale. Alcune fonti potrebbero non essere temporaneamente disponibili.","openGoogleNews":"Apri Google News direttamente ↗","noHeadlines":"Nessuna notizia disponibile al momento.","skipForm":"Vai al modulo"},
  "pt":{"home":"Início","news":"Notícias","report":"Relatar","countries":"Países","newsTitle":"NOTÍCIAS UAP DO MUNDO","search":"Pesquisar notícias","refresh":"Atualizar","more":"Ver mais","edition":"Edição","region":"Região","loading":"Carregando…","offline":"Fonte temporariamente indisponível.","newsIntro":"Manchetes internacionais recentes em ordem cronológica. Consulte as fontes.","edGlobal":"🌍 Fluxo mundial","edBulgaria":"🇧🇬 Bulgária","edOfficial":"Documentos e instituições","origHeadline":"MANCHETE ORIGINAL","headlines":"manchetes","translated":"traduzidas","origUntranslated":"Títulos originais — tradução indisponível","cached":"EM CACHE","newsWarning":"Fontes: resultados RSS públicos do Google Notícias e feeds RSS/Atom verificados de editoras. Os títulos são correspondências por palavras-chave, não são casos UAP confirmados. Exibimos apenas título, veículo, data e link para o artigo original. Algumas fontes podem ficar temporariamente indisponíveis.","openGoogleNews":"Abrir Google Notícias diretamente ↗","noHeadlines":"Nenhuma manchete disponível no momento.","skipForm":"Ir para o formulário"},
  "tr":{"home":"Ana sayfa","news":"Haberler","report":"Bildirim","countries":"Ülkeler","newsTitle":"DÜNYADAN UAP HABERLERİ","search":"Başlıklarda ara","refresh":"Yenile","more":"Daha fazla","edition":"Bölüm","region":"Bölge","loading":"Yükleniyor…","offline":"Kaynak geçici olarak kullanılamıyor.","newsIntro":"Dünya medyasından tarih sıralı haber başlıkları. Özgün kaynakları okuyun.","edGlobal":"🌍 Küresel akış","edBulgaria":"🇧🇬 Bulgaristan","edOfficial":"Belgeler ve kurumlar","origHeadline":"ÖZGÜN BAŞLIK","headlines":"başlık","translated":"çevrildi","origUntranslated":"Özgün başlıklar — çeviri kullanılamıyor","cached":"ÖNBELLEK","newsWarning":"Kaynaklar: Google Haberler'in herkese açık RSS sonuçları ve doğrulanmış yayıncı RSS/Atom akışları. Başlıklar anahtar kelime eşleşmeleridir; doğrulanmış UAP vakaları değildir. Yalnızca başlık, yayıncı, tarih ve özgün makale bağlantısı gösterilir. Bazı kaynaklar geçici olarak kullanılamayabilir.","openGoogleNews":"Google Haberler'i doğrudan aç ↗","noHeadlines":"Şu anda kullanılabilir haber başlığı yok.","skipForm":"Forma geç"},
  "ro":{"home":"Acasă","news":"Știri","report":"Raportează","countries":"Țări","newsTitle":"ȘTIRI UAP DIN LUME","search":"Caută titluri","refresh":"Actualizează","more":"Mai multe","edition":"Ediție","region":"Regiune","loading":"Se încarcă…","offline":"Sursa este temporar indisponibilă.","newsIntro":"Titluri internaționale ordonate după dată. Consultă sursele originale.","edGlobal":"🌍 Flux global","edBulgaria":"🇧🇬 Bulgaria","edOfficial":"Documente și instituții","origHeadline":"TITLU ORIGINAL","headlines":"titluri","translated":"traduse","origUntranslated":"Titluri originale — traducere indisponibilă","cached":"ÎN CACHE","newsWarning":"Surse: rezultate RSS publice Google Știri și fluxuri RSS/Atom verificate ale editorilor. Titlurile sunt potriviri de cuvinte-cheie, nu sunt cazuri UAP verificate. Afișăm doar titlul, publicația, data și linkul către articolul original. Unele surse pot fi temporar indisponibile.","openGoogleNews":"Deschide Google Știri direct ↗","noHeadlines":"Nu există știri disponibile momentan.","skipForm":"Mergi la formular"},
  "el":{"home":"Αρχική","news":"Ειδήσεις","report":"Αναφορά","countries":"Χώρες","newsTitle":"ΠΑΓΚΟΣΜΙΕΣ ΕΙΔΗΣΕΙΣ UAP","search":"Αναζήτηση τίτλων","refresh":"Ανανέωση","more":"Περισσότερα","edition":"Έκδοση","region":"Περιοχή","loading":"Φόρτωση…","offline":"Η πηγή δεν είναι προσωρινά διαθέσιμη.","newsIntro":"Διεθνείς τίτλοι με χρονολογική σειρά. Δείτε τις αρχικές πηγές.","edGlobal":"🌍 Παγκόσμια ροή","edBulgaria":"🇧🇬 Βουλγαρία","edOfficial":"Έγγραφα και θεσμοί","origHeadline":"ΠΡΩΤΟΤΥΠΟΣ ΤΙΤΛΟΣ","headlines":"τίτλοι","translated":"μεταφρασμένοι","origUntranslated":"Πρωτότυποι τίτλοι — η μετάφραση δεν είναι διαθέσιμη","cached":"ΑΠΟΘΗΚΕΥΜΕΝΟ","newsWarning":"Πηγές: δημόσια αποτελέσματα RSS του Google News και επαληθευμένες ροές RSS/Atom εκδοτών. Οι τίτλοι είναι αντιστοιχίσεις λέξεων-κλειδιών, δεν είναι επιβεβαιωμένα περιστατικά UAP. Εμφανίζονται μόνο τίτλος, μέσο, ημερομηνία και σύνδεσμος προς το πρωτότυπο άρθρο. Ορισμένες πηγές μπορεί να μην είναι προσωρινά διαθέσιμες.","openGoogleNews":"Άνοιγμα Google News απευθείας ↗","noHeadlines":"Δεν υπάρχουν διαθέσιμοι τίτλοι αυτή τη στιγμή.","skipForm":"Μετάβαση στη φόρμα"},
  "sr":{"home":"Почетна","news":"Вести","report":"Пријави","countries":"Државе","newsTitle":"СВЕТСКЕ UAP ВЕСТИ","search":"Претражи наслове","refresh":"Освежи","more":"Прикажи још","edition":"Издање","region":"Регион","loading":"Учитавање…","offline":"Извор привремено није доступан.","newsIntro":"Вести из света, поређане по датуму. Отворите изворне објаве.","edGlobal":"🌍 Светски ток","edBulgaria":"🇧🇬 Бугарска","edOfficial":"Документи и институције","origHeadline":"ИЗВОРНИ НАСЛОВ","headlines":"наслова","translated":"преведено","origUntranslated":"Изворни наслови — превод није доступан","cached":"КЕШИРАНО","newsWarning":"Извори: јавни RSS резултати Google вести и проверени RSS/Atom фидови издавача. Наслови су подударања по кључним речима, нису потврђени случајеви UAP. Приказујемо само наслов, медиј, датум и везу ка оригиналном чланку. Неки извори могу привремено бити недоступни.","openGoogleNews":"Отвори Google вести директно ↗","noHeadlines":"Тренутно нема доступних наслова.","skipForm":"Пређи на образац"},
  "uk":{"home":"Головна","news":"Новини","report":"Повідомити","countries":"Країни","newsTitle":"СВІТОВІ НОВИНИ UAP","search":"Пошук заголовків","refresh":"Оновити","more":"Більше","edition":"Видання","region":"Регион","loading":"Завантаження…","offline":"Джерело тимчасово недоступне.","newsIntro":"Світові заголовки за датою. Переглядайте оригінальні публікації.","edGlobal":"🌍 Світовий потік","edBulgaria":"🇧🇬 Болгарія","edOfficial":"Документи та установи","origHeadline":"ОРИГІНАЛЬНИЙ ЗАГОЛОВОК","headlines":"заголовків","translated":"перекладено","origUntranslated":"Оригінальні заголовки — переклад недоступний","cached":"КЕШОВАНО","newsWarning":"Джерела: публічні RSS-результати Google Новин і перевірені RSS/Atom-стрічки видавців. Заголовки є збігами за ключовими словами, а не підтвердженими випадками UAP. Показуємо лише заголовок, видання, дату та посилання на оригінал. Деякі джерела можуть бути тимчасово недоступні.","openGoogleNews":"Відкрити Google Новини напряму ↗","noHeadlines":"Зараз немає доступних заголовків.","skipForm":"До форми"},
  "pl":{"home":"Strona główna","news":"Wiadomości","report":"Zgłoś","countries":"Kraje","newsTitle":"WIADOMOŚCI UAP ZE ŚWIATA","search":"Szukaj nagłówków","refresh":"Odśwież","more":"Więcej","edition":"Wydanie","region":"Region","loading":"Ładowanie…","offline":"Źródło chwilowo niedostępne.","newsIntro":"Światowe nagłówki według daty. Sprawdź oryginalne publikacje.","edGlobal":"🌍 Strumień światowy","edBulgaria":"🇧🇬 Bułgaria","edOfficial":"Dokumenty i instytucje","origHeadline":"ORYGINALNY NAGŁÓWEK","headlines":"nagłówków","translated":"przetłumaczono","origUntranslated":"Oryginalne tytuły — tłumaczenie niedostępne","cached":"W PAMIĘCI PODRĘCZNEJ","newsWarning":"Źródła: publiczne wyniki RSS Google News oraz sprawdzone kanały RSS/Atom wydawców. Nagłówki są dopasowaniami słów kluczowych, nie są potwierdzonymi przypadkami UAP. Wyświetlamy tylko tytuł, wydawcę, datę i link do oryginalnego artykułu. Niektóre źródła mogą być chwilowo niedostępne.","openGoogleNews":"Otwórz Google News bezpośrednio ↗","noHeadlines":"Brak dostępnych wiadomości w tej chwili.","skipForm":"Przejdź do formularza"},
  "ar":{"home":"الرئيسية","news":"الأخبار","report":"إبلاغ","countries":"الدول","newsTitle":"أخبار UAP العالمية","search":"البحث في العناوين","refresh":"تحديث","more":"عرض المزيد","edition":"الإصدار","region":"المنطقة","loading":"جار التحميل…","offline":"المصدر غير متاح مؤقتاً.","newsIntro":"عناوين الأخبار العالمية حسب التاريخ. اطلع على المصادر الأصلية.","edGlobal":"🌍 البث العالمي","edBulgaria":"🇧🇬 بلغاريا","edOfficial":"الوثائق والمؤسسات","origHeadline":"العنوان الأصلي","headlines":"عنوان","translated":"مترجم","origUntranslated":"العناوين الأصلية — الترجمة غير متاحة","cached":"مخزن مؤقتاً","newsWarning":"المصادر: نتائج RSS العامة من أخبار Google وخلاصات RSS/Atom التي تم التحقق منها للناشرين. العناوين مطابقة للكلمات المفتاحية وليست حالات UAP مؤكدة. نعرض العنوان والناشر والتاريخ ورابط المقال الأصلي فقط. قد لا تتوفر بعض المصادر مؤقتاً.","openGoogleNews":"افتح أخبار Google مباشرة ↗","noHeadlines":"لا توجد عناوين متاحة حالياً.","skipForm":"الانتقال إلى النموذج"},
  "ja":{"home":"ホーム","news":"ニュース","report":"報告","countries":"国別一覧","newsTitle":"世界のUAPニュース","search":"見出しを検索","refresh":"更新","more":"もっと見る","edition":"版","region":"地域","loading":"読み込み中…","offline":"情報源に接続できません。","newsIntro":"世界のニュースを日付順に表示。元の記事をご覧ください。","edGlobal":"🌍 世界のフィード","edBulgaria":"🇧🇬 ブルガリア","edOfficial":"公文書・公的機関","origHeadline":"元の見出し","headlines":"件の見出し","translated":"件翻訳済み","origUntranslated":"元の見出し — 翻訳は利用できません","cached":"キャッシュ","newsWarning":"出典：Google ニュースの公開 RSS と確認済みの出版社 RSS/Atom フィード。見出しはキーワードに一致したもので、確認済みのUAP事例ではありません。見出し、媒体名、日付、元記事へのリンクのみを表示します。一部の情報源は一時的に利用できない場合があります。","openGoogleNews":"Google ニュースを直接開く ↗","noHeadlines":"現在表示できる見出しはありません。","skipForm":"フォームへ移動"},
  "ko":{"home":"홈","news":"뉴스","report":"제보","countries":"국가별 목록","newsTitle":"세계 UAP 뉴스","search":"제목 검색","refresh":"새로고침","more":"더 보기","edition":"범위","region":"지역","loading":"불러오는 중…","offline":"정보원을 일시적으로 이용할 수 없습니다.","newsIntro":"전 세계 언론의 최신 제목을 날짜순으로 보여줍니다. 원문을 확인하세요.","edGlobal":"🌍 전 세계 피드","edBulgaria":"🇧🇬 불가리아","edOfficial":"공식 문서 및 기관","origHeadline":"원본 제목","headlines":"개의 헤드라인","translated":"개 번역됨","origUntranslated":"원본 제목 — 번역 사용 불가","cached":"캐시됨","newsWarning":"출처: Google 뉴스 공개 RSS 결과와 검증된 언론사 RSS/Atom 피드. 헤드라인은 키워드 일치 결과이며 확인된 UAP 사례가 아닙니다. 제목, 언론사, 날짜 및 원문 링크만 표시합니다. 일부 출처는 일시적으로 이용할 수 없을 수 있습니다.","openGoogleNews":"Google 뉴스 직접 열기 ↗","noHeadlines":"현재 표시할 헤드라인이 없습니다.","skipForm":"양식으로 건너뛰기"}
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
