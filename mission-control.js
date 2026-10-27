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