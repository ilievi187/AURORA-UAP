'use strict';

const translations = {
  bg: {
    navHome:'Начало',navMission:'Мисия',navResearch:'Изследвания',navMap:'Карта',navReports:'Сигнали',navJoin:'Участвай',joinButton:'Включи се',
    heroKicker:'ОТВОРЕНИ ДАННИ. КРИТИЧНО МИСЛЕНЕ. НЕПОЗНАТОТО НИ ОЧАКВА.',heroTitle1:'ДА ИЗСЛЕДВАМЕ',heroTitle2:'НЕОБЯСНИМОТО',heroBody:'AURORA е проект на UAP Bulgaria за независимо документиране и анализ на необяснени въздушни явления — чрез факти, технологии и общност.',reportButton:'Подай сигнал',exploreButton:'Виж изследванията',heroTag:'ЕДНО НЕБЕ. МНОГО ВЪПРОСИ.',
    statSignals:'Примерни сигнали',statDemo:'Демо данни',statTopics:'Изследователски направления',statMission:'Обща мисия',statMissionNote:'Наука и прозрачност',statVerified:'Потвърдени случая',statHonest:'Без измислени доказателства',
    whatDo:'КАКВО ПРАВИМ',researchTitle:'НАБЛЮДАВАМЕ. ПРОВЕРЯВАМЕ. ИЗСЛЕДВАМЕ.',researchIntro:'За да разберем непознатото, първо изключваме познатото. Всеки сигнал заслужава уважение и внимателна проверка.',
    feature1:'Карта на наблюденията',feature1desc:'Географски преглед на постъпилите сигнали и тяхната проверка.',feature2:'Архив на случаите',feature2desc:'Свидетелства, материали, ход на проверката и ясни заключения.',feature3:'Изследователска лаборатория',feature3desc:'Методика, проверки за самолети, сателити, дронове и метеори.',feature4:'Медиен архив',feature4desc:'Фото, видео и аудио материали с проследим произход.',
    mapKicker:'ГЛОБАЛЕН МОНИТОРИНГ · ПРОТОТИП',mapTitle:'КАРТА НА НАБЛЮДЕНИЯТА',mapDisclaimer:'Демонстрационни локации — НЕ са реални текущи сигнали',mapFiltered:'показани демо случая',filterTitle:'ФИЛТРИ',filterAll:'Всички сигнали',filterLights:'Светлини',filterObjects:'Обекти',filterVideo:'С видео',filterNote:'Точките са измислени и служат само за тестване на интерфейса.',detailButton:'Виж детайли',
    reportsKicker:'ПРИМЕРЕН АРХИВ',reportsTitle:'ПОСЛЕДНИ СЛУЧАИ',searchPlaceholder:'Търси по град или описание...',showAll:'Покажи всички 8 случая',showLess:'Покажи първите 4',nothingFound:'Няма резултати за това търсене.',resultsSample:'Само демонстрационни записи, не истински сигнали.',
    methodKicker:'НАШИЯТ ПОДХОД',methodTitle:"СЛЕДВАЙ ИСТОРИЯТА.",methodBody:"Разглеждаме всяка история през свидетелствата, публикуваните записи и източниците. Оставяме фактите открити за самостоятелно изследване.",method1:'Документиране на източника',method2:'Проверка на обстоятелствата',method3:'Технически анализ',method4:'Публично, честно заключение',
    joinKicker:'СТАНИ ЧАСТ ОТ МИСИЯТА',joinTitle:'ОБЩНОСТ, КОЯТО ТЪРСИ ОТГОВОРИ',joinBody:'Наблюдавай, задавай въпроси и участвай в изграждането на отворена, независима изследователска общност в България.',joinAct1:'Подай сигнал',joinAct1sub:'Запази чернова локално',joinAct2:'Доброволчество',joinAct2sub:'Предстояща програма',joinAct3:'Изследвания',joinAct3sub:'Отворена методика',joinCTA:'Подготви своя сигнал',
    protoLabel:'ПРОТОТИП:',protoNote:'Организацията и платформата са в процес на подготовка. Картата и случаите са демонстрационни; няма публично подаване на данни, регистрации или приемане на дарения.',footerSub:'Да изследваме небето заедно.',methodNav:'Методика',
    dialogKicker:'ДЕМОНСТРАЦИОННА ФОРМА',dialogTitle:'Опиши наблюдението си',dialogExplain:'Това е демо форма. Записва черновата само в този браузър, на твоето устройство — нищо не се изпраща към сървър.',formPlace:'Място / град',formDate:'Дата и час',formType:'Тип наблюдение',typeLight:'Светлини',typeObject:'Обект',typeOther:'Друго / не знам',formDesc:'Какво видя?',deleteDraft:'Изтрий черновата',saveDraft:'Запази чернова',saved:'Черновата е запазена само в браузъра ти. Не е изпращана никъде.',deleted:'Черновата е изтрита от браузъра.',storageError:'Браузърът не позволява локално съхранение. Опитай с локален уеб сървър.',caseCaution:'Илюстративен пример. Това не е реален сигнал, проверено доказателство или установено наблюдение.'
  },
  en: {
    navHome:'Home',navMission:'Mission',navResearch:'Research',navMap:'Map',navReports:'Sightings',navJoin:'Join',joinButton:'Join us',
    heroKicker:'OPEN DATA. OPEN MINDS. A CLEARER TOMORROW.',heroTitle1:'UNCOVERING THE',heroTitle2:'UNEXPLAINED',heroBody:'AURORA is a UAP Bulgaria project for independent documentation and analysis of unidentified aerial phenomena — through evidence, technology, and community.',reportButton:'Submit a sighting',exploreButton:'Explore the research',heroTag:'ONE SKY. MANY QUESTIONS.',
    statSignals:'Sample sightings',statDemo:'Demo data',statTopics:'Research themes',statMission:'Shared mission',statMissionNote:'Science & transparency',statVerified:'Verified cases',statHonest:'No invented evidence',
    whatDo:'WHAT WE DO',researchTitle:'OBSERVE. QUESTION. INVESTIGATE.',researchIntro:'To understand the unknown, we first rule out what is known. Every report deserves respect and careful examination.',
    feature1:'Sightings map',feature1desc:'Explore geographic patterns and the status of submitted reports.',feature2:'Case files',feature2desc:'Witness accounts, source materials, investigative steps, and conclusions.',feature3:'Research lab',feature3desc:'Methods for ruling out aircraft, satellites, drones, and meteors.',feature4:'Media archive',feature4desc:'Photographs, videos, and audio with traceable provenance.',
    mapKicker:'GLOBAL MONITORING · PROTOTYPE',mapTitle:'SIGHTINGS MAP',mapDisclaimer:'Illustrative locations — NOT real-time or verified sightings',mapFiltered:'demo cases displayed',filterTitle:'FILTER MAP',filterAll:'All sightings',filterLights:'Lights',filterObjects:'Objects',filterVideo:'With video',filterNote:'Markers are fictional and exist only to demonstrate the interface.',detailButton:'Read details',
    reportsKicker:'SAMPLE ARCHIVE',reportsTitle:'RECENT CASES',searchPlaceholder:'Search by location or description...',showAll:'View all 8 demo cases',showLess:'View first 4',nothingFound:'No results for this search.',resultsSample:'Illustrative cases only, not real reports.',
    methodKicker:'OUR APPROACH',methodTitle:"FOLLOW THE STORY.",methodBody:"Follow each story through witness accounts, published footage and original sources. Explore the material and form your own perspective.",method1:'Document the source',method2:'Verify the circumstances',method3:'Perform technical analysis',method4:'Publish a transparent conclusion',
    joinKicker:'JOIN THE MISSION',joinTitle:'A COMMUNITY SEEKING ANSWERS',joinBody:'Observe, question, and help build an open, independent research community in Bulgaria.',joinAct1:'Report a sighting',joinAct1sub:'Save a local draft',joinAct2:'Volunteer',joinAct2sub:'Program coming later',joinAct3:'Research',joinAct3sub:'Open methodology',joinCTA:'Draft your sighting',
    protoLabel:'PROTOTYPE:',protoNote:'The organization and platform are in preparation. The map and cases are demos. Online donations will become available after payment-provider verification.',footerSub:'Exploring open skies together.',methodNav:'Methodology',
    dialogKicker:'DEMO SUBMISSION FORM',dialogTitle:'Describe your observation',dialogExplain:'This is a demo form. It saves a draft in this browser, on your device only. Nothing is sent to a server.',formPlace:'Place / city',formDate:'Date and time',formType:'Observation type',typeLight:'Lights',typeObject:'Object',typeOther:'Other / not sure',formDesc:'What did you see?',deleteDraft:'Delete draft',saveDraft:'Save draft',saved:'Saved in this browser only. Nothing was sent anywhere.',deleted:'Draft deleted from this browser.',storageError:'Browser storage is unavailable. Try running the site on a local web server.',caseCaution:'Illustrative example. This is not a real report, verified evidence, or documented observation.'
  }
};


Object.assign(translations, window.AURORA_LOCALES || {});
// The news archive is a first-class destination on desktop and mobile.
// Keep its navigation label complete across all 18 public locales.
const navNewsLabels = {
  "bg": "Новини",
  "en": "News",
  "de": "Nachrichten",
  "ru": "Новости",
  "zh-CN": "新闻",
  "fr": "Actualités",
  "es": "Noticias",
  "it": "Notizie",
  "pt": "Notícias",
  "tr": "Haberler",
  "ro": "Știri",
  "el": "Ειδήσεις",
  "sr": "Вести",
  "uk": "Новини",
  "pl": "Wiadomości",
  "ar": "الأخبار",
  "ja": "ニュース",
  "ko": "뉴스"
};
for (const [locale, label] of Object.entries(navNewsLabels)) {
  if (!translations[locale]) throw new Error("Missing AURORA locale: " + locale);
  translations[locale].navNews = label;
}

const donationNav = {
 bg:{navDonate:'ДАРИ',donateKicker:'ПОДКРЕПИ НЕЗАВИСИМИТЕ ИЗСЛЕДВАНИЯ',donateTitle:'ПОМОГНИ НИ ДА ИЗГРАДИМ AURORA.',donateSummary:'Подкрепата ще бъде използвана за оборудване, разследвания, пътувания, софтуер, хостинг и прозрачни разходи по проекта.'},
 en:{navDonate:'DONATE',donateKicker:'SUPPORT INDEPENDENT RESEARCH',donateTitle:'HELP US BUILD AURORA.',donateSummary:'Support will fund equipment, investigations, field travel, software, hosting, and transparent project costs.'},
 de:{navDonate:'SPENDEN',donateKicker:'UNABHÄNGIGE FORSCHUNG UNTERSTÜTZEN',donateTitle:'HILF UNS, AURORA AUFZUBAUEN.',donateSummary:'Unterstützung finanziert Ausrüstung, Untersuchungen, Reisen, Software, Hosting und transparent dokumentierte Projektkosten.'},
 ru:{navDonate:'ПОМОЧЬ',donateKicker:'ПОДДЕРЖАТЬ НЕЗАВИСИМЫЕ ИССЛЕДОВАНИЯ',donateTitle:'ПОМОГИТЕ ПОСТРОИТЬ AURORA.',donateSummary:'Средства планируется направлять на оборудование, исследования, поездки, программы и прозрачные расходы проекта.'},
 'zh-CN':{navDonate:'捐助',donateKicker:'支持独立研究',donateTitle:'帮助我们建设 AURORA。',donateSummary:'支持将用于设备、调查、实地出行、软件、网站托管和公开透明的项目费用。'}
};
for(const [code, keys] of Object.entries(donationNav)) Object.assign(translations[code],keys);

const premiumNavLabels={
 bg:{navArchive:"Архив",navMedia:"Видео",heroArchiveCTA:"Разгледай случаите"},
 en:{navArchive:"Archive",navMedia:"Videos",heroArchiveCTA:"Explore the cases"},
 de:{navArchive:"Archiv",navMedia:"Videos",heroArchiveCTA:"Fälle entdecken"},
 ru:{navArchive:"Архив",navMedia:"Видео",heroArchiveCTA:"Изучить случаи"},
 "zh-CN":{navArchive:"档案",navMedia:"视频",heroArchiveCTA:"探索案例"},
 fr:{navArchive:"Archives",navMedia:"Vidéos",heroArchiveCTA:"Explorer les dossiers"},
 es:{navArchive:"Archivo",navMedia:"Vídeos",heroArchiveCTA:"Explorar los casos"},
 it:{navArchive:"Archivio",navMedia:"Video",heroArchiveCTA:"Esplora i casi"},
 pt:{navArchive:"Arquivo",navMedia:"Vídeos",heroArchiveCTA:"Explorar os casos"},
 tr:{navArchive:"Arşiv",navMedia:"Videolar",heroArchiveCTA:"Vakaları keşfet"},
 ro:{navArchive:"Arhivă",navMedia:"Video",heroArchiveCTA:"Explorează cazurile"},
 el:{navArchive:"Αρχείο",navMedia:"Βίντεο",heroArchiveCTA:"Εξερεύνηση περιστατικών"},
 sr:{navArchive:"Архива",navMedia:"Видео",heroArchiveCTA:"Истражи случајеве"},
 uk:{navArchive:"Архів",navMedia:"Відео",heroArchiveCTA:"Переглянути випадки"},
 pl:{navArchive:"Archiwum",navMedia:"Wideo",heroArchiveCTA:"Poznaj przypadki"},
 ar:{navArchive:"الأرشيف",navMedia:"الفيديو",heroArchiveCTA:"استكشف الحالات"},
 ja:{navArchive:"アーカイブ",navMedia:"動画",heroArchiveCTA:"事例を見る"},
 ko:{navArchive:"아카이브",navMedia:"영상",heroArchiveCTA:"사례 살펴보기"}
};
for(const [locale,labels] of Object.entries(premiumNavLabels))Object.assign(translations[locale],labels);

const reportDraftNotes={
 bg:"Публичното подаване е изключено. Черновата остава на устройството; нищо не се изпраща към сървър.",
 en:"Public submissions are disabled. Drafts stay on your device; nothing is sent to a server.",
 de:"Öffentliche Meldungen sind deaktiviert. Entwürfe bleiben auf deinem Gerät; nichts wird an einen Server gesendet.",
 ru:"Публичная отправка отключена. Черновик остаётся на устройстве; данные не отправляются на сервер.",
 "zh-CN":"公开提交尚未启用。草稿仅保存在你的设备上，不会发送到服务器。",
 fr:"Les envois publics sont désactivés. Le brouillon reste sur votre appareil ; rien n’est envoyé au serveur.",
 es:"El envío público está desactivado. El borrador queda en tu dispositivo; no se envía nada al servidor.",
 it:"L’invio pubblico è disattivato. La bozza resta sul tuo dispositivo; non viene inviato nulla al server.",
 pt:"O envio público está desativado. O rascunho fica no seu dispositivo; nada é enviado para um servidor.",
 tr:"Herkese açık gönderim devre dışı. Taslak cihazında kalır; sunucuya hiçbir şey gönderilmez.",
 ro:"Trimiterea publică este dezactivată. Ciorna rămâne pe dispozitivul tău; nimic nu este trimis către un server.",
 el:"Η δημόσια υποβολή είναι απενεργοποιημένη. Το πρόχειρο μένει στη συσκευή σου· δεν αποστέλλεται τίποτα σε διακομιστή.",
 sr:"Јавно слање је онемогућено. Нацрт остаје на уређају; ништа се не шаље серверу.",
 uk:"Публічне надсилання вимкнене. Чернетка залишається на пристрої; нічого не надсилається на сервер.",
 pl:"Publiczne zgłoszenia są wyłączone. Szkic pozostaje na Twoim urządzeniu; nic nie jest wysyłane na serwer.",
 ar:"الإرسال العام معطّل. تبقى المسودة على جهازك ولا يُرسل أي شيء إلى الخادم.",
 ja:"公開送信は無効です。下書きは端末に保存され、サーバーには何も送信されません。",
 ko:"공개 제출은 비활성화되어 있습니다. 초안은 기기에만 저장되며 서버로 전송되지 않습니다."
};
for(const [locale,note] of Object.entries(reportDraftNotes))translations[locale].reportDraftNote=note;

const SUPPORTED_LOCALES = ['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko'];
const HOME_TITLES = {
  bg: 'AURORA — UAP Bulgaria | Изследвай неизвестното',
  en: 'AURORA — UAP Bulgaria | Uncovering the unexplained',
  de: 'AURORA — UAP Bulgaria | Dem Unerklärlichen auf der Spur',
  ru: 'AURORA — UAP Bulgaria | Исследуем необъяснимое',
  'zh-CN': 'AURORA — UAP Bulgaria | 探索未解之谜',
  fr: "AURORA — UAP Bulgaria | Explorer l'inexpliqué",
  es: 'AURORA — UAP Bulgaria | Explorar lo inexplicable',
  it: "AURORA — UAP Bulgaria | Esplorare l'inspiegabile",
  pt: 'AURORA — UAP Bulgaria | Explorar o inexplicável',
  tr: 'AURORA — UAP Bulgaria | Açıklanamayanı araştır',
  ro: 'AURORA — UAP Bulgaria | Explorăm neexplicatul',
  el: 'AURORA — UAP Bulgaria | Εξερευνούμε το ανεξήγητο',
  sr: 'AURORA — UAP Bulgaria | Истражујемо необјашњено',
  uk: 'AURORA — UAP Bulgaria | Досліджуємо непояснене',
  pl: 'AURORA — UAP Bulgaria | Odkrywamy niewyjaśnione',
  ar: 'AURORA — UAP Bulgaria | نستكشف ما لا تفسير له',
  ja: 'AURORA — UAP Bulgaria | 未解明を探究する',
  ko: 'AURORA — UAP Bulgaria | 미지의 현상을 탐구하다'
};
let lang = (()=>{
  try{
    const u=new URL(location.href);
    const q=u.searchParams.get('lang');
    if(SUPPORTED_LOCALES.includes(q)){
      try{localStorage.setItem('aurora-lang',q);}catch(_){}
      u.searchParams.delete('lang');
      history.replaceState(null,'',u.pathname+(u.search||'')+u.hash);
      return q;
    }
    const s=localStorage.getItem('aurora-lang');
    return SUPPORTED_LOCALES.includes(s)?s:'bg';
  }catch(_){return 'bg';}
})();
let editorialCases=[];
let editorialLoaded=false;
let editorialError=false;
let archiveLocalization=null;
let reportPageSize=24;
const $ = selector => document.querySelector(selector);
const txt = key => translations[lang]?.[key] || translations.en[key] || key;
function syncHomeSeo() {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.append(canonical);
  }
  canonical.setAttribute('href', 'https://aurorauap.org/');
  const desc = document.querySelector('meta[name="description"]');
  if (desc && txt('heroBody')) desc.setAttribute('content', txt('heroBody'));
}

function translate() {
  document.documentElement.lang = lang;
  document.title = HOME_TITLES[lang] || HOME_TITLES.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {const key=el.dataset.i18n;if (txt(key) !== key) el.textContent=txt(key);});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {el.placeholder=txt(el.dataset.i18nPlaceholder);});
  $('#langToggle').value = lang;
  syncHomeSeo();
  renderMap();renderReports();
}
function renderMap(){
  const container=$('#mapPins');
  if(!container)return; // Retired demo markers must never reappear.
  container.replaceChildren();
}
// The homepage preview reads only the source-backed editorial archive.
const editorialText={
 bg:{loading:"Зареждаме архивните истории…",error:"Архивът временно не е достъпен. Използвай световната карта.",empty:"Няма случаи за това търсене.",more:"Покажи още случаи",count:"досиета с източници",media:"ВИДЕО",archive:"АРХИВ",art:"Илюстрация към случая — не оригинален кадър",heading:"СЛУЧАИ ОТ СВЕТА",kicker:"СВЕТОВЕН АРХИВ"},
 en:{loading:"Loading case files…",error:"The case archive is temporarily unavailable. Explore the world map.",empty:"No matching cases.",more:"Load more cases",count:"source-linked case files",media:"VIDEO",archive:"ARCHIVE",art:"Illustration only — not original footage",heading:"CASES FROM AROUND THE WORLD",kicker:"WORLD ARCHIVE"},
 de:{loading:"Fallakten werden geladen…",error:"Das Fallarchiv ist vorübergehend nicht verfügbar. Nutze die Weltkarte.",empty:"Keine passenden Fälle gefunden.",more:"Weitere Fälle laden",count:"quellengebundene Fallakten",media:"VIDEO",archive:"ARCHIV",art:"Nur Illustration — keine Originalaufnahme",heading:"FÄLLE AUS ALLER WELT",kicker:"WELTARCHIV"},
 ru:{loading:"Загрузка архивных досье…",error:"Архив временно недоступен. Используйте карту мира.",empty:"Подходящих случаев не найдено.",more:"Показать ещё случаи",count:"досье с источниками",media:"ВИДЕО",archive:"АРХИВ",art:"Иллюстрация к случаю — не оригинальный кадр",heading:"СЛУЧАИ СО ВСЕГО МИРА",kicker:"МИРОВОЙ АРХИВ"},
 "zh-CN":{loading:"正在加载案例档案…",error:"案例档案暂时不可用，请浏览世界地图。",empty:"没有匹配的案例。",more:"加载更多案例",count:"份带来源的案例档案",media:"视频",archive:"档案",art:"仅作示意插图 — 非原始影像",heading:"全球案例精选",kicker:"世界档案"},
 fr:{loading:"Chargement des dossiers…",error:"Les archives sont temporairement indisponibles. Utilisez la carte mondiale.",empty:"Aucun cas correspondant.",more:"Charger plus de cas",count:"dossiers liés aux sources",media:"VIDÉO",archive:"ARCHIVE",art:"Illustration uniquement — pas une image originale",heading:"CAS DANS LE MONDE",kicker:"ARCHIVES MONDIALES"},
 es:{loading:"Cargando expedientes…",error:"El archivo no está disponible temporalmente. Explora el mapa mundial.",empty:"No hay casos que coincidan.",more:"Cargar más casos",count:"expedientes con fuente",media:"VÍDEO",archive:"ARCHIVO",art:"Solo ilustración — no es metraje original",heading:"CASOS DEL MUNDO",kicker:"ARCHIVO MUNDIAL"},
 it:{loading:"Caricamento dei fascicoli…",error:"L'archivio è temporaneamente non disponibile. Esplora la mappa mondiale.",empty:"Nessun caso corrispondente.",more:"Carica altri casi",count:"fascicoli con fonte",media:"VIDEO",archive:"ARCHIVIO",art:"Solo illustrazione — non filmato originale",heading:"CASI DAL MONDO",kicker:"ARCHIVIO MONDIALE"},
 pt:{loading:"A carregar processos…",error:"O arquivo está temporariamente indisponível. Explore o mapa mundial.",empty:"Nenhum caso correspondente.",more:"Carregar mais casos",count:"processos com fonte",media:"VÍDEO",archive:"ARQUIVO",art:"Apenas ilustração — não é imagem original",heading:"CASOS PELO MUNDO",kicker:"ARQUIVO MUNDIAL"},
 tr:{loading:"Vaka dosyaları yükleniyor…",error:"Vaka arşivi geçici olarak kullanılamıyor. Dünya haritasını inceleyin.",empty:"Eşleşen vaka bulunamadı.",more:"Daha fazla vaka yükle",count:"kaynak bağlantılı vaka dosyası",media:"VİDEO",archive:"ARŞİV",art:"Yalnızca illüstrasyon — orijinal görüntü değildir",heading:"DÜNYADAN VAKALAR",kicker:"DÜNYA ARŞİVİ"},
 ro:{loading:"Se încarcă dosarele…",error:"Arhiva este temporar indisponibilă. Explorează harta lumii.",empty:"Niciun caz potrivit.",more:"Încarcă mai multe cazuri",count:"dosare cu sursă",media:"VIDEO",archive:"ARHIVĂ",art:"Doar ilustrație — nu este cadru original",heading:"CAZURI DIN LUME",kicker:"ARHIVA MONDIALĂ"},
 el:{loading:"Φόρτωση φακέλων υποθέσεων…",error:"Το αρχείο είναι προσωρινά μη διαθέσιμο. Χρησιμοποιήστε τον παγκόσμιο χάρτη.",empty:"Δεν βρέθηκαν αντίστοιχες υποθέσεις.",more:"Φόρτωση περισσότερων υποθέσεων",count:"φάκελοι με πηγή",media:"ΒΙΝΤΕΟ",archive:"ΑΡΧΕΙΟ",art:"Εικονογράφηση μόνο — όχι πρωτότυπο υλικό",heading:"ΥΠΟΘΕΣΕΙΣ ΑΠΟ ΤΟΝ ΚΟΣΜΟ",kicker:"ΠΑΓΚΟΣΜΙΟ ΑΡΧΕΙΟ"},
 sr:{loading:"Учитавање архивских досијеа…",error:"Архив је привремено недоступан. Истражите мапу света.",empty:"Нема одговарајућих случајева.",more:"Учитај још случајева",count:"досијеа са изворима",media:"ВИДЕО",archive:"АРХИВ",art:"Само илустрација — није оригинални снимак",heading:"СЛУЧАЈЕВИ ИЗ СВЕТА",kicker:"СВЕТСКИ АРХИВ"},
 uk:{loading:"Завантаження архівних досьє…",error:"Архів тимчасово недоступний. Скористайтеся картою світу.",empty:"Відповідних випадків не знайдено.",more:"Показати ще випадки",count:"досьє з джерелами",media:"ВІДЕО",archive:"АРХІВ",art:"Лише ілюстрація — не оригінальний кадр",heading:"ВИПАДКИ З УСЬОГО СВІТУ",kicker:"СВІТОВИЙ АРХІВ"},
 pl:{loading:"Wczytywanie akt spraw…",error:"Archiwum jest tymczasowo niedostępne. Skorzystaj z mapy świata.",empty:"Brak pasujących przypadków.",more:"Wczytaj więcej przypadków",count:"akt ze źródłami",media:"WIDEO",archive:"ARCHIWUM",art:"Wyłącznie ilustracja — nie oryginalne nagranie",heading:"PRZYPADKI ZE ŚWIATA",kicker:"ŚWIATOWE ARCHIWUM"},
 ar:{loading:"جاري تحميل ملفات الحالات…",error:"الأرشيف غير متاح مؤقتاً. استكشف خريطة العالم.",empty:"لا توجد حالات مطابقة.",more:"تحميل المزيد من الحالات",count:"ملفات موثقة بالمصادر",media:"فيديو",archive:"أرشيف",art:"رسم توضيحي فقط — ليس تسجيلاً أصلياً",heading:"حالات من حول العالم",kicker:"الأرشيف العالمي"},
 ja:{loading:"事例ファイルを読み込み中…",error:"アーカイブは一時的に利用できません。世界地図をご利用ください。",empty:"一致する事例がありません。",more:"さらに事例を読み込む",count:"件の出典付き事例ファイル",media:"映像",archive:"アーカイブ",art:"イメージ図 — 実際の映像ではありません",heading:"世界の事例",kicker:"ワールドアーカイブ"},
 ko:{loading:"사례 기록을 불러오는 중…",error:"사례 아카이브를 일시적으로 사용할 수 없습니다. 세계 지도를 이용해 주세요.",empty:"일치하는 사례가 없습니다.",more:"사례 더 보기",count:"개의 출처 연결 사례 파일",media:"영상",archive:"아카이브",art:"이해를 돕기 위한 일러스트 — 원본 영상 아님",heading:"세계의 주요 사례",kicker:"월드 아카이브"}
};
const editorialLang=()=>editorialText[lang]||editorialText.en;
function renderReports(){
 const grid=$('#reportGrid'),note=$('#reportResultsNote');
 grid.replaceChildren();note.replaceChildren();
 const title=$('#reports .section-heading h2'),kicker=$('#reports .section-heading .eyebrow');
 if(title)title.textContent=editorialLang().heading;
 if(kicker)kicker.textContent=editorialLang().kicker;
 if(!editorialLoaded){
  const el=document.createElement('p');el.className='empty-results';
  el.textContent=editorialError?editorialLang().error:editorialLang().loading;
  grid.append(el);return;
 }
 const q=$('#reportSearch').value.trim().toLocaleLowerCase();
 const filtered=editorialCases.filter(c=>{
  if(!q)return true;
  const pieces=[...Object.values(c.title||{}),...Object.values(c.city||{}),...Object.values(c.summary||{}),c.country,c.date,c.source?.name];
  return pieces.some(v=>typeof v==='string'&&v.toLocaleLowerCase().includes(q));
 });
 const visible=filtered.slice(0,reportPageSize);
 for(const c of visible){
  const card=document.createElement('a');
  card.className='report-card';card.href='/archive/'+encodeURIComponent(c.id);
  const img=document.createElement('img');
  // No remote images or unverified footage: artwork is visibly identified.
  img.src=/^\/assets\/[a-z0-9-]+\.webp$/.test(c.visual?.src||'')?c.visual.src:'/assets/feature-cases.webp';
  img.alt=(c.visual?.caption?.[lang]||c.visual?.caption?.en||editorialLang().art);
  img.loading='lazy';img.decoding='async';
  const attribution=document.createElement('span');attribution.className='editorial-image-credit';
  attribution.textContent=editorialLang().art;
  const meta=document.createElement('span');meta.className='date';
  meta.textContent=[c.date,c.country].filter(Boolean).join(' · ');
  const contentLanguage=archiveLocalization.caseTextLanguage(c,lang);
  const title=document.createElement('h3');title.textContent=c.title?.[contentLanguage]||c.title?.en||'';
  const desc=document.createElement('p');desc.className='desc';
  desc.textContent=c.summary?.[contentLanguage]||c.summary?.en||'';
  const cardContent=[img,attribution,meta,title,desc];
  if(lang!=='en'&&contentLanguage!==lang){
   const disclosure=document.createElement('small');
   disclosure.className='archive-translation-disclosure';
   disclosure.textContent=archiveLocalization.translationDisclosure(lang);
   disclosure.setAttribute('role','note');
   cardContent.push(disclosure);
  }
  const bottom=document.createElement('div');bottom.className='report-bottom';
  const type=document.createElement('span');type.className='report-badge';
  type.textContent=Array.isArray(c.media)&&c.media.some(m=>m.type==='video')?editorialLang().media:editorialLang().archive;
  const arrow=document.createElement('span');arrow.className='circle-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='→';
  bottom.append(type,arrow);card.append(...cardContent,bottom);grid.append(card);
 }
 if(!visible.length){const el=document.createElement('p');el.className='empty-results';el.textContent=editorialLang().empty;grid.append(el)}
 const count=document.createElement('span');count.textContent=visible.length+' / '+filtered.length+' '+editorialLang().count;note.append(count);
 if(filtered.length>visible.length){
  const button=document.createElement('button');button.type='button';button.className='show-all';button.textContent=editorialLang().more+' ↓';
  button.addEventListener('click',()=>{reportPageSize+=24;renderReports()});note.append(button);
 }
}
async function loadEditorialCases(){
 try{
  const [r,localization]=await Promise.all([
   fetch('/data/cases.json',{cache:'force-cache'}),
   import('./archive-localization.js')
  ]);
  if(!r.ok)throw Error('archive_unavailable');
  const data=await r.json();
  if(!Array.isArray(data.cases))throw Error('invalid_archive');
  archiveLocalization=localization;
  editorialCases=data.cases.filter(c=>c&&/^[a-z0-9-]{3,90}$/.test(c.id)&&c.title?.en&&c.summary?.en&&c.source?.url?.startsWith('https://'))
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  editorialLoaded=true;editorialError=false;
 }catch{
  editorialError=true;editorialLoaded=false;
 }
 renderReports();
}
function setup(){
  $('#year').textContent=new Date().getFullYear();
  $('#langToggle').addEventListener('change', e=>{lang=e.target.value;try{localStorage.setItem('aurora-lang',lang);}catch(_){}translate();});
  $('#menuToggle').addEventListener('click',()=>{const nav=$('#mobileNav');nav.hidden=!nav.hidden;$('#menuToggle').setAttribute('aria-expanded',String(!nav.hidden));});
  $('#mobileNav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('#mobileNav').hidden=true;$('#menuToggle').setAttribute('aria-expanded','false');}));
  const dismissMobileNav=e=>{
    if(e.key!=='Escape'||$('#mobileNav').hidden)return;
    e.preventDefault();
    $('#mobileNav').hidden=true;
    $('#menuToggle').setAttribute('aria-expanded','false');
    $('#menuToggle').focus();
  };
  $('#mobileNav').addEventListener('keydown',dismissMobileNav);
  $('#menuToggle').addEventListener('keydown',dismissMobileNav);
  $('#reportSearch').addEventListener('input',()=>{reportPageSize=24;renderReports()});
  $('#tooltipRead')?.addEventListener('click',()=>{location.hash='#worldAtlas';});
  // Keep the selected interface language private to this browser.
  translate();
  loadEditorialCases();
}
setup();
