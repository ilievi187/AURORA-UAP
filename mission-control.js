/* AURORA Mission Control v1.2 — interactive methodology explainer.
   This is an illustrative workflow, not case ingestion or telemetry. */
"use strict";
(()=>{
  const root=document.getElementById("control");
  if(!root)return;
  const tabs=[...root.querySelectorAll(".console-tab")];
  const panel=root.querySelector("#controlPanel");
  const title=root.querySelector("#controlStageTitle");
  const description=root.querySelector("#controlStageDescription");
  const list=root.querySelector("#controlChecklist");
  const count=root.querySelector("#controlCounter");
  const next=root.querySelector("#controlNext");
  const visualStage=root.querySelector("#controlVisualStage");
  const feed=root.querySelector("#controlCaseButtons");
  const changes={
    bg:{
      heading:"КОМАНДЕН ЦЕНТЪР",
      intro:"Проследи как един сигнал преминава от наблюдение до обосновано заключение. Това е интерактивна демонстрация на методиката, не система с живи данни.",
      phaseLabel:"ИЗБЕРИ ЕТАП",disclaimer:"Илюстративен процес. Не обработваме реални сигнали онлайн.",
      phase0:"Регистриране",phase1:"Проверка",phase2:"Анализ",phase3:"Заключение",
      activeStage:"АКТИВЕН ЕТАП",next:"СЛЕДВАЩ ЕТАП",methodLink:"ВИЖ МЕТОДИКАТА",
      feedLabel:"ПРИМЕРНИ ДОСИЕТА / ДЕМО",feedIntro:"Разгледай примерните случаи или отвори пълния архив.",
      archiveLink:"КЪМ АРХИВА",navControl:"Център",
      items:[
        ["Регистриране на наблюдението","Започваме със свидетелството: кога, къде и при какви условия е наблюдавано явлението.",["Дата, час и местоположение","Свидетели, описание и условия","Оригинални снимки и видео"]],
        ["Проверка на контекста","Преди предположенията проверяваме всички известни обяснения и събираме независим контекст.",["Самолети, дронове и полети","Спътници, планети и метеори","Време, светлина и оптика"]],
        ["Технически анализ","Сравняваме данните и отбелязваме неопределеността, вместо да преувеличаваме доказателствата.",["Метаданни и произход","Видеокомпресия и перспектива","Независима експертна проверка"]],
        ["Публикуване на заключение","Разделяме проверените факти, възможните обяснения и това, което все още не знаем.",["Хронология на проверките","Оценка на достоверността","Публично и прозрачно заключение"]]
      ]
    },
    en:{
      heading:"MISSION CONTROL",
      intro:"Explore how a sighting moves from observation to a reasoned conclusion. This is an interactive illustration of our method—not a live processing system.",
      phaseLabel:"SELECT A STAGE",disclaimer:"Illustrative workflow. Real sightings are not processed online.",
      phase0:"Document",phase1:"Verify",phase2:"Analyze",phase3:"Conclude",
      activeStage:"ACTIVE STAGE",next:"NEXT STAGE",methodLink:"OUR METHODS",
      feedLabel:"EXAMPLE CASE FILES / DEMO",feedIntro:"Explore fictional examples or browse the complete demo archive.",
      archiveLink:"OPEN ARCHIVE",navControl:"Control",
      items:[
        ["Document the observation","Start with first-hand facts: when, where, and under what conditions did the observation occur?",["Date, time and location","Witness account and conditions","Original photos and footage"]],
        ["Check known explanations","Before speculating, rule out familiar explanations and collect independent context.",["Aircraft, drones and flights","Satellites, planets and meteors","Weather, optics and lighting"]],
        ["Analyze the evidence","Compare available data while recording uncertainty rather than overstating what it proves.",["Metadata and provenance","Compression and perspective","Independent technical review"]],
        ["Communicate conclusions","Separate established facts, plausible explanations, and what remains unresolved.",["Investigation timeline","Confidence and limitations","Transparent public conclusions"]]
      ]
    },
    de:{
      heading:"FORSCHUNGSZENTRALE",intro:"Erfahre, wie aus einer Sichtung eine sorgfältig begründete Einschätzung wird. Diese Ansicht ist eine interaktive Demonstration, kein Live-System.",
      phaseLabel:"PHASE AUSWÄHLEN",disclaimer:"Nur Demo-Prozess. Es werden online keine echten Meldungen verarbeitet.",
      phase0:"Dokumentieren",phase1:"Prüfen",phase2:"Analysieren",phase3:"Fazit",
      activeStage:"AKTIVE PHASE",next:"NÄCHSTE PHASE",methodLink:"METHODIK",
      feedLabel:"BEISPIELFÄLLE / DEMO",feedIntro:"Fiktive Fälle ansehen oder das Demo-Archiv öffnen.",
      archiveLink:"ZUM ARCHIV",navControl:"Zentrale",
      items:[
        ["Beobachtung dokumentieren","Zuerst erfassen wir Zeitpunkt, Ort und Umstände der Beobachtung.",["Datum, Uhrzeit und Ort","Zeugenaussagen und Kontext","Unveränderte Fotos und Videos"]],
        ["Bekannte Ursachen prüfen","Bevor wir spekulieren, überprüfen wir bekannte mögliche Erklärungen.",["Flugzeuge und Drohnen","Satelliten, Planeten und Meteore","Wetter und optische Effekte"]],
        ["Beweismaterial analysieren","Wir vergleichen Daten und dokumentieren Unsicherheiten ohne Übertreibungen.",["Metadaten und Herkunft","Kompression und Perspektive","Unabhängige technische Prüfung"]],
        ["Ergebnisse veröffentlichen","Wir trennen Fakten, plausible Erklärungen und offene Fragen.",["Ablauf der Untersuchung","Vertrauen und Grenzen","Transparente Schlussfolgerungen"]]
      ]
    },
    ru:{
      heading:"ЦЕНТР ИССЛЕДОВАНИЙ",intro:"Узнайте, как сообщение проходит путь от наблюдения до обоснованного вывода. Это демонстрация методики, а не действующая система.",
      phaseLabel:"ВЫБЕРИТЕ ЭТАП",disclaimer:"Демонстрационный процесс. Реальные сообщения пока не обрабатываются.",
      phase0:"Документация",phase1:"Проверка",phase2:"Анализ",phase3:"Вывод",
      activeStage:"ТЕКУЩИЙ ЭТАП",next:"СЛЕДУЮЩИЙ ЭТАП",methodLink:"МЕТОДИКА",
      feedLabel:"ПРИМЕРЫ ДЕЛ / ДЕМО",feedIntro:"Изучите вымышленные примеры или откройте архив.",
      archiveLink:"ОТКРЫТЬ АРХИВ",navControl:"Центр",
      items:[
        ["Документирование наблюдения","Записываем время, место и условия, при которых произошло наблюдение.",["Дата, время и место","Свидетели и обстоятельства","Оригинальные фото и видео"]],
        ["Проверка обстоятельств","Сначала исключаем известные объяснения и ищем независимые сведения.",["Самолёты и дроны","Спутники, планеты и метеоры","Погода и оптические эффекты"]],
        ["Технический анализ","Сопоставляем материалы и отмечаем неопределённость без преувеличений.",["Метаданные и происхождение","Компрессия и перспектива","Независимая техническая проверка"]],
        ["Публикация выводов","Разделяем доказанные факты, вероятные объяснения и открытые вопросы.",["Ход расследования","Уровень уверенности","Прозрачный вывод"]]
      ]
    },
    "zh-CN":{
      heading:"任务控制中心",intro:"了解一份目击报告从记录到得出有依据的结论的过程。这只是研究方法的交互演示，不是实时处理系统。",
      phaseLabel:"选择阶段",disclaimer:"仅为示范流程，暂不在线处理真实报告。",
      phase0:"记录",phase1:"核查",phase2:"分析",phase3:"结论",
      activeStage:"当前阶段",next:"下一阶段",methodLink:"研究方法",
      feedLabel:"案例样例 / 演示",feedIntro:"浏览虚构样例或打开完整演示档案。",
      archiveLink:"打开档案",navControl:"控制中心",
      items:[
        ["记录观察","首先记录现象出现的时间、地点和具体环境。",["日期、时间与地点","目击者描述与环境","原始照片和视频"]],
        ["排查已知原因","排除常见解释并收集独立证据。",["飞机、无人机和航班","卫星、行星和流星","天气及光学现象"]],
        ["分析证据","对比材料，明确不确定之处，避免夸大证据。",["元数据和来源","视频压缩与视角","独立技术审核"]],
        ["公布结论","区分已确认事实、合理解释与尚不明确的问题。",["调查时间线","可信度及局限","透明公开的结论"]]
      ]
    },
    fr:{
      heading:"CENTRE DE CONTRÔLE",intro:"Découvrez comment un signalement passe de l'observation à une conclusion argumentée. Il s'agit d'une démonstration interactive, pas d'un système en direct.",
      phaseLabel:"CHOISIR UNE ÉTAPE",disclaimer:"Processus illustratif. Les vrais signalements ne sont pas traités en ligne.",
      phase0:"Documenter",phase1:"Vérifier",phase2:"Analyser",phase3:"Conclure",
      activeStage:"ÉTAPE ACTIVE",next:"ÉTAPE SUIVANTE",methodLink:"NOTRE MÉTHODE",
      feedLabel:"DOSSIERS D'EXEMPLE / DÉMO",feedIntro:"Explorez des exemples fictifs ou ouvrez les archives complètes.",
      archiveLink:"OUVRIR L'ARCHIVE",navControl:"Centre",
      items:[
        ["Documenter l'observation","Commencer par les faits de première main : quand, où et dans quelles conditions ?",["Date, heure et lieu","Témoignages et conditions","Photos et vidéos originales"]],
        ["Vérifier les explications connues","Avant toute spéculation, écarter les causes connues et recueillir un contexte indépendant.",["Aéronefs, drones et vols","Satellites, planètes et météores","Météo, optique et éclairage"]],
        ["Analyser les éléments","Comparer les données tout en consignant les incertitudes sans exagération.",["Métadonnées et provenance","Compression et perspective","Examen technique indépendant"]],
        ["Communiquer les conclusions","Distinguer les faits établis, les pistes plausibles et ce qui demeure non résolu.",["Chronologie de l'enquête","Niveau de confiance et limites","Conclusions publiques transparentes"]]
      ]
    },
    es:{
      heading:"CENTRO DE CONTROL",intro:"Explora cómo un avistamiento pasa de la observación a una conclusión fundamentada. Es una demostración interactiva del método, no un sistema en vivo.",
      phaseLabel:"SELECCIONAR ETAPA",disclaimer:"Flujo ilustrativo. Los informes reales no se procesan en línea.",
      phase0:"Documentar",phase1:"Verificar",phase2:"Analizar",phase3:"Concluir",
      activeStage:"ETAPA ACTIVA",next:"SIGUIENTE ETAPA",methodLink:"METODOLOGÍA",
      feedLabel:"CASOS DE EJEMPLO / DEMO",feedIntro:"Explora ejemplos ficticios o abre el archivo completo.",
      archiveLink:"ABRIR ARCHIVO",navControl:"Control",
      items:[
        ["Documentar la observación","Empezar por los datos directos: ¿cuándo, dónde y en qué condiciones ocurrió?",["Fecha, hora y lugar","Testimonios y condiciones","Fotos y vídeos originales"]],
        ["Comprobar causas conocidas","Antes de especular, descartar explicaciones habituales y reunir contexto independiente.",["Aeronaves, drones y vuelos","Satélites, planetas y meteoros","Clima, óptica e iluminación"]],
        ["Analizar la evidencia","Comparar los datos disponibles registrando la incertidumbre sin exagerar pruebas.",["Metadatos y procedencia","Compresión y perspectiva","Revisión técnica independiente"]],
        ["Publicar conclusiones","Separar los hechos verificados, las hipótesis plausibles y lo aún no resuelto.",["Cronología de la investigación","Grado de confianza y límites","Conclusiones públicas transparentes"]]
      ]
    },
    it:{
      heading:"CENTRO DI CONTROLLO",intro:"Scopri come una segnalazione passa dall'osservazione a una conclusione motivata. È una dimostrazione interattiva del metodo, non un sistema live.",
      phaseLabel:"SELEZIONA FASE",disclaimer:"Flusso dimostrativo. Le segnalazioni reali non vengono elaborate online.",
      phase0:"Documentare",phase1:"Verificare",phase2:"Analizzare",phase3:"Concludere",
      activeStage:"FASE ATTIVA",next:"FASE SUCCESSIVA",methodLink:"METODOLOGIA",
      feedLabel:"CASI DI ESEMPIO / DEMO",feedIntro:"Esplora esempi fittizi o apri l'archivio completo.",
      archiveLink:"APRI ARCHIVIO",navControl:"Controllo",
      items:[
        ["Documentare l'osservazione","Partiamo dai dati diretti: quando, dove e in quali condizioni è avvenuta?",["Data, ora e luogo","Testimonianze e condizioni","Foto e filmati originali"]],
        ["Verificare cause note","Prima di ipotizzare, escludiamo spiegazioni comuni e raccogliamo contesto indipendente.",["Aerei, droni e voli","Satelliti, pianeti e meteore","Meteo, ottica e illuminazione"]],
        ["Analizzare le prove","Confrontiamo i dati annotando le incertezze senza sovrastimare le evidenze.",["Metadati e provenienza","Compressione e prospettiva","Revisione tecnica indipendente"]],
        ["Comunicare le conclusioni","Separiamo i fatti accertati, le spiegazioni plausibili e ciò che resta aperto.",["Cronologia dell'indagine","Affidabilità e limiti","Conclusioni pubbliche trasparenti"]]
      ]
    },
    pt:{
      heading:"CENTRO DE CONTROLO",intro:"Veja como um relato passa da observação a uma conclusão fundamentada. Esta é uma demonstração interativa do método, não um sistema em tempo real.",
      phaseLabel:"SELECIONAR ETAPA",disclaimer:"Fluxo ilustrativo. Relatos reais não são processados online.",
      phase0:"Documentar",phase1:"Verificar",phase2:"Analisar",phase3:"Concluir",
      activeStage:"ETAPA ATIVA",next:"PRÓXIMA ETAPA",methodLink:"METODOLOGIA",
      feedLabel:"CASOS DE EXEMPLO / DEMO",feedIntro:"Explore exemplos fictícios ou abra o arquivo completo.",
      archiveLink:"ABRIR ARQUIVO",navControl:"Controlo",
      items:[
        ["Documentar a observação","Começamos pelos factos diretos: quando, onde e em que condições ocorreu?",["Data, hora e localização","Testemunhos e condições","Fotos e vídeos originais"]],
        ["Verificar explicações conhecidas","Antes de especular, descartamos causas comuns e reunimos contexto independente.",["Aeronaves, drones e voos","Satélites, planetas e meteoros","Meteorologia, ótica e luz"]],
        ["Analisar as evidências","Comparamos dados registando incertezas sem exagerar o que provam.",["Metadados e proveniência","Compressão e perspetiva","Revisão técnica independente"]],
        ["Comunicar conclusões","Separamos factos confirmados, explicações plausíveis e questões em aberto.",["Cronologia da investigação","Confiança e limitações","Conclusões públicas transparentes"]]
      ]
    },
    tr:{
      heading:"KONTROL MERKEZİ",intro:"Bir gözlemin ilk kayıttan gerekçeli sonuca nasıl ulaştığını inceleyin. Bu görünüm canlı bir sistem değil, yöntemimizin etkileşimli tanıtımıdır.",
      phaseLabel:"AŞAMA SEÇİN",disclaimer:"Örnek iş akışıdır. Gerçek bildirimler çevrimiçi işlenmez.",
      phase0:"Belgele",phase1:"Doğrula",phase2:"Analiz Et",phase3:"Sonuçlandır",
      activeStage:"AKTİF AŞAMA",next:"SONRAKİ AŞAMA",methodLink:"METODOLOJİ",
      feedLabel:"ÖRNEK DOSYALAR / DEMO",feedIntro:"Kurgusal örnekleri inceleyin veya arşivi açın.",
      archiveLink:"ARŞİVİ AÇ",navControl:"Merkez",
      items:[
        ["Gözlemi belgele","İlk elden olgularla başlarız: gözlem ne zaman, nerede ve hangi koşullarda gerçekleşti?",["Tarih, saat ve konum","Tanık anlatımı ve koşullar","Orijinal fotoğraf ve videolar"]],
        ["Bilinen açıklamaları kontrol et","Varsayımdan önce olağan nedenleri eler ve bağımsız bağlam toplarız.",["Uçaklar, İHA’lar ve uçuşlar","Uydular, gezegenler ve meteorlar","Hava durumu, optik ve ışık"]],
        ["Kanıtları analiz et","Eldeki verileri karşılaştırır ve belirsizlikleri abartmadan kaydederiz.",["Meta veriler ve kaynak","Sıkıştırma ve perspektif","Bağımsız teknik inceleme"]],
        ["Sonuçları paylaş","Doğrulanmış olguları, olası açıklamaları ve çözülmemiş noktaları ayırırız.",["İnceleme zaman çizelgesi","Güven düzeyi ve sınırlar","Şeffaf kamusal sonuçlar"]]
      ]
    },
    ro:{
      heading:"CENTRU DE CONTROL",intro:"Urmărește cum o observație trece de la semnalare la o concluzie argumentată. Aceasta este o demonstrație interactivă a metodei, nu un sistem live.",
      phaseLabel:"SELECTEAZĂ ETAPA",disclaimer:"Flux demonstrativ. Semnalările reale nu sunt procesate online.",
      phase0:"Documentare",phase1:"Verificare",phase2:"Analiză",phase3:"Concluzie",
      activeStage:"ETAPĂ ACTIVĂ",next:"ETAPA URMĂTOARE",methodLink:"METODOLOGIE",
      feedLabel:"DOSARE EXEMPLU / DEMO",feedIntro:"Explorează exemple fictive sau deschide arhiva completă.",
      archiveLink:"DESCHIDE ARHIVA",navControl:"Control",
      items:[
        ["Documentarea observației","Începem cu datele directe: când, unde și în ce condiții a avut loc observația?",["Data, ora și locația","Mărturii și condiții","Fotografii și filmări originale"]],
        ["Verificarea cauzelor cunoscute","Înainte de ipoteze, excludem explicațiile uzuale și colectăm context independent.",["Aeronave, drone și zboruri","Sateliți, planete și meteori","Meteo, optică și iluminare"]],
        ["Analiza probelor","Comparăm datele disponibile și notăm incertitudinile fără exagerări.",["Metadate și proveniență","Compresie și perspectivă","Evaluare tehnică independentă"]],
        ["Comunicarea concluziilor","Separăm faptele stabilite, explicațiile plauzibile și aspectele rămase deschise.",["Cronologia investigației","Nivel de încredere și limite","Concluzii publice transparente"]]
      ]
    },
    el:{
      heading:"ΚΕΝΤΡΟ ΕΛΕΓΧΟΥ",intro:"Δείτε πώς μια αναφορά περνά από την παρατήρηση σε τεκμηριωμένο συμπέρασμα. Πρόκειται για διαδραστική επίδειξη της μεθόδου και όχι ζωντανό σύστημα.",
      phaseLabel:"ΕΠΙΛΟΓΗ ΣΤΑΔΙΟΥ",disclaimer:"Ενδεικτική ροή εργασίας. Οι πραγματικές αναφορές δεν υποβάλλονται σε ζωντανή επεξεργασία.",
      phase0:"Καταγραφή",phase1:"Έλεγχος",phase2:"Ανάλυση",phase3:"Συμπέρασμα",
      activeStage:"ΕΝΕΡΓΟ ΣΤΑΔΙΟ",next:"ΕΠΟΜΕΝΟ ΣΤΑΔΙΟ",methodLink:"ΜΕΘΟΔΟΛΟΓΙΑ",
      feedLabel:"ΕΝΔΕΙΚΤΙΚΟΙ ΦΑΚΕΛΟΙ / DEMO",feedIntro:"Εξερευνήστε εικονικά παραδείγματα ή ανοίξτε το πλήρες αρχείο.",
      archiveLink:"ΑΝΟΙΓΜΑ ΑΡΧΕΙΟΥ",navControl:"Κέντρο",
      items:[
        ["Καταγραφή της παρατήρησης","Ξεκινάμε με τα πρωτογενή στοιχεία: πότε, πού και υπό ποιες συνθήκες συνέβη;",["Ημερομηνία, ώρα και τοποθεσία","Μαρτυρίες και συνθήκες","Πρωτότυπες φωτογραφίες και βίντεο"]],
        ["Έλεγχος γνωστών εξηγήσεων","Πριν από κάθε υπόθεση, αποκλείουμε γνωστές αιτίες και συλλέγουμε ανεξάρτητα στοιχεία.",["Αεροσκάφη, drones και πτήσεις","Δορυφόροι, πλανήτες και μετέωρα","Καιρός, οπτική και φωτισμός"]],
        ["Ανάλυση τεκμηρίων","Συγκρίνουμε τα δεδομένα καταγράφοντας τις αβεβαιότητες χωρίς υπερβολές.",["Μεταδεδομένα και προέλευση","Συμπίεση και προοπτική","Ανεξάρτητος τεχνικός έλεγχος"]],
        ["Δημοσίευση συμπερασμάτων","Διαχωρίζουμε τα επιβεβαιωμένα γεγονότα, τις πιθανές εξηγήσεις και τα ανοιχτά ερωτήματα.",["Χρονολόγιο έρευνας","Βαθμός βεβαιότητας και όρια","Διαφανή δημόσια συμπεράσματα"]]
      ]
    },
    sr:{
      heading:"КОНТРОЛНИ ЦЕНТАР",intro:"Погледај како посматрање прелази пут од пријаве до образложеног закључка. Ово је интерактивни приказ методологије, а не систем уживо.",
      phaseLabel:"ИЗАБЕРИ ФАЗУ",disclaimer:"Илустративни процес. Стварне пријаве се не обрађују онлајн.",
      phase0:"Документовање",phase1:"Провера",phase2:"Анализа",phase3:"Закључак",
      activeStage:"АКТИВНА ФАЗА",next:"СЛЕДЕЋА ФАЗА",methodLink:"МЕТОДОЛОГИЈА",
      feedLabel:"ПРИМЕРИ ДОСИЈЕА / ДЕМО",feedIntro:"Прегледај фиктивне примере или отвори комплетан архив.",
      archiveLink:"ОТВОРИ АРХИВ",navControl:"Центар",
      items:[
        ["Документовање посматрања","Почињемо од основних чињеница: када, где и под којим условима се догодило?",["Датум, време и локација","Сведочење и услови","Оригиналне фотографије и снимци"]],
        ["Провера познатих објашњења","Пре претпоставки искључујемо познате узроке и прикупљамо независан контекст.",["Авиони, дронови и летови","Сателити, планете и метеори","Време, оптика и осветљење"]],
        ["Анализа доказа","Упоређујемо доступне податке и бележимо неизвесност без преувеличавања.",["Метаподаци и порекло","Компресија и перспектива","Независна техничка провера"]],
        ["Објављивање закључака","Раздвајамо утврђене чињенице, могућа објашњења и оно што остаје нерешено.",["Хронологија истраге","Поузданост и ограничења","Транспарентни јавни закључци"]]
      ]
    },
    uk:{
      heading:"ЦЕНТР КЕРУВАННЯ",intro:"Дізнайтеся, як повідомлення проходить шлях від спостереження до обґрунтованого висновку. Це інтерактивна демонстрація методики, а не жива система.",
      phaseLabel:"ОБЕРІТЬ ЕТАП",disclaimer:"Ілюстративний процес. Реальні повідомлення не обробляються онлайн.",
      phase0:"Документування",phase1:"Перевірка",phase2:"Аналіз",phase3:"Висновок",
      activeStage:"АКТИВНИЙ ЕТАП",next:"НАСТУПНИЙ ЕТАП",methodLink:"МЕТОДИКА",
      feedLabel:"ПРИКЛАДИ ДОСЬЄ / ДЕМО",feedIntro:"Перегляньте умовні приклади або відкрийте повний архів.",
      archiveLink:"ВІДКРИТИ АРХІВ",navControl:"Центр",
      items:[
        ["Документування спостереження","Починаємо з первинних фактів: коли, де та за яких умов відбулося явище?",["Дата, час і місце","Свідчення та умови","Оригінальні фото й відео"]],
        ["Перевірка відомих пояснень","Перш ніж припускати, виключаємо звичайні причини та збираємо незалежний контекст.",["Літаки, дрони та рейси","Супутники, планети й метеори","Погода, оптика та освітлення"]],
        ["Технічний аналіз","Зіставляємо дані й фіксуємо невизначеність без перебільшення доказів.",["Метадані та походження","Компресія й перспектива","Незалежна експертна перевірка"]],
        ["Оприлюднення висновків","Відокремлюємо встановлені факти, імовірні пояснення та нез’ясовані питання.",["Хронологія перевірки","Достовірність і обмеження","Прозорі публічні висновки"]]
      ]
    },
    pl:{
      heading:"CENTRUM KONTROLI",intro:"Zobacz, jak zgłoszenie przechodzi od obserwacji do uzasadnionego wniosku. To interaktywna prezentacja metodologii, a nie system działający na żywo.",
      phaseLabel:"WYBIERZ ETAP",disclaimer:"Proces poglądowy. Prawdziwe zgłoszenia nie są przetwarzane online.",
      phase0:"Dokumentacja",phase1:"Weryfikacja",phase2:"Analiza",phase3:"Wniosek",
      activeStage:"AKTYWNY ETAP",next:"NASTĘPNY ETAP",methodLink:"METODOLOGIA",
      feedLabel:"PRZYKŁADOWE AKTA / DEMO",feedIntro:"Przeglądaj fikcyjne przykłady lub otwórz pełne archiwum.",
      archiveLink:"OTWÓRZ ARCHIWUM",navControl:"Centrum",
      items:[
        ["Udokumentowanie obserwacji","Zaczynamy od faktów z pierwszej ręki: kiedy, gdzie i w jakich warunkach nastąpiła obserwacja?",["Data, godzina i lokalizacja","Relacje świadków i warunki","Oryginalne zdjęcia i nagrania"]],
        ["Sprawdzenie znanych wyjaśnień","Zanim pojawią się hipotezy, wykluczamy znane przyczyny i zbieramy niezależny kontekst.",["Samoloty, drony i loty","Satelity, planety i meteory","Pogoda, optyka i oświetlenie"]],
        ["Analiza materiału","Porównujemy dane, odnotowując niepewności bez wyolbrzymiania dowodów.",["Metadane i pochodzenie","Kompresja i perspektywa","Niezależna ocena techniczna"]],
        ["Publikacja wniosków","Oddzielamy ustalone fakty, prawdopodobne wyjaśnienia oraz kwestie nierozstrzygnięte.",["Harmonogram badania","Poziom pewności i ograniczenia","Przejrzyste wnioski publiczne"]]
      ]
    },
    ar:{
      heading:"مركز التحكم",intro:"استكشف كيف ينتقل البلاغ من الرصد الأولي إلى خلاصة مبنية على الأدلة. هذا عرض تفاعلي لمنهجيتنا وليس نظام معالجة فوري.",
      phaseLabel:"اختر مرحلة",disclaimer:"مسار توضيحي فقط؛ لا تتم معالجة البلاغات الحقيقية عبر الإنترنت.",
      phase0:"توثيق",phase1:"تحقق",phase2:"تحليل",phase3:"خلاصة",
      activeStage:"المرحلة النشطة",next:"المرحلة التالية",methodLink:"منهجيتنا",
      feedLabel:"ملفات تجريبية / عرض",feedIntro:"استكشف أمثلة افتراضية أو افتح الأرشيف الكامل.",
      archiveLink:"فتح الأرشيف",navControl:"التحكم",
      items:[
        ["توثيق المشاهدة","نبدأ بالحقائق المباشرة: متى وأين وتحت أي ظروف حدثت المشاهدة؟",["التاريخ والوقت والموقع","شهادة الشهود والظروف","الصور ومقاطع الفيديو الأصلية"]],
        ["فحص التفسيرات المعروفة","قبل الافتراض نستبعد الأسباب المألوفة ونجمع سياقاً مستقلاً.",["الطائرات والمسيّرات والرحلات","الأقمار الصناعية والكواكب والشهب","الطقس والبصريات والإضاءة"]],
        ["تحليل الأدلة","نقارن البيانات المتاحة مع تسجيل عدم اليقين دون مبالغة.",["البيانات الوصفية والمصدر","الضغط وزاوية الرؤية","مراجعة تقنية مستقلة"]],
        ["نشر النتائج","نفصل بين الحقائق المثبتة والتفسيرات المحتملة وما يزال غير محسوم.",["الجدول الزمني للتحقيق","درجة الموثوقية والقيود","استنتاجات عامة شفافة"]]
      ]
    },
    ja:{
      heading:"ミッションコントロール",intro:"目撃報告が記録から根拠ある結論に至るまでの流れを確認できます。これは手法のインタラクティブな解説であり、ライブ処理システムではありません。",
      phaseLabel:"ステージを選択",disclaimer:"例示用ワークフローです。実際の報告はオンライン処理されません。",
      phase0:"記録",phase1:"検証",phase2:"分析",phase3:"結論",
      activeStage:"現在のステージ",next:"次のステージ",methodLink:"方法論を見る",
      feedLabel:"サンプル事例 / デモ",feedIntro:"架空のサンプルを見るか、アーカイブ全体を開きます。",
      archiveLink:"アーカイブを開く",navControl:"コントロール",
      items:[
        ["目撃情報の記録","まず一次事実を整理します。いつ、どこで、どのような状況で目撃されたのか。",["日時と場所","目撃証言と周囲の状況","オリジナルの写真と映像"]],
        ["既知の説明の検証","推測の前に一般的な原因を除外し、独立した背景情報を集めます。",["航空機・ドローン・便情報","人工衛星・惑星・流星","気象・光学効果・照明"]],
        ["証拠の技術分析","データを比較し、誇張せず不確実性を明確に記録します。",["メタデータと来歴","映像圧縮と遠近感","独立した技術レビュー"]],
        ["結論の公開","確認された事実、妥当な説明、未解明の点を明確に区別して公表します。",["調査タイムライン","信頼度と限界","透明性のある公開結論"]]
      ]
    },
    ko:{
      heading:"미션 컨트롤",intro:"목격 제보가 초기 기록에서 근거 있는 결론에 이르는 과정을 살펴보세요. 실시간 처리 시스템이 아닌 연구 방법론의 대화형 안내입니다.",
      phaseLabel:"단계 선택",disclaimer:"예시 워크플로입니다. 실제 제보는 온라인으로 자동 처리되지 않습니다.",
      phase0:"기록",phase1:"검증",phase2:"분석",phase3:"결론",
      activeStage:"현재 단계",next:"다음 단계",methodLink:"방법론 보기",
      feedLabel:"예시 사례 / 데모",feedIntro:"가상의 예시를 살펴보거나 전체 아카이브를 여세요.",
      archiveLink:"아카이브 열기",navControl:"컨트롤",
      items:[
        ["목격 내용 기록","먼저 1차 사실을 정리합니다: 언제, 어디서, 어떤 조건에서 관측되었는가?",["날짜, 시간 및 위치","목격자 진술과 환경 조건","원본 사진 및 영상"]],
        ["알려진 설명 확인","추측하기 전에 일상적인 원인을 배제하고 독립적인 맥락을 수집합니다.",["항공기, 드론 및 운항 정보","위성, 행성 및 유성","기상, 광학 효과 및 조명"]],
        ["증거 기술 분석","가용 데이터를 비교하고 불확실성을 과장 없이 기록합니다.",["메타데이터 및 출처","압축 및 원근 왜곡","독립적인 기술 검토"]],
        ["결론 공개","확인된 사실, 타당한 설명, 미해결 영역을 명확히 구분해 발표합니다.",["조사 타임라인","신뢰도 및 한계","투명한 공개 결론"]]
      ]
    }
  };
  let active=0;
  function copy(){
    const lang=document.documentElement.lang;
    return changes[lang]||changes.en;
  }
  function renderFeed(){
    feed.replaceChildren();
    const available=typeof cases!=="undefined"&&Array.isArray(cases)?cases.slice(0,3):[];
    for(const c of available){
      const button=document.createElement("button");
      button.type="button";
      const n=document.createElement("span");n.textContent="DEMO / "+c.date;
      const t=document.createElement("strong");const language=document.documentElement.lang;
      t.textContent=(c.title[language]||c.title.en);
      button.append(n,t);
      button.setAttribute("aria-label","DEMO: "+t.textContent);
      button.addEventListener("click",()=>{
        if(typeof openCase==="function")openCase(c);
        else location.hash="#reports";
      });
      feed.append(button);
    }
  }
  function render(focus=false){
    const d=copy();
    root.querySelectorAll("[data-control-t]").forEach(el=>{
      const key=el.dataset.controlT;
      if(typeof d[key]==="string")el.textContent=d[key];
    });
    const nav=document.querySelectorAll("[data-control-nav]");
    nav.forEach(el=>{el.textContent=d.navControl});
    const stage=d.items[active];
    root.dataset.phase=String(active);
    title.textContent=stage[0];
    description.textContent=stage[1];
    list.replaceChildren();
    for(const item of stage[2]){
      const li=document.createElement("li");li.textContent=item;list.append(li);
    }
    count.textContent=String(active+1).padStart(2,"0");
    visualStage.textContent=String(active+1);
    tabs.forEach((tab,i)=>{
      const chosen=i===active;
      tab.setAttribute("aria-selected",String(chosen));
      tab.tabIndex=chosen?0:-1;
    });
    panel.setAttribute("aria-labelledby",tabs[active].id);
    if(focus)tabs[active].focus();
    root.classList.remove("panel-transition");
    void root.offsetWidth;
    root.classList.add("panel-transition");
    renderFeed();
  }
  function activate(index,focus=false){
    active=(index+tabs.length)%tabs.length;
    render(focus);
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener("click",()=>activate(i,true));
    tab.addEventListener("keydown",e=>{
      const target=e.key==="ArrowRight"||e.key==="ArrowDown"?(i+1)%tabs.length:
        e.key==="ArrowLeft"||e.key==="ArrowUp"?(i-1+tabs.length)%tabs.length:
        e.key==="Home"?0:e.key==="End"?tabs.length-1:null;
      if(target===null)return;
      e.preventDefault();activate(target,true);
    });
  });
  next.addEventListener("click",()=>activate(active+1));
  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.attributeName==="lang"))render();
  });
  observer.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  render();
})();