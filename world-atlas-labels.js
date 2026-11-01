const keys = [
  'search', 'searchHint', 'year', 'allYears', 'category', 'allCategories',
  'lights', 'objects', 'instrument', 'zoomIn', 'zoomOut', 'resetView',
  'results', 'mapped', 'noResults', 'unknownLocation', 'readCase',
  'originalSource', 'media', 'mapHelp', 'cluster', 'archiveUnavailable'
];

const rows = {
  bg: [
    'Търси досие', 'Заглавие, район, държава или източник', 'ГОДИНА', 'ВСИЧКИ ГОДИНИ',
    'КАТЕГОРИЯ', 'ВСИЧКИ КАТЕГОРИИ', 'СВЕТЛИНИ', 'ОБЕКТИ', 'ЗАПИСИ ОТ ПРИБОРИ',
    'УВЕЛИЧИ', 'НАМАЛИ', 'НАЧАЛЕН ИЗГЛЕД', 'досие(та)', 'с координати',
    'Няма досиета за тези критерии.', 'Местоположението не е посочено', 'ОТВОРИ ДОСИЕТО',
    'ПЪРВОИЗТОЧНИК', 'МЕДИЙНИ МАТЕРИАЛИ', 'Плъзни картата; използвай +/− за мащаб.',
    'групирани досиета', 'Архивът не е наличен. Опитай отново по-късно.'
  ],
  en: [
    'Search cases', 'Title, area, country, or source', 'YEAR', 'ALL YEARS', 'CATEGORY', 'ALL CATEGORIES',
    'LIGHTS', 'OBJECTS', 'INSTRUMENT RECORDINGS', 'ZOOM IN', 'ZOOM OUT', 'RESET VIEW',
    'cases', 'mapped', 'No cases match these filters.', 'Location not reported', 'OPEN CASE FILE',
    'ORIGINAL SOURCE', 'MEDIA', 'Drag to pan; use +/− to change map scale.', 'cases in this cluster',
    'The case archive could not be loaded. Try again later.'
  ],
  de: [
    'Fälle suchen', 'Titel, Region, Land oder Quelle', 'JAHR', 'ALLE JAHRE', 'KATEGORIE', 'ALLE KATEGORIEN',
    'LICHTER', 'OBJEKTE', 'INSTRUMENTAUFNAHMEN', 'VERGRÖSSERN', 'VERKLEINERN', 'ANSICHT ZURÜCKSETZEN',
    'Fälle', 'kartiert', 'Keine Fälle für diese Filter.', 'Ort nicht angegeben', 'FALLAKTE ÖFFNEN',
    'ORIGINALQUELLE', 'MEDIEN', 'Karte ziehen; mit +/− den Maßstab ändern.', 'Fälle in dieser Gruppe',
    'Das Fallarchiv konnte nicht geladen werden. Bitte später erneut versuchen.'
  ],
  ru: [
    'Поиск дел', 'Название, район, страна или источник', 'ГОД', 'ВСЕ ГОДЫ', 'КАТЕГОРИЯ', 'ВСЕ КАТЕГОРИИ',
    'ОГНИ', 'ОБЪЕКТЫ', 'ЗАПИСИ ПРИБОРОВ', 'УВЕЛИЧИТЬ', 'УМЕНЬШИТЬ', 'СБРОСИТЬ ВИД',
    'дел', 'на карте', 'По этим фильтрам ничего не найдено.', 'Место не указано', 'ОТКРЫТЬ ДОСЬЕ',
    'ПЕРВОИСТОЧНИК', 'МЕДИА', 'Перетаскивайте карту; масштаб меняется кнопками +/−.', 'дел в этой группе',
    'Не удалось загрузить архив дел. Попробуйте позже.'
  ],
  'zh-CN': [
    '搜索案例', '标题、地区、国家或来源', '年份', '所有年份', '类别', '所有类别', '光点', '物体', '仪器记录',
    '放大', '缩小', '重置视图', '个案例', '已定位', '没有符合筛选条件的案例。', '未报告位置', '打开案例档案',
    '原始来源', '媒体', '拖动平移；使用 +/− 调整地图比例。', '个案例位于此组', '无法加载案例档案，请稍后重试。'
  ],
  fr: [
    'Rechercher un cas', 'Titre, région, pays ou source', 'ANNÉE', 'TOUTES LES ANNÉES', 'CATÉGORIE', 'TOUTES LES CATÉGORIES',
    'LUMIÈRES', 'OBJETS', 'ENREGISTREMENTS D’INSTRUMENT', 'ZOOMER', 'DÉZOOMER', 'RÉINITIALISER LA VUE',
    'cas', 'cartographiés', 'Aucun cas ne correspond à ces filtres.', 'Lieu non indiqué', 'OUVRIR LE DOSSIER',
    'SOURCE ORIGINALE', 'MÉDIAS', 'Faites glisser pour déplacer la carte ; +/− change l’échelle.', 'cas dans ce groupe',
    'Impossible de charger les dossiers. Réessayez plus tard.'
  ],
  es: [
    'Buscar casos', 'Título, zona, país o fuente', 'AÑO', 'TODOS LOS AÑOS', 'CATEGORÍA', 'TODAS LAS CATEGORÍAS',
    'LUZ', 'OBJETOS', 'REGISTROS DE INSTRUMENTOS', 'ACERCAR', 'ALEJAR', 'RESTABLECER VISTA',
    'casos', 'en el mapa', 'Ningún caso coincide con estos filtros.', 'Ubicación no indicada', 'ABRIR EXPEDIENTE',
    'FUENTE ORIGINAL', 'MEDIOS', 'Arrastra para mover; usa +/− para cambiar la escala.', 'casos en este grupo',
    'No se pudo cargar el archivo de casos. Inténtalo más tarde.'
  ],
  it: [
    'Cerca casi', 'Titolo, area, paese o fonte', 'ANNO', 'TUTTI GLI ANNI', 'CATEGORIA', 'TUTTE LE CATEGORIE',
    'LUCI', 'OGGETTI', 'REGISTRAZIONI STRUMENTALI', 'INGRANDISCI', 'RIDUCI', 'REIMPOSTA VISTA',
    'casi', 'sulla mappa', 'Nessun caso corrisponde ai filtri.', 'Luogo non indicato', 'APRI IL DOSSIER',
    'FONTE ORIGINALE', 'MEDIA', 'Trascina per spostare; usa +/− per cambiare scala.', 'casi in questo gruppo',
    'Archivio dei casi non disponibile. Riprova più tardi.'
  ],
  pt: [
    'Pesquisar casos', 'Título, região, país ou fonte', 'ANO', 'TODOS OS ANOS', 'CATEGORIA', 'TODAS AS CATEGORIAS',
    'LUZES', 'OBJETOS', 'REGISTROS DE INSTRUMENTOS', 'AMPLIAR', 'REDUZIR', 'REDEFINIR VISUALIZAÇÃO',
    'casos', 'mapeados', 'Nenhum caso corresponde a estes filtros.', 'Local não informado', 'ABRIR DOSSIÊ',
    'FONTE ORIGINAL', 'MÍDIA', 'Arraste para mover; use +/− para alterar a escala.', 'casos neste grupo',
    'Não foi possível carregar o arquivo de casos. Tente novamente mais tarde.'
  ],
  tr: [
    'Vakaları ara', 'Başlık, bölge, ülke veya kaynak', 'YIL', 'TÜM YILLAR', 'KATEGORİ', 'TÜM KATEGORİLER',
    'IŞIKLAR', 'NESNELER', 'CİHAZ KAYITLARI', 'YAKINLAŞTIR', 'UZAKLAŞTIR', 'GÖRÜNÜMÜ SIFIRLA',
    'vaka', 'haritada', 'Bu filtrelerle eşleşen vaka yok.', 'Konum bildirilmedi', 'DOSYAYI AÇ',
    'ORİJİNAL KAYNAK', 'MEDYA', 'Haritayı sürükleyin; ölçeği +/− ile değiştirin.', 'bu gruptaki vaka',
    'Vaka arşivi yüklenemedi. Daha sonra tekrar deneyin.'
  ],
  ro: [
    'Caută cazuri', 'Titlu, zonă, țară sau sursă', 'AN', 'TOȚI ANII', 'CATEGORIE', 'TOATE CATEGORIILE',
    'LUMINI', 'OBIECTE', 'ÎNREGISTRĂRI DE INSTRUMENTE', 'MĂREȘTE', 'MICȘOREAZĂ', 'RESETEAZĂ VEDEREA',
    'cazuri', 'pe hartă', 'Niciun caz nu corespunde filtrelor.', 'Locația nu este precizată', 'DESCHIDE DOSARUL',
    'SURSĂ ORIGINALĂ', 'MEDIA', 'Trage pentru panoramare; +/− schimbă scara.', 'cazuri în acest grup',
    'Arhiva de cazuri nu a putut fi încărcată. Încearcă din nou mai târziu.'
  ],
  el: [
    'Αναζήτηση υποθέσεων', 'Τίτλος, περιοχή, χώρα ή πηγή', 'ΕΤΟΣ', 'ΟΛΑ ΤΑ ΕΤΗ', 'ΚΑΤΗΓΟΡΙΑ', 'ΟΛΕΣ ΟΙ ΚΑΤΗΓΟΡΙΕΣ',
    'ΦΩΤΑ', 'ΑΝΤΙΚΕΙΜΕΝΑ', 'ΚΑΤΑΓΡΑΦΕΣ ΟΡΓΑΝΩΝ', 'ΜΕΓΕΘΥΝΣΗ', 'ΣΜΙΚΡΥΝΣΗ', 'ΕΠΑΝΑΦΟΡΑ ΠΡΟΒΟΛΗΣ',
    'υποθέσεις', 'στον χάρτη', 'Δεν βρέθηκαν υποθέσεις με αυτά τα φίλτρα.', 'Δεν αναφέρεται τοποθεσία', 'ΑΝΟΙΓΜΑ ΦΑΚΕΛΟΥ',
    'ΑΡΧΙΚΗ ΠΗΓΗ', 'ΜΕΣΑ', 'Σύρετε για μετακίνηση· αλλάξτε κλίμακα με +/−.', 'υποθέσεις σε αυτή την ομάδα',
    'Δεν ήταν δυνατή η φόρτωση του αρχείου. Δοκιμάστε ξανά αργότερα.'
  ],
  sr: [
    'Pretraži slučajeve', 'Naslov, oblast, država ili izvor', 'GODINA', 'SVE GODINE', 'KATEGORIJA', 'SVE KATEGORIJE',
    'SVETLA', 'OBJEKTI', 'INSTRUMENTALNI ZAPISI', 'UVEĆAJ', 'UMANJI', 'VRATI POGLED',
    'slučajeva', 'na mapi', 'Nema slučajeva za ove filtere.', 'Lokacija nije navedena', 'OTVORI DOSIJE',
    'IZVORNI IZVOR', 'MEDIJI', 'Prevucite za pomeranje; +/− menja razmeru.', 'slučajeva u ovoj grupi',
    'Arhiva slučajeva nije dostupna. Pokušajte kasnije.'
  ],
  uk: [
    'Пошук справ', 'Назва, район, країна або джерело', 'РІК', 'УСІ РОКИ', 'КАТЕГОРІЯ', 'УСІ КАТЕГОРІЇ',
    'ВОГНІ', 'ОБ’ЄКТИ', 'ЗАПИСИ ПРИЛАДІВ', 'ЗБІЛЬШИТИ', 'ЗМЕНШИТИ', 'СКИНУТИ ВИГЛЯД',
    'справ', 'на карті', 'За цими фільтрами справ не знайдено.', 'Місце не вказано', 'ВІДКРИТИ ДОСЬЄ',
    'ПЕРШОДЖЕРЕЛО', 'МЕДІА', 'Перетягніть для панорамування; +/− змінює масштаб.', 'справ у цій групі',
    'Не вдалося завантажити архів справ. Спробуйте пізніше.'
  ],
  pl: [
    'Szukaj spraw', 'Tytuł, region, kraj lub źródło', 'ROK', 'WSZYSTKIE LATA', 'KATEGORIA', 'WSZYSTKIE KATEGORIE',
    'ŚWIATŁA', 'OBIEKTY', 'ZAPISY URZĄDZEŃ', 'POWIĘKSZ', 'POMNIEJSZ', 'RESETUJ WIDOK',
    'spraw', 'na mapie', 'Brak spraw pasujących do filtrów.', 'Nie podano lokalizacji', 'OTWÓRZ AKTA',
    'ŹRÓDŁO ORYGINALNE', 'MEDIA', 'Przeciągnij, aby przesunąć; +/− zmienia skalę.', 'spraw w tej grupie',
    'Nie udało się wczytać archiwum spraw. Spróbuj ponownie później.'
  ],
  ar: [
    'ابحث في الحالات', 'العنوان أو المنطقة أو البلد أو المصدر', 'السنة', 'كل السنوات', 'الفئة', 'كل الفئات',
    'أضواء', 'أجسام', 'تسجيلات الأجهزة', 'تكبير', 'تصغير', 'إعادة ضبط العرض',
    'حالات', 'على الخريطة', 'لا توجد حالات تطابق عوامل التصفية.', 'الموقع غير مذكور', 'افتح ملف الحالة',
    'المصدر الأصلي', 'الوسائط', 'اسحب لتحريك الخريطة؛ استخدم +/− لتغيير المقياس.', 'حالات في هذه المجموعة',
    'تعذر تحميل أرشيف الحالات. حاول مرة أخرى لاحقاً.'
  ],
  ja: [
    '事例を検索', 'タイトル、地域、国、出典', '年', 'すべての年', 'カテゴリ', 'すべてのカテゴリ',
    '光', '物体', '機器記録', '拡大', '縮小', '表示をリセット',
    '件', '地図上', '条件に一致する事例はありません。', '場所は報告されていません', '事例ファイルを開く',
    '原資料', 'メディア', 'ドラッグで移動、＋/−で縮尺を変更。', '件の事例を含むグループ',
    '事例アーカイブを読み込めませんでした。後でもう一度お試しください。'
  ],
  ko: [
    '사례 검색', '제목, 지역, 국가 또는 출처', '연도', '모든 연도', '분류', '모든 분류',
    '빛', '물체', '기기 기록', '확대', '축소', '보기 초기화',
    '건', '지도 표시', '필터와 일치하는 사례가 없습니다.', '위치가 보고되지 않음', '사례 기록 열기',
    '원본 출처', '미디어', '드래그하여 이동하고 +/−로 축척을 조정하세요.', '건의 사례가 모인 그룹',
    '사례 아카이브를 불러오지 못했습니다. 나중에 다시 시도하세요.'
  ]
};

export const labels = Object.fromEntries(Object.entries(rows).map(([locale, values]) => [
  locale,
  Object.fromEntries(keys.map((key, index) => [key, values[index]]))
]));

const extraLabels = {
  bg: { notMapped: 'Не е нанесено на картата — липсват координати', other: 'ДРУГИ', mapControls: 'КОНТРОЛИ НА КАРТАТА' },
  en: { notMapped: 'Not mapped — coordinates unavailable', other: 'OTHER', mapControls: 'MAP CONTROLS' },
  de: { notMapped: 'Nicht kartiert — keine Koordinaten verfügbar', other: 'ANDERE', mapControls: 'KARTENSTEUERUNG' },
  ru: { notMapped: 'Не нанесено на карту — координаты недоступны', other: 'ДРУГОЕ', mapControls: 'УПРАВЛЕНИЕ КАРТОЙ' },
  'zh-CN': { notMapped: '未绘于地图（无可用坐标）', other: '其他', mapControls: '地图控件' },
  fr: { notMapped: 'Non cartographié — coordonnées indisponibles', other: 'AUTRE', mapControls: 'COMMANDES DE LA CARTE' },
  es: { notMapped: 'No está en el mapa: no hay coordenadas', other: 'OTRO', mapControls: 'CONTROLES DEL MAPA' },
  it: { notMapped: 'Non mappato — coordinate non disponibili', other: 'ALTRO', mapControls: 'CONTROLLI DELLA MAPPA' },
  pt: { notMapped: 'Não mapeado — coordenadas indisponíveis', other: 'OUTRO', mapControls: 'CONTROLES DO MAPA' },
  tr: { notMapped: 'Haritada değil — koordinatlar mevcut değil', other: 'DİĞER', mapControls: 'HARİTA KONTROLLERİ' },
  ro: { notMapped: 'Nemapat — coordonate indisponibile', other: 'ALTELE', mapControls: 'CONTROALELE HĂRȚII' },
  el: { notMapped: 'Δεν έχει χαρτογραφηθεί — δεν υπάρχουν συντεταγμένες', other: 'ΑΛΛΟ', mapControls: 'ΧΕΙΡΙΣΤΗΡΙΑ ΧΑΡΤΗ' },
  sr: { notMapped: 'Nije ucrtano — koordinate nisu dostupne', other: 'OSTALO', mapControls: 'KONTROLE MAPE' },
  uk: { notMapped: 'Не нанесено на карту — координати недоступні', other: 'ІНШЕ', mapControls: 'КЕРУВАННЯ КАРТОЮ' },
  pl: { notMapped: 'Nie naniesiono na mapę — brak współrzędnych', other: 'INNE', mapControls: 'STEROWANIE MAPĄ' },
  ar: { notMapped: 'غير مرسوم على الخريطة — الإحداثيات غير متاحة', other: 'أخرى', mapControls: 'عناصر التحكم بالخريطة' },
  ja: { notMapped: '地図上に未表示（座標なし）', other: 'その他', mapControls: '地図の操作' },
  ko: { notMapped: '지도에 표시되지 않음(좌표 없음)', other: '기타', mapControls: '지도 컨트롤' }
};
for (const [locale, values] of Object.entries(extraLabels)) Object.assign(labels[locale], values);

const precisionLabels = {
  bg: { precisionExact: 'Точно място', precisionApproxCity: 'Ориентировъчно — град', precisionApproxRegion: 'Ориентировъчно — регион', precisionApproxCountry: 'Ориентировъчно — държава' },
  en: { precisionExact: 'Exact place', precisionApproxCity: 'Approximate — city', precisionApproxRegion: 'Approximate — region', precisionApproxCountry: 'Approximate — country' },
  de: { precisionExact: 'Exakter Ort', precisionApproxCity: 'Ungefähre Angabe — Stadt', precisionApproxRegion: 'Ungefähre Angabe — Region', precisionApproxCountry: 'Ungefähre Angabe — Land' },
  ru: { precisionExact: 'Точное место', precisionApproxCity: 'Приблизительно — город', precisionApproxRegion: 'Приблизительно — регион', precisionApproxCountry: 'Приблизительно — страна' },
  'zh-CN': { precisionExact: '确切地点', precisionApproxCity: '大致位置 — 城市', precisionApproxRegion: '大致位置 — 地区', precisionApproxCountry: '大致位置 — 国家' },
  fr: { precisionExact: 'Lieu exact', precisionApproxCity: 'Approximatif — ville', precisionApproxRegion: 'Approximatif — région', precisionApproxCountry: 'Approximatif — pays' },
  es: { precisionExact: 'Lugar exacto', precisionApproxCity: 'Aproximado — ciudad', precisionApproxRegion: 'Aproximado — región', precisionApproxCountry: 'Aproximado — país' },
  it: { precisionExact: 'Luogo esatto', precisionApproxCity: 'Approssimativo — città', precisionApproxRegion: 'Approssimativo — regione', precisionApproxCountry: 'Approssimativo — paese' },
  pt: { precisionExact: 'Local exato', precisionApproxCity: 'Aproximado — cidade', precisionApproxRegion: 'Aproximado — região', precisionApproxCountry: 'Aproximado — país' },
  tr: { precisionExact: 'Kesin yer', precisionApproxCity: 'Yaklaşık — şehir', precisionApproxRegion: 'Yaklaşık — bölge', precisionApproxCountry: 'Yaklaşık — ülke' },
  ro: { precisionExact: 'Loc exact', precisionApproxCity: 'Aproximativ — oraș', precisionApproxRegion: 'Aproximativ — regiune', precisionApproxCountry: 'Aproximativ — țară' },
  el: { precisionExact: 'Ακριβής τοποθεσία', precisionApproxCity: 'Κατά προσέγγιση — πόλη', precisionApproxRegion: 'Κατά προσέγγιση — περιοχή', precisionApproxCountry: 'Κατά προσέγγιση — χώρα' },
  sr: { precisionExact: 'Tačno mesto', precisionApproxCity: 'Približno — grad', precisionApproxRegion: 'Približno — region', precisionApproxCountry: 'Približno — država' },
  uk: { precisionExact: 'Точне місце', precisionApproxCity: 'Приблизно — місто', precisionApproxRegion: 'Приблизно — регіон', precisionApproxCountry: 'Приблизно — країна' },
  pl: { precisionExact: 'Dokładne miejsce', precisionApproxCity: 'Przybliżone — miasto', precisionApproxRegion: 'Przybliżone — region', precisionApproxCountry: 'Przybliżone — kraj' },
  ar: { precisionExact: 'موقع دقيق', precisionApproxCity: 'تقريبي — مدينة', precisionApproxRegion: 'تقريبي — منطقة', precisionApproxCountry: 'تقريبي — دولة' },
  ja: { precisionExact: '正確な場所', precisionApproxCity: 'おおよその位置 — 都市', precisionApproxRegion: 'おおよその位置 — 地域', precisionApproxCountry: 'おおよその位置 — 国' },
  ko: { precisionExact: '정확한 장소', precisionApproxCity: '대략적인 위치 — 도시', precisionApproxRegion: '대략적인 위치 — 지역', precisionApproxCountry: '대략적인 위치 — 국가' }
};
for (const [locale, values] of Object.entries(precisionLabels)) Object.assign(labels[locale], values);

const operationalLabels = {
  bg: { registryIncomplete: 'Регистърът е зареден частично; възможни са още досиета.', showMore: 'ПОКАЖИ ОЩЕ' },
  en: { registryIncomplete: 'The registry load is incomplete; more cases may be available.', showMore: 'SHOW MORE' },
  de: { registryIncomplete: 'Das Register wurde unvollständig geladen; weitere Fälle sind möglich.', showMore: 'MEHR ANZEIGEN' },
  ru: { registryIncomplete: 'Реестр загружен не полностью; могут быть доступны другие дела.', showMore: 'ПОКАЗАТЬ ЕЩЁ' },
  'zh-CN': { registryIncomplete: '登记档案未完整加载，可能还有更多案例。', showMore: '显示更多' },
  fr: { registryIncomplete: 'Le registre n’a pas été chargé en entier ; d’autres cas peuvent exister.', showMore: 'AFFICHER PLUS' },
  es: { registryIncomplete: 'El registro no se cargó por completo; puede haber más casos.', showMore: 'MOSTRAR MÁS' },
  it: { registryIncomplete: 'Il registro non è stato caricato per intero; potrebbero esserci altri casi.', showMore: 'MOSTRA ALTRO' },
  pt: { registryIncomplete: 'O registro não foi carregado por completo; podem existir mais casos.', showMore: 'MOSTRAR MAIS' },
  tr: { registryIncomplete: 'Kayıt defteri tam yüklenmedi; daha fazla vaka olabilir.', showMore: 'DAHA FAZLA GÖSTER' },
  ro: { registryIncomplete: 'Registrul nu a fost încărcat complet; pot exista mai multe cazuri.', showMore: 'AFIȘEAZĂ MAI MULTE' },
  el: { registryIncomplete: 'Το μητρώο δεν φορτώθηκε πλήρως· ενδέχεται να υπάρχουν κι άλλες υποθέσεις.', showMore: 'ΕΜΦΑΝΙΣΗ ΠΕΡΙΣΣΟΤΕΡΩΝ' },
  sr: { registryIncomplete: 'Registar nije učitan u potpunosti; možda ima još slučajeva.', showMore: 'PRIKAŽI JOŠ' },
  uk: { registryIncomplete: 'Реєстр завантажено не повністю; можуть бути доступні інші справи.', showMore: 'ПОКАЗАТИ ЩЕ' },
  pl: { registryIncomplete: 'Rejestr nie został wczytany w całości; mogą być dostępne kolejne sprawy.', showMore: 'POKAŻ WIĘCEJ' },
  ar: { registryIncomplete: 'لم يُحمّل السجل بالكامل؛ قد تتوفر حالات أخرى.', showMore: 'عرض المزيد' },
  ja: { registryIncomplete: '登録データをすべて読み込めませんでした。ほかにも事例がある可能性があります。', showMore: 'さらに表示' },
  ko: { registryIncomplete: '등록 자료를 모두 불러오지 못했습니다. 더 많은 사례가 있을 수 있습니다.', showMore: '더 보기' }
};
for (const [locale, values] of Object.entries(operationalLabels)) Object.assign(labels[locale], values);

const pageNavigationLabels = {
  bg: { nextPage: 'СЛЕДВАЩИ', previousPage: 'ПРЕДИШНИ' },
  en: { nextPage: 'NEXT', previousPage: 'PREVIOUS' },
  de: { nextPage: 'WEITER', previousPage: 'ZURÜCK' },
  ru: { nextPage: 'ДАЛЕЕ', previousPage: 'НАЗАД' },
  'zh-CN': { nextPage: '下一页', previousPage: '上一页' },
  fr: { nextPage: 'SUIVANT', previousPage: 'PRÉCÉDENT' },
  es: { nextPage: 'SIGUIENTE', previousPage: 'ANTERIOR' },
  it: { nextPage: 'AVANTI', previousPage: 'INDIETRO' },
  pt: { nextPage: 'PRÓXIMA', previousPage: 'ANTERIOR' },
  tr: { nextPage: 'SONRAKİ', previousPage: 'ÖNCEKİ' },
  ro: { nextPage: 'URMĂTORUL', previousPage: 'ANTERIOR' },
  el: { nextPage: 'ΕΠΟΜΕΝΗ', previousPage: 'ΠΡΟΗΓΟΥΜΕΝΗ' },
  sr: { nextPage: 'SLEDEĆA', previousPage: 'PRETHODNA' },
  uk: { nextPage: 'ДАЛІ', previousPage: 'НАЗАД' },
  pl: { nextPage: 'DALEJ', previousPage: 'POPRZEDNIA' },
  ar: { nextPage: 'التالي', previousPage: 'السابق' },
  ja: { nextPage: '次へ', previousPage: '前へ' },
  ko: { nextPage: '다음', previousPage: '이전' }
};
for (const [locale, values] of Object.entries(pageNavigationLabels)) Object.assign(labels[locale], values);

const markerGroupLabels = {
  bg: { mapMarkers: 'МАРКЕРИ И КЛЪСТЕРИ' },
  en: { mapMarkers: 'MAP MARKERS AND CLUSTERS' },
  de: { mapMarkers: 'KARTENMARKER UND CLUSTER' },
  ru: { mapMarkers: 'МАРКЕРЫ И КЛАСТЕРЫ' },
  'zh-CN': { mapMarkers: '地图标记与聚类' },
  fr: { mapMarkers: 'MARQUEURS ET CLUSTERS' },
  es: { mapMarkers: 'MARCADORES Y GRUPOS' },
  it: { mapMarkers: 'SEGNAPOSTI E GRUPPI' },
  pt: { mapMarkers: 'MARCADORES E GRUPOS' },
  tr: { mapMarkers: 'HARİTA İŞARETLERİ VE KÜMELER' },
  ro: { mapMarkers: 'MARCATORE ȘI GRUPURI' },
  el: { mapMarkers: 'ΔΕΙΚΤΕΣ ΚΑΙ ΟΜΑΔΕΣ' },
  sr: { mapMarkers: 'OZNAKE I GRUPE' },
  uk: { mapMarkers: 'МАРКЕРИ Й КЛАСТЕРИ' },
  pl: { mapMarkers: 'ZNACZNIKI I GRUPY' },
  ar: { mapMarkers: 'علامات الخريطة والتجمعات' },
  ja: { mapMarkers: '地図マーカーとクラスター' },
  ko: { mapMarkers: '지도 마커 및 군집' }
};
for (const [locale, values] of Object.entries(markerGroupLabels)) Object.assign(labels[locale], values);

const mapCaveatLabels = {
  bg: { mapCaveat: 'Маркерите показват описани райони, а не измерени траектории.' },
  en: { mapCaveat: 'Markers show reported areas, not measured trajectories.' },
  de: { mapCaveat: 'Markierungen zeigen gemeldete Gebiete, keine gemessenen Flugbahnen.' },
  ru: { mapCaveat: 'Маркеры показывают сообщённые районы, а не измеренные траектории.' },
  'zh-CN': { mapCaveat: '标记表示报告中的区域，并非测量得到的轨迹。' },
  fr: { mapCaveat: 'Les marqueurs indiquent les zones signalées, pas des trajectoires mesurées.' },
  es: { mapCaveat: 'Los marcadores muestran zonas reportadas, no trayectorias medidas.' },
  it: { mapCaveat: 'I marcatori indicano le aree segnalate, non traiettorie misurate.' },
  pt: { mapCaveat: 'Os marcadores mostram áreas relatadas, não trajetórias medidas.' },
  tr: { mapCaveat: 'İşaretçiler bildirilen bölgeleri gösterir; ölçülmüş yörüngeleri değil.' },
  ro: { mapCaveat: 'Marcatorii indică zonele raportate, nu traiectorii măsurate.' },
  el: { mapCaveat: 'Οι δείκτες δείχνουν αναφερόμενες περιοχές, όχι μετρημένες τροχιές.' },
  sr: { mapCaveat: 'Oznake prikazuju prijavljene oblasti, a ne izmerene putanje.' },
  uk: { mapCaveat: 'Маркери показують повідомлені райони, а не виміряні траєкторії.' },
  pl: { mapCaveat: 'Znaczniki pokazują zgłoszone obszary, a nie zmierzone trajektorie.' },
  ar: { mapCaveat: 'تُظهر العلامات المناطق المُبلغ عنها، لا المسارات المقاسة.' },
  ja: { mapCaveat: 'マーカーは報告された地域を示し、測定された軌跡ではありません。' },
  ko: { mapCaveat: '마커는 보고된 지역을 표시하며 측정된 궤적이 아닙니다.' }
};
for (const [locale, values] of Object.entries(mapCaveatLabels)) Object.assign(labels[locale], values);
