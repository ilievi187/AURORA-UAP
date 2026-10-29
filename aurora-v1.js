/* AURORA cinematic V1 progressive enhancement.
   The underlying prototype remains usable without this file. */
"use strict";
(()=>{
  const gate=document.getElementById("languageGate");
  const options=document.getElementById("gateLanguageGrid");
  const trigger=document.getElementById("openLanguageGate");
  const select=document.getElementById("langToggle");
  if(!gate||!options||!trigger||!select)return;

  // All 18 supported locales provide full homepage and subpage interface coverage.
  const languages=[
    ["bg","Български","Bulgarian","BG",true],
    ["en","English","English","EN",true],
    ["de","Deutsch","German","DE",true],
    ["ru","Русский","Russian","RU",true],
    ["zh-CN","简体中文","Chinese","ZH",true],
    ["fr","Français","French","FR",true],
    ["es","Español","Spanish","ES",true],
    ["it","Italiano","Italian","IT",true],
    ["pt","Português","Portuguese","PT",true],
    ["tr","Türkçe","Turkish","TR",true],
    ["ro","Română","Romanian","RO",true],
    ["el","Ελληνικά","Greek","EL",true],
    ["sr","Српски","Serbian","SR",true],
    ["uk","Українська","Ukrainian","UK",true],
    ["pl","Polski","Polish","PL",true],
    ["ar","العربية","Arabic","AR",true],
    ["ja","日本語","Japanese","JA",true],
    ["ko","한국어","Korean","KO",true]
  ];
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
  for(const [code,native,english,short,complete] of languages){
    if(!select.querySelector('option[value="'+code+'"]')){
      const opt=document.createElement("option");opt.value=code;opt.textContent=native;select.append(opt);
    }
    const btn=document.createElement("button");btn.type="button";btn.dataset.language=code;
    btn.setAttribute("aria-label",native+" — "+english+(complete?"":", partial translation"));
    const flag=document.createElement("span");flag.className="flag";flag.textContent=short;
    const title=document.createElement("strong");title.textContent=native;
    const badge=document.createElement("small");badge.textContent=complete?"Full locale":"Preview · EN fallback";
    btn.append(flag,title,badge);options.append(btn);
  }
  const t={
    bg:["Избери език","Избери езика, на който искаш да изследваш AURORA.","Езиковата настройка се запазва във всички страници на платформата."],
    en:["Choose your language","Select your interface language to enter AURORA.","Your selected language persists across all pages on the platform."],
    de:["Sprache wählen","Wähle deine Sprache für AURORA.","Deine Sprachauswahl bleibt auf allen Seiten der Plattform erhalten."],
    ru:["Выберите язык","Выберите язык интерфейса AURORA.","Выбранный язык сохраняется на всех страницах платформы."],
    "zh-CN":["选择语言","选择进入 AURORA 的界面语言。","所选语言将在平台的所有页面中保持生效。"],
    fr:["Choisir la langue","Sélectionnez votre langue d'interface pour entrer dans AURORA.","Votre langue est mémorisée sur toutes les pages de la plateforme."],
    es:["Elige tu idioma","Selecciona el idioma de la interfaz para entrar en AURORA.","Tu idioma seleccionado se mantiene en todas las páginas de la plataforma."],
    it:["Scegli la lingua","Seleziona la lingua dell'interfaccia per entrare in AURORA.","La lingua scelta rimane attiva in tutte le pagine della piattaforma."],
    pt:["Escolha o idioma","Selecione o idioma da interface para entrar na AURORA.","O idioma escolhido é mantido em todas as páginas da plataforma."],
    tr:["Dilinizi seçin","AURORA’ya girmek için arayüz dilinizi seçin.","Seçtiğiniz dil platformun tüm sayfalarında korunur."],
    ro:["Alege limba","Selectează limba interfeței pentru a intra în AURORA.","Limba selectată se păstrează în toate paginile platformei."],
    el:["Επιλέξτε γλώσσα","Επιλέξτε τη γλώσσα διεπαφής για είσοδο στο AURORA.","Η επιλεγμένη γλώσσα διατηρείται σε όλες τις σελίδες της πλατφόρμας."],
    sr:["Изабери језик","Изабери језик интерфејса за улазак у AURORA.","Изабрани језик се памти на свим страницама платформе."],
    uk:["Оберіть мову","Оберіть мову інтерфейсу для входу в AURORA.","Обрана мова зберігається на всіх сторінках платформи."],
    pl:["Wybierz język","Wybierz język interfejsu, aby wejść do AURORA.","Wybrany język jest zapamiętywany na wszystkich stronach platformy."],
    ar:["اختر لغتك","حدد لغة الواجهة للدخول إلى AURORA.","تُحفظ اللغة المختارة في جميع صفحات المنصة."],
    ja:["言語を選択","AURORA に入るための表示言語を選択してください。","選択した言語はプラットフォームの全ページで保持されます。"],
    ko:["언어 선택","AURORA에 입장할 인터페이스 언어를 선택하세요.","선택한 언어는 플랫폼의 모든 페이지에서 유지됩니다."]
  };
  const selectedStatusLabel={
    bg:"избран език",en:"language selected",de:"Sprache ausgewählt",ru:"выбран язык","zh-CN":"已选择语言",
    fr:"langue sélectionnée",es:"idioma seleccionado",it:"lingua selezionata",pt:"idioma selecionado",tr:"dil seçildi",
    ro:"limbă selectată",el:"επιλεγμένη γλώσσα",sr:"изабран језик",uk:"мову обрано",pl:"wybrano język",
    ar:"تم اختيار اللغة",ja:"言語を選択済み",ko:"언어 선택됨"
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
      : "AWAITING LANGUAGE SELECTION";
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
