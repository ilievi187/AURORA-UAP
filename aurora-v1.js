/* AURORA cinematic V1 progressive enhancement.
   The underlying prototype remains usable without this file. */
"use strict";
(()=>{
  const gate=document.getElementById("languageGate");
  const options=document.getElementById("gateLanguageGrid");
  const trigger=document.getElementById("openLanguageGate");
  const select=document.getElementById("langToggle");
  if(!gate||!options||!trigger||!select)return;

  const languages=[
    ["bg","Български","Bulgarian","BG"],
    ["en","English","English","EN"],
    ["de","Deutsch","German","DE"],
    ["ru","Русский","Russian","RU"],
    ["zh-CN","简体中文","Chinese","ZH"],
    ["fr","Français","French","FR"],
    ["es","Español","Spanish","ES"],
    ["it","Italiano","Italian","IT"],
    ["pt","Português","Portuguese","PT"],
    ["tr","Türkçe","Turkish","TR"],
    ["ro","Română","Romanian","RO"],
    ["el","Ελληνικά","Greek","EL"],
    ["sr","Српски","Serbian","SR"],
    ["uk","Українська","Ukrainian","UK"],
    ["pl","Polski","Polish","PL"],
    ["ar","العربية","Arabic","AR"],
    ["ja","日本語","Japanese","JA"],
    ["ko","한국어","Korean","KO"]
  ];
  const interfaceBadges={
    bg:"ИНТЕРФЕЙС",en:"INTERFACE",de:"OBERFLÄCHE",ru:"ИНТЕРФЕЙС","zh-CN":"界面",
    fr:"INTERFACE",es:"INTERFAZ",it:"INTERFACCIA",pt:"INTERFACE",tr:"ARAYÜZ",
    ro:"INTERFAȚĂ",el:"ΔΙΕΠΑΦΗ",sr:"ИНТЕРФЕЈС",uk:"ІНТЕРФЕЙС",pl:"INTERFEJS",
    ar:"الواجهة",ja:"インターフェース",ko:"인터페이스"
  };
  const languageGroupLabels={
    bg:"Език на интерфейса",en:"Interface language",de:"Sprache der Benutzeroberfläche",ru:"Язык интерфейса",
    "zh-CN":"界面语言",fr:"Langue de l’interface",es:"Idioma de la interfaz",it:"Lingua dell’interfaccia",
    pt:"Idioma da interface",tr:"Arayüz dili",ro:"Limba interfeței",el:"Γλώσσα διεπαφής",
    sr:"Језик интерфејса",uk:"Мова інтерфейсу",pl:"Język interfejsu",ar:"لغة الواجهة",
    ja:"インターフェース言語",ko:"인터페이스 언어"
  };
  const extra={
    fr:{navHome:"Accueil",navMission:"Mission",navResearch:"Recherche",navMap:"Carte",navReports:"Signalements",navJoin:"Participer",navDonate:"FAIRE UN DON",heroKicker:"DONNÉES OUVERTES. ESPRIT CRITIQUE. REGARDONS PLUS HAUT.",heroTitle1:"EXPLORER",heroTitle2:"L'INEXPLIQUÉ",heroBody:"AURORA est une initiative indépendante en Bulgarie dédiée à la documentation et à l'analyse rigoureuse des phénomènes aériens non identifiés.",reportButton:"Signaler une observation",exploreButton:"Explorer la recherche",joinButton:"Rejoindre"},
    es:{navHome:"Inicio",navMission:"Misión",navResearch:"Investigación",navMap:"Mapa",navReports:"Informes",navJoin:"Participa",navDonate:"DONAR",heroKicker:"DATOS ABIERTOS. PENSAMIENTO CRÍTICO. UN CIELO POR EXPLORAR.",heroTitle1:"EXPLORAR",heroTitle2:"LO INEXPLICABLE",heroBody:"AURORA es una iniciativa independiente en Bulgaria que documenta y analiza fenómenos aéreos no identificados con rigor y transparencia.",reportButton:"Informar de un avistamiento",exploreButton:"Explorar investigaciones",joinButton:"Únete"},
    it:{navHome:"Home",navMission:"Missione",navResearch:"Ricerca",navMap:"Mappa",navReports:"Segnalazioni",navJoin:"Partecipa",navDonate:"DONA",heroKicker:"DATI APERTI. PENSIERO CRITICO. OSSERVIAMO IL CIELO.",heroTitle1:"ESPLORARE",heroTitle2:"L'INSPIEGABILE",heroBody:"AURORA è un'iniziativa indipendente in Bulgaria per documentare e analizzare con rigore i fenomeni aerei non identificati.",reportButton:"Segnala un avvistamento",exploreButton:"Esplora la ricerca",joinButton:"Partecipa"},
    pt:{navHome:"Início",navMission:"Missão",navResearch:"Pesquisa",navMap:"Mapa",navReports:"Relatos",navJoin:"Participar",navDonate:"DOAR",heroKicker:"DADOS ABERTOS. PENSAMENTO CRÍTICO. CÉUS ABERTOS.",heroTitle1:"EXPLORAR",heroTitle2:"O INEXPLICÁVEL",heroBody:"AURORA é uma iniciativa independente na Bulgária dedicada à documentação e à análise rigorosa de fenómenos aéreos não identificados.",reportButton:"Relatar avistamento",exploreButton:"Explorar pesquisas",joinButton:"Participar"},
    tr:{navHome:"Ana sayfa",navMission:"Misyon",navResearch:"Araştırma",navMap:"Harita",navReports:"Raporlar",navJoin:"Katıl",navDonate:"BAĞIŞ YAP",heroKicker:"AÇIK VERİ. ELEŞTİREL DÜŞÜNCE. AÇIK GÖKYÜZÜ.",heroTitle1:"AÇIKLANAMAYANI",heroTitle2:"ARAŞTIR",heroBody:"AURORA, tanımlanamayan hava olaylarını bilimsel yaklaşımla belgeleyen ve inceleyen Bulgaristan merkezli bağımsız bir girişimdir.",reportButton:"Gözlem bildir",exploreButton:"Araştırmaları keşfet",joinButton:"Katıl"},
    ro:{navHome:"Acasă",navMission:"Misiune",navResearch:"Cercetare",navMap:"Hartă",navReports:"Rapoarte",navJoin:"Participă",navDonate:"DONEAZĂ",heroKicker:"DATE DESCHISE. GÂNDIRE CRITICĂ. CER DESCHIS.",heroTitle1:"EXPLORĂM",heroTitle2:"NEEXPLICATUL",heroBody:"AURORA este o inițiativă independentă din Bulgaria dedicată documentării și analizei riguroase a fenomenelor aeriene neidentificate.",reportButton:"Raportează o observație",exploreButton:"Descoperă cercetarea",joinButton:"Participă"},
    el:{navHome:"Αρχική",navMission:"Αποστολή",navResearch:"Έρευνα",navMap:"Χάρτης",navReports:"Αναφορές",navJoin:"Συμμετοχή",navDonate:"ΔΩΡΕΑ",heroKicker:"ΑΝΟΙΧΤΑ ΔΕΔΟΜΕΝΑ. ΚΡΙΤΙΚΗ ΣΚΕΨΗ. ΑΝΟΙΧΤΟΣ ΟΥΡΑΝΟΣ.",heroTitle1:"ΕΞΕΡΕΥΝΟΥΜΕ",heroTitle2:"ΤΟ ΑΝΕΞΗΓΗΤΟ",heroBody:"Η AURORA είναι μια ανεξάρτητη πρωτοβουλία στη Βουλγαρία για την τεκμηρίωση και προσεκτική ανάλυση μη αναγνωρισμένων εναέριων φαινομένων.",reportButton:"Αναφορά παρατήρησης",exploreButton:"Εξερεύνηση έρευνας",joinButton:"Συμμετοχή"},
    sr:{navHome:"Почетна",navMission:"Мисија",navResearch:"Истраживање",navMap:"Мапа",navReports:"Пријаве",navJoin:"Придружи се",navDonate:"ДОНИРАЈ",heroKicker:"ОТВОРЕНИ ПОДАЦИ. КРИТИЧКО МИШЉЕЊЕ. ОТВОРЕНО НЕБО.",heroTitle1:"ИСТРАЖУЈЕМО",heroTitle2:"НЕОБЈАШЊЕНО",heroBody:"AURORA је независна иницијатива у Бугарској за документовање и анализу неидентификованих ваздушних појава.",reportButton:"Пријави посматрање",exploreButton:"Истражи пројекат",joinButton:"Придружи се"},
    uk:{navHome:"Головна",navMission:"Місія",navResearch:"Дослідження",navMap:"Мапа",navReports:"Повідомлення",navJoin:"Долучитися",navDonate:"ПІДТРИМАТИ",heroKicker:"ВІДКРИТІ ДАНІ. КРИТИЧНЕ МИСЛЕННЯ. ВІДКРИТЕ НЕБО.",heroTitle1:"ДОСЛІДЖУЄМО",heroTitle2:"НЕПОЯСНЕНЕ",heroBody:"AURORA — незалежна ініціатива в Болгарії для документування та ретельного аналізу неідентифікованих повітряних явищ.",reportButton:"Повідомити про спостереження",exploreButton:"Переглянути дослідження",joinButton:"Долучитися"},
    pl:{navHome:"Start",navMission:"Misja",navResearch:"Badania",navMap:"Mapa",navReports:"Zgłoszenia",navJoin:"Dołącz",navDonate:"WESPRZYJ",heroKicker:"OTWARTE DANE. KRYTYCZNE MYŚLENIE. OTWARTE NIEBO.",heroTitle1:"ODKRYWAMY",heroTitle2:"NIEWYJAŚNIONE",heroBody:"AURORA to niezależna inicjatywa w Bułgarii zajmująca się dokumentowaniem i rzetelną analizą niezidentyfikowanych zjawisk powietrznych.",reportButton:"Zgłoś obserwację",exploreButton:"Odkryj badania",joinButton:"Dołącz"},
    ar:{navHome:"الرئيسية",navMission:"المهمة",navResearch:"الأبحاث",navMap:"الخريطة",navReports:"البلاغات",navJoin:"شارك",navDonate:"تبرع",heroKicker:"بيانات مفتوحة. تفكير نقدي. سماء مفتوحة.",heroTitle1:"نستكشف",heroTitle2:"ما لا تفسير له",heroBody:"أورورا مبادرة مستقلة في بلغاريا لتوثيق الظواهر الجوية غير المحددة وتحليلها بعناية وشفافية.",reportButton:"سجّل مشاهدة",exploreButton:"استكشف الأبحاث",joinButton:"شارك"},
    ja:{navHome:"ホーム",navMission:"使命",navResearch:"研究",navMap:"地図",navReports:"報告",navJoin:"参加",navDonate:"寄付",heroKicker:"オープンデータ。批判的思考。未知の空へ。",heroTitle1:"未解明を",heroTitle2:"探究する",heroBody:"AURORAは、未確認航空現象を慎重に記録・分析するブルガリアの独立した研究イニシアチブです。",reportButton:"目撃情報を報告",exploreButton:"研究を見る",joinButton:"参加する"},
    ko:{navHome:"홈",navMission:"사명",navResearch:"연구",navMap:"지도",navReports:"제보",navJoin:"참여",navDonate:"후원",heroKicker:"열린 데이터. 비판적 사고. 열린 하늘.",heroTitle1:"미지의 현상을",heroTitle2:"탐구하다",heroBody:"AURORA는 미확인 항공 현상을 신중하게 기록하고 분석하는 불가리아의 독립 연구 이니셔티브입니다.",reportButton:"목격 제보",exploreButton:"연구 살펴보기",joinButton:"참여하기"}
  };
  for(const [code,dict] of Object.entries(extra)){
    translations[code]={...translations.en,...(translations[code]||{}),...dict};
  }
  for(const [code,native,english,short] of languages){
    if(!select.querySelector('option[value="'+code+'"]')){
      const opt=document.createElement("option");opt.value=code;opt.textContent=native;select.append(opt);
    }
    const btn=document.createElement("button");btn.type="button";btn.dataset.language=code;
    btn.setAttribute("aria-label",native+" — "+english+" — "+(interfaceBadges[code]||interfaceBadges.en));
    const flag=document.createElement("span");flag.className="flag";flag.textContent=short;
    const title=document.createElement("strong");title.textContent=native;
    const badge=document.createElement("small");badge.textContent=interfaceBadges[code]||interfaceBadges.en;
    btn.append(flag,title,badge);options.append(btn);
  }
  const t={
    bg:["Избери език","Избери езика на интерфейса за AURORA.","Езикът на интерфейса се задава тук. Досиетата може да останат на английски, ако няма пълен превод."],
    en:["Choose your language","Select the interface language for AURORA.","This sets the interface language. Case files may remain in English when a complete translation is unavailable."],
    de:["Sprache wählen","Wähle die Sprache der AURORA-Benutzeroberfläche.","Hier wird die Sprache der Benutzeroberfläche festgelegt. Fallakten können auf Englisch bleiben, wenn keine vollständige Übersetzung verfügbar ist."],
    ru:["Выберите язык","Выберите язык интерфейса AURORA.","Здесь выбирается язык интерфейса. Досье может оставаться на английском, если полного перевода нет."],
    "zh-CN":["选择语言","选择 AURORA 的界面语言。","此选项设置界面语言。若没有完整译文，案例档案可能仍为英文。"],
    fr:["Choisir la langue","Sélectionnez la langue de l’interface AURORA.","Cette option définit la langue de l’interface. Les dossiers peuvent rester en anglais lorsqu’aucune traduction complète n’est disponible."],
    es:["Elige tu idioma","Selecciona el idioma de la interfaz de AURORA.","Esta opción establece el idioma de la interfaz. Los expedientes pueden seguir en inglés si no hay una traducción completa."],
    it:["Scegli la lingua","Seleziona la lingua dell’interfaccia AURORA.","Questa scelta imposta la lingua dell’interfaccia. I dossier possono restare in inglese se non è disponibile una traduzione completa."],
    pt:["Escolha o idioma","Selecione o idioma da interface da AURORA.","Esta opção define o idioma da interface. Os dossiês podem permanecer em inglês quando não houver uma tradução completa."],
    tr:["Dilinizi seçin","AURORA arayüz dilini seçin.","Bu seçim arayüz dilini belirler. Tam çeviri yoksa dosyalar İngilizce kalabilir."],
    ro:["Alege limba","Selectează limba interfeței AURORA.","Această opțiune stabilește limba interfeței. Dosarele pot rămâne în engleză dacă nu este disponibilă o traducere completă."],
    el:["Επιλέξτε γλώσσα","Επιλέξτε τη γλώσσα διεπαφής του AURORA.","Αυτή η επιλογή ορίζει τη γλώσσα διεπαφής. Οι φάκελοι μπορεί να παραμείνουν στα αγγλικά όταν δεν υπάρχει πλήρης μετάφραση."],
    sr:["Изабери језик","Изабери језик интерфејса за AURORA.","Овде се бира језик интерфејса. Досијеи могу остати на енглеском ако пун превод није доступан."],
    uk:["Оберіть мову","Оберіть мову інтерфейсу AURORA.","Тут обирається мова інтерфейсу. Досьє можуть залишатися англійською, якщо повного перекладу немає."],
    pl:["Wybierz język","Wybierz język interfejsu AURORA.","Ten wybór ustawia język interfejsu. Akta mogą pozostać po angielsku, gdy pełne tłumaczenie nie jest dostępne."],
    ar:["اختر لغتك","اختر لغة واجهة AURORA.","يحدد هذا الخيار لغة الواجهة. قد تبقى ملفات القضايا باللغة الإنجليزية عند عدم توفر ترجمة كاملة."],
    ja:["言語を選択","AURORA のインターフェース言語を選択してください。","この設定はインターフェースの言語を選びます。完全な翻訳がない場合、事例ファイルは英語のまま表示されることがあります。"],
    ko:["언어 선택","AURORA 인터페이스 언어를 선택하세요.","이 설정은 인터페이스 언어를 선택합니다. 완전한 번역이 없으면 사례 기록은 영어로 표시될 수 있습니다."]
  };
  const selectedStatusLabel={
    bg:"избран език",en:"language selected",de:"Sprache ausgewählt",ru:"выбран язык","zh-CN":"已选择语言",
    fr:"langue sélectionnée",es:"idioma seleccionado",it:"lingua selezionata",pt:"idioma selecionado",tr:"dil seçildi",
    ro:"limbă selectată",el:"επιλεγμένη γλώσσα",sr:"изабран језик",uk:"мову обрано",pl:"wybrano język",
    ar:"تم اختيار اللغة",ja:"言語を選択済み",ko:"언어 선택됨"
  };
  const awaitingSelection={
    bg:"ИЗБЕРИ ЕЗИК НА ИНТЕРФЕЙСА",en:"CHOOSE AN INTERFACE LANGUAGE",de:"SPRACHE DER OBERFLÄCHE WÄHLEN",
    ru:"ВЫБЕРИТЕ ЯЗЫК ИНТЕРФЕЙСА","zh-CN":"请选择界面语言",fr:"CHOISISSEZ LA LANGUE DE L’INTERFACE",
    es:"ELIGE EL IDIOMA DE LA INTERFAZ",it:"SCEGLI LA LINGUA DELL’INTERFACCIA",pt:"ESCOLHA O IDIOMA DA INTERFACE",
    tr:"ARAYÜZ DİLİNİ SEÇİN",ro:"ALEGE LIMBA INTERFEȚEI",el:"ΕΠΙΛΕΞΤΕ ΓΛΩΣΣΑ ΔΙΕΠΑΦΗΣ",
    sr:"ИЗАБЕРИ ЈЕЗИК ИНТЕРФЕЈСА",uk:"ОБЕРІТЬ МОВУ ІНТЕРФЕЙСУ",pl:"WYBIERZ JĘZYK INTERFEJSU",
    ar:"اختر لغة الواجهة",ja:"インターフェース言語を選択",ko:"인터페이스 언어 선택"
  };
  // First visit: choose language and Continue. Returning visitors enter immediately.
  // The LANGUAGE button always offers an optional, accessible re-selection.
  let previousFocus=null;
  let isMandatoryEntry=true;
  let selectedLanguage=null;
  let transitionPending=false;
  const continueButton=document.getElementById("gateContinue");
  const continueLabel=document.getElementById("gateContinueLabel");
  const cancelButton=document.getElementById("gateCancel");
  const selectionStatus=document.getElementById("gateSelection");
  const getStored=()=>{
    try{
      const q=new URLSearchParams(location.search).get("lang");
      if(languages.some(item=>item[0]===q)){try{localStorage.setItem("aurora-lang",q)}catch(_){}return q;}
      return localStorage.getItem("aurora-lang");
    }catch(_){return null}
  };
  const continueTranslations={
    bg:"ПРОДЪЛЖИ",en:"CONTINUE",de:"WEITER",ru:"ПРОДОЛЖИТЬ","zh-CN":"继续",
    fr:"CONTINUER",es:"CONTINUAR",it:"CONTINUA",pt:"CONTINUAR",tr:"DEVAM ET",
    ro:"CONTINUĂ",el:"ΣΥΝΕΧΕΙΑ",sr:"НАСТАВИ",uk:"ПРОДОВЖИТИ",pl:"KONTYNUUJ",
    ar:"متابعة",ja:"続ける",ko:"계속"
  };
  function updateGateText(code){
    const labels=t[code]||t.en;
    document.getElementById("gateHeading").textContent=labels[0];
    document.getElementById("gateSubtitle").textContent=labels[1];
    document.getElementById("gateDisclaimer").textContent=labels[2];
    options.setAttribute("aria-label",languageGroupLabels[code]||languageGroupLabels.en);
    continueLabel.textContent=continueTranslations[code]||continueTranslations.en;
    document.querySelectorAll("[data-language]").forEach(btn=>{
      const active=btn.dataset.language===selectedLanguage;
      btn.setAttribute("aria-pressed",String(active));
      btn.classList.toggle("is-selected",active);
    });
    continueButton.disabled=!selectedLanguage;
    const chosen=languages.find(item=>item[0]===selectedLanguage);
    selectionStatus.textContent=chosen
      ? "✓ "+chosen[1]+" / "+chosen[2]+" — "+(selectedStatusLabel[code]||selectedStatusLabel.en)
      : awaitingSelection[code]||awaitingSelection.en;
  }
  function openGate(mandatory=false){
    previousFocus=document.activeElement;
    isMandatoryEntry=mandatory;
    transitionPending=false;
    gate.hidden=false;
    gate.classList.remove("gate-exit");
    gate.dataset.entry=mandatory?"required":"optional";
    cancelButton.hidden=mandatory;
    document.body.classList.add("gate-open");
    document.querySelector(".site-shell").inert=true;
    updateGateText(selectedLanguage||lang);
    const current=options.querySelector('[data-language="'+selectedLanguage+'"]');
    (current||options.querySelector("button"))?.focus();
    window.dispatchEvent(new CustomEvent("aurora:gate-open"));
  }
  function closeGate(){
    gate.hidden=true;
    gate.classList.remove("gate-exit");
    document.body.classList.remove("gate-open");
    document.querySelector(".site-shell").inert=false;
    if(previousFocus&&previousFocus.isConnected&&typeof previousFocus.focus==="function"){
      previousFocus.focus();
    }else{
      document.querySelector(".site-header .brand")?.focus();
    }
    window.dispatchEvent(new CustomEvent("aurora:gate-closed"));
  }
  function selectLanguage(code){
    if(!languages.some(item=>item[0]===code)||transitionPending)return;
    selectedLanguage=code;
    updateGateText(code);
    continueButton.focus();
  }
  function continueToAurora(){
    if(!selectedLanguage||transitionPending)return;
    transitionPending=true;
    lang=selectedLanguage;
    try{localStorage.setItem("aurora-lang",lang)}catch(_){}
    translate();
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      closeGate();return;
    }
    gate.classList.add("gate-exit");
    window.setTimeout(closeGate,650);
  }
  options.addEventListener("click",event=>{
    const btn=event.target.closest("button[data-language]");
    if(btn)selectLanguage(btn.dataset.language);
  });
  continueButton.addEventListener("click",continueToAurora);
  cancelButton.addEventListener("click",()=>{if(!isMandatoryEntry&&!transitionPending)closeGate()});
  gate.addEventListener("keydown",event=>{
    if(event.key==="Escape"){
      event.preventDefault();
      if(!isMandatoryEntry&&!transitionPending)closeGate();
      return;
    }
    if(event.key!=="Tab")return;
    const focusables=[...options.querySelectorAll("button:not(:disabled)")];
    if(!continueButton.disabled)focusables.push(continueButton);
    if(!cancelButton.hidden&&!cancelButton.disabled)focusables.push(cancelButton);
    const first=focusables[0],last=focusables[focusables.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  });
  trigger.addEventListener("click",()=>openGate(false));
  document.getElementById("footerLanguageGate")?.addEventListener("click",()=>openGate(false));
  const stored=getStored();
  selectedLanguage=languages.some(item=>item[0]===stored)?stored:null;
  if(selectedLanguage&&lang!==selectedLanguage){lang=selectedLanguage;translate()}
  if(selectedLanguage){
    // Remove initial modal and body scroll lock when visitor already opted in.
    // Keep the selector accessible through the header/footer LANGUAGE controls.
    closeGate();
  }else{
    openGate(true);
  }

  const prefersReduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!prefersReduced&&"IntersectionObserver" in window){
    document.documentElement.classList.add("has-motion");
    const sections=document.querySelectorAll(".stats,.section-heading,.feature-card,.map-panel,.report-card,.methodology,.join-section,.donate-banner");
    sections.forEach(el=>el.classList.add("reveal-section"));
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");obs.unobserve(entry.target)}});
    },{rootMargin:"0px 0px -35px 0px",threshold:0.06});
    sections.forEach(el=>obs.observe(el));
    // Report cards are re-rendered on filtering; leave them visible by default.
    document.querySelectorAll(".report-card").forEach(el=>el.classList.add("is-visible"));
  }

  const track=document.createElement("div");track.className="progress-track";
  const line=document.createElement("span");track.append(line);document.body.append(track);
  let queued=false;
  function updateScroll(){
    queued=false;
    const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    track.style.setProperty("--scroll-pct",Math.max(0,Math.min(100,scrollY/max*100)).toFixed(2)+"%");
  }
  window.addEventListener("scroll",()=>{
    if(!queued){queued=true;requestAnimationFrame(updateScroll)}
  },{passive:true});
  window.addEventListener("resize",updateScroll,{passive:true});
  updateScroll();

  if("IntersectionObserver" in window){
    const links=Array.from(document.querySelectorAll(".desktop-nav a[href^='#']"));
    const nodes=links.map(a=>document.querySelector(a.getAttribute("href"))).filter(Boolean);
    const navObs=new IntersectionObserver(entries=>{
      for(const item of entries){
        if(!item.isIntersecting)continue;
        links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+item.target.id));
      }
    },{rootMargin:"-20% 0px -67% 0px",threshold:0});
    nodes.forEach(el=>navObs.observe(el));
  }
})();
