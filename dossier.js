/* AURORA / CASE DOSSIERS. Every field is rendered with textContent, never HTML. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const path=location.pathname.split("/").filter(Boolean);
 const kind=path[0],id=path[1]||"";
 const legacy=kind==="archive";
 const base={
  bg:{
   home:"← НАЧАЛО",subtitle:"От първите свидетелства до оригиналните записи — проследи историята зад наблюдението.",
   loading:"Зареждаме досието…",unavailable:"Публичният D1 регистър още не е активиран или е временно недостъпен. Справочният исторически архив е достъпен от началната страница.",
   missing:"Досието не е налично или не е одобрено за публикуване.",invalid:"Невалиден идентификатор на досие.",
   error:"Неуспешно зареждане. Можеш да се върнеш към глобуса и да опиташ отново.",
   kindLegacy:"AURORA / HISTORICAL CASE FILE",kindD1:"AURORA / PUBLIC CASE FILE",
   facts:"ПРОВЕРИМИ ДАННИ / CASE FACTS",id:"ИДЕНТИФИКАТОР",date:"ДАТА",location:"РАЙОН",
   category:"ТИП",publication:"ПУБЛИКАЦИЯ",assessment:"ОЦЕНКА НА ЯВЛЕНИЕТО",precision:"ТОЧНОСТ НА МЯСТОТО",
   summary:"ИСТОРИЯТА ЗАД НАБЛЮДЕНИЕТО",source:"ПРОИЗХОД И ИЗТОЧНИК",
   geography:"ГЕОГРАФСКА НЕСИГУРНОСТ",related:"СВЪРЗАНИ СЛУЧАИ В АРХИВА",openCase:"ОТВОРИ ДОСИЕТО ↗",openSource:"ОТВОРИ ОРИГИНАЛНИЯ ИЗТОЧНИК ↗",
   country:"КЪМ РЕГИСТЪРА НА ДЪРЖАВАТА ↗",back:"← КЪМ ГЛОБУСА",skip:"Към съдържанието",
   reference:"ИСТОРИЧЕСКИ АРХИВ · ПУБЛИКУВАНИ ИЗТОЧНИЦИ",
   approved:"ПУБЛИКУВАНО СЛЕД РЕДАКЦИОНЕН ПРЕГЛЕД",
   
   noCoords:"Няма публикувани достатъчно точни координати. Не се поставя измислена точка на картата.",
   approx:"Позицията е ориентировъчна, а не измерено местоположение на наблюдавания обект.",
   sourceMissing:"Няма разрешен оригинален HTTPS източник.",
   categoryName:{lights:"Светлини",object:"Обект",instrument:"Запис от прибор",other:"Друго"},
   statusName:{resolved:"Обяснено според цитирания източник",unresolved:"Необяснено според цитирания източник",undetermined:"Без определено заключение",disputed:"Оспорвана оценка",reported:"Свидетелско съобщение",official_record:"Официално документирано",explained:"Има известно обяснение"},
   confidence:{high:"висока",moderate:"умерена",low:"ниска",not_stated:"непосочена"}
  },
  en:{
   home:"← HOME",subtitle:"From the first accounts to the original recordings — explore the story behind the sighting.",
   loading:"Loading public dossier…",unavailable:"The D1 public registry is not active or temporarily unavailable. The historical reference archive remains available from the homepage.",
   missing:"This dossier is unavailable or has not been approved for publication.",invalid:"Invalid dossier ID.",
   error:"Could not load dossier. Return to the globe and try again.",
   kindLegacy:"AURORA / HISTORICAL CASE FILE",kindD1:"AURORA / PUBLIC CASE FILE",
   facts:"SOURCE-CHECKED INFORMATION / CASE FACTS",id:"IDENTIFIER",date:"DATE",location:"REGION",
   category:"CATEGORY",publication:"PUBLICATION",assessment:"SOURCE ASSESSMENT",precision:"LOCATION ACCURACY",
   summary:"THE STORY BEHIND THE SIGHTING",source:"PROVENANCE AND ORIGINAL SOURCE",
   geography:"GEOGRAPHIC UNCERTAINTY",related:"RELATED ARCHIVE CASES",openCase:"OPEN DOSSIER ↗",openSource:"OPEN ORIGINAL SOURCE ↗",
   country:"EXPLORE COUNTRY REGISTER ↗",back:"← RETURN TO THE GLOBE",skip:"Skip to content",
   reference:"HISTORICAL ARCHIVE · PUBLISHED SOURCES",
   approved:"PUBLISHED AFTER EDITORIAL REVIEW",
   
   noCoords:"No sufficiently precise published coordinates. No artificial map position is invented.",
   approx:"Coordinates are an approximate display anchor, not a measured object position.",
   sourceMissing:"No verified original HTTPS source is available.",
   categoryName:{lights:"Lights",object:"Object",instrument:"Instrument recording",other:"Other"},
   statusName:{resolved:"Resolved according to cited source",unresolved:"Unresolved according to cited source",undetermined:"No final assessment",disputed:"Disputed assessment",reported:"Eyewitness report",official_record:"Official documented report",explained:"Known explanation"},
   confidence:{high:"high",moderate:"moderate",low:"low",not_stated:"not stated"}
  }
 };
 const overrides={
  de:{home:"← STARTSEITE",subtitle:"Von den ersten Zeugenaussagen bis zu Originalaufnahmen – entdecken Sie die Geschichte hinter der Beobachtung.",loading:"Dossier wird geladen…",unavailable:"Das öffentliche D1-Register ist derzeit nicht aktiv. Das historische Referenzarchiv bleibt auf der Startseite verfügbar.",missing:"Dieses Dossier ist nicht verfügbar oder noch nicht zur Veröffentlichung freigegeben.",invalid:"Ungültige Dossier-Kennung.",error:"Dossier konnte nicht geladen werden. Bitte kehren Sie zum Globus zurück.",facts:"GEPRÜFTE ANGABEN / CASE FACTS",id:"KENNUNG",date:"DATUM",location:"REGION",category:"KATEGORIE",publication:"VERÖFFENTLICHUNG",assessment:"BEWERTUNG",precision:"ORTSGENAUIGKEIT",summary:"DIE GESCHICHTE HINTER DER SICHTUNG",source:"HERKUNFT UND ORIGINALQUELLE",geography:"GEOGRAFISCHE UNSICHERHEIT",related:"VERWANDTE ARCHIVFÄLLE",openCase:"DOSSIER ÖFFNEN ↗",openSource:"ORIGINALQUELLE ÖFFNEN ↗",country:"ZUM LÄNDERREGISTER ↗",back:"← ZURÜCK ZUM GLOBUS",skip:"Zum Inhalt springen",reference:"HISTORISCHES ARCHIV · ORIGINALQUELLEN",approved:"NACH REDAKTIONELLER PRÜFUNG VERÖFFENTLICHT",noCoords:"Keine hinreichend genauen Koordinaten veröffentlicht. Es wird keine künstliche Kartenposition erfunden.",approx:"Koordinaten sind ein ungefährer Orientierungspunkt, keine gemessene Objektposition.",sourceMissing:"Keine geprüfte HTTPS-Originalquelle verfügbar.",categoryName:{lights:"Lichter",object:"Objekt",instrument:"Instrumentenaufnahme",other:"Sonstiges"},statusName:{resolved:"Laut Quelle geklärt",unresolved:"Laut Quelle ungeklärt",undetermined:"Keine abschließende Bewertung",disputed:"Umstrittene Bewertung",reported:"Zeugenbericht",official_record:"Offiziell dokumentiert",explained:"Bekannte Erklärung"},confidence:{high:"hoch",moderate:"mittel",low:"niedrig",not_stated:"nicht angegeben"}},
  ru:{home:"← ГЛАВНАЯ",subtitle:"От первых свидетельств до оригинальных записей — исследуйте историю наблюдения.",loading:"Загрузка досье…",unavailable:"Публичный реестр D1 временно недоступен. Исторический справочный архив доступен на главной странице.",missing:"Досье недоступно или не одобрено для публикации.",invalid:"Недействительный идентификатор досье.",error:"Не удалось загрузить досье. Вернитесь к глобусу и попробуйте снова.",facts:"ПРОВЕРЕННЫЕ ДАННЫЕ / CASE FACTS",id:"ИДЕНТИФИКАТОР",date:"ДАТА",location:"РАЙОН",category:"КАТЕГОРИЯ",publication:"ПУБЛИКАЦИЯ",assessment:"ОЦЕНКА ИСТОЧНИКА",precision:"ТОЧНОСТЬ МЕСТА",summary:"ИСТОРИЯ НАБЛЮДЕНИЯ",source:"ПРОИСХОЖДЕНИЕ И ПЕРВОИСТОЧНИК",geography:"ГЕОГРАФИЧЕСКАЯ НЕОПРЕДЕЛЁННОСТЬ",related:"СВЯЗАННЫЕ СЛУЧАИ В АРХИВЕ",openCase:"ОТКРЫТЬ ДОСЬЕ ↗",openSource:"ОТКРЫТЬ ОРИГИНАЛЬНЫЙ ИСТОЧНИК ↗",country:"К РЕЕСТРУ СТРАНЫ ↗",back:"← НАЗАД К ГЛОБУСУ",skip:"К содержанию",reference:"ИСТОРИЧЕСКИЙ АРХИВ · ОПУБЛИКОВАННЫЕ ИСТОЧНИКИ",approved:"ОПУБЛИКОВАНО ПОСЛЕ РЕДАКЦИОННОГО ПРОСМОТРА",noCoords:"Точные координаты не опубликованы. Искусственная точка на карте не создаётся.",approx:"Координаты являются приблизительным ориентиром, а не измеренным положением объекта.",sourceMissing:"Проверенный HTTPS-источник отсутствует.",categoryName:{lights:"Огни",object:"Объект",instrument:"Приборная запись",other:"Другое"},statusName:{resolved:"Объяснено согласно источнику",unresolved:"Не объяснено согласно источнику",undetermined:"Без окончательной оценки",disputed:"Спорная оценка",reported:"Свидетельство очевидца",official_record:"Официальная запись",explained:"Известное объяснение"},confidence:{high:"высокая",moderate:"средняя",low:"низкая",not_stated:"не указана"}},
  "zh-CN":{home:"← 首页",subtitle:"从最初的目击证言到原始影像，探索这次观测背后的故事。",loading:"正在加载档案…",unavailable:"公开 D1 登记库暂未启用或不可用。首页仍提供历史参考档案。",missing:"此档案不可用或尚未获准公开。",invalid:"无效的档案标识符。",error:"无法加载档案，请返回地球仪重试。",facts:"核查信息 / CASE FACTS",id:"标识符",date:"日期",location:"地区",category:"类别",publication:"发布状态",assessment:"来源评估",precision:"位置精度",summary:"观测背后的故事",source:"出处与原始来源",geography:"地理不确定性",related:"相关档案案例",openCase:"打开档案 ↗",openSource:"打开原始来源 ↗",country:"浏览国家/地区登记库 ↗",back:"← 返回地球仪",skip:"跳至正文",reference:"历史档案 · 公开来源",approved:"经编辑审核后发布",noCoords:"未公布足够精确的坐标，不在地图上虚构位置。",approx:"坐标仅为大致显示锚点，而非测得的目标位置。",sourceMissing:"无已验证的 HTTPS 原始来源。",categoryName:{lights:"光点",object:"物体",instrument:"仪器记录",other:"其他"},statusName:{resolved:"据引用来源已解释",unresolved:"据引用来源未解释",undetermined:"无最终结论",disputed:"存在争议",reported:"目击报告",official_record:"官方记录",explained:"已有已知解释"},confidence:{high:"高",moderate:"中",low:"低",not_stated:"未说明"}},
  fr:{home:"← ACCUEIL",subtitle:"Des premiers témoignages aux enregistrements originaux, explorez l’histoire de cette observation.",loading:"Chargement du dossier…",unavailable:"Le registre public D1 n'est pas actif ou est temporairement indisponible. L'archive historique reste accessible depuis l'accueil.",missing:"Ce dossier est indisponible ou non approuvé pour publication.",invalid:"Identifiant de dossier invalide.",error:"Impossible de charger le dossier. Retournez au globe et réessayez.",facts:"DONNÉES VÉRIFIABLES / CASE FACTS",id:"IDENTIFIANT",date:"DATE",location:"RÉGION",category:"CATÉGORIE",publication:"PUBLICATION",assessment:"ÉVALUATION DE LA SOURCE",precision:"PRÉCISION DU LIEU",summary:"L’HISTOIRE DE L’OBSERVATION",source:"PROVENANCE ET SOURCE ORIGINALE",geography:"INCERTITUDE GÉOGRAPHIQUE",related:"CAS CONNEXES DANS L'ARCHIVE",openCase:"OUVRIR LE DOSSIER ↗",openSource:"OUVRIR LA SOURCE ORIGINALE ↗",country:"EXPLORER LE REGISTRE DU PAYS ↗",back:"← RETOUR AU GLOBE",skip:"Aller au contenu",reference:"ARCHIVES HISTORIQUES · SOURCES PUBLIÉES",approved:"PUBLIÉ APRÈS EXAMEN ÉDITORIAL",noCoords:"Aucune coordonnée précise publiée. Aucun point artificiel n'est inventé.",approx:"Les coordonnées sont un repère approximatif, pas une position mesurée.",sourceMissing:"Aucune source HTTPS originale vérifiée disponible.",categoryName:{lights:"Lumières",object:"Objet",instrument:"Enregistrement d'instrument",other:"Autre"},statusName:{resolved:"Expliqué selon la source citée",unresolved:"Non expliqué selon la source citée",undetermined:"Sans évaluation finale",disputed:"Évaluation contestée",reported:"Témoignage oculaire",official_record:"Document officiel",explained:"Explication connue"},confidence:{high:"élevée",moderate:"modérée",low:"faible",not_stated:"non précisée"}},
  es:{home:"← INICIO",subtitle:"De los primeros testimonios a las grabaciones originales, descubre la historia de la observación.",loading:"Cargando expediente…",unavailable:"El registro público D1 no está activo o no está disponible temporalmente. El archivo histórico sigue disponible en la página principal.",missing:"Este expediente no está disponible o no ha sido aprobado.",invalid:"Identificador de expediente no válido.",error:"No se pudo cargar el expediente. Vuelve al globo e inténtalo de nuevo.",facts:"DATOS VERIFICABLES / CASE FACTS",id:"IDENTIFICADOR",date:"FECHA",location:"REGIÓN",category:"CATEGORÍA",publication:"PUBLICACIÓN",assessment:"EVALUACIÓN DE LA FUENTE",precision:"PRECISIÓN DEL LUGAR",summary:"LA HISTORIA DEL AVISTAMIENTO",source:"PROCEDENCIA Y FUENTE ORIGINAL",geography:"INCERTIDUMBRE GEOGRÁFICA",related:"CASOS RELACIONADOS EN EL ARCHIVO",openCase:"ABRIR EXPEDIENTE ↗",openSource:"ABRIR FUENTE ORIGINAL ↗",country:"EXPLORAR REGISTRO DEL PAÍS ↗",back:"← VOLVER AL GLOBO",skip:"Saltar al contenido",reference:"ARCHIVO HISTÓRICO · FUENTES PUBLICADAS",approved:"PUBLICADO TRAS REVISIÓN EDITORIAL",noCoords:"No hay coordenadas publicadas suficientemente precisas. No se inventa ninguna posición.",approx:"Las coordenadas son una referencia aproximada, no una posición medida.",sourceMissing:"No hay fuente HTTPS original verificada.",categoryName:{lights:"Luces",object:"Objeto",instrument:"Registro instrumental",other:"Otro"},statusName:{resolved:"Explicado según la fuente citada",unresolved:"No explicado según la fuente citada",undetermined:"Sin evaluación final",disputed:"Evaluación debatida",reported:"Relato de testigo",official_record:"Registro oficial documentado",explained:"Explicación conocida"},confidence:{high:"alta",moderate:"moderada",low:"baja",not_stated:"no indicada"}},
  it:{home:"← HOME",subtitle:"Dalle prime testimonianze alle registrazioni originali: scopri la storia dietro l'avvistamento.",loading:"Caricamento del dossier…",unavailable:"Il registro pubblico D1 non è attivo o è temporaneamente non disponibile. L'archivio storico resta disponibile dalla pagina iniziale.",missing:"Questo dossier non è disponibile o non è stato approvato.",invalid:"ID dossier non valido.",error:"Impossibile caricare il dossier. Torna al globo e riprova.",facts:"DATI VERIFICABILI / CASE FACTS",id:"IDENTIFICATORE",date:"DATA",location:"REGIONE",category:"CATEGORIA",publication:"PUBBLICAZIONE",assessment:"VALUTAZIONE DELLA FONTE",precision:"PRECISIONE DELLA POSIZIONE",summary:"LA STORIA DELL’AVVISTAMENTO",source:"PROVENIENZA E FONTE ORIGINALE",geography:"INCERTEZZA GEOGRAFICA",related:"CASI CORRELATI NELL'ARCHIVIO",openCase:"APRI DOSSIER ↗",openSource:"APRI FONTE ORIGINALE ↗",country:"ESPLORA REGISTRO DEL PAESE ↗",back:"← TORNA AL GLOBO",skip:"Vai al contenuto",reference:"ARCHIVIO STORICO · FONTI PUBBLICATE",approved:"PUBBLICATO DOPO REVISIONE EDITORIALE",noCoords:"Coordinate precise non pubblicate. Non viene inventata alcuna posizione sulla mappa.",approx:"Le coordinate sono un riferimento approssimativo, non una posizione misurata.",sourceMissing:"Nessuna fonte HTTPS originale verificata disponibile.",categoryName:{lights:"Luci",object:"Oggetto",instrument:"Registrazione strumentale",other:"Altro"},statusName:{resolved:"Spiegato secondo la fonte citata",unresolved:"Non spiegato secondo la fonte citata",undetermined:"Nessuna valutazione finale",disputed:"Valutazione discussa",reported:"Testimonianza oculare",official_record:"Documento ufficiale",explained:"Spiegazione nota"},confidence:{high:"alta",moderate:"moderata",low:"bassa",not_stated:"non indicata"}},
  pt:{home:"← INÍCIO",subtitle:"Dos primeiros relatos às gravações originais, explore a história da observação.",loading:"A carregar dossiê…",unavailable:"O registo público D1 não está ativo ou está temporariamente indisponível. O arquivo histórico continua disponível na página inicial.",missing:"Este dossiê não está disponível ou não foi aprovado.",invalid:"Identificador de dossiê inválido.",error:"Não foi possível carregar o dossiê. Volte ao globo e tente novamente.",facts:"DADOS VERIFICÁVEIS / CASE FACTS",id:"IDENTIFICADOR",date:"DATA",location:"REGIÃO",category:"CATEGORIA",publication:"PUBLICAÇÃO",assessment:"AVALIAÇÃO DA FONTE",precision:"PRECISÃO DO LOCAL",summary:"A HISTÓRIA DA OBSERVAÇÃO",source:"PROVENIÊNCIA E FONTE ORIGINAL",geography:"INCERTEZA GEOGRÁFICA",related:"CASOS RELACIONADOS NO ARQUIVO",openCase:"ABRIR DOSSIÊ ↗",openSource:"ABRIR FONTE ORIGINAL ↗",country:"EXPLORAR REGISTO DO PAÍS ↗",back:"← VOLTAR AO GLOBO",skip:"Ir para o conteúdo",reference:"ARQUIVO HISTÓRICO · FONTES PUBLICADAS",approved:"PUBLICADO APÓS REVISÃO EDITORIAL",noCoords:"Sem coordenadas precisas publicadas. Nenhuma posição artificial é inventada.",approx:"As coordenadas são uma referência aproximada, não uma posição medida.",sourceMissing:"Nenhuma fonte HTTPS original verificada disponível.",categoryName:{lights:"Luzes",object:"Objeto",instrument:"Registo instrumental",other:"Outro"},statusName:{resolved:"Explicado segundo a fonte citada",unresolved:"Não explicado segundo a fonte citada",undetermined:"Sem avaliação final",disputed:"Avaliação contestada",reported:"Relato ocular",official_record:"Registo oficial documentado",explained:"Explicação conhecida"},confidence:{high:"alta",moderate:"moderada",low:"baixa",not_stated:"não indicada"}},
  tr:{home:"← ANA SAYFA",subtitle:"İlk tanıklıklardan özgün kayıtlara, gözlemin ardındaki hikâyeyi keşfedin.",loading:"Dosya yükleniyor…",unavailable:"Herkese açık D1 kaydı henüz aktif değil veya geçici olarak kullanılamıyor. Tarihî başvuru arşivi ana sayfada mevcuttur.",missing:"Bu dosya kullanılamıyor veya yayın için onaylanmadı.",invalid:"Geçersiz dosya kimliği.",error:"Dosya yüklenemedi. Küreye dönüp tekrar deneyin.",facts:"DOĞRULANABİLİR VERİLER / CASE FACTS",id:"KİMLİK",date:"TARİH",location:"BÖLGE",category:"KATEGORİ",publication:"YAYIN",assessment:"KAYNAK DEĞERLENDİRMESİ",precision:"KONUM HASSASİYETİ",summary:"GÖZLEMİN ARDINDAKİ HİKÂYE",source:"KÖKEN VE ÖZGÜN KAYNAK",geography:"COĞRAFİ BELİRSİZLİK",related:"ARŞİVDEKİ İLGİLİ VAKALAR",openCase:"DOSYAYI AÇ ↗",openSource:"ÖZGÜN KAYNAĞI AÇ ↗",country:"ÜLKE KAYDINI İNCELE ↗",back:"← KÜREYE DÖN",skip:"İçeriğe geç",reference:"TARİHSEL ARŞİV · YAYIMLANMIŞ KAYNAKLAR",approved:"EDİTORYAL İNCELEME SONRASI YAYIMLANDI",noCoords:"Yeterince kesin koordinat yayınlanmamıştır. Yapay harita konumu oluşturulmaz.",approx:"Koordinatlar ölçülmüş bir konum değil, yaklaşık bir gösterim referansıdır.",sourceMissing:"Doğrulanmış HTTPS özgün kaynağı mevcut değil.",categoryName:{lights:"Işıklar",object:"Nesne",instrument:"Cihaz kaydı",other:"Diğer"},statusName:{resolved:"Kaynağa göre açıklandı",unresolved:"Kaynağa göre açıklanamadı",undetermined:"Nihai değerlendirme yok",disputed:"Tartışmalı değerlendirme",reported:"Görgü tanığı raporu",official_record:"Resmî belgelenmiş kayıt",explained:"Bilinen açıklama"},confidence:{high:"yüksek",moderate:"orta",low:"düşük",not_stated:"belirtilmemiş"}},
  ro:{home:"← ACASĂ",subtitle:"De la primele mărturii la înregistrările originale, descoperă povestea observației.",loading:"Se încarcă dosarul…",unavailable:"Registrul public D1 nu este activ sau este temporar indisponibil. Arhiva istorică rămâne disponibilă pe pagina principală.",missing:"Acest dosar nu este disponibil sau nu a fost aprobat.",invalid:"Identificator de dosar invalid.",error:"Dosarul nu a putut fi încărcat. Revino la glob și încearcă din nou.",facts:"DATE VERIFICABILE / CASE FACTS",id:"IDENTIFICATOR",date:"DATĂ",location:"REGIUNE",category:"CATEGORIE",publication:"PUBLICARE",assessment:"EVALUAREA SURSEI",precision:"PRECIZIA LOCAȚIEI",summary:"POVESTEA OBSERVAȚIEI",source:"PROVENIENȚĂ ȘI SURSĂ ORIGINALĂ",geography:"INCERTITUDINE GEOGRAFICĂ",related:"CAZURI CONEXE ÎN ARHIVĂ",openCase:"DESCHIDE DOSARUL ↗",openSource:"DESCHIDE SURSA ORIGINALĂ ↗",country:"EXPLOREAZĂ REGISTRUL ȚĂRII ↗",back:"← ÎNAPOI LA GLOB",skip:"Mergi la conținut",reference:"ARHIVĂ ISTORICĂ · SURSE PUBLICATE",approved:"PUBLICAT DUPĂ REVIZUIRE EDITORIALĂ",noCoords:"Nu există coordonate publicate suficient de precise. Nu se inventează nicio poziție.",approx:"Coordonatele sunt un reper aproximativ, nu o poziție măsurată.",sourceMissing:"Nicio sursă HTTPS originală verificată disponibilă.",categoryName:{lights:"Lumini",object:"Obiect",instrument:"Înregistrare instrumentală",other:"Altele"},statusName:{resolved:"Explicat conform sursei citate",unresolved:"Neexplicat conform sursei citate",undetermined:"Fără evaluare finală",disputed:"Evaluare disputată",reported:"Relatare de martor",official_record:"Document oficial",explained:"Explicație cunoscută"},confidence:{high:"ridicată",moderate:"moderată",low:"scăzută",not_stated:"nespecificată"}},
  el:{home:"← ΑΡΧΙΚΗ",subtitle:"Από τις πρώτες μαρτυρίες έως τις πρωτότυπες καταγραφές, ανακαλύψτε την ιστορία της παρατήρησης.",loading:"Φόρτωση φακέλου…",unavailable:"Το δημόσιο μητρώο D1 δεν είναι ενεργό ή είναι προσωρινά μη διαθέσιμο. Το ιστορικό αρχείο παραμένει διαθέσιμο στην αρχική σελίδα.",missing:"Ο φάκελος δεν είναι διαθέσιμος ή δεν έχει εγκριθεί.",invalid:"Μη έγκυρο αναγνωριστικό φακέλου.",error:"Αδυναμία φόρτωσης φακέλου. Επιστρέψτε στην υδρόγειο.",facts:"ΕΠΑΛΗΘΕΥΣΙΜΑ ΣΤΟΙΧΕΙΑ / CASE FACTS",id:"ΑΝΑΓΝΩΡΙΣΤΙΚΟ",date:"ΗΜΕΡΟΜΗΝΙΑ",location:"ΠΕΡΙΟΧΗ",category:"ΚΑΤΗΓΟΡΙΑ",publication:"ΔΗΜΟΣΙΕΥΣΗ",assessment:"ΑΞΙΟΛΟΓΗΣΗ ΠΗΓΗΣ",precision:"ΑΚΡΙΒΕΙΑ ΤΟΠΟΘΕΣΙΑΣ",summary:"Η ΙΣΤΟΡΙΑ ΤΗΣ ΠΑΡΑΤΗΡΗΣΗΣ",source:"ΠΡΟΕΛΕΥΣΗ ΚΑΙ ΠΡΩΤΟΤΥΠΗ ΠΗΓΗ",geography:"ΓΕΩΓΡΑΦΙΚΗ ΑΒΕΒΑΙΟΤΗΤΑ",related:"ΣΧΕΤΙΚΕΣ ΥΠΟΘΕΣΕΙΣ ΣΤΟ ΑΡΧΕΙΟ",openCase:"ΑΝΟΙΓΜΑ ΦΑΚΕΛΟΥ ↗",openSource:"ΑΝΟΙΓΜΑ ΠΡΩΤΟΤΥΠΗΣ ΠΗΓΗΣ ↗",country:"ΜΗΤΡΩΟ ΧΩΡΑΣ ↗",back:"← ΕΠΙΣΤΡΟΦΗ ΣΤΗΝ ΥΔΡΟΓΕΙΟ",skip:"Μετάβαση στο περιεχόμενο",reference:"ΙΣΤΟΡΙΚΟ ΑΡΧΕΙΟ · ΔΗΜΟΣΙΕΥΜΕΝΕΣ ΠΗΓΕΣ",approved:"ΔΗΜΟΣΙΕΥΤΗΚΕ ΜΕΤΑ ΑΠΟ ΣΥΝΤΑΚΤΙΚΟ ΕΛΕΓΧΟ",noCoords:"Δεν υπάρχουν δημοσιευμένες ακριβείς συντεταγμένες. Δεν επινοείται θέση στον χάρτη.",approx:"Οι συντεταγμένες είναι προσεγγιστικό σημείο αναφοράς.",sourceMissing:"Δεν υπάρχει επιβεβαιωμένη πηγή HTTPS.",categoryName:{lights:"Φώτα",object:"Αντικείμενο",instrument:"Καταγραφή οργάνων",other:"Άλλο"},statusName:{resolved:"Εξηγήθηκε σύμφωνα με την πηγή",unresolved:"Ανεξήγητο σύμφωνα με την πηγή",undetermined:"Χωρίς τελική αξιολόγηση",disputed:"Αμφισβητούμενη αξιολόγηση",reported:"Μαρτυρία",official_record:"Επίσημο έγγραφο",explained:"Γνωστή εξήγηση"},confidence:{high:"υψηλή",moderate:"μέτρια",low:"χαμηλή",not_stated:"δεν αναφέρεται"}},
  sr:{home:"← ПОЧЕТНА",subtitle:"Од првих сведочења до оригиналних снимака, истражите причу иза посматрања.",loading:"Учитавање досијеа…",unavailable:"Јавни D1 регистар још није активан или је привремено недоступан. Историјски архив је доступан на почетној страници.",missing:"Овај досије није доступан или није одобрен за објављивање.",invalid:"Неважећи идентификатор досијеа.",error:"Није могуће учитати досије. Вратите се на глобус.",facts:"ПРОВЕРЉИВИ ПОДАЦИ / CASE FACTS",id:"ИДЕНТИФИКАТОР",date:"ДАТУМ",location:"РЕГИОН",category:"КАТЕГОРИЈА",publication:"ПУБЛИКАЦИЈА",assessment:"ПРОЦЕНА ИЗВОРА",precision:"ПРЕЦИЗНОСТ ЛОКАЦИЈЕ",summary:"ПРИЧА ИЗА ПОСМАТРАЊА",source:"ПОРЕКЛО И ИЗВОРНИ ИЗВОР",geography:"ГЕОГРАФСКА НЕСИГУРНОСТ",related:"ПОВЕЗАНИ СЛУЧАЈЕВИ У АРХИВИ",openCase:"ОТВОРИ ДОСИЈЕ ↗",openSource:"ОТВОРИ ИЗВОРНИ ИЗВОР ↗",country:"ИСТРАЖИ РЕГИСТАР ДРЖАВЕ ↗",back:"← НАЗАД НА ГЛОБУС",skip:"Пређи на садржај",reference:"ИСТОРИЈСКА АРХИВА · ОБЈАВЉЕНИ ИЗВОРИ",approved:"ОБЈАВЉЕНО НАКОН УРЕДНИЧКОГ ПРЕГЛЕДА",noCoords:"Нема објављених прецизних координата. Не поставља се измишљена тачка на мапи.",approx:"Координате су приближна тачка приказа, а не измерена позиција објекта.",sourceMissing:"Нема провереног изворног HTTPS линка.",categoryName:{lights:"Светла",object:"Објекат",instrument:"Инструментални снимак",other:"Друго"},statusName:{resolved:"Објашњено према извору",unresolved:"Необјашњено према извору",undetermined:"Без коначне процене",disputed:"Оспорена процена",reported:"Сведочење очевица",official_record:"Званично документовано",explained:"Познато објашњење"},confidence:{high:"висока",moderate:"умерена",low:"ниска",not_stated:"није наведена"}},
  uk:{home:"← ГОЛОВНА",subtitle:"Від перших свідчень до оригінальних записів — досліджуйте історію спостереження.",loading:"Завантаження досьє…",unavailable:"Публічний реєстр D1 ще не активований або тимчасово недоступний. Історичний архів доступний на головній сторінці.",missing:"Це досьє недоступне або не схвалене для публікації.",invalid:"Недійсний ідентифікатор досьє.",error:"Не вдалося завантажити досьє. Поверніться до глобуса.",facts:"ПЕРЕВІРЕНІ ДАНІ / CASE FACTS",id:"ІДЕНТИФІКАТОР",date:"ДАТА",location:"РАЙОН",category:"КАТЕГОРІЯ",publication:"ПУБЛІКАЦІЯ",assessment:"ОЦІНКА ДЖЕРЕЛА",precision:"ТОЧНІСТЬ МІСЦЯ",summary:"ІСТОРІЯ СПОСТЕРЕЖЕННЯ",source:"ПОХОДЖЕННЯ ТА ПЕРШОДЖЕРЕЛО",geography:"ГЕОГРАФІЧНА НЕВИЗНАЧЕНІСТЬ",related:"ПОВ'ЯЗАНІ ВИПАДКИ В АРХІВІ",openCase:"ВІДКРИТИ ДОСЬЄ ↗",openSource:"ВІДКРИТИ ОРИГІНАЛЬНЕ ДЖЕРЕЛО ↗",country:"ДО РЕЄСТРУ КРАЇНИ ↗",back:"← НАЗАД ДО ГЛОБУСА",skip:"До вмісту",reference:"ІСТОРИЧНИЙ АРХІВ · ОПУБЛІКОВАНІ ДЖЕРЕЛА",approved:"ОПУБЛІКОВАНО ПІСЛЯ РЕДАКЦІЙНОЇ ПЕРЕВІРКИ",noCoords:"Немає опублікованих точних координат. Штучна точка на карті не створюється.",approx:"Координати є орієнтовною точкою, а не виміряним положенням об’єкта.",sourceMissing:"Немає перевіреного оригінального HTTPS-джерела.",categoryName:{lights:"Вогні",object:"Об'єкт",instrument:"Приладовий запис",other:"Інше"},statusName:{resolved:"Пояснено згідно з джерелом",unresolved:"Не пояснено згідно з джерелом",undetermined:"Без остаточної оцінки",disputed:"Суперечлива оцінка",reported:"Свідчення очевидця",official_record:"Офіційно задокументовано",explained:"Відоме пояснення"},confidence:{high:"висока",moderate:"помірна",low:"низька",not_stated:"не вказана"}},
  pl:{home:"← STRONA GŁÓWNA",subtitle:"Od pierwszych relacji po oryginalne nagrania — odkryj historię obserwacji.",loading:"Ładowanie dossier…",unavailable:"Publiczny rejestr D1 nie jest aktywny lub jest chwilowo niedostępny. Archiwum historyczne pozostaje dostępne na stronie głównej.",missing:"To dossier jest niedostępne lub nie zostało zatwierdzone.",invalid:"Nieprawidłowy identyfikator dossier.",error:"Nie udało się wczytać dossier. Wróć do globusa i spróbuj ponownie.",facts:"ZWERYFIKOWANE DANE / CASE FACTS",id:"IDENTYFIKATOR",date:"DATA",location:"REGION",category:"KATEGORIA",publication:"PUBLIKACJA",assessment:"OCENA ŹRÓDŁA",precision:"DOKŁADNOŚĆ LOKALIZACJI",summary:"HISTORIA OBSERWACJI",source:"POCHODZENIE I ŹRÓDŁO ORYGINALNE",geography:"NIEPEWNOŚĆ GEOGRAFICZNA",related:"POWIĄZANE PRZYPADKI W ARCHIWUM",openCase:"OTWÓRZ DOSSIER ↗",openSource:"OTWÓRZ ŹRÓDŁO ORYGINALNE ↗",country:"ZOBACZ REJESTR KRAJU ↗",back:"← POWRÓT DO GLOBUSA",skip:"Przejdź do treści",reference:"ARCHIWUM HISTORYCZNE · OPUBLIKOWANE ŹRÓDŁA",approved:"OPUBLIKOWANO PO WERYFIKACJI REDAKCYJNEJ",noCoords:"Brak wystarczająco dokładnych współrzędnych. Nie tworzymy sztucznego punktu na mapie.",approx:"Współrzędne są przybliżonym punktem orientacyjnym, a nie zmierzoną pozycją obiektu.",sourceMissing:"Brak zweryfikowanego oryginalnego źródła HTTPS.",categoryName:{lights:"Światła",object:"Obiekt",instrument:"Zapis instrumentalny",other:"Inne"},statusName:{resolved:"Wyjaśnione według cytowanego źródła",unresolved:"Niewyjaśnione według cytowanego źródła",undetermined:"Brak końcowej oceny",disputed:"Ocena sporna",reported:"Relacja świadka",official_record:"Oficjalny dokument",explained:"Znane wyjaśnienie"},confidence:{high:"wysoka",moderate:"umiarkowana",low:"niska",not_stated:"nieokreślona"}},
  ar:{home:"← الرئيسية",subtitle:"من الشهادات الأولى إلى التسجيلات الأصلية، اكتشف قصة الرصد.",loading:"جارٍ تحميل الملف…",unavailable:"سجل D1 العام غير مفعل أو غير متاح مؤقتاً. يظل الأرشيف التاريخي متاحاً في الصفحة الرئيسية.",missing:"هذا الملف غير متاح أو لم تتم الموافقة على نشره.",invalid:"معرف ملف غير صالح.",error:"تعذر تحميل الملف. عد إلى الكرة الأرضية وحاول مجدداً.",facts:"معلومات موثقة / CASE FACTS",id:"المعرف",date:"التاريخ",location:"المنطقة",category:"الفئة",publication:"النشر",assessment:"تقييم المصدر",precision:"دقة الموقع",summary:"القصة وراء الرصد",source:"الأصل والمصدر الأصلي",geography:"عدم اليقين الجغرافي",related:"حالات ذات صلة في الأرشيف",openCase:"افتح الملف ↗",openSource:"افتح المصدر الأصلي ↗",country:"استكشف سجل الدولة ↗",back:"← العودة إلى الكرة الأرضية",skip:"الانتقال إلى المحتوى",reference:"أرشيف تاريخي · مصادر منشورة",approved:"نُشر بعد مراجعة تحريرية",noCoords:"لا توجد إحداثيات منشورة دقيقة بما يكفي. لا يتم اختلاق موقع على الخريطة.",approx:"الإحداثيات هي نقطة عرض تقريبية وليست موقعاً مقاساً للجسم.",sourceMissing:"لا يتوفر مصدر HTTPS أصلي موثق.",categoryName:{lights:"أضواء",object:"جسم",instrument:"تسجيل بالأجهزة",other:"أخرى"},statusName:{resolved:"مفسر وفقاً للمصدر المذكور",unresolved:"غير مفسر وفقاً للمصدر المذكور",undetermined:"بدون تقييم نهائي",disputed:"تقييم مختلف عليه",reported:"تقرير شاهد عيان",official_record:"سجل رسمي موثق",explained:"تفسير معروف"},confidence:{high:"عالية",moderate:"متوسطة",low:"منخفضة",not_stated:"غير محددة"}},
  ja:{home:"← ホーム",subtitle:"最初の証言から原記録まで、目撃の背景にある物語を探ってください。",loading:"事例ファイルを読み込み中…",unavailable:"公開D1レジストリは現在無効または一時的に利用できません。歴史的参照アーカイブはホームページから利用できます。",missing:"この事例ファイルは利用できないか、公開が承認されていません。",invalid:"無効な事例IDです。",error:"事例を読み込めませんでした。地球儀に戻って再試行してください。",facts:"検証可能な情報 / CASE FACTS",id:"識別子",date:"日付",location:"地域",category:"カテゴリ",publication:"公開区分",assessment:"出典の評価",precision:"位置の精度",summary:"目撃の記録",source:"来歴と元の出典",geography:"地理的不確実性",related:"関連するアーカイブ事例",openCase:"事例を開く ↗",openSource:"元の出典を開く ↗",country:"国別レジストリを見る ↗",back:"← 地球儀に戻る",skip:"本文へ移動",reference:"歴史アーカイブ · 公開資料",approved:"編集審査後に公開",noCoords:"十分な精度の座標が公表されていません。架空の地図位置は作成されません。",approx:"座標は概略の表示位置であり、測定された物体の位置ではありません。",sourceMissing:"検証済みのオリジナルHTTPS出典がありません。",categoryName:{lights:"光",object:"物体",instrument:"機器による記録",other:"その他"},statusName:{resolved:"出典により解明済み",unresolved:"出典により未解明",undetermined:"最終評価なし",disputed:"評価に議論あり",reported:"目撃報告",official_record:"公式記録",explained:"既知の説明あり"},confidence:{high:"高",moderate:"中",low:"低",not_stated:"記載なし"}},
  ko:{home:"← 홈",subtitle:"첫 증언부터 원본 영상까지, 목격 기록 뒤의 이야기를 탐구해 보세요.",loading:"사례 기록을 불러오는 중…",unavailable:"공개 D1 레지스트리가 아직 활성화되지 않았거나 일시적으로 사용할 수 없습니다. 역사적 참조 아카이브는 홈페이지에서 이용할 수 있습니다.",missing:"이 사례 기록은 사용할 수 없거나 게시 승인되지 않았습니다.",invalid:"유효하지 않은 사례 ID입니다.",error:"사례 기록을 불러올 수 없습니다. 지구본으로 돌아가 다시 시도하세요.",facts:"검증된 정보 / CASE FACTS",id:"식별자",date:"날짜",location:"지역",category:"분류",publication:"게시 상태",assessment:"출처 평가",precision:"위치 정확도",summary:"목격의 이야기",source:"출처 및 원본 자료",geography:"지리적 불확실성",related:"관련 아카이브 사례",openCase:"사례 열기 ↗",openSource:"원본 출처 열기 ↗",country:"국가 레지스트리 탐색 ↗",back:"← 지구본으로 돌아가기",skip:"본문으로 건너뛰기",reference:"역사 기록 보관소 · 공개 자료",approved:"편집 검토 후 게시",noCoords:"충분히 정확한 좌표가 공개되지 않았습니다. 임의의 지도 위치를 생성하지 않습니다.",approx:"좌표는 대략적인 표시 기준점이며 측정된 물체 위치가 아닙니다.",sourceMissing:"검증된 원본 HTTPS 출처가 없습니다.",categoryName:{lights:"불빛",object:"물체",instrument:"장비 기록",other:"기타"},statusName:{resolved:"인용 출처에 따라 해명됨",unresolved:"인용 출처에 따라 미해명",undetermined:"최종 평가 없음",disputed:"논란이 있는 평가",reported:"목격자 보고",official_record:"공식 문서 기록",explained:"알려진 설명 있음"},confidence:{high:"높음",moderate:"보통",low:"낮음",not_stated:"명시되지 않음"}}
 };
 let language=(()=>{try{return localStorage.getItem("aurora-lang")||"bg"}catch{return "bg"}})();
 document.documentElement.lang=language;
 const getPack=()=>{
  if(language==="bg")return base.bg;
  const o=overrides[language]||{};
  return {...base.en,...o,categoryName:{...base.en.categoryName,...(o.categoryName||{})},statusName:{...base.en.statusName,...(o.statusName||{})},confidence:{...base.en.confidence,...(o.confidence||{})}};
 };
 const local=x=>x?.[language]||x?.en||"";
 const legacyBulgarian=x=>language==="bg"&&(
  /(?:е случай, описан в публичния каталог|Публикуваните сведения се отнасят|Маркерът, ако има такъв)/i.test(String(x?.summary?.bg||""))||
  (x?.story?.bg||[]).some(p=>/^EN\s*[·:]/.test(String(p))||/Следва оригиналното описание на английски/.test(String(p)))
 );
 const translationRequested=new Set();
 function narrativeDisclosure(record){
  const el=$("dossierTranslationDisclosure")||(()=>{
   const tag=document.createElement("p");tag.id="dossierTranslationDisclosure";
   tag.className="archive-translation-disclosure";
   tag.setAttribute("role","note");
   $("dossierSubtitle")?.after(tag);return tag;
  })();
  const currentIsNative=Boolean(record?.title?.[language]&&record?.summary?.[language]&&
    Array.isArray(record?.story?.[language])&&!legacyBulgarian(record));
  if(language==="en"||currentIsNative){el.hidden=true;return}
  const labels={
   bg:"Оригиналният разказ е на английски. Преводът не е наличен или е частичен.",
   de:"Originalbericht auf Englisch; die Übersetzung ist nicht verfügbar oder unvollständig.",
   ru:"Оригинальный рассказ на английском; перевод недоступен или неполон.",
   fr:"Récit original en anglais ; traduction absente ou partielle.",
   es:"Relato original en inglés; traducción no disponible o parcial.",
   "zh-CN":"英文原文 · 翻译暂不可用或不完整。",
   it:"Testo originale inglese · traduzione non disponibile o incompleta.",
   pt:"Texto original em inglês · tradução indisponível ou parcial.",
   tr:"İngilizce özgün metin · çeviri mevcut değil veya eksik.",
   ro:"Text original în engleză · traducere indisponibilă sau parțială.",
   el:"Αγγλικό πρωτότυπο · η μετάφραση δεν είναι διαθέσιμη ή είναι ελλιπής.",
   sr:"Енглески изворни текст · превод није доступан или је непотпун.",
   uk:"Англійський оригінал · переклад недоступний або неповний.",
   pl:"Oryginalny tekst angielski · tłumaczenie niedostępne lub niepełne.",
   ar:"النص الإنجليزي الأصلي · الترجمة غير متاحة أو غير مكتملة.",
   ja:"英語の原文です。翻訳が利用できないか不完全です。",
   ko:"영어 원문입니다. 번역이 없거나 불완전합니다。"
  };
  el.textContent=labels[language]||"Original English narrative · Translation unavailable or partial";
  el.hidden=false;
 }
 function requestNarrativeTranslation(record){
  if(!legacy||language==="en"||!record?.id)return;
  const lang=language,key=record.id+"/"+lang;
  if(translationRequested.has(key))return;
  translationRequested.add(key);
  void import("/archive-localization.js").then(module=>module.translatePublicCase(record,lang,{detail:true}))
   .then(reply=>{
    if(!reply||currentCase!==record||language!==lang)return;
    // Keep source provenance, event assessments and multimedia unchanged.
    render(record);
   }).catch(()=>{}).finally(()=>translationRequested.delete(key));
 }
 let currentCase=null,archiveCases=[],feedbackState="loading";
 function feedback(stateKey,error=false){
  feedbackState=stateKey;
  const t=getPack();
  $("dossierFeedback").textContent=t[stateKey]||stateKey;
  $("dossierFeedback").classList.toggle("error",error);
  $("dossierFeedback").hidden=false;
  $("dossierContent").hidden=true;
  $("dossierActions").hidden=true;
 }
 function sourceUrl(raw){
  try{
   const u=new URL(raw);
   if(u.protocol!=="https:"||u.username||u.password||u.port||!u.hostname.includes("."))return null;
   return u.href;
  }catch{return null}
 }
 function label(id,value){const el=$(id);if(el)el.textContent=value}
 function renderRelatedCases(c,t){
  const section=$("relatedCasesSection"),grid=$("relatedCasesGrid");
  if(!section||!grid)return;
  grid.replaceChildren();
  label("relatedHeading",t.related);
  const country=c.country_code||c.country||"";
  const candidates=archiveCases.filter(item=>item&&item.id!==c.id&&/^[a-z0-9-]{3,90}$/.test(item.id)&&item.title?.en);
  const sameCountry=candidates.filter(item=>(item.country||item.country_code)===country);
  const sameCategory=candidates.filter(item=>item.category===c.category&&(item.country||item.country_code)!==country);
  const related=[...sameCountry,...sameCategory,...candidates].filter((item,idx,arr)=>arr.findIndex(x=>x.id===item.id)===idx).slice(0,3);
  if(!related.length){
   section.hidden=true;
   return;
  }
  for(const item of related){
   const card=document.createElement("a");
   card.className="related-case-card";
   card.href="/archive/"+encodeURIComponent(item.id);
   const meta=document.createElement("span");
   meta.className="related-case-meta";
   meta.textContent=[item.date,item.country,t.categoryName[item.category]||item.category].filter(Boolean).join(" · ");
   const title=document.createElement("strong");
   title.textContent=local(item.title)||item.id;
   const cta=document.createElement("small");
   cta.textContent=t.openCase;
   card.append(meta,title,cta);
   grid.append(card);
  }
  section.hidden=false;
 }
 function render(c){
  currentCase=c;
  const t=getPack();
  const sourceEnglish=legacyBulgarian(c)&&!c.translationSummaryReady;
  const title=(sourceEnglish?c.title?.en:local(c.title))||id;
  const summary=(sourceEnglish?c.summary?.en:local(c.summary))||c.description||"";
  const area=local(c.city)||c.location||"—";
  const country=c.country_code||c.country||"";
  const assessment=c.assessment_status||c.status||"undetermined";
  document.title=title+" | AURORA UAP";
  const metaDesc=document.querySelector('meta[name="description"]');
  if(metaDesc&&summary)metaDesc.setAttribute("content",summary);
  label("dossierTitle",title);
  label("dossierKind",legacy?t.kindLegacy:t.kindD1);
  label("dossierSubtitle",t.subtitle);
  label("factIdentifier",c.id);
  label("factDate",c.date+(c.date_precision?" · "+c.date_precision:""));
  label("factLocation",area+(country?" · "+country:""));
  label("factCategory",t.categoryName[c.category]||c.category||"—");
  label("factPublication",legacy?t.reference:t.approved);
  label("factAssessment",t.statusName[assessment]||t.statusName.undetermined);
  label("factPrecision",Number.isFinite(c.lat)&&Number.isFinite(c.lng)?(language==="en"?(c.location_precision||t.approx):t.approx):t.noCoords);
  label("dossierSummary",summary);
  label("dossierDepth",["editorial","sourced-feature","source-reviewed"].includes(c.content_depth)?
   (language==="bg"?"ИСТОРИЯ И КОНТЕКСТ · РАЗШИРЕНО ДОСИЕ":"STORY & CONTEXT · EXTENDED FILE"):
   (language==="bg"?"АРХИВЕН ЗАПИС · ОРИГИНАЛНИ ИЗТОЧНИЦИ":"ARCHIVE FILE · ORIGINAL SOURCES"));
  // Source provenance is preserved; visuals are labelled if illustrative.
  const visual=c.visual;
  const visualBox=$("caseVisual"),visualImage=$("caseVisualImage");
  // feature-media.webp contains a baked-in ▶ graphic, not real footage.
  // Never show that stock image as if it were a player in any dossier.
  const allowedVisual=typeof visual?.src==="string"&&visual.src!=="/assets/feature-media.webp"&&/^\/assets\/[a-z0-9-]+\.webp$/.test(visual.src);
  const videoReferences=Array.isArray(c.media)&&c.media.some(m=>m?.type==="video"&&sourceUrl(m.url));
  // All dossiers have a cinematic reading cover. Only source-cleared visuals
  // are described as incident photographs; the generic cover is labelled art.
  visualBox.hidden=false;
  visualImage.hidden=!!videoReferences;
  $("caseVisualCaption").hidden=!!videoReferences;
  if(!videoReferences){
   visualImage.src=allowedVisual?visual.src:"/assets/media-ufo-earth-preview.svg";
   visualImage.alt=allowedVisual?(local(visual.caption)||"Published source illustration"):
    (language==="bg"?"Илюстрация на AURORA — не е кадър от наблюдението":"AURORA illustration — not an image of the incident");
   $("caseVisualCaption").textContent=allowedVisual?
    (local(visual.caption)||"Illustrative image"):
    (language==="bg"?"Илюстрация на AURORA · не е оригинален кадър от събитието":"AURORA illustration · not an original incident frame");
  }else{visualImage.removeAttribute("src")}
  // Replace baked-in stock Play with an actual, lazy source-verified video hero.
  window.AURORA_DOSSIER_HERO?.render({caseRecord:c,lang:language});
  const story=$("dossierStory");story.replaceChildren();
  const narrative=(legacyBulgarian(c)?c.story?.en:c.story?.[language])||c.story?.en;
  if(Array.isArray(narrative)){
   // Skip repeated catalog boilerplate and verbatim copies of the synopsis.
   // Their source attribution is visible in the separate provenance panel.
   const compact=value=>String(value||"").replace(/\s+/g," ").trim().toLocaleLowerCase();
   const opening=compact(summary),seen=new Set();
   for(const passage of narrative.slice(0,18)){
    if(typeof passage!=="string"||passage.length<15)continue;
    const normalized=compact(passage);
    if(/^source-linked case dossier[ ·]/i.test(passage)||/^EN\s*[·:]/.test(passage))continue;
    if(normalized===opening||seen.has(normalized))continue;
    seen.add(normalized);
    const paragraph=document.createElement("p");
    paragraph.textContent=passage;story.append(paragraph);
   }
  }
  // Structured chronology is optional and always taken from published case metadata.
  const contentHelper=globalThis.AURORA_DOSSIER_CONTENT;
  const timelineBox=$("dossierTimeline"),timelineList=$("dossierTimelineList");
  const events=contentHelper?.timeline(c,language)||[];
  timelineList.replaceChildren();
  $("dossierTimelineHeading").textContent=language==="bg"?"ХРОНОЛОГИЯ ПО ИЗТОЧНИЦИ":"SOURCE-LINKED TIMELINE";
  for(const event of events){
   const row=document.createElement("li");
   if(event.date){const date=document.createElement("time");date.textContent=event.date;row.append(date)}
   if(event.title){const heading=document.createElement("strong");heading.textContent=event.title;row.append(heading)}
   if(event.description){const desc=document.createElement("p");desc.textContent=event.description;row.append(desc)}
   if(event.url){const link=document.createElement("a");link.href=event.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=language==="bg"?"Първоизточник ↗":"Original source ↗";row.append(link)}
   timelineList.append(row);
  }
  timelineBox.hidden=timelineList.childElementCount===0;

  // Every case has ONE playback surface, in its top evidence/hero section.
  // Keep the lower archive for photographs and documents only; video source
  // links are listed under provenance, never as a second player.
  const mediaBox=$("caseMediaSection"),mediaGrid=$("caseMediaGrid");
  mediaGrid.replaceChildren();
  $("caseMediaTitle").textContent=language==="bg"?"СНИМКИ И ДОКУМЕНТИ":"PHOTOS AND DOCUMENTS";
  const approvedTypes=new Set(["documents","archive","photo"]);
  const availableMedia=contentHelper?.media(c)||[];
  const photoGallery=$("casePhotoGallery");photoGallery.replaceChildren();
  // Close the prior document on language change or record navigation.
  globalThis.AURORA_DOCUMENT_PREVIEW?.close();
  const previewClose=$("caseDocumentClose");
  if(previewClose)previewClose.onclick=()=>globalThis.AURORA_DOCUMENT_PREVIEW?.close();
  for(const m of availableMedia){
   if(!approvedTypes.has(m.type))continue;
   const safe=sourceUrl(m.url);if(!safe)continue;
   const anchor=document.createElement("a");anchor.href=safe;anchor.target="_blank";anchor.rel="noopener noreferrer";
   anchor.className="case-media-link";
   const icon=document.createElement("span");
   icon.className="case-media-icon";icon.setAttribute("aria-hidden","true");
   icon.textContent=m.type==="photo"?"▧":"▤";
   const text=document.createElement("strong");
   text.textContent=local(m.title)||m.type;
   const type=document.createElement("small");
   type.textContent=({photo:"PHOTO",documents:"DOCUMENTS",archive:"ARCHIVE"})[m.type];
   anchor.append(icon,text,type);
   const reader=globalThis.AURORA_DOCUMENT_PREVIEW;
   const previewUrl=["documents","archive"].includes(m.type)?reader?.sourcePdf(safe):null;
   if(previewUrl){
    const tile=document.createElement("div");tile.className="case-media-tile";
    tile.append(anchor);
    const openButton=document.createElement("button");
    openButton.className="case-media-preview";openButton.type="button";
    openButton.textContent=reader.words(language)[0]+" ⤢";
    openButton.addEventListener("click",()=>{
     reader.open(previewUrl,local(m.title)||m.type,language);
    });
    tile.append(openButton);
    mediaGrid.append(tile);
   }else{mediaGrid.append(anchor);}
   if(m.type==="photo"){
    const preview=contentHelper?.photoPreview(m);
    if(preview){
     const figure=document.createElement("figure");
     figure.className="case-source-photo";
     const photoLink=document.createElement("a");
     photoLink.href=safe;photoLink.target="_blank";photoLink.rel="noopener noreferrer";
     const img=document.createElement("img");img.src=preview.url;img.loading="lazy";
     img.decoding="async";img.alt=local(m.title)||"Published source image";
     photoLink.append(img);figure.append(photoLink);
     const caption=document.createElement("figcaption");
     caption.textContent=(local(m.title)||"")+(preview.attribution?" · "+preview.attribution:"");
     figure.append(caption);
     const rights=document.createElement("a");rights.href=preview.evidence;
     rights.target="_blank";rights.rel="noopener noreferrer";
     rights.textContent=language==="bg"?"Права и произход ↗":"Rights and provenance ↗";
     figure.append(rights);photoGallery.append(figure);
    }
   }
  }
  mediaBox.hidden=mediaGrid.childElementCount===0&&photoGallery.childElementCount===0;
  const provenance=c.provenance||{};
  const source=sourceUrl(c.source_url||c.source?.url||provenance.source_url);
  label("dossierSourceName",c.source_name||c.source?.name||provenance.source_name||t.sourceMissing);
  const src=$("dossierSourceUrl");
  src.hidden=!source;
  if(source){src.href=source;src.textContent=t.openSource}
  label("dossierLicense",legacy?(provenance.license?(t.reference+" · "+provenance.source_name+" — "+provenance.license+" · "+provenance.source_url):t.reference):(c.license||provenance.license||""));
  // Show every independent public source, not only the first source URL.
  const sourcePanel=$("dossierSourcesSection"),sourceList=$("dossierSourcesList");
  sourceList.replaceChildren();
  const citations=contentHelper?.sources(c,language)||[];
  $("dossierSourcesHeading").textContent=language==="bg"?"ДОПЪЛНИТЕЛНИ ПУБЛИЧНИ ИЗТОЧНИЦИ":"PUBLISHED SOURCES AND DOCUMENTS";
  for(const cited of citations){
   const row=document.createElement("li");
   const link=document.createElement("a");link.href=cited.url;link.target="_blank";
   link.rel="noopener noreferrer";link.textContent=cited.name+" ↗";
   row.append(link);
   if(cited.type&&cited.type!=="primary"){
    const note=document.createElement("small");note.textContent=" · "+cited.type;row.append(note);
   }
   sourceList.append(row);
  }
  // A case may have only a sources[] entry and no traditional primary source.
  sourcePanel.hidden=citations.length===0||(citations.length===1&&citations[0].url===source);

  const authority=c.assessment_authority?
   c.assessment_authority+" · "+(t.confidence[c.assessment_confidence]||t.confidence.not_stated):"";
  label("dossierAssessmentAuthority",authority);
  const lat=c.latitude??c.lat,lng=c.longitude??c.lng;
  if(typeof lat==="number"&&Number.isFinite(lat)&&Math.abs(lat)<=90&&
     typeof lng==="number"&&Number.isFinite(lng)&&Math.abs(lng)<=180){
   label("dossierCoordinate",lat.toFixed(3)+"°, "+lng.toFixed(3)+"°");
   label("dossierLocationCaveat",t.approx+(language==="bg"&&c.location_precision_bg?" "+c.location_precision_bg:language==="en"&&c.location_precision?" "+c.location_precision:""));
  }else{
   label("dossierCoordinate","N/A — POSITION NOT PUBLISHED");
   label("dossierLocationCaveat",t.noCoords+(language==="en"&&c.location_precision?" "+c.location_precision:""));
  }
  const sourceLocation=$("dossierOriginalLocation");
  if(sourceLocation){
   const raw=typeof c.location_context==="string"?c.location_context:c.location_context?.en;
   const text=typeof raw==="string"?raw.trim():"";
   sourceLocation.hidden=!text||text.length<65;
   if(!sourceLocation.hidden){
    sourceLocation.querySelector("summary").textContent=language==="bg"?
     "ПЪЛНО ОПИСАНИЕ НА МЯСТОТО ОТ ИЗТОЧНИКА (EN)":"ORIGINAL SOURCE LOCATION NOTE (EN)";
    sourceLocation.querySelector("p").textContent=text;
   }
  }
  renderRelatedCases(c,t);
  narrativeDisclosure(c);
  requestNarrativeTranslation(c);
  const countryLink=$("dossierCountry");
  countryLink.hidden=legacy||!/^[A-Z]{2}$/.test(country);
  if(!countryLink.hidden){countryLink.href="/countries/"+country;countryLink.textContent=t.country}
  label("dossierArchiveLink",t.back);
  $("dossierFeedback").hidden=true;
  $("dossierContent").hidden=false;$("dossierActions").hidden=false;
 }
 function translateStatic(){
  const t=getPack();
  const ids={dossierBack:"home",dossierSubtitle:"subtitle",factsHeading:"facts",labelIdentifier:"id",labelDate:"date",
   labelLocation:"location",labelCategory:"category",labelPublication:"publication",labelAssessment:"assessment",
   labelPrecision:"precision",summaryHeading:"summary",sourceHeading:"source",locationHeading:"geography",relatedHeading:"related"};
  for(const [id,key] of Object.entries(ids))label(id,t[key]);
  const skip=document.querySelector(".skip");
  if(skip)skip.textContent=t.skip||"Skip to content";
 }
 window.addEventListener("aurora:language-changed",e=>{
  language=e?.detail?.language||document.documentElement.lang||"bg";
  translateStatic();
  if(currentCase&&!$("dossierContent").hidden)render(currentCase);
  else if(!$("dossierFeedback").hidden)feedback(feedbackState,$("dossierFeedback").classList.contains("error"));
 });
 async function load(){
  translateStatic();
  if(!["archive","cases"].includes(kind)||!/^[a-z0-9-]{3,90}$/.test(id)||path.length!==2){
   feedback("invalid",true);return;
  }
  feedback("loading");
  try{
   let c;
   if(legacy){
    const res=await fetch("/data/cases.json",{cache:"no-cache"});
    if(!res.ok)throw Error("archive");
    const data=await res.json();
    archiveCases=globalThis.AURORA_ARCHIVE?.prepareArchiveCases(data.cases)??(Array.isArray(data.cases)?data.cases:[]);
    c=archiveCases.find(x=>x.id===id);
   }else{
    const res=await fetch("/api/cases/"+encodeURIComponent(id),{cache:"no-store"});
    if(res.status===503){feedback("unavailable");return}
    if(res.status===404){feedback("missing",true);return}
    if(!res.ok)throw Error("case");
    c=await res.json();
    if(c.review_status!=="approved"||c.record_kind==="demo"){feedback("missing",true);return}
    try{
     const archRes=await fetch("/data/cases.json",{cache:"no-cache"});
     if(archRes.ok){const archData=await archRes.json();archiveCases=globalThis.AURORA_ARCHIVE?.prepareArchiveCases(archData.cases)??(Array.isArray(archData.cases)?archData.cases:[]);}
    }catch{}
   }
   if(!c){feedback("missing",true);return}
   render(c);
  }catch{feedback("error",true)}
 }
 load();
})();
