/* AURORA country directory: only D1-approved public observations, never demo totals. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const packs={
  bg:{
   docTitle:"Държави",title:"НАБЛЮДЕНИЯ ПО ДЪРЖАВИ",intro:"Разгледай държавите с одобрени и публикувани записи. Данните идват от реалния публичен регистър, не от демонстрационните случаи.",
   home:"НАЧАЛО",cases:"ПУБЛИКУВАНИ НАБЛЮДЕНИЯ",countries:"ДЪРЖАВИ СЪС ЗАПИСИ",sync:"ПОСЛЕДНО ОБНОВЯВАНЕ",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ИЗБЕРИ ДЪРЖАВА",search:"ТЪРСИ ДЪРЖАВА",placeholder:"BG / България",loading:"Проверяваме публичния регистър…",
   offline:"Публичният регистър не е активен или е временно недостъпен. Затова не показваме измислени държави и бройки. Можеш да разгледаш отделния исторически архив.",
   empty:"Все още няма одобрени и публикувани записи в регистъра.",filtered:"Няма държави, които съответстват на търсенето.",
   archive:"Исторически архив с източници ↗",prepare:"Подготви сигнал (локална чернова) ↗",
   privacy:"Няма лични адреси, точни координати или непубликувани сигнали. DEMO записите са изключени.",
   listed:"Държави с публикувани записи: ",reports:"публикувани случая: ",
   histFiles:"АРХИВНИ ДОСИЕТА",histTitle:"ИСТОРИЧЕСКИ СЛУЧАИ ПО ДЪРЖАВИ",histListed:"Държави с исторически досиета: ",histOffline:"Архивът е временно недостъпен."
  },
  en:{
   docTitle:"Country Directory",title:"EXPLORE THE WORLD REGISTER",intro:"Explore countries with approved, published observations. Figures come only from the public registry, never from demonstration cases.",
   home:"HOME",cases:"PUBLISHED OBSERVATIONS",countries:"COUNTRIES WITH RECORDS",sync:"LAST SYNC",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"CHOOSE A COUNTRY",search:"SEARCH COUNTRIES",placeholder:"US / United States",loading:"Checking the public registry…",
   offline:"The public registry is offline or not yet active. We do not invent country counts. Explore the separate sourced historical archive instead.",
   empty:"There are no approved published records in the registry yet.",filtered:"No countries match your search.",
   archive:"Sourced historical archive ↗",prepare:"Prepare a report (local draft) ↗",
   privacy:"No private addresses, exact coordinates, unpublished observations or DEMO cases are displayed.",
   listed:"Countries with published records: ",reports:"published observations: ",
   histFiles:"HISTORICAL CASE FILES",histTitle:"HISTORICAL CASES BY COUNTRY",histListed:"Countries with historical case files: ",histOffline:"Archive temporarily unavailable."
  },
  de:{
   docTitle:"Länderverzeichnis",title:"BEOBACHTUNGEN NACH LÄNDERN",intro:"Entdecken Sie Länder mit geprüften und veröffentlichten Einträgen aus dem öffentlichen Register — ohne Demonstrationsfälle.",
   home:"STARTSEITE",cases:"VERÖFFENTLICHTE FÄLLE",countries:"LÄNDER MIT EINTRÄGEN",sync:"LETZTE AKTUALISIERUNG",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"LAND AUSWÄHLEN",search:"LAND SUCHEN",placeholder:"DE / Deutschland",loading:"Öffentliches Register wird geprüft…",
   offline:"Das öffentliche Register ist derzeit nicht aktiv. Es werden keine erfundenen Zahlen angezeigt. Nutzen Sie das historische Quellenarchiv.",
   empty:"Noch keine veröffentlichten Einträge im Register.",filtered:"Keine Länder entsprechen Ihrer Suche.",
   archive:"Historisches Quellenarchiv ↗",prepare:"Meldung vorbereiten (lokaler Entwurf) ↗",
   privacy:"Keine privaten Adressen, exakten Koordinaten oder unveröffentlichten Meldungen. DEMO-Fälle sind ausgeschlossen.",
   listed:"Länder mit veröffentlichten Einträgen: ",reports:"veröffentlichte Beobachtungen: ",
   histFiles:"HISTORISCHE DOSSIERS",histTitle:"HISTORISCHE FÄLLE NACH LÄNDERN",histListed:"Länder mit historischen Dossiers: ",histOffline:"Archiv vorübergehend nicht verfügbar."
  },
  ru:{
   docTitle:"Страны",title:"НАБЛЮДЕНИЯ ПО СТРАНАМ",intro:"Изучите страны с одобренными и опубликованными записями из публичного реестра без демонстрационных примеров.",
   home:"ГЛАВНАЯ",cases:"ОПУБЛИКОВАННЫЕ НАБЛЮДЕНИЯ",countries:"СТРАНЫ С ЗАПИСЯМИ",sync:"ПОСЛЕДНЕЕ ОБНОВЛЕНИЕ",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ВЫБЕРИТЕ СТРАНУ",search:"ПОИСК СТРАНЫ",placeholder:"US / США",loading:"Проверка публичного реестра…",
   offline:"Публичный реестр временно недоступен или ещё не активирован. Мы не показываем вымышленные числа. Доступен исторический архив с источниками.",
   empty:"В реестре пока нет опубликованных записей.",filtered:"Нет стран, соответствующих запросу.",
   archive:"Исторический архив с источниками ↗",prepare:"Подготовить сообщение (локальный черновик) ↗",
   privacy:"Личные адреса, точные координаты и неопубликованные сообщения не отображаются. DEMO-записи исключены.",
   listed:"Стран с опубликованными записями: ",reports:"опубликованных наблюдений: ",
   histFiles:"АРХИВНЫЕ ДОСЬЕ",histTitle:"ИСТОРИЧЕСКИЕ СЛУЧАИ ПО СТРАНАМ",histListed:"Стран с историческими досье: ",histOffline:"Архив временно недоступен."
  },
  "zh-CN":{
   docTitle:"国家/地区目录",title:"按国家/地区浏览观测记录",intro:"浏览拥有已审核公开观测记录的国家与地区。数据仅来自公共登记库，绝不包含演示案例。",
   home:"首页",cases:"已发布观测记录",countries:"有记录的国家/地区",sync:"最近同步",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"选择国家/地区",search:"搜索国家/地区",placeholder:"CN / 中国",loading:"正在检查公共登记库…",
   offline:"公共登记库暂未启用或暂时不可用。我们不会虚构统计数据，请浏览独立的来源历史档案。",
   empty:"登记库中暂无已审核发布的记录。",filtered:"没有匹配搜索条件的国家或地区。",
   archive:"有来源的历史档案 ↗",prepare:"准备报告（本地草稿） ↗",
   privacy:"不显示私人地址、精确坐标或未公开报告，不含演示数据。",
   listed:"有公开记录的国家/地区：",reports:"条已发布记录：",
   histFiles:"历史档案卷宗",histTitle:"按国家/地区分类的历史案例",histListed:"拥有历史档案的国家/地区：",histOffline:"历史档案暂时不可用。"
  },
  fr:{
   docTitle:"Répertoire des pays",title:"OBSERVATIONS PAR PAYS",intro:"Explorez les pays disposant d'observations publiées et vérifiées dans le registre public, hors cas de démonstration.",
   home:"ACCUEIL",cases:"OBSERVATIONS PUBLIÉES",countries:"PAYS AVEC DOSSIERS",sync:"DERNIÈRE SYNCHRONISATION",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"CHOISIR UN PAYS",search:"RECHERCHER UN PAYS",placeholder:"FR / France",loading:"Vérification du registre public…",
   offline:"Le registre public est hors ligne ou non activé. Aucun chiffre fictif n'est affiché. Consultez les archives historiques sourcées.",
   empty:"Aucun enregistrement publié dans le registre pour le moment.",filtered:"Aucun pays ne correspond à votre recherche.",
   archive:"Archives historiques sourcées ↗",prepare:"Préparer un signalement (brouillon local) ↗",
   privacy:"Aucune adresse privée, coordonnée exacte ou observation non publiée. Les cas DEMO sont exclus.",
   listed:"Pays avec dossiers publiés : ",reports:"observations publiées : ",
   histFiles:"DOSSIERS HISTORIQUES",histTitle:"CAS HISTORIQUES PAR PAYS",histListed:"Pays avec dossiers historiques : ",histOffline:"Archives temporairement indisponibles."
  },
  es:{
   docTitle:"Directorio de países",title:"OBSERVACIONES POR PAÍS",intro:"Explora los países con observaciones aprobadas y publicadas en el registro público, sin casos de demostración.",
   home:"INICIO",cases:"OBSERVACIONES PUBLICADAS",countries:"PAÍSES CON REGISTROS",sync:"ÚLTIMA SINCRONIZACIÓN",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ELEGIR UN PAÍS",search:"BUSCAR PAÍS",placeholder:"ES / España",loading:"Comprobando el registro público…",
   offline:"El registro público no está activo o no responde temporalmente. No inventamos cifras. Explora el archivo histórico con fuentes.",
   empty:"Todavía no hay registros aprobados en el registro público.",filtered:"Ningún país coincide con tu búsqueda.",
   archive:"Archivo histórico con fuentes ↗",prepare:"Preparar informe (borrador local) ↗",
   privacy:"No se muestran direcciones privadas, coordenadas exactas ni informes no publicados. Casos DEMO excluidos.",
   listed:"Países con registros publicados: ",reports:"observaciones publicadas: ",
   histFiles:"EXPEDIENTES HISTÓRICOS",histTitle:"CASOS HISTÓRICOS POR PAÍS",histListed:"Países con expedientes históricos: ",histOffline:"Archivo temporalmente no disponible."
  },
  it:{
   docTitle:"Elenco dei paesi",title:"OSSERVAZIONI PER PAESE",intro:"Esplora i paesi con osservazioni approvate e pubblicate nel registro pubblico, esclusi i casi dimostrativi.",
   home:"HOME",cases:"OSSERVAZIONI PUBBLICATE",countries:"PAESI CON REGISTRAZIONI",sync:"ULTIMO AGGIORNAMENTO",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"SCEGLI UN PAESE",search:"CERCA PAESE",placeholder:"IT / Italia",loading:"Verifica del registro pubblico…",
   offline:"Il registro pubblico non è attivo o è temporaneamente non disponibile. Non mostriamo conteggi fittizi. Esplora l'archivio storico con fonti.",
   empty:"Non ci sono ancora record pubblicati nel registro.",filtered:"Nessun paese corrisponde alla ricerca.",
   archive:"Archivio storico con fonti ↗",prepare:"Prepara segnalazione (bozza locale) ↗",
   privacy:"Nessun indirizzo privato, coordinata esatta o segnalazione non pubblicata. Casi DEMO esclusi.",
   listed:"Paesi con record pubblicati: ",reports:"osservazioni pubblicate: ",
   histFiles:"DOSSIER STORICI",histTitle:"CASI STORICI PER PAESE",histListed:"Paesi con dossier storici: ",histOffline:"Archivio temporaneamente non disponibile."
  },
  pt:{
   docTitle:"Diretório de países",title:"OBSERVAÇÕES POR PAÍS",intro:"Explore os países com observações aprovadas e publicadas no registo público, sem casos de demonstração.",
   home:"INÍCIO",cases:"OBSERVAÇÕES PUBLICADAS",countries:"PAÍSES COM REGISTOS",sync:"ÚLTIMA SINCRONIZAÇÃO",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ESCOLHER PAÍS",search:"PESQUISAR PAÍS",placeholder:"PT / Portugal",loading:"A verificar o registo público…",
   offline:"O registo público está offline ou ainda não foi ativado. Não inventamos contagens. Explore o arquivo histórico com fontes.",
   empty:"Ainda não existem registos publicados.",filtered:"Nenhum país corresponde à pesquisa.",
   archive:"Arquivo histórico com fontes ↗",prepare:"Preparar relato (rascunho local) ↗",
   privacy:"Não são exibidos endereços privados, coordenadas exatas ou relatos não publicados. Casos DEMO excluídos.",
   listed:"Países com registos publicados: ",reports:"observações publicadas: ",
   histFiles:"DOSSIÊS HISTÓRICOS",histTitle:"CASOS HISTÓRICOS POR PAÍS",histListed:"Países com dossiês históricos: ",histOffline:"Arquivo temporariamente indisponível."
  },
  tr:{
   docTitle:"Ülke Dizini",title:"ÜLKELERE GÖRE GÖZLEMLER",intro:"Onaylanmış ve yayımlanmış gözlemlere sahip ülkeleri inceleyin. Veriler yalnızca açık kayıttan gelir.",
   home:"ANA SAYFA",cases:"YAYIMLANAN GÖZLEMLER",countries:"KAYITLI ÜLKELER",sync:"SON GÜNCELLEME",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ÜLKE SEÇİN",search:"ÜLKE ARA",placeholder:"TR / Türkiye",loading:"Açık kayıt kontrol ediliyor…",
   offline:"Açık kayıt henüz etkin değil veya geçici olarak kullanılamıyor. Kurgusal sayılar göstermiyoruz; kaynaklı tarihî arşivi inceleyin.",
   empty:"Kayıtta henüz onaylanmış açık kayıt yok.",filtered:"Aramanızla eşleşen ülke bulunamadı.",
   archive:"Kaynaklı tarihî arşiv ↗",prepare:"Bildirim hazırla (yerel taslak) ↗",
   privacy:"Özel adresler, kesin koordinatlar veya yayımlanmamış bildirimler gösterilmez. DEMO kayıtları hariçtir.",
   listed:"Yayımlanmış kaydı olan ülkeler: ",reports:"yayımlanan gözlem: ",
   histFiles:"TARİHÎ VAKA DOSYALARI",histTitle:"ÜLKELERE GÖRE TARİHÎ VAKALAR",histListed:"Tarihî vaka dosyası olan ülkeler: ",histOffline:"Arşiv geçici olarak kullanılamıyor."
  },
  ro:{
   docTitle:"Directorul țărilor",title:"OBSERVAȚII PE ȚĂRI",intro:"Explorează țările cu observații aprobate și publicate în registrul public, fără cazuri demonstrative.",
   home:"ACASĂ",cases:"OBSERVAȚII PUBLICATE",countries:"ȚĂRI CU ÎNREGISTRĂRI",sync:"ULTIMA SINCRONIZARE",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ALEGE O ȚARĂ",search:"CAUTĂ ȚARA",placeholder:"RO / România",loading:"Verificăm registrul public…",
   offline:"Registrul public este indisponibil sau inactiv. Nu afișăm statistici inventate. Consultă arhiva istorică cu surse.",
   empty:"Nu există încă înregistrări publicate în registru.",filtered:"Nicio țară nu corespunde căutării.",
   archive:"Arhiva istorică cu surse ↗",prepare:"Pregătește un raport (ciornă locală) ↗",
   privacy:"Nu afișăm adrese private, coordonate exacte sau rapoarte nepublicate. Cazurile DEMO sunt excluse.",
   listed:"Țări cu înregistrări publicate: ",reports:"observații publicate: ",
   histFiles:"DOSARE ISTORICE",histTitle:"CAZURI ISTORICE PE ȚĂRI",histListed:"Țări cu dosare istorice: ",histOffline:"Arhiva este temporar indisponibilă."
  },
  el:{
   docTitle:"Κατάλογος χωρών",title:"ΠΑΡΑΤΗΡΗΣΕΙΣ ΑΝΑ ΧΩΡΑ",intro:"Εξερευνήστε χώρες με εγκεκριμένες δημοσιευμένες παρατηρήσεις από το δημόσιο μητρώο.",
   home:"ΑΡΧΙΚΗ",cases:"ΔΗΜΟΣΙΕΥΜΕΝΕΣ ΠΑΡΑΤΗΡΗΣΕΙΣ",countries:"ΧΩΡΕΣ ΜΕ ΚΑΤΑΓΡΑΦΕΣ",sync:"ΤΕΛΕΥΤΑΙΑ ΕΝΗΜΕΡΩΣΗ",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ΕΠΙΛΕΞΤΕ ΧΩΡΑ",search:"ΑΝΑΖΗΤΗΣΗ ΧΩΡΑΣ",placeholder:"GR / Ελλάδα",loading:"Έλεγχος δημόσιου μητρώου…",
   offline:"Το δημόσιο μητρώο είναι εκτός σύνδεσης ή μη ενεργό. Δεν εμφανίζουμε εικονικούς αριθμούς. Δείτε το ιστορικό αρχείο πηγών.",
   empty:"Δεν υπάρχουν ακόμη δημοσιευμένες εγγραφές στο μητρώο.",filtered:"Καμία χώρα δεν ταιριάζει στην αναζήτηση.",
   archive:"Ιστορικό αρχείο με πηγές ↗",prepare:"Προετοιμασία αναφοράς (τοπικό πρόχειρο) ↗",
   privacy:"Δεν εμφανίζονται προσωπικές διευθύνσεις, ακριβείς συντεταγμένες ή μη δημοσιευμένες αναφορές.",
   listed:"Χώρες με δημοσιευμένες εγγραφές: ",reports:"δημοσιευμένες παρατηρήσεις: ",
   histFiles:"ΙΣΤΟΡΙΚΟΙ ΦΑΚΕΛΟΙ",histTitle:"ΙΣΤΟΡΙΚΕΣ ΠΕΡΙΠΤΩΣΕΙΣ ΑΝΑ ΧΩΡΑ",histListed:"Χώρες με ιστορικούς φακέλους: ",histOffline:"Το αρχείο είναι προσωρινά μη διαθέσιμο."
  },
  sr:{
   docTitle:"Државе",title:"ЗАПАЖАЊА ПО ДРЖАВАМА",intro:"Истражите државе са одобреним и објављеним записима из јавног регистра, без демо случајева.",
   home:"ПОЧЕТНА",cases:"ОБЈАВЉЕНА ЗАПАЖАЊА",countries:"ДРЖАВЕ СА ЗАПИСИМА",sync:"ПОСЛЕДЊЕ АЖУРИРАЊЕ",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ИЗАБЕРИ ДРЖАВУ",search:"ПРЕТРАЖИ ДРЖАВУ",placeholder:"RS / Србија",loading:"Провера јавног регистра…",
   offline:"Јавни регистар тренутно није активан. Не приказујемо измишљене бројеве. Погледајте историјски архив са изворима.",
   empty:"Још нема објављених записа у регистру.",filtered:"Ниједна држава не одговара претрази.",
   archive:"Историјски архив са изворима ↗",prepare:"Припреми пријаву (локални нацрт) ↗",
   privacy:"Не приказујемо приватне адресе, тачне координате нити необјављене пријаве. DEMO записи су искључени.",
   listed:"Државе са објављеним записима: ",reports:"објављених случајева: ",
   histFiles:"АРХИВСКИ ДОСИЈЕИ",histTitle:"ИСТОРИЈСКИ СЛУЧАЈЕВИ ПО ДРЖАВАМА",histListed:"Државе са историјским досијеима: ",histOffline:"Архив је привремено недоступан."
  },
  uk:{
   docTitle:"Країни",title:"СПОСТЕРЕЖЕННЯ ЗА КРАЇНАМИ",intro:"Переглядайте країни з схваленими та опублікованими записами з публічного реєстру без демо-випадків.",
   home:"ГОЛОВНА",cases:"ОПУБЛІКОВАНІ СПОСТЕРЕЖЕННЯ",countries:"КРАЇНИ ІЗ ЗАПИСАМИ",sync:"ОСТАННЄ ОНОВЛЕННЯ",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"ОБЕРІТЬ КРАЇНУ",search:"ПОШУК КРАЇНИ",placeholder:"UA / Україна",loading:"Перевіряємо публічний реєстр…",
   offline:"Публічний реєстр тимчасово недоступний або ще не активований. Ми не показуємо вигаданих цифр. Перегляньте історичний архів із джерелами.",
   empty:"У реєстрі ще немає опублікованих записів.",filtered:"Жодна країна не відповідає запиту.",
   archive:"Історичний архів із джерелами ↗",prepare:"Підготувати повідомлення (локальна чернетка) ↗",
   privacy:"Не показуємо приватні адреси, точні координати чи неопубліковані сигнали. DEMO-записи виключено.",
   listed:"Країн з опублікованими записами: ",reports:"опублікованих спостережень: ",
   histFiles:"АРХІВНІ ДОСЬЄ",histTitle:"ІСТОРИЧНІ ВИПАДКИ ЗА КРАЇНАМИ",histListed:"Країн з історичними досьє: ",histOffline:"Архів тимчасово недоступний."
  },
  pl:{
   docTitle:"Katalog krajów",title:"OBSERWACJE WEDŁUG KRAJÓW",intro:"Przeglądaj kraje z zatwierdzonymi i opublikowanymi wpisami w publicznym rejestrze, bez przypadków demonstracyjnych.",
   home:"STRONA GŁÓWNA",cases:"OPUBLIKOWANE OBSERWACJE",countries:"KRAJE Z WPISAMI",sync:"OSTATNIA SYNCHRONIZACJA",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"WYBIERZ KRAJ",search:"SZUKAJ KRAJU",placeholder:"PL / Polska",loading:"Sprawdzanie rejestru publicznego…",
   offline:"Rejestr publiczny jest niedostępny lub nieaktywny. Nie pokazujemy fikcyjnych danych. Sprawdź archiwum historyczne ze źródłami.",
   empty:"Brak opublikowanych wpisów w rejestrze.",filtered:"Żaden kraj nie pasuje do wyszukiwania.",
   archive:"Archiwum historyczne ze źródłami ↗",prepare:"Przygotuj zgłoszenie (szkic lokalny) ↗",
   privacy:"Nie wyświetlamy prywatnych adresów, dokładnych współrzędnych ani nieopublikowanych zgłoszeń. Przypadki DEMO są wykluczone.",
   listed:"Kraje z opublikowanymi wpisami: ",reports:"opublikowanych obserwacji: ",
   histFiles:"DOSSIER ARCHIWALNE",histTitle:"PRZYPADKI HISTORYCZNE WEDŁUG KRAJÓW",histListed:"Kraje z historycznymi dossier: ",histOffline:"Archiwum chwilowo niedostępne."
  },
  ar:{
   docTitle:"دليل الدول",title:"المشاهدات حسب الدولة",intro:"استكشف الدول التي لديها مشاهدات معتمدة ومنشورة في السجل العام، دون الحالات التجريبية.",
   home:"الرئيسية",cases:"المشاهدات المنشورة",countries:"دول بها سجلات",sync:"آخر مزامنة",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"اختر دولة",search:"ابحث عن دولة",placeholder:"EG / مصر",loading:"جارٍ التحقق من السجل العام…",
   offline:"السجل العام غير متصل أو غير مفعل بعد. نحن لا نعرض أرقاماً مختلقة. تصفح الأرشيف التاريخي الموثق بالمصادر.",
   empty:"لا توجد سجلات معتمدة منشورة في السجل حتى الآن.",filtered:"لا توجد دول تطابق بحثك.",
   archive:"الأرشيف التاريخي الموثق ↗",prepare:"إعداد بلاغ (مسودة محلية) ↗",
   privacy:"لا يتم عرض العناوين الخاصة أو الإحداثيات الدقيقة أو البلاغات غير المنشورة.",
   listed:"الدول التي لديها سجلات منشورة: ",reports:"مشاهدات منشورة: ",
   histFiles:"ملفات تاريخية",histTitle:"الحالات التاريخية حسب الدولة",histListed:"الدول التي لديها ملفات تاريخية: ",histOffline:"الأرشيف غير متاح مؤقتاً."
  },
  ja:{
   docTitle:"国別ディレクトリ",title:"国別の公開観測記録",intro:"公開レジストリで承認・公開された観測記録がある国を一覧できます。デモ事例は含まれません。",
   home:"ホーム",cases:"公開観測数",countries:"記録のある国",sync:"最終同期",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"国を選択",search:"国を検索",placeholder:"JP / 日本",loading:"公開レジストリを確認中…",
   offline:"公開レジストリは現在オフラインまたは未稼働です。架空の数値は表示しません。出典付きの歴史アーカイブをご覧ください。",
   empty:"承認・公開された記録はまだありません。",filtered:"一致する国が見つかりません。",
   archive:"出典付き歴史アーカイブ ↗",prepare:"報告を準備（ローカル下書き） ↗",
   privacy:"個人の住所、正確な座標、未公開の報告、DEMO事例は表示されません。",
   listed:"公開記録のある国: ",reports:"件の公開観測: ",
   histFiles:"歴史事例ファイル",histTitle:"国別の歴史的UAP事例",histListed:"歴史事例ファイルのある国: ",histOffline:"アーカイブは一時的に利用できません。"
  },
  ko:{
   docTitle:"국가별 디렉터리",title:"국가별 공개 관측 기록",intro:"공개 레지스트리에서 승인 및 게시된 관측 기록이 있는 국가를 살펴보세요. 데모 사례는 제외됩니다.",
   home:"홈",cases:"게시된 관측",countries:"기록 보유 국가",sync:"최근 동기화",
   indexLabel:"PUBLIC DATA / COUNTRY INDEX",browse:"국가 선택",search:"국가 검색",placeholder:"KR / 대한민국",loading:"공개 레지스트리 확인 중…",
   offline:"공개 레지스트리가 오프라인이거나 아직 활성화되지 않았습니다. 임의의 수치를 표시하지 않으며, 출처 기반 역사 아카이브를 이용할 수 있습니다.",
   empty:"아직 승인되어 게시된 레지스트리 기록이 없습니다.",filtered:"검색어와 일치하는 국가가 없습니다.",
   archive:"출처 기반 역사 아카이브 ↗",prepare:"제보 준비 (로컬 초안) ↗",
   privacy:"개인 주소, 정확한 좌표, 미공개 제보 및 DEMO 사례는 표시되지 않습니다.",
   listed:"공개 기록이 있는 국가: ",reports:"건의 공개 관측: ",
   histFiles:"역사 사례 파일",histTitle:"국가별 역사적 사례",histListed:"역사 사례 파일이 있는 국가: ",histOffline:"아카이브를 일시적으로 사용할 수 없습니다."
  }
 };
 let language="bg";try{language=localStorage.getItem("aurora-lang")||"bg"}catch{}
 if(!packs[language])language="bg";
 document.documentElement.lang=language;
 const getLocale=()=>language==="zh-CN"?"zh-Hans":language;
 const msg=()=>packs[language]||packs.en;
 const status=$("countryDirectoryStatus"),grid=$("countryGrid"),search=$("countrySearch");
 let rawCountries=[],rawSourceCounts=new Map(),sourceError=false;
 function displayNames(){
  const loc=getLocale();
  try{return new Intl.DisplayNames([loc,"en"],{type:"region"})}catch{return new Intl.DisplayNames(["en"],{type:"region"})}
 }
 function applyStatic(){
  const m=msg();
  document.querySelectorAll("[data-t]").forEach(el=>{
   if(el===status&&status.dataset.state!=="loading")return;
   const s=m[el.dataset.t];if(typeof s==="string")el.textContent=s;
  });
  document.title="AURORA — "+m.docTitle;
  search.placeholder=m.placeholder;
  const skip=document.querySelector(".skip-link");
  if(skip)skip.textContent=language==="bg"?"Към съдържанието":"Skip to content";
 }
 function render(){
  const m=msg(),loc=getLocale(),dn=displayNames();
  const nameOf=c=>dn.of(c)||c;
  const countries=rawCountries.map(c=>({code:c.code,count:c.count,name:nameOf(c.code)})).sort((a,b)=>a.name.localeCompare(b.name,loc));
  grid.replaceChildren();
  const q=search.value.trim().toLocaleLowerCase(loc);
  const filtered=countries.filter(c=>(c.name+" "+c.code).toLocaleLowerCase(loc).includes(q));
  for(const c of filtered){
   const a=document.createElement("a");a.className="country-card";a.href="/countries/"+c.code;
   a.setAttribute("aria-label",c.name+" — "+m.reports+c.count);
   const label=document.createElement("span"),name=document.createElement("strong"),iso=document.createElement("small"),num=document.createElement("span");
   name.textContent=c.name;iso.textContent=c.code+" / ISO";num.className="count";num.textContent=c.count.toLocaleString(loc);num.title=m.reports+c.count;
   label.append(name,iso);a.append(label,num);grid.append(a);
  }
  if(status.dataset.state==="ready")status.textContent=countries.length===0?m.empty:filtered.length===0?m.filtered:m.listed+filtered.length;
  else if(status.dataset.state==="offline")status.textContent=m.offline;
  else status.textContent=m.loading;
 }
 function renderSourceCountries(){
  const m=msg(),loc=getLocale(),dn=displayNames();
  const nameOf=c=>dn.of(c)||c;
  const host=$("sourcedCountryGrid"),q=search.value.trim().toLocaleLowerCase(loc);
  host.replaceChildren();
  $("sourcedCountryTitle").textContent=m.histTitle;
  if(sourceError){$("sourcedCountryStatus").textContent=m.histOffline;return}
  const sourceCountries=[...rawSourceCounts].map(([code,count])=>({code,count,name:nameOf(code)})).sort((a,b)=>a.name.localeCompare(b.name,loc));
  const visible=sourceCountries.filter(x=>(x.name+" "+x.code).toLocaleLowerCase(loc).includes(q));
  for(const c of visible){
   const a=document.createElement("a");a.className="country-card";a.href="/countries/"+c.code;
   const label=document.createElement("span"),name=document.createElement("strong"),iso=document.createElement("small");
   name.textContent=c.name;iso.textContent=c.code+" · "+m.histFiles;
   label.append(name,iso);
   const number=document.createElement("span");number.className="count";number.textContent=c.count;
   a.append(label,number);host.append(a);
  }
  $("sourcedCountryStatus").textContent=m.histListed+visible.length;
 }
 search.addEventListener("input",()=>{render();renderSourceCountries()});
 window.addEventListener("aurora:language-changed",e=>{
  const next=e?.detail?.language||document.documentElement.lang||"bg";
  language=packs[next]?next:"en";
  applyStatic();render();renderSourceCountries();
 });
 async function start(){
  applyStatic();
  try{
   const response=await fetch("/api/stats",{cache:"no-store"});
   if(!response.ok)throw Error("stats unavailable");
   const stats=await response.json();
   if(stats?.includes_demo!==false||!Number.isInteger(stats.sightings)||stats.sightings<0||
      !Number.isInteger(stats.countries)||stats.countries<0||!Array.isArray(stats.by_country))
     throw Error("invalid stats");
   const unique=new Set();
   rawCountries=stats.by_country.filter(c=>{
    if(!c||typeof c.code!=="string"||!/^[A-Z]{2}$/.test(c.code)||
       !Number.isInteger(c.count)||c.count<1||unique.has(c.code))return false;
    unique.add(c.code);return true
   });
   if(rawCountries.length!==stats.countries||rawCountries.reduce((s,c)=>s+c.count,0)!==stats.sightings)throw Error("mismatched stats");
   const loc=getLocale();
   $("directoryCaseCount").textContent=stats.sightings.toLocaleString(loc);
   $("directoryCountryCount").textContent=stats.countries.toLocaleString(loc);
   $("directoryLastSync").textContent=typeof stats.last_successful_sync==="string"?stats.last_successful_sync.slice(0,10):"—";
   $("directoryMetrics").hidden=false;
   status.dataset.state="ready";render();
  }catch{
   rawCountries=[];grid.replaceChildren();$("directoryMetrics").hidden=true;
   status.dataset.state="offline";status.textContent=msg().offline;
  }
 }
 async function loadSourceCountries(){
  try{
   const res=await fetch("/data/cases.json",{cache:"no-cache"});if(!res.ok)throw Error("Archive offline");
   const json=await res.json(),counts=new Map();
   if(!Array.isArray(json.cases))throw Error("Bad archive");
   const sourceCases=globalThis.AURORA_ARCHIVE?.prepareArchiveCases(json.cases)??json.cases;
   for(const c of sourceCases)if(/^[A-Z]{2}$/.test(c.country||"")&&c.title?.en&&c.source?.url?.startsWith("https://"))
    counts.set(c.country,(counts.get(c.country)||0)+1);
   rawSourceCounts=counts;sourceError=false;
   renderSourceCountries();
  }catch{
   sourceError=true;$("sourcedCountryStatus").textContent=msg().histOffline;
  }
 }
 start();
 loadSourceCountries();
})();
