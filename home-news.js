/* AURORA live headline preview; source links, no synthetic headlines. */
"use strict";
(()=>{
 const host=document.getElementById("homeNewsGrid"),status=document.getElementById("homeNewsStatus");
 if(!host||!status)return;
 let sequence=0;
 const packs={
  "bg":{"orig":"Оригинални заглавия · преводът е недостъпен","cached":"КЕШИРАНО · последна успешна емисия","empty":"В момента няма налични заглавия.","offline":"Емисията временно не е достъпна. Пълната страница с новини остава активна."},
  "en":{"orig":"Original headlines · translation unavailable","cached":"CACHED · last successful news feed","empty":"No headlines available right now.","offline":"News feed temporarily unavailable. The full news page remains accessible."},
  "de":{"orig":"Originalschlagzeilen · Übersetzung nicht verfügbar","cached":"ZWISCHENGESPEICHERT · letzter erfolgreicher Feed","empty":"Derzeit keine Schlagzeilen verfügbar.","offline":"Nachrichten-Feed vorübergehend nicht verfügbar. Die Nachrichtenseite bleibt erreichbar."},
  "ru":{"orig":"Оригинальные заголовки · перевод недоступен","cached":"КЭШ · последняя успешная лента","empty":"Сейчас нет доступных заголовков.","offline":"Лента новостей временно недоступна. Полная страница новостей остаётся открытой."},
  "zh-CN":{"orig":"原始标题 · 翻译暂不可用","cached":"缓存 · 最近一次成功加载的新闻流","empty":"当前暂无可用新闻。","offline":"新闻源暂时不可用。完整新闻页面仍可访问。"},
  "fr":{"orig":"Titres originaux · traduction indisponible","cached":"EN CACHE · dernier flux disponible","empty":"Aucun titre disponible pour le moment.","offline":"Flux d'actualités temporairement indisponible. La page complète reste accessible."},
  "es":{"orig":"Titulares originales · traducción no disponible","cached":"EN CACHÉ · última fuente cargada","empty":"No hay titulares disponibles ahora.","offline":"Fuente de noticias temporalmente no disponible. La página completa sigue accesible."},
  "it":{"orig":"Titoli originali · traduzione non disponibile","cached":"IN CACHE · ultimo feed disponibile","empty":"Nessuna notizia disponibile al momento.","offline":"Feed notizie temporaneamente non disponibile. La pagina completa resta accessibile."},
  "pt":{"orig":"Manchetes originais · tradução indisponível","cached":"EM CACHE · último feed carregado","empty":"Nenhuma manchete disponível no momento.","offline":"Feed de notícias temporariamente indisponível. A página completa continua acessível."},
  "tr":{"orig":"Özgün başlıklar · çeviri kullanılamıyor","cached":"ÖNBELLEK · son başarılı haber akışı","empty":"Şu anda kullanılabilir başlık yok.","offline":"Haber akışı geçici olarak kullanılamıyor. Tam haber sayfası erişilebilir durumda."},
  "ro":{"orig":"Titluri originale · traducere indisponibilă","cached":"ÎN CACHE · ultimul flux disponibil","empty":"Nu există titluri disponibile momentan.","offline":"Fluxul de știri este temporar indisponibil. Pagina completă rămâne accesibilă."},
  "el":{"orig":"Πρωτότυποι τίτλοι · μετάφραση μη διαθέσιμη","cached":"ΑΠΟΘΗΚΕΥΜΕΝΟ · τελευταία επιτυχής ροή","empty":"Δεν υπάρχουν διαθέσιμοι τίτλοι αυτή τη στιγμή.","offline":"Η ροή ειδήσεων δεν είναι προσωρινά διαθέσιμη. Η πλήρης σελίδα παραμένει προσβάσιμη."},
  "sr":{"orig":"Изворни наслови · превод није доступан","cached":"КЕШИРАНО · последњи успешан ток вести","empty":"Тренутно нема доступних наслова.","offline":"Ток вести привремено није доступан. Комплетна страница вести је доступна."},
  "uk":{"orig":"Оригінальні заголовки · переклад недоступний","cached":"КЕШОВАНО · останній успішний потік","empty":"Зараз немає доступних заголовків.","offline":"Стрічка новин тимчасово недоступна. Повна сторінка новин залишається доступною."},
  "pl":{"orig":"Oryginalne nagłówki · tłumaczenie niedostępne","cached":"W PAMIĘCI PODRĘCZNEJ · ostatni udany strumień","empty":"Brak dostępnych nagłówków w tej chwili.","offline":"Kanał wiadomości chwilowo niedostępny. Pełna strona wiadomości pozostaje dostępna."},
  "ar":{"orig":"العناوين الأصلية · الترجمة غير متاحة","cached":"مخزن مؤقتاً · آخر موجز أخبار ناجح","empty":"لا توجد عناوين متاحة حالياً.","offline":"موجز الأخبار غير متاح مؤقتاً. صفحة الأخبار الكاملة متاحة."},
  "ja":{"orig":"元の見出し · 翻訳は利用できません","cached":"キャッシュ · 直近の正常なニュースフィード","empty":"現在表示できる見出しはありません。","offline":"ニュースフィードは一時的に利用できません。ニュース一覧ページは引き続き開けます。"},
  "ko":{"orig":"원본 제목 · 번역 사용 불가","cached":"캐시됨 · 마지막으로 성공한 뉴스 피드","empty":"현재 표시할 헤드라인이 없습니다.","offline":"뉴스 피드를 일시적으로 사용할 수 없습니다. 전체 뉴스 페이지는 계속 이용 가능합니다."}
 };
 const locale=()=>{try{return localStorage.getItem("aurora-lang")||document.documentElement.lang||"bg"}catch{return document.documentElement.lang||"bg"}};
 const msg=k=>(packs[locale()]||packs.en)[k]||packs.en[k];
 async function render(){
  const lang=locale(),seq=++sequence;
  try{
   const r=await fetch("/api/news?edition=global&lang="+encodeURIComponent(lang)+"&offset=0",{cache:"no-store"});if(!r.ok)throw Error("feed");
   const data=await r.json();if(seq!==sequence||lang!==locale())return;if(!["live","cached"].includes(data.status)||!Array.isArray(data.items))throw Error("format");
   host.replaceChildren();
   for(const item of data.items.slice(0,9)){
    if(!/^https:\/\//.test(item.url))continue;
    const card=document.createElement("article"),small=document.createElement("small"),a=document.createElement("a");
    small.textContent=item.source+" · "+new Date(item.published).toLocaleDateString(document.documentElement.lang||"en");
    a.href=item.url;a.textContent=item.translated_title||item.title;a.title=item.title;a.target="_blank";a.rel="noopener noreferrer";
    card.append(small,a);host.append(card);
   }
   status.textContent=host.childElementCount?(data.translation?.status==="unavailable"?msg("orig"):data.status==="cached"?msg("cached"):""):msg("empty");
  }catch{
   if(seq===sequence&&!host.childElementCount)status.textContent=msg("offline");
  }
 }
 render();
 new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
 // New-source server cache lasts 15 minutes; refresh while the page is open.
 setInterval(()=>{if(!document.hidden)render()},15*60*1000);
})();
