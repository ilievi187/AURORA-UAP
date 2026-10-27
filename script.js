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
    methodKicker:'НАШИЯТ ПОДХОД',methodTitle:'ЛЮБОПИТСТВО БЕЗ ПРИБЪРЗАНИ ЗАКЛЮЧЕНИЯ.',methodBody:'Не приемаме автоматично, че необяснен обект е извънземен. Проверяваме първо конвенционални обяснения и описваме какво знаем, какво не знаем и защо.',method1:'Документиране на източника',method2:'Проверка на обстоятелствата',method3:'Технически анализ',method4:'Публично, честно заключение',
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
    methodKicker:'OUR APPROACH',methodTitle:'CURIOSITY WITHOUT LEAPING TO CONCLUSIONS.',methodBody:'An unidentified object is not automatically extraterrestrial. We first check ordinary explanations and document what is known, unknown, and why.',method1:'Document the source',method2:'Verify the circumstances',method3:'Perform technical analysis',method4:'Publish a transparent conclusion',
    joinKicker:'JOIN THE MISSION',joinTitle:'A COMMUNITY SEEKING ANSWERS',joinBody:'Observe, question, and help build an open, independent research community in Bulgaria.',joinAct1:'Report a sighting',joinAct1sub:'Save a local draft',joinAct2:'Volunteer',joinAct2sub:'Program coming later',joinAct3:'Research',joinAct3sub:'Open methodology',joinCTA:'Draft your sighting',
    protoLabel:'PROTOTYPE:',protoNote:'The organization and platform are in preparation. The map and cases are demos. Online donations will become available after payment-provider verification.',footerSub:'Exploring open skies together.',methodNav:'Methodology',
    dialogKicker:'DEMO SUBMISSION FORM',dialogTitle:'Describe your observation',dialogExplain:'This is a demo form. It saves a draft in this browser, on your device only. Nothing is sent to a server.',formPlace:'Place / city',formDate:'Date and time',formType:'Observation type',typeLight:'Lights',typeObject:'Object',typeOther:'Other / not sure',formDesc:'What did you see?',deleteDraft:'Delete draft',saveDraft:'Save draft',saved:'Saved in this browser only. Nothing was sent anywhere.',deleted:'Draft deleted from this browser.',storageError:'Browser storage is unavailable. Try running the site on a local web server.',caseCaution:'Illustrative example. This is not a real report, verified evidence, or documented observation.'
  }
};


Object.assign(translations, window.AURORA_LOCALES || {});
const donationNav = {
 bg:{navDonate:'ДАРИ',donateKicker:'ПОДКРЕПИ НЕЗАВИСИМИТЕ ИЗСЛЕДВАНИЯ',donateTitle:'ПОМОГНИ НИ ДА ИЗГРАДИМ AURORA.',donateSummary:'Подкрепата ще бъде използвана за оборудване, разследвания, пътувания, софтуер, хостинг и прозрачни разходи по проекта.'},
 en:{navDonate:'DONATE',donateKicker:'SUPPORT INDEPENDENT RESEARCH',donateTitle:'HELP US BUILD AURORA.',donateSummary:'Support will fund equipment, investigations, field travel, software, hosting, and transparent project costs.'},
 de:{navDonate:'SPENDEN',donateKicker:'UNABHÄNGIGE FORSCHUNG UNTERSTÜTZEN',donateTitle:'HILF UNS, AURORA AUFZUBAUEN.',donateSummary:'Unterstützung finanziert Ausrüstung, Untersuchungen, Reisen, Software, Hosting und transparent dokumentierte Projektkosten.'},
 ru:{navDonate:'ПОМОЧЬ',donateKicker:'ПОДДЕРЖАТЬ НЕЗАВИСИМЫЕ ИССЛЕДОВАНИЯ',donateTitle:'ПОМОГИТЕ ПОСТРОИТЬ AURORA.',donateSummary:'Средства планируется направлять на оборудование, исследования, поездки, программы и прозрачные расходы проекта.'},
 'zh-CN':{navDonate:'捐助',donateKicker:'支持独立研究',donateTitle:'帮助我们建设 AURORA。',donateSummary:'支持将用于设备、调查、实地出行、软件、网站托管和公开透明的项目费用。'}
};
for(const [code, keys] of Object.entries(donationNav)) Object.assign(translations[code],keys);

const cases = [
  {id:'m1',city:{bg:'Монтана, САЩ',en:'Montana, USA'},title:{bg:'Три светлини над гора',en:'Three lights above a forest'},description:{bg:'Илюстрация на сигнал за три синхронно движещи се светлини. Методика: проверка за дронове, самолети и перспективни ефекти.',en:'Illustrative report of three lights moving together. Research path: check drones, aircraft, and perspective effects.'},date:'2026-10-19',type:'light',video:false,px:20,py:30,img:'assets/report-triangle.webp'},
  {id:'m2',city:{bg:'Япония',en:'Japan'},title:{bg:'Дискообразен силует над море',en:'Disc-like silhouette above the sea'},description:{bg:'Примерен случай за анализ на снимка: оригинален файл, фокусно разстояние, атмосферни условия и възможни оптични ефекти.',en:'Sample image-analysis case: original file, focal length, weather conditions, and potential optical artifacts.'},date:'2026-10-17',type:'object',video:false,px:84,py:39,img:'assets/report-ocean.webp'},
  {id:'m3',city:{bg:'Черно море',en:'Black Sea'},title:{bg:'Инфрачервен запис от полет',en:'Infrared footage from a flight'},description:{bg:'Демо на проверка на инфрачервен кадър: стабилизация, метаданни, паралакс и възможна грешна интерпретация на сензора.',en:'Demo examination of an infrared frame: stabilization, metadata, parallax, and potential sensor misinterpretation.'},date:'2026-10-15',type:'object',video:true,px:55,py:38,img:'assets/report-infrared.webp'},
  {id:'m4',city:{bg:'Барселона, Испания',en:'Barcelona, Spain'},title:{bg:'Светещи точки над града',en:'Luminous points over a city'},description:{bg:'Пример за няколко светлинни източника в нощно небе, проверявани спрямо астрономически и авиационни данни.',en:'A sample of several lights in the night sky, checked against astronomical and aviation data.'},date:'2026-10-12',type:'light',video:true,px:45,py:32,img:'assets/report-orbs.webp'},
  {id:'m5',city:{bg:'Шумен, България',en:'Shumen, Bulgaria'},title:{bg:'Необичайна светлина над хоризонта',en:'Unusual light on the horizon'},description:{bg:'Демонстрация как местните наблюдения могат да се съпоставят със звезди, спътници и летателни апарати.',en:'Demonstrates how local observations can be compared with stars, satellites, and aircraft.'},date:'2026-10-10',type:'light',video:false,px:52,py:35,img:'assets/report-orbs.webp'},
  {id:'m6',city:{bg:'Буенос Айрес, Аржентина',en:'Buenos Aires, Argentina'},title:{bg:'Неясен обект на видеозапис',en:'Unclear object in a video'},description:{bg:'Пример за анализ на компресия, цифрово увеличение, движение на камерата и липсващ контекст.',en:'Example analysis of compression, digital zoom, camera movement, and missing context.'},date:'2026-10-09',type:'object',video:true,px:27,py:78,img:'assets/report-infrared.webp'},
  {id:'m7',city:{bg:'Норвегия',en:'Norway'},title:{bg:'Светлина в облачна нощ',en:'Light on a cloudy night'},description:{bg:'Учебен сценарий за съпоставка с атмосферни явления и възможни наземни източници на светлина.',en:'Educational scenario comparing atmospheric phenomena and possible ground-based light sources.'},date:'2026-10-08',type:'light',video:false,px:49,py:17,img:'assets/report-triangle.webp'},
  {id:'m8',city:{bg:'Австралия',en:'Australia'},title:{bg:'Тъмен силует по здрач',en:'Dark silhouette at twilight'},description:{bg:'Демонстрация на необходимостта от мащаб, ориентир, автентичен файл и независими свидетели.',en:'Demonstrates the need for scale, references, original files, and independent witnesses.'},date:'2026-10-07',type:'object',video:false,px:82,py:77,img:'assets/report-ocean.webp'}
];

let lang = (()=>{try{const s=localStorage.getItem('aurora-lang');return ['bg','en','de','ru','zh-CN'].includes(s)?s:'bg';}catch(_){return 'bg';}})();
let selectedId = null;
let showAll = false;
const $ = selector => document.querySelector(selector);
const txt = key => translations[lang]?.[key] || translations.en[key] || key;
const reportDialog = $('#reportDialog');
const caseDialog = $('#caseDialog');

function translate() {
  document.documentElement.lang = lang;
  document.title = lang === 'bg' ? 'AURORA — UAP Bulgaria | Изследвай неизвестното' : 'AURORA — UAP Bulgaria | Uncovering the unexplained';
  document.querySelectorAll('[data-i18n]').forEach(el => {const key=el.dataset.i18n;if (txt(key) !== key) el.textContent=txt(key);});
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {el.placeholder=txt(el.dataset.i18nPlaceholder);});
  $('#langToggle').value = lang;
  renderMap();renderReports();
}
function filterCases() {
  const type = document.querySelector('input[name="mapFilter"]:checked')?.value || 'all';
  return cases.filter(c=>type==='all'||(type==='video'?c.video:c.type===type));
}
function renderMap(){
  const list=filterCases(), container=$('#mapPins'); container.replaceChildren();
  $('#visibleCount').textContent=list.length;
  if (!list.some(c=>c.id===selectedId)) {selectedId=null;$('#mapTooltip').hidden=true;}
  list.forEach(c=>{
    const pin=document.createElement('button');pin.type='button';pin.className='map-pin';pin.style.left=`${c.px}%`;pin.style.top=`${c.py}%`;
    pin.setAttribute('aria-label',`${(c.city[lang] || c.city.en)}: ${(c.title[lang] || c.title.en)} (DEMO)`);pin.setAttribute('aria-pressed',String(selectedId===c.id));pin.title=`DEMO — ${(c.city[lang] || c.city.en)}`;
    pin.addEventListener('click',()=>selectPin(c));container.append(pin);
  });
  if(selectedId){const c=cases.find(x=>x.id===selectedId);if(c) updateTooltip(c);}
}
function updateTooltip(c){
  $('#tooltipName').textContent=(c.city[lang] || c.city.en);$('#tooltipDate').textContent=(c.title[lang] || c.title.en);
  $('#mapTooltip').hidden=false;
  // Position popup away from the clicked marker when possible.
  $('#mapTooltip').style.left=`${Math.max(8,Math.min(c.px,67))}%`;
  $('#mapTooltip').style.bottom=`${Math.max(7,Math.min(100-c.py+3,78))}%`;
}
function selectPin(c){selectedId=c.id;updateTooltip(c);renderMap();}
function openCase(c){
  $('#caseTitle').textContent=(c.title[lang] || c.title.en);$('#caseImage').src=c.img;$('#caseDate').textContent=`${c.date} · ${(c.city[lang] || c.city.en)} · DEMO`;
  $('#caseDescription').textContent=(c.description[lang] || c.description.en);caseDialog.showModal();
}
function renderReports(){
  const query=$('#reportSearch').value.trim().toLocaleLowerCase(lang);
  const matching=cases.filter(c=>[c.city.bg,c.city.en,c.title.bg,c.title.en,c.description.bg,c.description.en].some(t=>t.toLocaleLowerCase(lang).includes(query)));
  const display=showAll||query?matching:matching.slice(0,4);const grid=$('#reportGrid');grid.replaceChildren();
  display.forEach(c=>{
    const btn=document.createElement('button');btn.type='button';btn.className='report-card';
    const img=document.createElement('img');img.src=c.img;img.alt=lang==='bg'?'Художествена илюстрация':'Illustrative artwork';img.loading='lazy';
    const date=document.createElement('span');date.className='date';date.textContent=`${c.date} · ${(c.city[lang] || c.city.en)}`;
    const heading=document.createElement('h3');heading.textContent=(c.title[lang] || c.title.en);
    const p=document.createElement('p');p.className='desc';p.textContent=(c.description[lang] || c.description.en);
    const foot=document.createElement('div');foot.className='report-bottom';
    const tag=document.createElement('span');tag.className='report-badge';tag.textContent='DEMO';
    const arrow=document.createElement('span');arrow.className='circle-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='→';foot.append(tag,arrow);
    btn.append(img,date,heading,p,foot);btn.addEventListener('click',()=>openCase(c));grid.append(btn);
  });
  if(!display.length){const empty=document.createElement('p');empty.className='empty-results';empty.textContent=txt('nothingFound');grid.append(empty);}
  const note=$('#reportResultsNote');note.replaceChildren();
  const text=document.createElement('span');text.textContent=txt('resultsSample')+' ';
  note.append(text);
  if(!query){const toggle=document.createElement('button');toggle.className='show-all';toggle.type='button';toggle.textContent=txt(showAll?'showLess':'showAll')+' →';toggle.addEventListener('click',()=>{showAll=!showAll;renderReports();});note.append(toggle);}
}
function openReport(){
  $('#formResponse').textContent='';
  try {const draft=JSON.parse(localStorage.getItem('aurora-demo-draft')||'null');if(draft){$('#fPlace').value=draft.place||'';$('#fCountry').value=draft.country||'';$('#fDate').value=draft.date||'';$('#fType').value=draft.type||'light';$('#fDescription').value=draft.description||'';}}
  catch (_) {/* No saved draft available. */}
  reportDialog.showModal();
}
function saveReport(event){
  event.preventDefault();
  const data={country:$('#fCountry').value.trim().toUpperCase(),place:$('#fPlace').value.trim(),date:$('#fDate').value,type:$('#fType').value,description:$('#fDescription').value.trim()};
  if(data.place.length<1||data.description.length<15||!data.date){$('#reportForm').reportValidity();return;}
  try{localStorage.setItem('aurora-demo-draft',JSON.stringify(data));$('#formResponse').textContent=txt('saved');}catch(_){$('#formResponse').textContent=txt('storageError');}
}
function clearDraft(){
  try{localStorage.removeItem('aurora-demo-draft');$('#reportForm').reset();$('#formResponse').textContent=txt('deleted');}
  catch(_){$('#formResponse').textContent=txt('storageError');}
}
function setup(){
  $('#year').textContent=new Date().getFullYear();
  $('#langToggle').addEventListener('change', e=>{lang=e.target.value;try{localStorage.setItem('aurora-lang',lang);}catch(_){}translate();});
  $('#menuToggle').addEventListener('click',()=>{const nav=$('#mobileNav');nav.hidden=!nav.hidden;$('#menuToggle').setAttribute('aria-expanded',String(!nav.hidden));});
  $('#mobileNav').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('#mobileNav').hidden=true;$('#menuToggle').setAttribute('aria-expanded','false');}));
  document.querySelectorAll('[data-open-report]').forEach(btn=>btn.addEventListener('click',openReport));
  $('#closeDialog').addEventListener('click',()=>reportDialog.close());$('#caseClose').addEventListener('click',()=>caseDialog.close());
  reportDialog.addEventListener('click',e=>{if(e.target===reportDialog)reportDialog.close();});
  caseDialog.addEventListener('click',e=>{if(e.target===caseDialog)caseDialog.close();});
  $('#reportForm').addEventListener('submit',saveReport);$('#clearDraft').addEventListener('click',clearDraft);
  $('#reportSearch').addEventListener('input',renderReports);
  document.querySelectorAll('input[name="mapFilter"]').forEach(x=>x.addEventListener('change',renderMap));
  $('#tooltipRead').addEventListener('click',()=>{const c=cases.find(x=>x.id===selectedId);if(c)openCase(c);});
  // Leave the selected language and drafts private to the current browser.
  translate();
  // Optional link from country explorer; still a local-only draft and NEVER submitted.
  const url=new URL(location.href);
  if(url.searchParams.get('report')==='draft'&&/^[A-Za-z]{2}$/.test(url.searchParams.get('country')||'')){
    const requested=url.searchParams.get('country').toUpperCase();
    window.addEventListener('aurora:gate-closed',()=>{
      if(!reportDialog.open){openReport();$('#fCountry').value=requested;}
      url.searchParams.delete('report');url.searchParams.delete('country');
      history.replaceState(null,'',url.pathname+(url.search||'')+url.hash);
    },{once:true});
  }
}
setup();
