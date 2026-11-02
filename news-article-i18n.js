'use strict';
// Labels for editorial article bodies and dates; source-language prose remains unchanged.
window.AURORA_NEWS_ARTICLE_COPY={
 bg:{originalBody:'Оригиналният текст е на езика на източника; пълен превод не е наличен.',readArticle:'Прочети статията',auroraPublished:'AURORA · редакционна публикация',videoSource:'Видеоматериал от външен източник'},
 en:{originalBody:'The original article text is shown; a full translation is unavailable.',readArticle:'Read article',auroraPublished:'AURORA · editorial publication',videoSource:'External video source'},
 de:{originalBody:'Der Originaltext wird angezeigt; eine vollständige Übersetzung ist nicht verfügbar.',readArticle:'Artikel lesen',auroraPublished:'AURORA · redaktioneller Beitrag',videoSource:'Externes Video'},
 ru:{originalBody:'Показан исходный текст; полный перевод недоступен.',readArticle:'Читать статью',auroraPublished:'AURORA · редакционная публикация',videoSource:'Внешний источник видео'},
 'zh-CN':{originalBody:'当前显示原文；完整译文暂不可用。',readArticle:'阅读文章',auroraPublished:'AURORA · 编辑发布',videoSource:'外部视频来源'},
 fr:{originalBody:'Le texte original est affiché ; la traduction intégrale est indisponible.',readArticle:'Lire l’article',auroraPublished:'AURORA · publication éditoriale',videoSource:'Source vidéo externe'},
 es:{originalBody:'Se muestra el texto original; no hay una traducción completa disponible.',readArticle:'Leer el artículo',auroraPublished:'AURORA · publicación editorial',videoSource:'Fuente de vídeo externa'},
 it:{originalBody:'È mostrato il testo originale; la traduzione completa non è disponibile.',readArticle:'Leggi l’articolo',auroraPublished:'AURORA · pubblicazione editoriale',videoSource:'Fonte video esterna'},
 pt:{originalBody:'O texto original é exibido; a tradução completa não está disponível.',readArticle:'Ler artigo',auroraPublished:'AURORA · publicação editorial',videoSource:'Fonte de vídeo externa'},
 tr:{originalBody:'Özgün metin gösteriliyor; tam çeviri mevcut değil.',readArticle:'Haberi oku',auroraPublished:'AURORA · editoryal yayın',videoSource:'Harici video kaynağı'},
 ro:{originalBody:'Este afișat textul original; traducerea completă nu este disponibilă.',readArticle:'Citește articolul',auroraPublished:'AURORA · publicație editorială',videoSource:'Sursă video externă'},
 el:{originalBody:'Εμφανίζεται το πρωτότυπο κείμενο· δεν υπάρχει πλήρης μετάφραση.',readArticle:'Διαβάστε το άρθρο',auroraPublished:'AURORA · συντακτική δημοσίευση',videoSource:'Εξωτερική πηγή βίντεο'},
 sr:{originalBody:'Prikazan je izvorni tekst; ceo prevod nije dostupan.',readArticle:'Pročitaj članak',auroraPublished:'AURORA · urednička objava',videoSource:'Spoljni izvor video-snimka'},
 uk:{originalBody:'Показано оригінальний текст; повний переклад недоступний.',readArticle:'Читати статтю',auroraPublished:'AURORA · редакційна публікація',videoSource:'Зовнішнє джерело відео'},
 pl:{originalBody:'Wyświetlany jest oryginalny tekst; pełne tłumaczenie jest niedostępne.',readArticle:'Czytaj artykuł',auroraPublished:'AURORA · publikacja redakcyjna',videoSource:'Zewnętrzne źródło wideo'},
 ar:{originalBody:'يُعرض النص الأصلي؛ الترجمة الكاملة غير متاحة.',readArticle:'اقرأ المقال',auroraPublished:'AURORA · نشر تحريري',videoSource:'مصدر فيديو خارجي'},
 ja:{originalBody:'原文を表示しています。全文翻訳はありません。',readArticle:'記事を読む',auroraPublished:'AURORA・編集記事',videoSource:'外部動画ソース'},
 ko:{originalBody:'원문이 표시됩니다. 전체 번역은 제공되지 않습니다.',readArticle:'기사 읽기',auroraPublished:'AURORA · 편집 게시물',videoSource:'외부 동영상 출처'}
};
for(const [locale,labels] of Object.entries(window.AURORA_NEWS_ARTICLE_COPY))Object.assign(window.AURORA_NEWS_UI[locale],labels);
