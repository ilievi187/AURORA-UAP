/* Complete interface/localization for the publisher directory.
 * Publisher text remains verbatim and source-attributed; it is not an incident report. */
(()=>{
 "use strict";
 const langs=["bg","en","de","ru","zh-CN","fr","es","it","pt","tr","ro","el","sr","uk","pl","ar","ja","ko"];
 const labels={
 bg:["МЕЖДУНАРОДНИ ИЗТОЧНИЦИ","Официални RSS и Atom потоци на издатели и институции. Показваме оригиналните източници, а не потвърдени UAP случаи.","Съвпадението по ключова дума не е потвърдено наблюдение. Оригиналните публикации остават при издателите.","Регион","Каталог","Състояние на източниците","Съвпадения по ключови думи","Провери заглавия","Провери състоянието","Изберете език"],
 en:["INTERNATIONAL SOURCES","Official RSS and Atom feeds from publishers and institutions. These are original source directories, not confirmed UAP cases.","A keyword match is not a confirmed sighting. Original articles remain with their publishers.","Region","Source directory","Source health","Keyword matches","Check headlines","Check status","Choose language"],
 de:["INTERNATIONALE QUELLEN","Offizielle RSS- und Atom-Feeds von Medien und Institutionen. Dies ist ein Quellenverzeichnis, keine Liste bestätigter UAP-Fälle.","Ein Schlagworttreffer ist keine bestätigte Sichtung. Die Originalbeiträge bleiben bei den Herausgebern.","Region","Quellenverzeichnis","Quellenstatus","Schlagworttreffer","Schlagzeilen prüfen","Status prüfen","Sprache wählen"],
 ru:["МЕЖДУНАРОДНЫЕ ИСТОЧНИКИ","Официальные RSS- и Atom-ленты изданий и учреждений. Это каталог источников, а не подтверждённых случаев UAP.","Совпадение по ключевым словам не подтверждает наблюдение. Оригиналы доступны у издателей.","Регион","Каталог источников","Доступность источников","Совпадения по словам","Проверить заголовки","Проверить состояние","Выбрать язык"],
 "zh-CN":["国际信息来源","来自媒体和机构的官方 RSS 和 Atom 订阅源。这里是来源目录，而非已证实的 UAP 事件。","关键词匹配并非已证实的目击事件。原始文章仍由发布者提供。","地区","来源目录","来源状态","关键词匹配","检查标题","检查状态","选择语言"],
 fr:["SOURCES INTERNATIONALES","Flux RSS et Atom officiels des médias et institutions. Il s'agit d'un répertoire de sources, pas de cas UAP confirmés.","Un mot-clé correspondant ne prouve aucune observation. Les articles originaux restent chez leurs éditeurs.","Région","Répertoire des sources","État des sources","Correspondances","Vérifier les titres","Vérifier l'état","Choisir la langue"],
 es:["FUENTES INTERNACIONALES","Canales RSS y Atom oficiales de medios e instituciones. Es un catálogo de fuentes, no casos UAP confirmados.","Una coincidencia de palabras clave no confirma un avistamiento. Los artículos originales siguen en sus medios.","Región","Catálogo de fuentes","Estado de las fuentes","Coincidencias","Comprobar titulares","Comprobar estado","Elegir idioma"],
 it:["FONTI INTERNAZIONALI","Feed RSS e Atom ufficiali di editori e istituzioni. È un catalogo di fonti, non un elenco di casi UAP confermati.","Una corrispondenza di parole chiave non conferma un avvistamento. Gli articoli restano presso gli editori.","Regione","Catalogo delle fonti","Stato delle fonti","Corrispondenze","Verifica titoli","Verifica stato","Scegli lingua"],
 pt:["FONTES INTERNACIONAIS","Feeds RSS e Atom oficiais de editores e instituições. Este é um catálogo de fontes, não de casos UAP confirmados.","Uma correspondência de palavras-chave não confirma um avistamento. Os artigos originais permanecem nos editores.","Região","Catálogo de fontes","Estado das fontes","Correspondências","Verificar títulos","Verificar estado","Selecionar idioma"],
 tr:["ULUSLARARASI KAYNAKLAR","Yayıncı ve kurumların resmî RSS ve Atom akışları. Bu bir kaynak dizinidir, doğrulanmış UAP vakaları değildir.","Anahtar kelime eşleşmesi doğrulanmış gözlem değildir. Özgün makaleler yayıncılarda kalır.","Bölge","Kaynak dizini","Kaynak durumu","Anahtar sözcük eşleşmeleri","Başlıkları kontrol et","Durumu kontrol et","Dil seç"],
 ro:["SURSE INTERNAȚIONALE","Fluxuri RSS și Atom oficiale de la publicații și instituții. Acesta este un catalog de surse, nu cazuri UAP confirmate.","Potrivirea unui cuvânt-cheie nu confirmă o observație. Articolele originale rămân la editori.","Regiune","Catalog de surse","Starea surselor","Potriviri de cuvinte","Verifică titlurile","Verifică starea","Alege limba"],
 el:["ΔΙΕΘΝΕΙΣ ΠΗΓΕΣ","Επίσημες ροές RSS και Atom εκδοτών και οργανισμών. Πρόκειται για κατάλογο πηγών, όχι επιβεβαιωμένων περιστατικών UAP.","Η αντιστοίχιση λέξεων δεν επιβεβαιώνει παρατήρηση. Τα αρχικά άρθρα παραμένουν στους εκδότες.","Περιοχή","Κατάλογος πηγών","Κατάσταση πηγών","Αντιστοιχίσεις","Έλεγχος τίτλων","Έλεγχος κατάστασης","Επιλογή γλώσσας"],
 sr:["МЕЂУНАРОДНИ ИЗВОРИ","Званични RSS и Atom канали издавача и институција. Ово је каталог извора, не потврђених UAP случајева.","Поклапање кључних речи не доказује виђење. Оригинални чланци остају код издавача.","Регион","Каталог извора","Статус извора","Поклапања кључних речи","Провери наслове","Провери статус","Изабери језик"],
 uk:["МІЖНАРОДНІ ДЖЕРЕЛА","Офіційні RSS та Atom-стрічки видавців і установ. Це каталог джерел, а не підтверджених випадків UAP.","Збіг ключових слів не підтверджує спостереження. Оригінальні статті залишаються у видавців.","Регіон","Каталог джерел","Стан джерел","Збіги за ключовими словами","Перевірити заголовки","Перевірити стан","Вибрати мову"],
 pl:["ŹRÓDŁA MIĘDZYNARODOWE","Oficjalne kanały RSS i Atom wydawców i instytucji. To katalog źródeł, a nie potwierdzonych przypadków UAP.","Dopasowanie słów kluczowych nie potwierdza obserwacji. Oryginalne artykuły pozostają u wydawców.","Region","Katalog źródeł","Stan źródeł","Dopasowania słów","Sprawdź nagłówki","Sprawdź stan","Wybierz język"],
 ar:["مصادر دولية","خلاصات RSS وAtom الرسمية للناشرين والمؤسسات. هذا دليل للمصادر وليس قائمة بحالات UAP مؤكدة.","تطابق الكلمات المفتاحية لا يؤكد مشاهدة. تبقى المقالات الأصلية لدى ناشريها.","المنطقة","دليل المصادر","حالة المصادر","تطابق الكلمات","فحص العناوين","فحص الحالة","اختر اللغة"],
 ja:["国際情報源","報道機関や公的機関が配信する公式RSS・Atomフィードです。確認済みUAP事例ではなく、情報源の一覧です。","キーワードの一致は目撃の証明ではありません。原文は発行元のサイトにあります。","地域","情報源一覧","接続状況","キーワード一致","見出しを確認","状態を確認","言語を選択"],
 ko:["국제 정보 출처","언론사와 기관의 공식 RSS 및 Atom 피드입니다. 확인된 UAP 사례가 아니라 출처 목록입니다.","키워드 일치는 목격 확인을 의미하지 않습니다. 원문은 발행처에서 제공합니다.","지역","출처 목록","출처 상태","키워드 일치","제목 확인","상태 확인","언어 선택"]
 };
 const selectText=(name)=>{const arr=labels[document.documentElement.lang]||labels.en;return arr[name]||labels.en[name]||""};
 const get=(key)=>Number.isInteger(key)?selectText(key):key;
 function apply(){
  const set=(selector,index)=>{const node=document.querySelector(selector);if(node)node.textContent=get(index);};
  set(".live-hero h1",0);
  const lead=document.querySelector(".live-hero p:not(.live-eyebrow)");
  if(lead)lead.textContent=get(1);
  const warning=document.querySelector("main > .live-warning");
  if(warning)warning.textContent=get(2);
  set("#catalogHeading",4);set("#healthHeading",5);set("#matchHeading",6);
  set("#reloadMatches",7);set("#checkHealth",8);
  const region=document.querySelector(".live-toolbar label");
  if(region?.firstChild?.nodeType===3)region.firstChild.textContent=get(3)+" ";
  document.title=get(0)+" | AURORA UAP";
  const meta=document.querySelector('meta[name="description"]');
  if(meta)meta.content=get(1);
 }
 function init(){
  let dropdown=document.getElementById("pageLanguage");
  if(!dropdown){
   dropdown=document.createElement("select");
   dropdown.id="pageLanguage";dropdown.className="page-language";
   dropdown.setAttribute("aria-label",labels.en[9]);
   for(const lang of langs){const option=document.createElement("option");option.value=lang;
    option.textContent=lang==="zh-CN"?"简体中文":lang.toUpperCase();dropdown.append(option);}
   document.querySelector(".live-header")?.append(dropdown);
  }
  let current;try{current=localStorage.getItem("aurora-lang")}catch{}
  document.documentElement.lang=langs.includes(current)?current:"bg";
  document.documentElement.dir=current==="ar"?"rtl":"ltr";
  dropdown.value=document.documentElement.lang;apply();
  dropdown.addEventListener("change",()=>{
   const chosen=dropdown.value;
   if(!langs.includes(chosen))return;
   document.documentElement.lang=chosen;document.documentElement.dir=chosen==="ar"?"rtl":"ltr";
   try{localStorage.setItem("aurora-lang",chosen)}catch{}
   apply();window.dispatchEvent(new CustomEvent("aurora:language-changed",{detail:{language:chosen}}));
  });
 }
 window.AURORA_SOURCE_UI={text:get,apply};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
