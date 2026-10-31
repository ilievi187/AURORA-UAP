/* AURORA Country Explorer / read-only public D1 data. No personal submissions. */
"use strict";
(()=>{
 const el=id=>document.getElementById(id),status=el("countryFeedback");
 const names="AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
 const code=decodeURIComponent(location.pathname.split("/")[2]||"").toUpperCase();
 const packs={
  bg:{
   back:"НАЧАЛО",dirBack:"← ДЪРЖАВИ",sightings:"РЕГИСТРИРАНИ СЛУЧАИ",years:"ГОДИНИ СЪС СЛУЧАИ",regions:"РЕГИОНИ",
   choose:"ДЪРЖАВА",year:"ГОДИНА",region:"РЕГИОН",type:"ТИП",status:"СТАТУС",search:"ТЪРСЕНЕ",placeholder:"Търси по място или описание",
   results:"РЕГИСТЪР НА СЛУЧАИТЕ",report:"✦ ПОДАЙ НАБЛЮДЕНИЕ",notice:"Засега само локална чернова — публичното изпращане не е активно.",
   caveat:"Приблизителни райони, не точни траектории и лични адреси.",
   loading:"Зареждаме регистрираните случаи…",error:"Базата данни още не е свързана или временно не отговаря. Не показваме измислени числа.",
   empty:"Няма публикувани случаи за тези филтри.",more:"ПОКАЖИ ОЩЕ ↓",source:"ПЪРВИЧЕН ИЗТОЧНИК",
   approx:"Координатите са ориентир, а не потвърдена точка на наблюдение.",
   intro:n=>"Публичен архив за "+n+". Данните се зареждат от реалния регистър; демо случаите не се броят.",
   groups:"групи точки",published:"публикувани случая",openDossier:"ОТВОРИ ПЪЛНОТО ДОСИЕ ↗",openCase:"ОТВОРИ ДОСИЕТО ↗",
   histTitle:n=>"ИСТОРИЧЕСКИ СЛУЧАИ ОТ "+n.toUpperCase(),histCount:"Архивни досиета с източници: ",histEmpty:"Все още няма архивни случаи за тази държава.",histError:"Историческият архив временно не е достъпен."
  },
  en:{
   back:"HOME",dirBack:"← ALL COUNTRIES",sightings:"REGISTERED CASES",years:"YEARS WITH CASES",regions:"REGIONS",
   choose:"COUNTRY",year:"YEAR",region:"REGION",type:"TYPE",status:"STATUS",search:"SEARCH",placeholder:"Search place or description",
   results:"CASE REGISTER",report:"✦ REPORT A SIGHTING",notice:"Local draft only — submissions are not enabled.",
   caveat:"Approximate regions, not flight paths or personal addresses.",
   loading:"Loading registered cases…",error:"D1 is not connected or temporarily unavailable. No fabricated statistics are shown.",
   empty:"No published cases match these filters.",more:"LOAD MORE ↓",source:"ORIGINAL SOURCE",
   approx:"Coordinates are approximate anchors, not verified observation points.",
   intro:n=>"Public registry for "+n+". Counts come from D1; demonstration cases are excluded.",
   groups:"marker groups",published:"published cases",openDossier:"OPEN FULL DOSSIER ↗",openCase:"OPEN CASE DOSSIER ↗",
   histTitle:n=>"HISTORICAL CASES FROM "+n.toUpperCase(),histCount:"Source-linked archive cases: ",histEmpty:"No historical cases for this country yet.",histError:"Historical archive temporarily unavailable."
  },
  de:{
   back:"STARTSEITE",dirBack:"← ALLE LÄNDER",sightings:"REGISTRIERTE FÄLLE",years:"JAHRE MIT FÄLLEN",regions:"REGIONEN",
   choose:"LAND",year:"JAHR",region:"REGION",type:"TYP",status:"STATUS",search:"SUCHE",placeholder:"Ort oder Beschreibung suchen",
   results:"FALLREGISTER",report:"✦ BEOBACHTUNG MELDEN",notice:"Nur lokaler Entwurf — Übermittlung noch nicht aktiv.",
   caveat:"Ungefähre Regionen, keine Flugbahnen oder privaten Adressen.",
   loading:"Registrierte Fälle werden geladen…",error:"D1 ist noch nicht verbunden oder vorübergehend nicht erreichbar. Keine erfundenen Zahlen.",
   empty:"Keine veröffentlichten Fälle für diese Filter.",more:"MEHR ANZEIGEN ↓",source:"ORIGINALQUELLE",
   approx:"Koordinaten sind Näherungswerte, keine bestätigten Beobachtungspunkte.",
   intro:n=>"Öffentliches Register für "+n+". Zahlen stammen aus D1; Demonstrationsfälle sind ausgeschlossen.",
   groups:"Markierungsgruppen",published:"veröffentlichte Fälle",openDossier:"VOLLSTÄNDIGES DOSSIER ↗",openCase:"DOSSIER ÖFFNEN ↗",
   histTitle:n=>"HISTORISCHE FÄLLE AUS "+n.toUpperCase(),histCount:"Quellenbasierte Archivfälle: ",histEmpty:"Noch keine historischen Fälle für dieses Land.",histError:"Historisches Archiv vorübergehend nicht verfügbar."
  },
  ru:{
   back:"ГЛАВНАЯ",dirBack:"← ВСЕ СТРАНЫ",sightings:"ЗАРЕГИСТРИРОВАННЫЕ СЛУЧАИ",years:"ГОДЫ С НАБЛЮДЕНИЯМИ",regions:"РЕГИОНЫ",
   choose:"СТРАНА",year:"ГОД",region:"РЕГИОН",type:"ТИП",status:"СТАТУС",search:"ПОИСК",placeholder:"Поиск по месту или описанию",
   results:"РЕЕСТР СЛУЧАЕВ",report:"✦ СООБЩИТЬ О НАБЛЮДЕНИИ",notice:"Пока только локальный черновик — отправка не активна.",
   caveat:"Приблизительные районы, а не точные траектории или адреса.",
   loading:"Загрузка зарегистрированных случаев…",error:"База данных D1 не подключена или временно недоступна. Вымышленные числа не отображаются.",
   empty:"Нет опубликованных случаев для выбранных фильтров.",more:"ПОКАЗАТЬ ЕЩЁ ↓",source:"ПЕРВОИСТОЧНИК",
   approx:"Координаты являются ориентиром, а не подтверждённой точкой наблюдения.",
   intro:n=>"Публичный реестр для страны: "+n+". Данные из D1 без демонстрационных примеров.",
   groups:"групп маркеров",published:"опубликованных случаев",openDossier:"ОТКРЫТЬ ПОЛНОЕ ДОСЬЕ ↗",openCase:"ОТКРЫТЬ ДОСЬЕ ↗",
   histTitle:n=>"ИСТОРИЧЕСКИЕ СЛУЧАИ: "+n.toUpperCase(),histCount:"Архивных досье с источниками: ",histEmpty:"Пока нет исторических случаев для этой страны.",histError:"Исторический архив временно недоступен."
  },
  "zh-CN":{
   back:"首页",dirBack:"← 所有国家/地区",sightings:"登记案例",years:"有记录年份",regions:"地区",
   choose:"国家/地区",year:"年份",region:"地区",type:"类型",status:"状态",search:"搜索",placeholder:"按地点或描述搜索",
   results:"案例登记册",report:"✦ 提交观测报告",notice:"目前仅限本地草稿 — 公开提交尚未启用。",
   caveat:"显示大致区域，而非飞行轨迹或私人地址。",
   loading:"正在加载登记案例…",error:"D1 数据库尚未连接或暂时不可用，不显示虚构统计数据。",
   empty:"没有符合筛选条件的已发布案例。",more:"加载更多 ↓",source:"原始来源",
   approx:"坐标为大致参考锚点，而非经核实的观测点。",
   intro:n=>n+" 的公开登记库。数据来自 D1，不含演示案例。",
   groups:"标记组",published:"条已发布案例",openDossier:"打开完整档案 ↗",openCase:"打开案例档案 ↗",
   histTitle:n=>n+" 的历史案例",histCount:"有来源的历史档案：",histEmpty:"该国家/地区暂无历史案例。",histError:"历史档案暂时不可用。"
  },
  fr:{
   back:"ACCUEIL",dirBack:"← TOUS LES PAYS",sightings:"CAS ENREGISTRÉS",years:"ANNÉES AVEC CAS",regions:"RÉGIONS",
   choose:"PAYS",year:"ANNÉE",region:"RÉGION",type:"TYPE",status:"STATUT",search:"RECHERCHE",placeholder:"Rechercher lieu ou description",
   results:"REGISTRE DES CAS",report:"✦ SIGNALER UNE OBSERVATION",notice:"Brouillon local uniquement — l'envoi public est désactivé.",
   caveat:"Zones approximatives, pas de trajectoires exactes ni d'adresses privées.",
   loading:"Chargement des cas enregistrés…",error:"D1 n'est pas connecté ou est temporairement indisponible. Aucune statistique fictive.",
   empty:"Aucun cas publié ne correspond à ces filtres.",more:"AFFICHER PLUS ↓",source:"SOURCE ORIGINALE",
   approx:"Les coordonnées sont des repères approximatifs, non des points d'observation vérifiés.",
   intro:n=>"Registre public pour "+n+". Données issues de D1, hors cas de démonstration.",
   groups:"groupes de repères",published:"cas publiés",openDossier:"OUVRIR LE DOSSIER COMPLET ↗",openCase:"OUVRIR LE DOSSIER ↗",
   histTitle:n=>"CAS HISTORIQUES : "+n.toUpperCase(),histCount:"Dossiers d'archives sourcés : ",histEmpty:"Aucun cas historique pour ce pays pour le moment.",histError:"Archives historiques temporairement indisponibles."
  },
  es:{
   back:"INICIO",dirBack:"← TODOS LOS PAÍSES",sightings:"CASOS REGISTRADOS",years:"AÑOS CON CASOS",regions:"REGIONES",
   choose:"PAÍS",year:"AÑO",region:"REGIÓN",type:"TIPO",status:"ESTADO",search:"BUSCAR",placeholder:"Buscar por lugar o descripción",
   results:"REGISTRO DE CASOS",report:"✦ INFORMAR AVISTAMIENTO",notice:"Solo borrador local — el envío público no está activo.",
   caveat:"Regiones aproximadas, no trayectorias ni direcciones personales.",
   loading:"Cargando casos registrados…",error:"D1 no está conectado o no responde temporalmente. No se muestran estadísticas inventadas.",
   empty:"Ningún caso publicado coincide con estos filtros.",more:"MOSTRAR MÁS ↓",source:"FUENTE ORIGINAL",
   approx:"Las coordenadas son referencias aproximadas, no puntos verificados.",
   intro:n=>"Registro público para "+n+". Los recuentos provienen de D1; se excluyen los casos de demostración.",
   groups:"grupos de marcadores",published:"casos publicados",openDossier:"ABRIR EXPEDIENTE COMPLETO ↗",openCase:"ABRIR EXPEDIENTE ↗",
   histTitle:n=>"CASOS HISTÓRICOS DE "+n.toUpperCase(),histCount:"Casos de archivo con fuentes: ",histEmpty:"Aún no hay casos históricos para este país.",histError:"Archivo histórico temporalmente no disponible."
  },
  it:{
   back:"HOME",dirBack:"← TUTTI I PAESI",sightings:"CASI REGISTRATI",years:"ANNI CON CASI",regions:"REGIONI",
   choose:"PAESE",year:"ANNO",region:"REGIONE",type:"TIPO",status:"STATO",search:"CERCA",placeholder:"Cerca luogo o descrizione",
   results:"REGISTRO DEI CASI",report:"✦ SEGNALA OSSERVAZIONE",notice:"Solo bozza locale — l'invio pubblico non è attivo.",
   caveat:"Regioni approssimative, non traiettorie o indirizzi privati.",
   loading:"Caricamento dei casi registrati…",error:"D1 non è connesso o è temporaneamente non disponibile. Nessuna statistica inventata.",
   empty:"Nessun caso pubblicato corrisponde a questi filtri.",more:"MOSTRA ALTRO ↓",source:"FONTE ORIGINALE",
   approx:"Le coordinate sono riferimenti approssimativi, non punti verificati.",
   intro:n=>"Registro pubblico per "+n+". I conteggi provengono da D1; i casi dimostrativi sono esclusi.",
   groups:"gruppi di indicatori",published:"casi pubblicati",openDossier:"APRI DOSSIER COMPLETO ↗",openCase:"APRI DOSSIER ↗",
   histTitle:n=>"CASI STORICI DA "+n.toUpperCase(),histCount:"Casi d'archivio con fonti: ",histEmpty:"Nessun caso storico per questo paese al momento.",histError:"Archivio storico temporaneamente non disponibile."
  },
  pt:{
   back:"INÍCIO",dirBack:"← TODOS OS PAÍSES",sightings:"CASOS REGISTADOS",years:"ANOS COM CASOS",regions:"REGIÕES",
   choose:"PAÍS",year:"ANO",region:"REGIÃO",type:"TIPO",status:"ESTADO",search:"PESQUISAR",placeholder:"Pesquisar local ou descrição",
   results:"REGISTO DE CASOS",report:"✦ RELATAR OBSERVAÇÃO",notice:"Apenas rascunho local — o envio público não está ativo.",
   caveat:"Regiões aproximadas, não trajetórias ou endereços pessoais.",
   loading:"A carregar casos registados…",error:"O D1 não está ligado ou está temporariamente indisponível. Nenhuma estatística inventada é exibida.",
   empty:"Nenhum caso publicado corresponde a estes filtros.",more:"MOSTRAR MAIS ↓",source:"FONTE ORIGINAL",
   approx:"As coordenadas são referências aproximadas, não pontos verificados.",
   intro:n=>"Registo público para "+n+". As contagens vêm do D1; casos de demonstração são excluídos.",
   groups:"grupos de marcadores",published:"casos publicados",openDossier:"ABRIR DOSSIÊ COMPLETO ↗",openCase:"ABRIR DOSSIÊ ↗",
   histTitle:n=>"CASOS HISTÓRICOS DE "+n.toUpperCase(),histCount:"Casos de arquivo com fontes: ",histEmpty:"Ainda não há casos históricos para este país.",histError:"Arquivo histórico temporariamente indisponível."
  },
  tr:{
   back:"ANA SAYFA",dirBack:"← TÜM ÜLKELER",sightings:"KAYITLI VAKALAR",years:"VAKA YILLARI",regions:"BÖLGELER",
   choose:"ÜLKE",year:"YIL",region:"BÖLGE",type:"TÜR",status:"DURUM",search:"ARA",placeholder:"Yer veya açıklama ara",
   results:"VAKA KAYDI",report:"✦ GÖZLEM BİLDİR",notice:"Yalnızca yerel taslak — açık gönderim etkin değil.",
   caveat:"Yaklaşık bölgeler gösterilir; uçuş rotaları veya kişisel adresler değil.",
   loading:"Kayıtlı vakalar yükleniyor…",error:"D1 bağlı değil veya geçici olarak kullanılamıyor. Kurgusal istatistik gösterilmez.",
   empty:"Bu filtrelerle eşleşen yayımlanmış vaka yok.",more:"DAHA FAZLA ↓",source:"ÖZGÜN KAYNAK",
   approx:"Koordinatlar doğrulanmış noktalar değil, yaklaşık referanslardır.",
   intro:n=>n+" için açık kayıt. Sayılar D1'den gelir; demo vakalar hariçtir.",
   groups:"işaret grubu",published:"yayımlanmış vaka",openDossier:"TAM DOSYAYI AÇ ↗",openCase:"DOSYAYI AÇ ↗",
   histTitle:n=>n.toUpperCase()+" TARİHÎ VAKALARI",histCount:"Kaynak bağlantılı arşiv vakaları: ",histEmpty:"Bu ülke için henüz tarihî vaka yok.",histError:"Tarihî arşiv geçici olarak kullanılamıyor."
  },
  ro:{
   back:"ACASĂ",dirBack:"← TOATE ȚĂRILE",sightings:"CAZURI ÎNREGISTRATE",years:"ANI CU CAZURI",regions:"REGIUNI",
   choose:"ȚARĂ",year:"AN",region:"REGIUNE",type:"TIP",status:"STATUT",search:"CĂUTARE",placeholder:"Caută loc sau descriere",
   results:"REGISTRUL CAZURILOR",report:"✦ RAPORTEAZĂ OBSERVAȚIE",notice:"Doar ciornă locală — trimiterea publică nu este activă.",
   caveat:"Regiuni aproximative, nu traiectorii sau adrese personale.",
   loading:"Se încarcă cazurile înregistrate…",error:"D1 nu este conectat sau este temporar indisponibil. Nu afișăm statistici inventate.",
   empty:"Niciun caz publicat nu corespunde acestor filtre.",more:"ARATĂ MAI MULTE ↓",source:"SURSA ORIGINALĂ",
   approx:"Coordonatele sunt repere aproximative, nu puncte verificate.",
   intro:n=>"Registru public pentru "+n+". Datele provin din D1; cazurile demonstrative sunt excluse.",
   groups:"grupuri de marcaje",published:"cazuri publicate",openDossier:"DESCHIDE DOSARUL COMPLET ↗",openCase:"DESCHIDE DOSARUL ↗",
   histTitle:n=>"CAZURI ISTORICE DIN "+n.toUpperCase(),histCount:"Cazuri de arhivă cu surse: ",histEmpty:"Nu există încă cazuri istorice pentru această țară.",histError:"Arhiva istorică este temporar indisponibilă."
  },
  el:{
   back:"ΑΡΧΙΚΗ",dirBack:"← ΟΛΕΣ ΟΙ ΧΩΡΕΣ",sightings:"ΚΑΤΑΓΕΓΡΑΜΜΕΝΕΣ ΠΕΡΙΠΤΩΣΕΙΣ",years:"ΕΤΗ ΜΕ ΠΕΡΙΠΤΩΣΕΙΣ",regions:"ΠΕΡΙΟΧΕΣ",
   choose:"ΧΩΡΑ",year:"ΕΤΟΣ",region:"ΠΕΡΙΟΧΗ",type:"ΤΥΠΟΣ",status:"ΚΑΤΑΣΤΑΣΗ",search:"ΑΝΑΖΗΤΗΣΗ",placeholder:"Αναζήτηση τοποθεσίας ή περιγραφής",
   results:"ΜΗΤΡΩΟ ΠΕΡΙΠΤΩΣΕΩΝ",report:"✦ ΑΝΑΦΟΡΑ ΠΑΡΑΤΗΡΗΣΗΣ",notice:"Μόνο τοπικό πρόχειρο — η δημόσια υποβολή δεν είναι ενεργή.",
   caveat:"Προσεγγιστικές περιοχές, όχι τροχιές ή προσωπικές διευθύνσεις.",
   loading:"Φόρτωση καταγεγραμμένων περιπτώσεων…",error:"Το D1 δεν είναι συνδεδεμένο ή είναι προσωρινά μη διαθέσιμο.",
   empty:"Καμία δημοσιευμένη περίπτωση δεν ταιριάζει με αυτά τα φίλτρα.",more:"ΠΕΡΙΣΣΟΤΕΡΑ ↓",source:"ΠΡΩΤΟΤΥΠΗ ΠΗΓΗ",
   approx:"Οι συντεταγμένες είναι προσεγγιστικές ενδείξεις.",
   intro:n=>"Δημόσιο μητρώο για "+n+". Τα στοιχεία προέρχονται από το D1.",
   groups:"ομάδες δεικτών",published:"δημοσιευμένες περιπτώσεις",openDossier:"ΑΝΟΙΓΜΑ ΠΛΗΡΟΥΣ ΦΑΚΕΛΟΥ ↗",openCase:"ΑΝΟΙΓΜΑ ΦΑΚΕΛΟΥ ↗",
   histTitle:n=>"ΙΣΤΟΡΙΚΕΣ ΠΕΡΙΠΤΩΣΕΙΣ: "+n.toUpperCase(),histCount:"Υποθέσεις αρχείου με πηγές: ",histEmpty:"Δεν υπάρχουν ακόμη ιστορικές περιπτώσεις για αυτή τη χώρα.",histError:"Το ιστορικό αρχείο είναι προσωρινά μη διαθέσιμο."
  },
  sr:{
   back:"ПОЧЕТНА",dirBack:"← СВЕ ДРЖАВЕ",sightings:"РЕГИСТРОВАНИ СЛУЧАЈЕВИ",years:"ГОДИНЕ СА СЛУЧАЈЕВИМА",regions:"РЕГИОНИ",
   choose:"ДРЖАВА",year:"ГОДИНА",region:"РЕГИОН",type:"ТИП",status:"СТАТУС",search:"ПРЕТРАГА",placeholder:"Претражи место или опис",
   results:"РЕГИСТАР СЛУЧАЈЕВА",report:"✦ ПРИЈАВИ ЗАПАЖАЊЕ",notice:"Само локални нацрт — јавно слање није активно.",
   caveat:"Приближни региони, не путање лета или личне адресе.",
   loading:"Учитавање регистрованих случајева…",error:"D1 није повезан или је привремено недоступан. Не приказујемо измишљене статистике.",
   empty:"Нема објављених случајева за ове филтере.",more:"ПРИКАЖИ ЈОШ ↓",source:"ИЗВОРНИ ИЗВОР",
   approx:"Координате су оквирне тачке, а не потврђена места посматрања.",
   intro:n=>"Јавни регистар за: "+n+". Подаци долазе из D1; демо случајеви су искључени.",
   groups:"групе маркера",published:"објављених случајева",openDossier:"ОТВОРИ ЦЕО ДОСИЈЕ ↗",openCase:"ОТВОРИ ДОСИЈЕ ↗",
   histTitle:n=>"ИСТОРИЈСКИ СЛУЧАЈЕВИ: "+n.toUpperCase(),histCount:"Архивски случајеви са изворима: ",histEmpty:"Још нема историјских случајева за ову државу.",histError:"Историјски архив је привремено недоступан."
  },
  uk:{
   back:"ГОЛОВНА",dirBack:"← УСІ КРАЇНИ",sightings:"ЗАРЕЄСТРОВАНІ ВИПАДКИ",years:"РОКИ З ВИПАДКАМИ",regions:"РЕГІОНИ",
   choose:"КРАЇНА",year:"РІК",region:"РЕГІОН",type:"ТИП",status:"СТАТУС",search:"ПОШУК",placeholder:"Пошук за місцем або описом",
   results:"РЕЄСТР ВИПАДКІВ",report:"✦ ПОВІДОМИТИ ПРО СПОСТЕРЕЖЕННЯ",notice:"Лише локальна чернетка — публічне надсилання не активне.",
   caveat:"Приблизні райони, а не траєкторії чи особисті адреси.",
   loading:"Завантаження зареєстрованих випадків…",error:"D1 не підключено або тимчасово недоступно. Вигадана статистика не показується.",
   empty:"Немає опублікованих випадків за цими фільтрами.",more:"ПОКАЗАТИ ЩЕ ↓",source:"ПЕРШОДЖЕРЕЛО",
   approx:"Координати є орієнтиром, а не підтвердженою точкою спостереження.",
   intro:n=>"Публічний реєстр для країни: "+n+". Дані з D1 без демо-випадків.",
   groups:"груп маркерів",published:"опублікованих випадків",openDossier:"ВІДКРИТИ ПОВНЕ ДОСЬЄ ↗",openCase:"ВІДКРИТИ ДОСЬЄ ↗",
   histTitle:n=>"ІСТОРИЧНІ ВИПАДКИ: "+n.toUpperCase(),histCount:"Архівні справи з джерелами: ",histEmpty:"Для цієї країни ще немає історичних випадків.",histError:"Історичний архів тимчасово недоступний."
  },
  pl:{
   back:"STRONA GŁÓWNA",dirBack:"← WSZYSTKIE KRAJE",sightings:"ZAREJESTROWANE PRZYPADKI",years:"LATA Z PRZYPADKAMI",regions:"REGIONY",
   choose:"KRAJ",year:"ROK",region:"REGION",type:"TYP",status:"STATUS",search:"SZUKAJ",placeholder:"Szukaj miejsca lub opisu",
   results:"REJESTR PRZYPADKÓW",report:"✦ ZGŁOŚ OBSERWACJĘ",notice:"Tylko szkic lokalny — wysyłanie publiczne jest wyłączone.",
   caveat:"Przybliżone regiony, nie trasy przelotu ani prywatne adresy.",
   loading:"Ładowanie zarejestrowanych przypadków…",error:"Baza D1 nie jest połączona lub jest chwilowo niedostępna. Nie pokazujemy fikcyjnych statystyk.",
   empty:"Brak opublikowanych przypadków dla tych filtrów.",more:"POKAŻ WIĘCEJ ↓",source:"ŹRÓDŁO ORYGINALNE",
   approx:"Współrzędne są przybliżone, nie stanowią potwierdzonych punktów obserwacji.",
   intro:n=>"Publiczny rejestr dla kraju "+n+". Liczby pochodzą z D1; przypadki demonstracyjne są wykluczone.",
   groups:"grup znaczników",published:"opublikowanych przypadków",openDossier:"OTWÓRZ PEŁNE DOSSIER ↗",openCase:"OTWÓRZ DOSSIER ↗",
   histTitle:n=>"PRZYPADKI HISTORYCZNE: "+n.toUpperCase(),histCount:"Sprawy archiwalne ze źródłami: ",histEmpty:"Brak przypadków historycznych dla tego kraju.",histError:"Archiwum historyczne chwilowo niedostępne."
  },
  ar:{
   back:"الرئيسية",dirBack:"← جميع الدول",sightings:"الحالات المسجلة",years:"السنوات المسجلة",regions:"المناطق",
   choose:"الدولة",year:"السنة",region:"المنطقة",type:"النوع",status:"الحالة",search:"بحث",placeholder:"ابحث حسب المكان أو الوصف",
   results:"سجل الحالات",report:"✦ أبلغ عن مشاهدة",notice:"مسودة محلية فقط — الإرسال العام غير مفعل.",
   caveat:"مناطق تقريبية، وليست مسارات طيران أو عناوين شخصية.",
   loading:"جارٍ تحميل الحالات المسجلة…",error:"قاعدة بيانات D1 غير متصلة أو غير متاحة مؤقتاً. لا يتم عرض إحصاءات مختلقة.",
   empty:"لا توجد حالات منشورة تطابق عوامل التصفية.",more:"عرض المزيد ↓",source:"المصدر الأصلي",
   approx:"الإحداثيات تقريبية وليست نقاط رصد مؤكدة.",
   intro:n=>"السجل العام لـ "+n+". الأرقام من D1 مع استبعاد الحالات التجريبية.",
   groups:"مجموعات علامات",published:"حالات منشورة",openDossier:"افتح الملف الكامل ↗",openCase:"افتح ملف الحالة ↗",
   histTitle:n=>"الحالات التاريخية من "+n,histCount:"حالات الأرشيف الموثقة بالمصادر: ",histEmpty:"لا توجد حالات تاريخية لهذه الدولة حتى الآن.",histError:"الأرشيف التاريخي غير متاح مؤقتاً."
  },
  ja:{
   back:"ホーム",dirBack:"← すべての国",sightings:"登録事例数",years:"記録のある年",regions:"地域",
   choose:"国",year:"年",region:"地域",type:"種別",status:"評価",search:"検索",placeholder:"場所や説明で検索",
   results:"事例レジストリ",report:"✦ 目撃情報を報告",notice:"ローカル下書きのみ — 公開送信は有効化されていません。",
   caveat:"概略の地域を示しており、正確な飛行経路や個人住所ではありません。",
   loading:"登録された事例を読み込み中…",error:"D1 データベースが未接続または一時的に利用できません。架空の統計は表示されません。",
   empty:"条件に一致する公開事例はありません。",more:"さらに表示 ↓",source:"元の出典",
   approx:"座標は概略の目安であり、確認された観測地点ではありません。",
   intro:n=>n+" の公開レジストリ。数値は D1 に基づき、デモ事例は除外されています。",
   groups:"マーカーグループ",published:"件の公開事例",openDossier:"完全な資料を開く ↗",openCase:"事例ファイルを開く ↗",
   histTitle:n=>n+" の歴史的事例",histCount:"出典付きアーカイブ事例: ",histEmpty:"この国の歴史的事例はまだありません。",histError:"歴史アーカイブは一時的に利用できません。"
  },
  ko:{
   back:"홈",dirBack:"← 모든 국가",sightings:"등록된 사례",years:"기록 연도",regions:"지역",
   choose:"국가",year:"연도",region:"지역",type:"유형",status:"상태",search:"검색",placeholder:"장소 또는 설명 검색",
   results:"사례 레지스트리",report:"✦ 관측 제보하기",notice:"로컬 초안 전용 — 공개 제출은 비활성화되어 있습니다.",
   caveat:"대략적인 지역을 나타내며 비행 경로나 개인 주소가 아닙니다.",
   loading:"등록된 사례 불러오는 중…",error:"D1 데이터베이스가 연결되지 않았거나 일시적으로 사용할 수 없습니다. 임의의 통계를 표시하지 않습니다.",
   empty:"필터와 일치하는 게시된 사례가 없습니다.",more:"더 보기 ↓",source:"원본 출처",
   approx:"좌표는 대략적인 기준점이며 검증된 관측 지점이 아닙니다.",
   intro:n=>n+" 공개 레지스트리. 수치는 D1에서 제공되며 데모 사례는 제외됩니다.",
   groups:"마커 그룹",published:"건의 게시된 사례",openDossier:"전체 파일 열기 ↗",openCase:"사례 파일 열기 ↗",
   histTitle:n=>n+"의 역사적 사례",histCount:"출처 연결 아카이브 사례: ",histEmpty:"아직 이 국가의 역사적 사례가 없습니다.",histError:"역사 아카이브를 일시적으로 사용할 수 없습니다."
  }
 };
 let language=(()=>{try{return localStorage.getItem("aurora-lang")||"bg"}catch{return "bg"}})();
 if(!packs[language])language="bg";
 document.documentElement.lang=language;
 const getLocale=()=>language==="zh-CN"?"zh-Hans":language;
 const isBg=()=>language==="bg";
 const pack=()=>packs[language]||packs.en;
 const label=key=>pack()[key]||packs.en[key];
 if(!/^[A-Z]{2}$/.test(code)||!names.includes(code)){status.textContent="Invalid ISO country code";status.classList.add("error");return}
 function displayNames(){
  const loc=getLocale();
  try{return new Intl.DisplayNames([loc,"en"],{type:"region"})}catch{return new Intl.DisplayNames(["en"],{type:"region"})}
 }
 let countryName=code;
 const choose=el("chooseCountry");
 function applyStatic(){
  const d=displayNames(),p=pack(),bg=isBg();
  countryName=d.of(code)||code;
  document.title="AURORA — "+countryName+" | Country Explorer";
  el("countryCode").textContent=code;el("countryName").textContent=countryName;
  el("countryIntro").textContent=p.intro(countryName);
  el("backLabel").textContent=p.back;
  const dirLink=document.querySelector(".directory-back a");
  if(dirLink)dirLink.textContent=p.dirBack;
  el("sightingsLabel").textContent=p.sightings;
  el("yearsLabel").textContent=p.years;
  el("regionsLabel").textContent=p.regions;
  el("chooseCountryLabel").textContent=p.choose;
  el("yearLabel").textContent=p.year;
  el("regionLabel").textContent=p.region;
  el("typeLabel").textContent=p.type;
  el("statusLabel").textContent=p.status;
  el("searchLabel").textContent=p.search;
  el("resultsHeading").textContent=p.results;
  el("reportLabel").textContent=p.report;
  el("reportNotice").textContent=p.notice;
  el("mapCaveat").textContent=p.caveat;
  el("reportLink").href="/report.html?country="+code;
  el("caseSearch").placeholder=p.placeholder;
  choose.replaceChildren();
  for(const c of names){
   const option=document.createElement("option");option.value=c;option.textContent=d.of(c)||c;
   choose.append(option);
  }
  choose.value=code;
  // The country template shares five full and thirteen preview locales with the landing
  // page; on preview locales, English is the explicit fallback, not stray Bulgarian labels.
  if(!bg){
   for(const id of ["yearFilter","regionFilter"]){const o=el(id).querySelector('option[value=""]');if(o)o.textContent="All"}
   const categories={"":"All","lights":"Lights","object":"Objects","instrument":"Instrument recording","other":"Other"};
   for(const option of el("typeFilter").options)option.textContent=categories[option.value]||option.textContent;
   const assessments={"":"All assessments","resolved":"Resolved","unresolved":"Unresolved","undetermined":"No conclusion","disputed":"Disputed"};
   for(const option of el("statusFilter").options)option.textContent=assessments[option.value]||option.textContent;
   document.querySelector(".skip").textContent="Skip to content";
  }else{
   for(const id of ["yearFilter","regionFilter"]){const o=el(id).querySelector('option[value=""]');if(o)o.textContent="Всички"}
   const categories={"":"Всички","lights":"Светлини","object":"Обекти","instrument":"Инструментален запис","other":"Други"};
   for(const option of el("typeFilter").options)option.textContent=categories[option.value]||option.textContent;
   const assessments={"":"Всички оценки","resolved":"Обяснен","unresolved":"Необяснен","undetermined":"Без заключение","disputed":"Оспорван"};
   for(const option of el("statusFilter").options)option.textContent=assessments[option.value]||option.textContent;
   document.querySelector(".skip").textContent="Към съдържанието";
  }
 }
 applyStatic();
 choose.addEventListener("change",()=>{location.href="/countries/"+encodeURIComponent(choose.value)});

 let land=[],entries=[],page=0,total=0,requestToken=0,controller=null,loadMoreBusy=false,feedbackState="loading";
 const PAGE=30;
 const canvas=el("countryMap"),ctx=canvas.getContext("2d");
 function paint(){
  if(!ctx)return;
  ctx.clearRect(0,0,1000,480);
  const gradient=ctx.createLinearGradient(0,0,0,480);gradient.addColorStop(0,"#05202a");gradient.addColorStop(1,"#05121d");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,1000,480);
  ctx.strokeStyle="#29617455";ctx.lineWidth=1;
  for(let i=0;i<=1000;i+=50){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,480);ctx.stroke()}
  for(let i=0;i<=480;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(1000,i);ctx.stroke()}
  ctx.fillStyle="#164851";ctx.strokeStyle="#428f8e7e";ctx.lineWidth=.6;
  for(const poly of land){
   if(poly.length<3)continue;
   ctx.beginPath();let last=null,started=false;
   for(const [lng,lat] of poly){
    const x=(lng+180)/360*1000,y=(90-lat)/180*480;
    if(last!==null&&Math.abs(x-last)>500){ctx.fill();ctx.stroke();ctx.beginPath();started=false}
    if(!started){ctx.moveTo(x,y);started=true}else ctx.lineTo(x,y);
    last=x;
   }
   if(started){ctx.fill();ctx.stroke()}
  }
 }
 const pinHolder=el("mapPoints");
 function renderPins(){
  pinHolder.replaceChildren();
  pinHolder.style.top=canvas.offsetTop+"px";
  pinHolder.style.left=canvas.offsetLeft+"px";
  pinHolder.style.width=canvas.clientWidth+"px";
  pinHolder.style.height=canvas.clientHeight+"px";
  pinHolder.style.right="auto";pinHolder.style.bottom="auto";
  const clusters=new Map();
  for(const item of entries){
   if(!Number.isFinite(item.latitude)||!Number.isFinite(item.longitude))continue;
   const cell=Math.round(item.latitude/5)+":"+Math.round(item.longitude/5);
   const cluster=clusters.get(cell)||{lat:0,lng:0,items:[]};cluster.lat+=item.latitude;cluster.lng+=item.longitude;cluster.items.push(item);
   clusters.set(cell,cluster);
  }
  for(const cluster of clusters.values()){
   const lat=cluster.lat/cluster.items.length,lng=cluster.lng/cluster.items.length;
   const pin=document.createElement("button");pin.type="button";pin.className="map-point";
   pin.style.left=((lng+180)/360*100)+"%";pin.style.top=((90-lat)/180*100)+"%";
   pin.textContent=cluster.items.length>1?String(cluster.items.length):"";
   pin.title=cluster.items.map(x=>x.title[language]||x.title.en).slice(0,3).join(", ");
   pin.setAttribute("aria-label",pin.title);
   pin.addEventListener("click",()=>document.getElementById("case-"+cluster.items[0].id)?.focus());
   pinHolder.append(pin);
  }
  el("visibleMapCount").textContent=pinHolder.children.length+" "+label("groups");
 }
 function formatCase(x){
  const bg=isBg();
  const wrap=document.createElement("div");
  const button=document.createElement("button");button.type="button";button.className="case-card";button.id="case-"+x.id;
  button.setAttribute("aria-expanded","false");
  const top=document.createElement("span");top.className="case-top";top.textContent=x.date+" · "+(x.region||x.location)+" · "+(x.assessment_status==="resolved"?(bg?"ОБЯСНЕН СПОРЕД ИЗТОЧНИКА":"ASSESSED RESOLVED"):(bg?"ОЦЕНКА: ":"ASSESSMENT: ")+String(x.assessment_status||"undetermined").toUpperCase());
  const title=document.createElement("strong");title.className="case-title";title.textContent=x.title[language]||x.title.en;
  const excerpt=document.createElement("span");excerpt.className="case-excerpt";excerpt.textContent=(x.summary[language]||x.summary.en).slice(0,165)+"…";
  button.append(top,title,excerpt);
  const details=document.createElement("div");details.className="case-details";details.hidden=true;
  const p=document.createElement("p");p.textContent=x.summary[language]||x.summary.en;
  const precision=document.createElement("p");precision.textContent=label("approx")+" "+x.location_precision;
  details.append(p,precision);
  const dossierLink=document.createElement("a");dossierLink.href="/cases/"+encodeURIComponent(x.id);
  dossierLink.className="case-dossier-link";
  dossierLink.textContent=label("openDossier");
  details.append(dossierLink);
  if(x.assessment_authority){const finding=document.createElement("p");finding.textContent=(bg?"Оценка: ":"Assessment: ")+x.assessment_authority+" · "+x.assessment_status+" ("+x.assessment_confidence+")";details.append(finding)}
  if(x.media?.length){const media=document.createElement("p");media.textContent=bg?"Медийни материали с потвърдени права:":"Rights-verified media:";details.append(media)}
  try{
   const u=new URL(x.source_url);
   if(u.protocol==="https:"){
    const link=document.createElement("a");link.href=u.href;link.target="_blank";link.rel="noopener noreferrer";
    link.textContent=label("source")+": "+x.source_name+" ↗";details.append(link);
   }
  }catch{}
  button.addEventListener("click",()=>{
   const visible=details.hidden;details.hidden=!visible;button.setAttribute("aria-expanded",String(visible));
  });
  wrap.append(button,details);
  return wrap;
 }
 function queryParams(requestedPage){
  const p=new URLSearchParams({country:code,limit:String(PAGE),offset:String(requestedPage*PAGE)});
  const val=[["yearFilter","year"],["regionFilter","region"],["typeFilter","type"],["statusFilter","assessment"],["caseSearch","q"]];
  for(const [id,key] of val){const value=el(id).value.trim();if(value)p.set(key,value)}
  return p;
 }
 async function api(path,signal){
  const resp=await fetch(path,{headers:{accept:"application/json"},cache:"no-store",...(signal?{signal}:{})});
  if(!resp.ok)throw Error("HTTP "+resp.status);
  return resp.json();
 }
 async function load(reset=true){
  // A new filter selection must win even when an older network request finishes later.
  if(!reset&&loadMoreBusy)return;
  const token=reset?++requestToken:requestToken;
  if(reset){
   controller?.abort();controller=new AbortController();
   page=0;entries=[];el("countryCases").replaceChildren();
  }
  if(!controller)controller=new AbortController();
  const requestedPage=reset?0:page+1;
  loadMoreBusy=true;
  el("loadMore").disabled=true;
  status.classList.remove("error");
  feedbackState="loading";status.textContent=label("loading");
  try{
   const response=await api("/api/cases?"+queryParams(requestedPage),controller.signal);
   if(token!==requestToken)return;
   if(!Array.isArray(response.cases)||!Number.isInteger(response.total))throw Error("Invalid API response");
   page=requestedPage;
   total=response.total;
   entries.push(...response.cases);
   for(const item of response.cases)el("countryCases").append(formatCase(item));
   renderPins();
   feedbackState=total===0?"empty":"ready";
   status.textContent=total===0?label("empty"):total+" "+label("published")+" · "+countryName;
   el("loadMore").hidden=!response.has_more;
   el("loadMore").textContent=label("more");
  }catch(error){
   if(token!==requestToken||error.name==="AbortError")return;
   feedbackState="error";status.classList.add("error");status.textContent=label("error");
   el("loadMore").hidden=true;
  }finally{
   if(token===requestToken){loadMoreBusy=false;el("loadMore").disabled=false}
  }
 }
 async function init(){
  const local=names.includes(code);
  if(!local)return;
  try{
   const [region,world]=await Promise.all([
    api("/api/countries/"+code),
    fetch("/data/earth-land.json").then(r=>r.ok?r.json():{polygons:[]})
   ]);
   land=world.polygons||[];paint();
   el("countryTotal").textContent=region.total;
   el("countryYears").textContent=region.years.length;
   el("countryRegions").textContent=region.regions.length;
   for(const item of region.years){const op=document.createElement("option");op.value=item.year;op.textContent=item.year+" ("+item.n+")";el("yearFilter").append(op)}
   for(const item of region.regions){const op=document.createElement("option");op.value=item.region;op.textContent=item.region+" ("+item.n+")";el("regionFilter").append(op)}
  }catch{
   feedbackState="error";status.classList.add("error");status.textContent=label("error");paint();
  }
  await load();
 }
 for(const id of ["yearFilter","regionFilter","typeFilter","statusFilter"])el(id).addEventListener("change",()=>load());
 let timer;
 el("caseSearch").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>load(),280)});
 el("loadMore").addEventListener("click",()=>load(false));
 window.addEventListener("resize",renderPins,{passive:true});
 // Historical dossiers do not depend on D1 activation or moderation and keep
 // their own provenance, separate from the protected registry statistics.
 let historyCases=[],historyError=false;
 function renderCountryHistory(){
  const host=el("countryHistoryGrid"),message=el("countryHistoryStatus"),bg=isBg();
  el("countryHistoryTitle").textContent=pack().histTitle(countryName);
  if(historyError){message.textContent=label("histError");return}
  host.replaceChildren();
  for(const c of historyCases){
   const a=document.createElement("a");a.className="country-history-card";a.href="/archive/"+encodeURIComponent(c.id);
   const img=document.createElement("img");img.loading="lazy";
   img.src=/^\/assets\/[a-z0-9-]+\.webp$/.test(c.visual?.src||"")?c.visual.src:"/assets/feature-cases.webp";
   img.alt=bg?"Художествена илюстрация, не оригинална снимка":"Thematic illustration, not original incident photography";
   const body=document.createElement("div");
   const meta=document.createElement("small");meta.textContent=c.date+" · "+c.source.name;
   const title=document.createElement("strong");title.textContent=c.title[language]||c.title.en;
   const p=document.createElement("p");p.textContent=c.summary[language]||c.summary.en;
   const more=document.createElement("span");more.textContent=label("openCase");
   body.append(meta,title,p,more);a.append(img,body);host.append(a);
  }
  message.textContent=historyCases.length?label("histCount")+historyCases.length:label("histEmpty");
 }
 async function loadCountryHistory(){
  try{
   const res=await fetch("/data/cases.json",{cache:"no-cache"});if(!res.ok)throw Error("Source archive unavailable");
   const data=await res.json();if(!Array.isArray(data.cases))throw Error("Invalid source data");
   const sourceCases=globalThis.AURORA_ARCHIVE?.prepareArchiveCases(data.cases)??data.cases;
   historyCases=sourceCases.filter(c=>c.country===code&&/^[a-z0-9-]{3,90}$/.test(c.id)&&c.title?.en&&c.summary?.en&&c.source?.url?.startsWith("https://"))
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
   historyError=false;
   renderCountryHistory();
  }catch{historyError=true;renderCountryHistory()}
 }
 window.addEventListener("aurora:language-changed",e=>{
  const next=e?.detail?.language||document.documentElement.lang||"bg";
  language=packs[next]?next:"en";
  applyStatic();
  el("countryCases").replaceChildren();
  for(const item of entries)el("countryCases").append(formatCase(item));
  renderPins();
  if(feedbackState==="ready")status.textContent=total+" "+label("published")+" · "+countryName;
  else if(feedbackState==="empty")status.textContent=label("empty");
  else if(feedbackState==="error")status.textContent=label("error");
  else status.textContent=label("loading");
  el("loadMore").textContent=label("more");
  renderCountryHistory();
 });
 init();
 loadCountryHistory();
})();
