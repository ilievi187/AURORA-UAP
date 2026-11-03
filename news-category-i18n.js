'use strict';
// Category filter labels describe only classifications explicitly entered by AURORA editors.
window.AURORA_NEWS_CATEGORY_COPY={
 bg:{label:'Редакторска категория',options:{all:'Всички категории',sightings:'Наблюдения',official:'Официални документи',research:'Изследвания',history:'История',policy:'Политики',other:'Друго / без категория'}},
 en:{label:'Editorial category',options:{all:'All categories',sightings:'Sightings',official:'Official documents',research:'Research',history:'History',policy:'Policy',other:'Other / uncategorized'}},
 de:{label:'Redaktionelle Kategorie',options:{all:'Alle Kategorien',sightings:'Beobachtungen',official:'Offizielle Dokumente',research:'Forschung',history:'Geschichte',policy:'Politik',other:'Sonstiges / ohne Kategorie'}},
 ru:{label:'Редакционная категория',options:{all:'Все категории',sightings:'Наблюдения',official:'Официальные документы',research:'Исследования',history:'История',policy:'Политика',other:'Другое / без категории'}},
 'zh-CN':{label:'编辑分类',options:{all:'全部分类',sightings:'目击报告',official:'官方文件',research:'研究',history:'历史',policy:'政策',other:'其他 / 未分类'}},
 fr:{label:'Catégorie éditoriale',options:{all:'Toutes les catégories',sightings:'Observations',official:'Documents officiels',research:'Recherche',history:'Histoire',policy:'Politique',other:'Autre / non classé'}},
 es:{label:'Categoría editorial',options:{all:'Todas las categorías',sightings:'Avistamientos',official:'Documentos oficiales',research:'Investigación',history:'Historia',policy:'Política',other:'Otra / sin clasificar'}},
 it:{label:'Categoria editoriale',options:{all:'Tutte le categorie',sightings:'Avvistamenti',official:'Documenti ufficiali',research:'Ricerca',history:'Storia',policy:'Politiche',other:'Altro / non classificato'}},
 pt:{label:'Categoria editorial',options:{all:'Todas as categorias',sightings:'Avistamentos',official:'Documentos oficiais',research:'Pesquisa',history:'História',policy:'Políticas',other:'Outra / sem categoria'}},
 tr:{label:'Yayın kategorisi',options:{all:'Tüm kategoriler',sightings:'Gözlemler',official:'Resmî belgeler',research:'Araştırma',history:'Tarih',policy:'Politika',other:'Diğer / sınıflandırılmamış'}},
 ro:{label:'Categorie editorială',options:{all:'Toate categoriile',sightings:'Observații',official:'Documente oficiale',research:'Cercetare',history:'Istorie',policy:'Politici',other:'Altele / neclasificat'}},
 el:{label:'Συντακτική κατηγορία',options:{all:'Όλες οι κατηγορίες',sightings:'Παρατηρήσεις',official:'Επίσημα έγγραφα',research:'Έρευνα',history:'Ιστορία',policy:'Πολιτική',other:'Άλλο / χωρίς κατηγορία'}},
 sr:{label:'Urednička kategorija',options:{all:'Sve kategorije',sightings:'Opažanja',official:'Zvanični dokumenti',research:'Istraživanje',history:'Istorija',policy:'Politika',other:'Ostalo / bez kategorije'}},
 uk:{label:'Редакційна категорія',options:{all:'Усі категорії',sightings:'Спостереження',official:'Офіційні документи',research:'Дослідження',history:'Історія',policy:'Політика',other:'Інше / без категорії'}},
 pl:{label:'Kategoria redakcyjna',options:{all:'Wszystkie kategorie',sightings:'Obserwacje',official:'Dokumenty urzędowe',research:'Badania',history:'Historia',policy:'Polityka',other:'Inne / bez kategorii'}},
 ar:{label:'التصنيف التحريري',options:{all:'جميع التصنيفات',sightings:'مشاهدات',official:'وثائق رسمية',research:'أبحاث',history:'تاريخ',policy:'سياسات',other:'أخرى / غير مصنف'}},
 ja:{label:'編集カテゴリ',options:{all:'すべてのカテゴリ',sightings:'目撃情報',official:'公式文書',research:'研究',history:'歴史',policy:'政策',other:'その他 / 未分類'}},
 ko:{label:'편집 카테고리',options:{all:'모든 카테고리',sightings:'목격',official:'공식 문서',research:'연구',history:'역사',policy:'정책',other:'기타 / 미분류'}}
};
for(const [locale,copy] of Object.entries(window.AURORA_NEWS_CATEGORY_COPY))Object.assign(window.AURORA_NEWS_UI[locale],{topicCategory:copy.label,categories:copy.options});
