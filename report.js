/* AURORA V1.5 — a truthful local draft UI; HTTP intake enabled only by server. */
"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 const STORAGE="aurora-private-text-report-draft-v1";
 const LEGACY_STORAGE="aurora-demo-draft";
 const fields=["country","region","location","occurred","timezone","category","description"];
 let enabled=false,siteKey="",policyVersion="",challenge="",widget=null,pending=false;
 let requestKey=crypto.randomUUID(),widgetApi=null,statusState="checking";
 const I18N={
  "bg":{
   "heading":"ПОДАЙ СИГНАЛ","lead":"Документирай какво си видял. Разграничаваме свидетелските сведения от доказаните факти. Всички сигнали минават през човешка проверка.",
   "checking":"Проверка на системата за приемане…",
   "formTitle":"Подготви своя сигнал",
   "country":"Държава","region":"Регион","regionPh":"напр. Шуменска област",
   "location":"Приблизителен район","locationPh":"град / населено място, без личен адрес",
   "occurred":"Дата и местен час","timezone":"Часова зона",
   "category":"Тип","catLights":"Светлини","catObject":"Обект","catInstrument":"Инструментален запис","catOther":"Друго",
   "description":"Описание","descPh":"Какво видя, в каква посока, колко време продължи и какви бяха условията? Не споделяй имена, адреси или други лични данни.",
   "advisory":"Без имена, имейли, лични адреси, точни GPS координати или файлове. При активиране ще се записват само описанието, дата/час, часова зона и приблизителен район.",
   "consentPrefix":"Потвърждавам, че съм прочел/а","privacyLink":"информацията за личните данни и условията","consentSuffix":"и разрешавам обработката на този сигнал за модерация.",
   "saveDraft":"ЗАПАЗИ ЧЕРНОВА","downloadDraft":"ИЗТЕГЛИ ЧЕРНОВА (JSON)","clearDraft":"ИЗТРИЙ ЧЕРНОВА","sendReport":"ПОДАЙ НАБЛЮДЕНИЕ",
   "receiptHeading":"ПРИЕТО ЗА ЧОВЕШКИ ПРЕГЛЕД / RECEIVED FOR REVIEW","receiptNote":"Запази този номер. Сигналът не е публикуван.","copyReceipt":"КОПИРАЙ НОМЕРА",
   "ethicsTitle":"Какво следва?",
   "ethics1":"Всеки действително приет сигнал получава уникален номер и влиза в частна опашка за човешка проверка. Първоначалната цел е преглед до 72 часа, но това не е гарантиран срок. Нищо не се публикува автоматично. Черновите остават само в текущия браузър.",
   "ethics2":"Ако приемането е изключено, бутонът „Изтегли чернова“ запазва JSON файл само на твоето устройство. Това НЕ изпраща сигнала към AURORA. Не разпространявай файла, ако в описанието има лични данни.",
   "ethics3":"Няма публична система за снимки, видео или контактни данни на този етап. Автоматично публикуване от AI е изключено.",
   "statusDraft":"LOCAL DRAFT MODE · Публичното подаване все още не е активно. Можеш да подготвиш чернова само на устройството си.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Приемаме само текстови сигнали за човешка проверка. Не публикуваме автоматично.",
   "statusOffline":"INTAKE OFFLINE · Не можем да потвърдим, че приемането е активно. Можеш да запазиш само чернова.",
   "msgDraftSaved":"Черновата е запазена само в този браузър. Не е изпратена към AURORA.",
   "msgStorageBlocked":"Този браузър не разрешава съхранение на чернова.",
   "msgNeedDesc":"Попълни описание, преди да изтеглиш черновата.",
   "msgDownloaded":"Черновата е изтеглена на устройството. НИЩО не е изпратено към AURORA.",
   "msgDownloadBlocked":"Изтеглянето не е разрешено в този браузър.",
   "msgCleared":"Черновата е изчистена от този браузър.",
   "msgCopied":"Номерът е копиран.","msgCopyManual":"Копирай номера ръчно.",
   "msgDisabledNote":"Изпращането е изключено до юридическа, техническа и модераторска готовност.",
   "msgTurnstileError":"Проверката за защита от спам не е достъпна. Сигналът не може да бъде изпратен.",
   "msgNotAllowed":"Изпращането все още не е разрешено.","msgSending":"Изпращаме за поверителен преглед…"
  },
  "en":{
   "heading":"REPORT AN OBSERVATION","lead":"Document what you observed. We separate witness accounts from verified facts. Every submission undergoes human review.",
   "checking":"Checking intake system status…",
   "formTitle":"Prepare your report",
   "country":"Country","region":"Region","regionPh":"e.g. Bavaria / Sofia province",
   "location":"Approximate location","locationPh":"city or area, without personal address",
   "occurred":"Local date and time","timezone":"Time zone",
   "category":"Category","catLights":"Lights","catObject":"Object","catInstrument":"Instrument recording","catOther":"Other",
   "description":"Your account","descPh":"What did you observe, in which direction, how long did it last, and what were the sky conditions? Do not include names, addresses, or personal data.",
   "advisory":"No names, emails, personal addresses, exact GPS coordinates, or files. When enabled, only the description, date/time, time zone, and approximate area are recorded.",
   "consentPrefix":"I confirm that I have read the","privacyLink":"privacy notice and terms","consentSuffix":"and consent to processing this report for human moderation.",
   "saveDraft":"SAVE DRAFT","downloadDraft":"DOWNLOAD DRAFT (JSON)","clearDraft":"CLEAR DRAFT","sendReport":"SUBMIT OBSERVATION",
   "receiptHeading":"RECEIVED FOR HUMAN REVIEW","receiptNote":"Save this reference; the report is not public.","copyReceipt":"COPY RECEIPT",
   "ethicsTitle":"What happens next?",
   "ethics1":"Every accepted report receives a unique reference ID and enters a private queue for human review. Nothing is published automatically. Drafts stay exclusively in your browser.",
   "ethics2":"When intake is disabled, 'Download draft' saves a JSON file locally on your device only. It does NOT transmit anything to AURORA.",
   "ethics3":"There is no public upload for photos, video, or contact details at this stage. Automated AI publication is disabled.",
   "statusDraft":"LOCAL DRAFT MODE · Public submission is not active yet. You can prepare a local draft on your device only.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Accepting text-only reports for human review. No automatic publication.",
   "statusOffline":"INTAKE OFFLINE · Cannot confirm active intake status. You can save a local draft only.",
   "msgDraftSaved":"Draft saved locally in this browser. Nothing was submitted to AURORA.",
   "msgStorageBlocked":"Local storage is unavailable in this browser.",
   "msgNeedDesc":"Enter a description before downloading the draft.",
   "msgDownloaded":"Draft downloaded to your device. NOTHING was transmitted to AURORA.",
   "msgDownloadBlocked":"Download is blocked in this browser.",
   "msgCleared":"Local draft cleared from this browser.",
   "msgCopied":"Reference copied.","msgCopyManual":"Copy the reference manually.",
   "msgDisabledNote":"Submission remains disabled until legal, technical, and moderation readiness is complete.",
   "msgTurnstileError":"Anti-spam verification is unavailable. The report cannot be submitted.",
   "msgNotAllowed":"Submission is not enabled yet.","msgSending":"Sending for confidential review…"
  },
  "de":{
   "heading":"BEOBACHTUNG MELDEN","lead":"Dokumentieren Sie Ihre Beobachtung. Wir trennen Zeugenaussagen von geprüften Fakten. Jede Meldung wird menschlich geprüft.",
   "checking":"Status des Meldesystems wird geprüft…",
   "formTitle":"Meldung vorbereiten",
   "country":"Land","region":"Region","regionPh":"z. B. Bayern",
   "location":"Ungefährer Ort","locationPh":"Stadt oder Gebiet, keine Privatadresse",
   "occurred":"Lokales Datum und Uhrzeit","timezone":"Zeitzone",
   "category":"Kategorie","catLights":"Lichter","catObject":"Objekt","catInstrument":"Instrumentenaufnahme","catOther":"Sonstiges",
   "description":"Beschreibung","descPh":"Was haben Sie gesehen, in welcher Richtung, wie lange dauerte es und wie waren die Bedingungen? Keine Namen oder Adressen angeben.",
   "advisory":"Keine Namen, E-Mails, Privatadressen, exakten GPS-Koordinaten oder Dateien. Bei Aktivierung werden nur Beschreibung, Datum/Uhrzeit, Zeitzone und ungefähres Gebiet gespeichert.",
   "consentPrefix":"Ich bestätige, dass ich die","privacyLink":"Datenschutzhinweise und Bedingungen","consentSuffix":"gelesen habe und der Verarbeitung zur Moderation zustimme.",
   "saveDraft":"ENTWURF SPEICHERN","downloadDraft":"ENTWURF HERUNTERLADEN (JSON)","clearDraft":"ENTWURF LÖSCHEN","sendReport":"BEOBACHTUNG SENDEN",
   "receiptHeading":"ZUR MENSCHLICHEN PRÜFUNG EINGEGANGEN","receiptNote":"Bewahren Sie diese Referenz auf; der Bericht ist nicht öffentlich.","copyReceipt":"REFERENZ KOPIEREN",
   "ethicsTitle":"Wie geht es weiter?",
   "ethics1":"Jede angenommene Meldung erhält eine eindeutige Referenznummer und gelangt in eine private Warteschlange zur menschlichen Prüfung. Nichts wird automatisch veröffentlicht.",
   "ethics2":"Wenn die Annahme deaktiviert ist, speichert „Entwurf herunterladen“ eine JSON-Datei nur lokal auf Ihrem Gerät. Es wird NICHTS an AURORA gesendet.",
   "ethics3":"Derzeit gibt es keinen öffentlichen Upload für Fotos, Videos oder Kontaktdaten. Automatische KI-Veröffentlichung ist deaktiviert.",
   "statusDraft":"LOCAL DRAFT MODE · Öffentliche Einreichung ist noch nicht aktiv. Sie können lokal auf Ihrem Gerät einen Entwurf speichern.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Nur Textmeldungen zur menschlichen Prüfung. Keine automatische Veröffentlichung.",
   "statusOffline":"INTAKE OFFLINE · Annahmestatus nicht bestätigt. Sie können nur lokal einen Entwurf speichern.",
   "msgDraftSaved":"Entwurf nur lokal in diesem Browser gespeichert. Nichts wurde an AURORA gesendet.",
   "msgStorageBlocked":"Lokaler Speicher in diesem Browser nicht verfügbar.",
   "msgNeedDesc":"Bitte geben Sie vor dem Herunterladen eine Beschreibung ein.",
   "msgDownloaded":"Entwurf lokal heruntergeladen. NICHTS wurde an AURORA übertragen.",
   "msgDownloadBlocked":"Download in diesem Browser blockiert.",
   "msgCleared":"Lokaler Entwurf gelöscht.",
   "msgCopied":"Referenz kopiert.","msgCopyManual":"Bitte Referenz manuell kopieren.",
   "msgDisabledNote":"Das Absenden bleibt bis zur rechtlichen, technischen und redaktionellen Freigabe deaktiviert.",
   "msgTurnstileError":"Spamschutz-Prüfung nicht verfügbar. Meldung kann nicht gesendet werden.",
   "msgNotAllowed":"Absenden noch nicht freigegeben.","msgSending":"Wird zur vertraulichen Prüfung gesendet…"
  },
  "ru":{
   "heading":"СООБЩИТЬ О НАБЛЮДЕНИИ","lead":"Задокументируйте увиденное. Мы отделяем свидетельства очевидцев от проверенных фактов. Каждое сообщение проходит проверку человеком.",
   "checking":"Проверка системы приёма сообщений…",
   "formTitle":"Подготовьте сообщение",
   "country":"Страна","region":"Регион","regionPh":"напр. Софийская область",
   "location":"Примерный район","locationPh":"город / населённый пункт, без личного адреса",
   "occurred":"Местные дата и время","timezone":"Часовой пояс",
   "category":"Категория","catLights":"Огни","catObject":"Объект","catInstrument":"Приборная запись","catOther":"Другое",
   "description":"Описание","descPh":"Что вы видели, в каком направлении, сколько времени это длилось и какими были условия? Не указывайте имена, адреса или личные данные.",
   "advisory":"Без имён, email, личных адресов, точных GPS-координат и файлов. При активации сохраняются только описание, дата/время, часовой пояс и примерный район.",
   "consentPrefix":"Я подтверждаю, что прочитал(а)","privacyLink":"уведомление о конфиденциальности и условия","consentSuffix":"и даю согласие на обработку сообщения для модерации.",
   "saveDraft":"СОХРАНИТЬ ЧЕРНОВИК","downloadDraft":"СКАЧАТЬ ЧЕРНОВИК (JSON)","clearDraft":"ОЧИСТИТЬ ЧЕРНОВИК","sendReport":"ОТПРАВИТЬ НАБЛЮДЕНИЕ",
   "receiptHeading":"ПРИНЯТО НА ПРОВЕРКУ / RECEIVED FOR REVIEW","receiptNote":"Сохраните этот номер. Сообщение не опубликовано.","copyReceipt":"СКОПИРОВАТЬ НОМЕР",
   "ethicsTitle":"Что дальше?",
   "ethics1":"Каждое принятое сообщение получает уникальный номер и поступает в закрытую очередь на проверку человеком. Ничего не публикуется автоматически. Черновики хранятся только в вашем браузере.",
   "ethics2":"Если приём отключён, кнопка «Скачать черновик» сохраняет JSON-файл только на вашем устройстве и НЕ отправляет данные в AURORA.",
   "ethics3":"Публичная загрузка фото, видео и контактных данных на этом этапе отсутствует. Автоматическая ИИ-публикация отключена.",
   "statusDraft":"LOCAL DRAFT MODE · Публичный приём ещё не активен. Вы можете подготовить черновик локально на своём устройстве.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Принимаются только текстовые сообщения для проверки человеком. Без автопубликации.",
   "statusOffline":"INTAKE OFFLINE · Не удалось подтвердить активность приёма. Доступно только локальное сохранение черновика.",
   "msgDraftSaved":"Черновик сохранён только в этом браузере. Ничего не отправлено в AURORA.",
   "msgStorageBlocked":"Локальное хранилище недоступно в этом браузере.",
   "msgNeedDesc":"Заполните описание перед скачиванием черновика.",
   "msgDownloaded":"Черновик скачан на устройство. НИЧЕГО не отправлено в AURORA.",
   "msgDownloadBlocked":"Скачивание заблокировано в этом браузере.",
   "msgCleared":"Локальный черновик очищен.",
   "msgCopied":"Номер скопирован.","msgCopyManual":"Скопируйте номер вручную.",
   "msgDisabledNote":"Отправка отключена до полной юридической, технической и модераторской готовности.",
   "msgTurnstileError":"Проверка защиты от спама недоступна. Сообщение не может быть отправлено.",
   "msgNotAllowed":"Отправка ещё не разрешена.","msgSending":"Отправка на конфиденциальную проверку…"
  },
  "zh-CN":{
   "heading":"提交目击报告","lead":"记录您的观测情况。我们将目击叙述与核实事实严格区分。所有报告均由人工审核。",
   "checking":"正在检查报告接收系统状态…",
   "formTitle":"准备您的报告",
   "country":"国家/地区","region":"地区/省份","regionPh":"例如：巴伐利亚 / 索非亚州",
   "location":"大致位置","locationPh":"城市或区域，请勿填写私人地址",
   "occurred":"当地日期与时间","timezone":"时区",
   "category":"类别","catLights":"光点","catObject":"物体","catInstrument":"仪器记录","catOther":"其他",
   "description":"观测描述","descPh":"您看到了什么、方向、持续时间以及天气状况？请勿填写姓名、住址或其他个人隐私信息。",
   "advisory":"请勿提交姓名、电子邮件、个人地址、精确 GPS 坐标或文件。启用后仅记录描述、日期/时间、时区和大致区域。",
   "consentPrefix":"我确认已阅读","privacyLink":"隐私声明与条款","consentSuffix":"并同意处理此报告以供人工审核。",
   "saveDraft":"保存草稿","downloadDraft":"下载草稿 (JSON)","clearDraft":"清除草稿","sendReport":"提交观测报告",
   "receiptHeading":"已收到并等待人工审核 / RECEIVED FOR REVIEW","receiptNote":"请保存此编号；报告不会公开。","copyReceipt":"复制编号",
   "ethicsTitle":"后续流程是什么？",
   "ethics1":"每份被接收的报告都会获得唯一编号并进入私人人工审核队列。任何内容都不会自动公开。草稿仅保存在您当前的浏览器中。",
   "ethics2":"当接收功能关闭时，“下载草稿”仅在您的设备本地保存 JSON 文件，不会向 AURORA 发送任何数据。",
   "ethics3":"当前阶段不设公开的照片、视频或联系方式上传系统。AI 自动发布功能已关闭。",
   "statusDraft":"LOCAL DRAFT MODE · 公开提交尚未启用。您只能在设备本地准备草稿。",
   "statusActive":"PRIVATE INTAKE ACTIVE · 仅接收纯文本报告供人工审核。不会自动公开。",
   "statusOffline":"INTAKE OFFLINE · 无法确认接收系统状态。您只能保存本地草稿。",
   "msgDraftSaved":"草稿已保存在当前浏览器中，未向 AURORA 发送任何内容。",
   "msgStorageBlocked":"当前浏览器不支持本地存储。",
   "msgNeedDesc":"请先填写观测描述再下载草稿。",
   "msgDownloaded":"草稿已下载到您的设备，未向 AURORA 发送任何数据。",
   "msgDownloadBlocked":"当前浏览器阻止了下载。",
   "msgCleared":"本地草稿已清除。",
   "msgCopied":"编号已复制。","msgCopyManual":"请手动复制编号。",
   "msgDisabledNote":"在完成法律、技术和审核准备之前，提交功能保持关闭。",
   "msgTurnstileError":"反垃圾验证不可用，无法提交报告。",
   "msgNotAllowed":"提交尚未启用。","msgSending":"正在发送以供保密审核…"
  },
  "fr":{
   "heading":"SIGNALER UNE OBSERVATION","lead":"Documentez ce que vous avez observé. Nous distinguons les témoignages des faits vérifiés. Chaque signalement fait l'objet d'une vérification humaine.",
   "checking":"Vérification du système de réception…",
   "formTitle":"Préparer votre signalement",
   "country":"Pays","region":"Région","regionPh":"ex. Bavière / Province de Sofia",
   "location":"Lieu approximatif","locationPh":"ville ou zone, sans adresse personnelle",
   "occurred":"Date et heure locales","timezone":"Fuseau horaire",
   "category":"Catégorie","catLights":"Lumières","catObject":"Objet","catInstrument":"Enregistrement instrumental","catOther":"Autre",
   "description":"Votre récit","descPh":"Qu'avez-vous observé, dans quelle direction, pendant combien de temps et dans quelles conditions ? N'indiquez ni nom ni adresse personnelle.",
   "advisory":"Aucun nom, e-mail, adresse personnelle, coordonnée GPS exacte ou fichier. Seuls la description, la date/heure, le fuseau horaire et la zone approximative sont enregistrés.",
   "consentPrefix":"Je confirme avoir lu la","privacyLink":"notice de confidentialité et les conditions","consentSuffix":"et consens au traitement de ce signalement pour modération.",
   "saveDraft":"ENREGISTRER LE BROUILLON","downloadDraft":"TÉLÉCHARGER LE BROUILLON (JSON)","clearDraft":"EFFACER LE BROUILLON","sendReport":"ENVOYER L'OBSERVATION",
   "receiptHeading":"REÇU POUR VÉRIFICATION HUMAINE","receiptNote":"Conservez cette référence ; le signalement n'est pas public.","copyReceipt":"COPIER LA RÉFÉRENCE",
   "ethicsTitle":"Que se passe-t-il ensuite ?",
   "ethics1":"Chaque signalement accepté reçoit une référence unique et entre dans une file privée pour examen humain. Rien n'est publié automatiquement. Les brouillons restent dans votre navigateur.",
   "ethics2":"Lorsque la réception est désactivée, « Télécharger le brouillon » enregistre un fichier JSON uniquement sur votre appareil sans rien envoyer à AURORA.",
   "ethics3":"Il n'y a pas d'envoi public de photos, vidéos ou coordonnées à ce stade. La publication automatique par IA est désactivée.",
   "statusDraft":"LOCAL DRAFT MODE · L'envoi public n'est pas encore actif. Vous pouvez préparer un brouillon local sur votre appareil.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Réception de signalements texte uniquement pour vérification humaine. Aucune publication automatique.",
   "statusOffline":"INTAKE OFFLINE · Impossible de confirmer le statut du système. Vous pouvez uniquement enregistrer un brouillon local.",
   "msgDraftSaved":"Brouillon enregistré localement dans ce navigateur. Rien n'a été envoyé à AURORA.",
   "msgStorageBlocked":"Le stockage local est indisponible dans ce navigateur.",
   "msgNeedDesc":"Veuillez saisir une description avant de télécharger le brouillon.",
   "msgDownloaded":"Brouillon téléchargé sur votre appareil. RIEN n'a été transmis à AURORA.",
   "msgDownloadBlocked":"Téléchargement bloqué dans ce navigateur.",
   "msgCleared":"Brouillon local effacé.",
   "msgCopied":"Référence copiée.","msgCopyManual":"Copiez la référence manuellement.",
   "msgDisabledNote":"L'envoi reste désactivé jusqu'à validation juridique, technique et éditoriale.",
   "msgTurnstileError":"La vérification anti-spam est indisponible. Le signalement ne peut pas être envoyé.",
   "msgNotAllowed":"L'envoi n'est pas encore activé.","msgSending":"Envoi pour examen confidentiel…"
  },
  "es":{
   "heading":"INFORMAR DE UNA OBSERVACIÓN","lead":"Documenta lo que observaste. Separamos los testimonios de los hechos verificados. Cada informe pasa por revisión humana.",
   "checking":"Comprobando el sistema de recepción…",
   "formTitle":"Prepara tu informe",
   "country":"País","region":"Región","regionPh":"p. ej. Baviera / Provincia de Sofía",
   "location":"Ubicación aproximada","locationPh":"ciudad o zona, sin dirección personal",
   "occurred":"Fecha y hora local","timezone":"Zona horaria",
   "category":"Categoría","catLights":"Luces","catObject":"Objeto","catInstrument":"Registro instrumental","catOther":"Otro",
   "description":"Tu relato","descPh":"¿Qué observaste, en qué dirección, cuánto duró y cuáles eran las condiciones del cielo? No incluyas nombres ni direcciones personales.",
   "advisory":"Sin nombres, correos, direcciones personales, coordenadas GPS exactas ni archivos. Al activarse solo se guardan descripción, fecha/hora, zona horaria y área aproximada.",
   "consentPrefix":"Confirmo que he leído el","privacyLink":"aviso de privacidad y condiciones","consentSuffix":"y autorizo el procesamiento de este informe para moderación.",
   "saveDraft":"GUARDAR BORRADOR","downloadDraft":"DESCARGAR BORRADOR (JSON)","clearDraft":"BORRAR BORRADOR","sendReport":"ENVIAR OBSERVACIÓN",
   "receiptHeading":"RECIBIDO PARA REVISIÓN HUMANA","receiptNote":"Guarda esta referencia; el informe no es público.","copyReceipt":"COPIAR REFERENCIA",
   "ethicsTitle":"¿Qué sucede después?",
   "ethics1":"Cada informe aceptado recibe una referencia única y entra en una cola privada para revisión humana. Nada se publica automáticamente. Los borradores permanecen en tu navegador.",
   "ethics2":"Si la recepción está desactivada, «Descargar borrador» guarda un archivo JSON solo en tu dispositivo y NO envía nada a AURORA.",
   "ethics3":"No hay carga pública de fotos, vídeos ni datos de contacto en esta etapa. La publicación automática por IA está desactivada.",
   "statusDraft":"LOCAL DRAFT MODE · El envío público aún no está activo. Puedes preparar un borrador local en tu dispositivo.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Aceptamos solo informes de texto para revisión humana. Sin publicación automática.",
   "statusOffline":"INTAKE OFFLINE · No podemos confirmar que la recepción esté activa. Solo puedes guardar un borrador local.",
   "msgDraftSaved":"Borrador guardado localmente en este navegador. No se envió nada a AURORA.",
   "msgStorageBlocked":"El almacenamiento local no está disponible en este navegador.",
   "msgNeedDesc":"Escribe una descripción antes de descargar el borrador.",
   "msgDownloaded":"Borrador descargado en tu dispositivo. NADA fue enviado a AURORA.",
   "msgDownloadBlocked":"Descarga bloqueada en este navegador.",
   "msgCleared":"Borrador local borrado.",
   "msgCopied":"Referencia copiada.","msgCopyManual":"Copia la referencia manualmente.",
   "msgDisabledNote":"El envío permanece desactivado hasta completar la preparación legal, técnica y de moderación.",
   "msgTurnstileError":"La verificación antispam no está disponible. No se puede enviar el informe.",
   "msgNotAllowed":"El envío aún no está habilitado.","msgSending":"Enviando para revisión confidencial…"
  },
  "it":{
   "heading":"SEGNALA UN'OSSERVAZIONE","lead":"Documenta ciò che hai osservato. Separiamo le testimonianze dai fatti verificati. Ogni segnalazione viene esaminata da revisori umani.",
   "checking":"Verifica del sistema di ricezione…",
   "formTitle":"Prepara la tua segnalazione",
   "country":"Paese","region":"Regione","regionPh":"es. Baviera / Provincia di Sofia",
   "location":"Posizione approssimativa","locationPh":"città o zona, senza indirizzo personale",
   "occurred":"Data e ora locale","timezone":"Fuso orario",
   "category":"Categoria","catLights":"Luci","catObject":"Oggetto","catInstrument":"Registrazione strumentale","catOther":"Altro",
   "description":"Il tuo resoconto","descPh":"Cosa hai visto, in quale direzione, per quanto tempo e con quali condizioni meteo? Non inserire nomi o indirizzi personali.",
   "advisory":"Nessun nome, email, indirizzo personale, coordinata GPS esatta o file. Quando attivo, vengono registrati solo descrizione, data/ora, fuso orario e area approssimativa.",
   "consentPrefix":"Confermo di aver letto l'","privacyLink":"informativa sulla privacy e i termini","consentSuffix":"e acconsento al trattamento per la moderazione.",
   "saveDraft":"SALVA BOZZA","downloadDraft":"SCARICA BOZZA (JSON)","clearDraft":"CANCELLA BOZZA","sendReport":"INVIA OSSERVAZIONE",
   "receiptHeading":"RICEVUTO PER REVISIONE UMANA","receiptNote":"Conserva questo codice; la segnalazione non è pubblica.","copyReceipt":"COPIA CODICE",
   "ethicsTitle":"Cosa succede dopo?",
   "ethics1":"Ogni segnalazione accettata riceve un codice univoco ed entra in una coda privata per la revisione umana. Nulla viene pubblicato automaticamente.",
   "ethics2":"Se la ricezione è disattivata, «Scarica bozza» salva un file JSON solo sul tuo dispositivo e NON invia nulla ad AURORA.",
   "ethics3":"Non è previsto il caricamento pubblico di foto, video o contatti in questa fase. La pubblicazione automatica tramite IA è disattivata.",
   "statusDraft":"LOCAL DRAFT MODE · L'invio pubblico non è ancora attivo. Puoi preparare una bozza locale sul tuo dispositivo.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Accettiamo solo segnalazioni testuali per revisione umana. Nessuna pubblicazione automatica.",
   "statusOffline":"INTAKE OFFLINE · Impossibile confermare lo stato di ricezione. Puoi solo salvare una bozza locale.",
   "msgDraftSaved":"Bozza salvata localmente in questo browser. Nulla è stato inviato ad AURORA.",
   "msgStorageBlocked":"Archiviazione locale non disponibile in questo browser.",
   "msgNeedDesc":"Inserisci una descrizione prima di scaricare la bozza.",
   "msgDownloaded":"Bozza scaricata sul dispositivo. NULLA è stato inviato ad AURORA.",
   "msgDownloadBlocked":"Download bloccato in questo browser.",
   "msgCleared":"Bozza locale cancellata.",
   "msgCopied":"Codice copiato.","msgCopyManual":"Copia il codice manualmente.",
   "msgDisabledNote":"L'invio resta disattivato fino al completamento delle verifiche legali, tecniche e di moderazione.",
   "msgTurnstileError":"Verifica anti-spam non disponibile. Impossibile inviare la segnalazione.",
   "msgNotAllowed":"Invio non ancora abilitato.","msgSending":"Invio per revisione riservata…"
  },
  "pt":{
   "heading":"RELATAR UMA OBSERVAÇÃO","lead":"Documente o que observou. Separamos relatos de testemunhas de factos verificados. Cada relato passa por revisão humana.",
   "checking":"A verificar o sistema de receção…",
   "formTitle":"Prepare o seu relato",
   "country":"País","region":"Região","regionPh":"ex. Baviera / Província de Sófia",
   "location":"Localização aproximada","locationPh":"cidade ou área, sem morada pessoal",
   "occurred":"Data e hora local","timezone":"Fuso horário",
   "category":"Categoria","catLights":"Luzes","catObject":"Objeto","catInstrument":"Registo instrumental","catOther":"Outro",
   "description":"O seu relato","descPh":"O que observou, em que direção, quanto tempo durou e quais eram as condições do céu? Não inclua nomes ou moradas pessoais.",
   "advisory":"Sem nomes, e-mails, moradas pessoais, coordenadas GPS exatas ou ficheiros. Quando ativo, apenas a descrição, data/hora, fuso horário e área aproximada são registados.",
   "consentPrefix":"Confirmo que li o","privacyLink":"aviso de privacidade e termos","consentSuffix":"e autorizo o processamento deste relato para moderação.",
   "saveDraft":"GUARDAR RASCUNHO","downloadDraft":"TRANSFERIR RASCUNHO (JSON)","clearDraft":"LIMPAR RASCUNHO","sendReport":"ENVIAR OBSERVAÇÃO",
   "receiptHeading":"RECEBIDO PARA REVISÃO HUMANA","receiptNote":"Guarde esta referência; o relato não é público.","copyReceipt":"COPIAR REFERÊNCIA",
   "ethicsTitle":"O que acontece a seguir?",
   "ethics1":"Cada relato aceite recebe uma referência única e entra numa fila privada para revisão humana. Nada é publicado automaticamente.",
   "ethics2":"Se a receção estiver desativada, «Transferir rascunho» guarda um ficheiro JSON apenas no seu dispositivo e NÃO envia nada para a AURORA.",
   "ethics3":"Não existe carregamento público de fotos, vídeos ou contactos nesta fase. A publicação automática por IA está desativada.",
   "statusDraft":"LOCAL DRAFT MODE · O envio público ainda não está ativo. Pode preparar um rascunho local no seu dispositivo.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Aceitamos apenas relatos em texto para revisão humana. Sem publicação automática.",
   "statusOffline":"INTAKE OFFLINE · Não é possível confirmar o estado de receção. Pode apenas guardar um rascunho local.",
   "msgDraftSaved":"Rascunho guardado localmente neste navegador. Nada foi enviado para a AURORA.",
   "msgStorageBlocked":"Armazenamento local indisponível neste navegador.",
   "msgNeedDesc":"Introduza uma descrição antes de transferir o rascunho.",
   "msgDownloaded":"Rascunho transferido para o dispositivo. NADA foi enviado para a AURORA.",
   "msgDownloadBlocked":"Transferência bloqueada neste navegador.",
   "msgCleared":"Rascunho local limpo.",
   "msgCopied":"Referência copiada.","msgCopyManual":"Copie a referência manualmente.",
   "msgDisabledNote":"O envio permanece desativado até conclusão da preparação legal, técnica e de moderação.",
   "msgTurnstileError":"Verificação anti-spam indisponível. O relato não pode ser enviado.",
   "msgNotAllowed":"Envio ainda não ativado.","msgSending":"A enviar para revisão confidencial…"
  },
  "tr":{
   "heading":"GÖZLEM BİLDİR","lead":"Gözlemlediğiniz olayı belgeleyin. Tanık anlatımlarını doğrulanmış gerçeklerden ayırıyoruz. Her bildirim insan incelemesinden geçer.",
   "checking":"Kabul sistemi durumu kontrol ediliyor…",
   "formTitle":"Bildiriminizi hazırlayın",
   "country":"Ülke","region":"Bölge","regionPh":"örn. Bavyera / Sofya ili",
   "location":"Yaklaşık konum","locationPh":"şehir veya bölge, kişisel adres olmadan",
   "occurred":"Yerel tarih ve saat","timezone":"Saat dilimi",
   "category":"Kategori","catLights":"Işıklar","catObject":"Nesne","catInstrument":"Cihaz kaydı","catOther":"Diğer",
   "description":"Anlatımınız","descPh":"Ne gördünüz, hangi yönde, ne kadar sürdü ve hava koşulları nasıldı? İsim, adres veya kişisel veri paylaşmayın.",
   "advisory":"İsim, e-posta, kişisel adres, tam GPS koordinatı veya dosya eklemeyin. Etkinleştirildiğinde yalnızca açıklama, tarih/saat, saat dilimi ve yaklaşık bölge kaydedilir.",
   "consentPrefix":"Okuduğumu onaylıyorum:","privacyLink":"gizlilik bildirimi ve koşullar","consentSuffix":"ve bu bildirimin moderasyon için işlenmesine izin veriyorum.",
   "saveDraft":"TASLAĞI KAYDET","downloadDraft":"TASLAĞI İNDİR (JSON)","clearDraft":"TASLAĞI TEMİZLE","sendReport":"GÖZLEMİ GÖNDER",
   "receiptHeading":"İNSAN İNCELEMESİ İÇİN ALINDI","receiptNote":"Bu referans numarasını saklayın; bildirim herkese açık değildir.","copyReceipt":"REFERANSI KOPYALA",
   "ethicsTitle":"Bundan sonra ne olur?",
   "ethics1":"Kabul edilen her bildirim benzersiz bir referans numarası alır ve insan incelemesi için özel kuyruğa girer. Hiçbir şey otomatik olarak yayınlanmaz.",
   "ethics2":"Kabul kapalıysa, 'Taslağı indir' yalnızca cihazınıza bir JSON dosyası kaydeder ve AURORA'ya hiçbir şey göndermez.",
   "ethics3":"Bu aşamada fotoğraf, video veya iletişim bilgisi yükleme sistemi yoktur. Yapay zeka ile otomatik yayınlama kapalıdır.",
   "statusDraft":"LOCAL DRAFT MODE · Herkese açık gönderim henüz aktif değil. Yalnızca cihazınızda yerel taslak hazırlayabilirsiniz.",
   "statusActive":"PRIVATE INTAKE ACTIVE · İnsan incelemesi için yalnızca metin bildirimleri kabul edilmektedir. Otomatik yayın yapılmaz.",
   "statusOffline":"INTAKE OFFLINE · Kabul sisteminin aktif olduğu doğrulanamıyor. Yalnızca yerel taslak kaydedebilirsiniz.",
   "msgDraftSaved":"Taslak yalnızca bu tarayıcıya kaydedildi. AURORA'ya hiçbir şey gönderilmedi.",
   "msgStorageBlocked":"Bu tarayıcıda yerel depolama kullanılamıyor.",
   "msgNeedDesc":"Taslağı indirmeden önce bir açıklama girin.",
   "msgDownloaded":"Taslak cihazınıza indirildi. AURORA'ya HİÇBİR ŞEY gönderilmedi.",
   "msgDownloadBlocked":"Bu tarayıcıda indirme engellendi.",
   "msgCleared":"Yerel taslak temizlendi.",
   "msgCopied":"Referans kopyalandı.","msgCopyManual":"Referansı手動 olarak kopyalayın.",
   "msgDisabledNote":"Yasal, teknik ve moderasyon hazırlığı tamamlanana kadar gönderim kapalıdır.",
   "msgTurnstileError":"Spam koruması doğrulaması kullanılamıyor. Bildirim gönderilemez.",
   "msgNotAllowed":"Gönderim henüz etkinleştirilmedi.","msgSending":"Gizli inceleme için gönderiliyor…"
  },
  "ro":{
   "heading":"RAPORTEAZĂ O OBSERVAȚIE","lead":"Documentează ceea ce ai observat. Separăm relatările martorilor de faptele verificate. Fiecare raport trece prin verificare umană.",
   "checking":"Se verifică starea sistemului de primire…",
   "formTitle":"Pregătește raportul",
   "country":"Țară","region":"Regiune","regionPh":"ex. Bavaria / Județul Sofia",
   "location":"Locație aproximativă","locationPh":"oraș sau zonă, fără adresă personală",
   "occurred":"Data și ora locală","timezone":"Fus orar",
   "category":"Categorie","catLights":"Lumini","catObject":"Obiect","catInstrument":"Înregistrare instrumentală","catOther":"Altele",
   "description":"Relatarea ta","descPh":"Ce ai observat, în ce direcție, cât a durat și care erau condițiile meteo? Nu include nume sau adrese personale.",
   "advisory":"Fără nume, e-mailuri, adrese personale, coordonate GPS exacte sau fișiere. La activare se salvează doar descrierea, data/ora, fusul orar și zona aproximativă.",
   "consentPrefix":"Confirm că am citit","privacyLink":"nota de confidențialitate și termenii","consentSuffix":"și sunt de acord cu procesarea acestui raport pentru moderare.",
   "saveDraft":"SALVEAZĂ CIORNA","downloadDraft":"DESCARCĂ CIORNA (JSON)","clearDraft":"ȘTERGE CIORNA","sendReport":"TRIMITE OBSERVAȚIA",
   "receiptHeading":"PRIMIT PENTRU VERIFICARE UMANĂ","receiptNote":"Păstrează acest cod; raportul nu este public.","copyReceipt":"COPIAZĂ CODUL",
   "ethicsTitle":"Ce urmează?",
   "ethics1":"Fiecare raport acceptat primește un cod unic și intră într-o coadă privată pentru verificare umană. Nimic nu se publică automat.",
   "ethics2":"Dacă primirea este oprită, butonul «Descarcă ciorna» salvează un fișier JSON doar pe dispozitivul tău și NU trimite nimic către AURORA.",
   "ethics3":"Nu există încărcare publică de fotografii, video sau date de contact în această etapă. Publicarea automată prin AI este dezactivată.",
   "statusDraft":"LOCAL DRAFT MODE · Trimiterea publică nu este încă activă. Poți pregăti o ciornă locală pe dispozitivul tău.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Primim doar rapoarte text pentru verificare umană. Fără publicare automată.",
   "statusOffline":"INTAKE OFFLINE · Nu putem confirma starea sistemului de primire. Poți salva doar o ciornă locală.",
   "msgDraftSaved":"Ciorna a fost salvată local în acest browser. Nimic nu a fost trimis către AURORA.",
   "msgStorageBlocked":"Stocarea locală nu este disponibilă în acest browser.",
   "msgNeedDesc":"Completează o descriere înainte de a descărca ciorna.",
   "msgDownloaded":"Ciorna a fost descărcată pe dispozitiv. NIMIC nu a fost trimis către AURORA.",
   "msgDownloadBlocked":"Descărcarea este blocată în acest browser.",
   "msgCleared":"Ciorna locală a fost ștearsă.",
   "msgCopied":"Codul a fost copiat.","msgCopyManual":"Copiază codul manual.",
   "msgDisabledNote":"Trimiterea rămâne dezactivată până la finalizarea pregătirii juridice, tehnice și de moderare.",
   "msgTurnstileError":"Verificarea anti-spam nu este disponibilă. Raportul nu poate fi trimis.",
   "msgNotAllowed":"Trimiterea nu este încă permisă.","msgSending":"Se trimite pentru verificare confidențială…"
  },
  "el":{
   "heading":"ΑΝΑΦΟΡΑ ΠΑΡΑΤΗΡΗΣΗΣ","lead":"Καταγράψτε όσα είδατε. Διαχωρίζουμε τις μαρτυρίες από τα επιβεβαιωμένα στοιχεία. Κάθε αναφορά ελέγχεται από ανθρώπους.",
   "checking":"Έλεγχος συστήματος υποβολής…",
   "formTitle":"Προετοιμάστε την αναφορά σας",
   "country":"Χώρα","region":"Περιοχή","regionPh":"π.χ. Βαυαρία / Περιφέρεια Σόφιας",
   "location":"Κατά προσέγγιση τοποθεσία","locationPh":"πόλη ή περιοχή, χωρίς προσωπική διεύθυνση",
   "occurred":"Τοπική ημερομηνία και ώρα","timezone":"Ζώνη ώρας",
   "category":"Κατηγορία","catLights":"Φώτα","catObject":"Αντικείμενο","catInstrument":"Καταγραφή οργάνων","catOther":"Άλλο",
   "description":"Η περιγραφή σας","descPh":"Τι είδατε, προς ποια κατεύθυνση, πόσο διήρκεσε και ποιες ήταν οι συνθήκες; Μην αναφέρετε ονόματα ή προσωπικές διευθύνσεις.",
   "advisory":"Χωρίς ονόματα, email, προσωπικές διευθύνσεις, ακριβείς συντεταγμένες GPS ή αρχεία. Καταγράφονται μόνο η περιγραφή, ημερομηνία/ώρα, ζώνη ώρας και περιοχή.",
   "consentPrefix":"Επιβεβαιώνω ότι διάβασα την","privacyLink":"ενημέρωση απορρήτου και τους όρους","consentSuffix":"και συναινώ στην επεξεργασία της αναφοράς για έλεγχο.",
   "saveDraft":"ΑΠΟΘΗΚΕΥΣΗ ΠΡΟΧΕΙΡΟΥ","downloadDraft":"ΛΗΨΗ ΠΡΟΧΕΙΡΟΥ (JSON)","clearDraft":"ΔΙΑΓΡΑΦΗ ΠΡΟΧΕΙΡΟΥ","sendReport":"ΥΠΟΒΟΛΗ ΠΑΡΑΤΗΡΗΣΗΣ",
   "receiptHeading":"ΕΛΗΦΘΗ ΓΙΑ ΑΝΘΡΩΠΙΝΟ ΕΛΕΓΧΟ","receiptNote":"Αποθηκεύστε αυτόν τον κωδικό· η αναφορά δεν είναι δημόσια.","copyReceipt":"ΑΝΤΙΓΡΑΦΗ ΚΩΔΙΚΟΥ",
   "ethicsTitle":"Τι ακολουθεί;",
   "ethics1":"Κάθε δεκτή αναφορά λαμβάνει μοναδικό κωδικό και μπαίνει σε ιδιωτική ουρά για ανθρώπινο έλεγχο. Τίποτα δεν δημοσιεύεται αυτόματα.",
   "ethics2":"Όταν η υποβολή είναι ανενεργή, η «Λήψη προχείρου» αποθηκεύει αρχείο JSON μόνο στη συσκευή σας και ΔΕΝ στέλνει τίποτα στο AURORA.",
   "ethics3":"Δεν υπάρχει δημόσια μεταφόρτωση φωτογραφιών, βίντεο ή στοιχείων επικοινωνίας σε αυτό το στάδιο. Η αυτόματη δημοσίευση από AI είναι απενεργοποιημένη.",
   "statusDraft":"LOCAL DRAFT MODE · Η δημόσια υποβολή δεν είναι ακόμη ενεργή. Μπορείτε να ετοιμάσετε τοπικό πρόχειρο στη συσκευή σας.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Δεχόμαστε μόνο αναφορές κειμένου για ανθρώπινο έλεγχο. Χωρίς αυτόματη δημοσίευση.",
   "statusOffline":"INTAKE OFFLINE · Αδυναμία επιβεβαίωσης ενεργού συστήματος. Μπορείτε να αποθηκεύσετε μόνο τοπικό πρόχειρο.",
   "msgDraftSaved":"Το πρόχειρο αποθηκεύτηκε τοπικά στον περιηγητή. Τίποτα δεν στάλθηκε στο AURORA.",
   "msgStorageBlocked":"Η τοπική αποθήκευση δεν είναι διαθέσιμη σε αυτόν τον περιηγητή.",
   "msgNeedDesc":"Συμπληρώστε περιγραφή πριν κατεβάσετε το πρόχειρο.",
   "msgDownloaded":"Το πρόχειρο κατέβηκε στη συσκευή σας. ΤΙΠΟΤΑ δεν στάλθηκε στο AURORA.",
   "msgDownloadBlocked":"Η λήψη αποκλείστηκε σε αυτόν τον περιηγητή.",
   "msgCleared":"Το τοπικό πρόχειρο διαγράφηκε.",
   "msgCopied":"Ο κωδικός αντιγράφηκε.","msgCopyManual":"Αντιγράψτε τον κωδικό χειροκίνητα.",
   "msgDisabledNote":"Η υποβολή παραμένει ανενεργή έως την ολοκλήρωση της νομικής και τεχνικής ετοιμότητας.",
   "msgTurnstileError":"Ο έλεγχος προστασίας από spam δεν είναι διαθέσιμος. Η αναφορά δεν μπορεί να σταλεί.",
   "msgNotAllowed":"Η υποβολή δεν επιτρέπεται ακόμη.","msgSending":"Αποστολή για εμπιστευτικό έλεγχο…"
  },
  "sr":{
   "heading":"ПРИЈАВИ ЗАПАЖАЊЕ","lead":"Документујте шта сте видели. Раздвајамо сведочења од потврђених чињеница. Свака пријава пролази људску проверу.",
   "checking":"Провера система за пријем…",
   "formTitle":"Припремите своју пријаву",
   "country":"Држава","region":"Регион","regionPh":"нпр. Шумадија / Баварска",
   "location":"Приближна локација","locationPh":"град или област, без личне адресе",
   "occurred":"Локални датум и време","timezone":"Временска зона",
   "category":"Категорија","catLights":"Светла","catObject":"Објекат","catInstrument":"Инструментални снимак","catOther":"Друго",
   "description":"Опис запажања","descPh":"Шта сте видели, у ком правцу, колико је трајало и какви су били услови? Не уносите имена или личне адресе.",
   "advisory":"Без имена, имејлова, личних адреса, тачних GPS координата или фајлова. При активирању бележе се само опис, датум/време, временска зона и приближна област.",
   "consentPrefix":"Потврђујем да сам прочитао/ла","privacyLink":"обавештење о приватности и услове","consentSuffix":"и сагласан/на сам са обрадом пријаве ради модерације.",
   "saveDraft":"САЧУВАЈ НАЦРТ","downloadDraft":"ПРЕУЗМИ НАЦРТ (JSON)","clearDraft":"ОБРИШИ НАЦРТ","sendReport":"ПОШАЉИ ЗАПАЖАЊЕ",
   "receiptHeading":"ПРИМЉЕНО НА ЉУДСКУ ПРОВЕРУ","receiptNote":"Сачувајте овај број; пријава није јавна.","copyReceipt":"КОПИРАЈ БРОЈ",
   "ethicsTitle":"Шта следи?",
   "ethics1":"Свака прихваћена пријава добија јединствени број и улази у приватни ред за људску проверу. Ништа се не објављује аутоматски.",
   "ethics2":"Ако је пријем искључен, дугме „Преузми нацрт“ чува JSON фајл само на вашем уређају и НЕ шаље ништа ка AURORA систему.",
   "ethics3":"Нема јавног отпремања фотографија, видеа или контакт података у овој фази. Аутоматско AI објављивање је искључено.",
   "statusDraft":"LOCAL DRAFT MODE · Јавно слање још није активно. Можете припремити нацрт локално на свом уређају.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Примамо само текстуалне пријаве за људску проверу. Нема аутоматског објављивања.",
   "statusOffline":"INTAKE OFFLINE · Не можемо да потврдимо да је пријем активан. Можете сачувати само локални нацрт.",
   "msgDraftSaved":"Нацрт је сачуван само у овом прегледачу. Ништа није послато у AURORA.",
   "msgStorageBlocked":"Локално чување није доступно у овом прегледачу.",
   "msgNeedDesc":"Унесите опис пре преузимања нацрта.",
   "msgDownloaded":"Нацрт је преузет на уређај. НИШТА није послато у AURORA.",
   "msgDownloadBlocked":"Преузимање није дозвољено у овом прегледачу.",
   "msgCleared":"Локални нацрт је обрисан.",
   "msgCopied":"Број је копиран.","msgCopyManual":"Копирајте број ручно.",
   "msgDisabledNote":"Слање је искључено до правне, техничке и модераторске спремности.",
   "msgTurnstileError":"Заштита од спама није доступна. Пријава се не може послати.",
   "msgNotAllowed":"Слање још није дозвољено.","msgSending":"Слање на поверљив преглед…"
  },
  "uk":{
   "heading":"ПОВІДОМИТИ ПРО СПОСТЕРЕЖЕННЯ","lead":"Задокументуйте побачене. Ми відокремлюємо свідчення очевидців від перевірених фактів. Кожне повідомлення проходить перевірку людиною.",
   "checking":"Перевірка системи прийому…",
   "formTitle":"Підготуйте своє повідомлення",
   "country":"Країна","region":"Регіон","regionPh":"напр. Київська область",
   "location":"Приблизний район","locationPh":"місто / населений пункт, без особистої адреси",
   "occurred":"Місцеві дата й час","timezone":"Часовий пояс",
   "category":"Категорія","catLights":"Вогні","catObject":"Об'єкт","catInstrument":"Приладовий запис","catOther":"Інше",
   "description":"Опис спостереження","descPh":"Що ви бачили, у якому напрямку, скільки це тривало та якими були умови? Не вказуйте імен, адрес чи персональних даних.",
   "advisory":"Без імен, email, особистих адрес, точних GPS-координат або файлів. Після активації зберігаються лише опис, дата/час, часовий пояс і приблизний район.",
   "consentPrefix":"Я підтверджую, що прочитав(ла)","privacyLink":"повідомлення про конфіденційність та умови","consentSuffix":"і даю згоду на обробку цього сигналу для модерації.",
   "saveDraft":"ЗБЕРЕГТИ ЧЕРНЕТКУ","downloadDraft":"ЗАВАНТАЖИТИ ЧЕРНЕТКУ (JSON)","clearDraft":"ОЧИСТИТИ ЧЕРНЕТКУ","sendReport":"НАДІСЛАТИ СПОСТЕРЕЖЕННЯ",
   "receiptHeading":"ПРИЙНЯТО НА ПЕРЕВІРКУ ЛЮДИНОЮ","receiptNote":"Збережіть цей номер; повідомлення не є публічним.","copyReceipt":"СКОПІЮВАТИ НОМЕР",
   "ethicsTitle":"Що далі?",
   "ethics1":"Кожне прийняте повідомлення отримує унікальний номер і потрапляє до приватної черги на перевірку людиною. Нічого не публікується автоматично.",
   "ethics2":"Якщо прийом вимкнено, кнопка «Завантажити чернетку» зберігає JSON-файл лише на вашому пристрої та НЕ надсилає дані до AURORA.",
   "ethics3":"Публічного завантаження фото, відео чи контактних даних на цьому етапі немає. Автоматичну публікацію ШІ вимкнено.",
   "statusDraft":"LOCAL DRAFT MODE · Публічне подання ще не активне. Ви можете підготувати чернетку локально на своєму пристрої.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Приймаємо лише текстові повідомлення для перевірки людиною. Без автопублікації.",
   "statusOffline":"INTAKE OFFLINE · Не вдалося підтвердити активність прийому. Можна зберегти лише локальну чернетку.",
   "msgDraftSaved":"Чернетку збережено лише в цьому браузері. Нічого не надіслано до AURORA.",
   "msgStorageBlocked":"Локальне сховище недоступне в цьому браузері.",
   "msgNeedDesc":"Заповніть опис перед завантаженням чернетки.",
   "msgDownloaded":"Чернетку завантажено на пристрій. НІЧОГО не надіслано до AURORA.",
   "msgDownloadBlocked":"Завантаження заблоковано в цьому браузері.",
   "msgCleared":"Локальну чернетку очищено.",
   "msgCopied":"Номер скопійовано.","msgCopyManual":"Скопіюйте номер вручну.",
   "msgDisabledNote":"Надсилання вимкнено до повної юридичної, технічної та модераторської готовності.",
   "msgTurnstileError":"Перевірка захисту від спаму недоступна. Повідомлення не може бути надіслане.",
   "msgNotAllowed":"Надсилання ще не дозволено.","msgSending":"Надсилаємо на конфіденційний розгляд…"
  },
  "pl":{
   "heading":"ZGŁOŚ OBSERWACJĘ","lead":"Udokumentuj to, co zaobserwowałeś. Oddzielamy relacje świadków od zweryfikowanych faktów. Każde zgłoszenie przechodzi ludzką weryfikację.",
   "checking":"Sprawdzanie statusu systemu zgłoszeń…",
   "formTitle":"Przygotuj zgłoszenie",
   "country":"Kraj","region":"Region","regionPh":"np. Mazowieckie / Bawaria",
   "location":"Przybliżona lokalizacja","locationPh":"miasto lub okolica, bez prywatnego adresu",
   "occurred":"Lokalna data i godzina","timezone":"Strefa czasowa",
   "category":"Kategoria","catLights":"Światła","catObject":"Obiekt","catInstrument":"Zapis instrumentalny","catOther":"Inne",
   "description":"Twoja relacja","descPh":"Co widziałeś, w jakim kierunku, jak długo to trwało i jakie były warunki? Nie podawaj imion, nazwisk ani adresów prywatnych.",
   "advisory":"Bez imion, e-maili, adresów prywatnych, dokładnych współrzędnych GPS ani plików. Po aktywacji zapisywane są tylko opis, data/czas, strefa czasowa i przybliżony obszar.",
   "consentPrefix":"Potwierdzam przeczytanie","privacyLink":"informacji o prywatności i warunków","consentSuffix":"oraz wyrażam zgodę na przetwarzanie zgłoszenia w celu moderacji.",
   "saveDraft":"ZAPISZ SZKIC","downloadDraft":"POBIERZ SZKIC (JSON)","clearDraft":"WYCZYŚĆ SZKIC","sendReport":"WYŚLIJ OBSERWACJĘ",
   "receiptHeading":"PRZYJĘTO DO WERYFIKACJI LUDZKIEJ","receiptNote":"Zachowaj ten numer; zgłoszenie nie jest publiczne.","copyReceipt":"KOPIUJ NUMER",
   "ethicsTitle":"Co dalej?",
   "ethics1":"Każde przyjęte zgłoszenie otrzymuje unikalny numer i trafia do prywatnej kolejki do ludzkiej weryfikacji. Nic nie jest publikowane automatycznie.",
   "ethics2":"Gdy przyjmowanie zgłoszeń jest wyłączone, „Pobierz szkic” zapisuje plik JSON wyłącznie na Twoim urządzeniu i NIE wysyła niczego do AURORA.",
   "ethics3":"Na tym etapie nie ma publicznego przesyłania zdjęć, wideo ani danych kontaktowych. Automatyczna publikacja przez AI jest wyłączona.",
   "statusDraft":"LOCAL DRAFT MODE · Publiczne wysyłanie nie jest jeszcze aktywne. Możesz przygotować lokalny szkic na swoim urządzeniu.",
   "statusActive":"PRIVATE INTAKE ACTIVE · Przyjmujemy wyłącznie zgłoszenia tekstowe do ludzkiej weryfikacji. Brak automatycznej publikacji.",
   "statusOffline":"INTAKE OFFLINE · Nie można potwierdzić statusu systemu. Możesz zapisać wyłącznie lokalny szkic.",
   "msgDraftSaved":"Szkic zapisano lokalnie w tej przeglądarce. Nic nie zostało wysłane do AURORA.",
   "msgStorageBlocked":"Pamięć lokalna jest niedostępna w tej przeglądarce.",
   "msgNeedDesc":"Wpisz opis przed pobraniem szkicu.",
   "msgDownloaded":"Szkic pobrano na urządzenie. NIC nie zostało wysłane do AURORA.",
   "msgDownloadBlocked":"Pobieranie zablokowane w tej przeglądarce.",
   "msgCleared":"Lokalny szkic wyczyszczony.",
   "msgCopied":"Numer skopiowany.","msgCopyManual":"Skopiuj numer ręcznie.",
   "msgDisabledNote":"Wysyłanie pozostaje wyłączone do czasu pełnej gotowości prawnej, technicznej i moderacyjnej.",
   "msgTurnstileError":"Weryfikacja antyspamowa niedostępna. Nie można wysłać zgłoszenia.",
   "msgNotAllowed":"Wysyłanie nie jest jeszcze włączone.","msgSending":"Wysyłanie do poufnej weryfikacji…"
  },
  "ar":{
   "heading":"الإبلاغ عن مشاهدة","lead":"وثّق ما شاهدته. نحن نفصل بين روايات الشهود والحقائق المؤكدة. يخضع كل بلاغ لمراجعة بشرية.",
   "checking":"جارٍ التحقق من حالة نظام الاستلام…",
   "formTitle":"جهّز بلاغك",
   "country":"الدولة","region":"المنطقة","regionPh":"مثال: بافاريا / محافظة صوفيا",
   "location":"الموقع التقريبي","locationPh":"المدينة أو المنطقة، بدون عنوان شخصي",
   "occurred":"التاريخ والوقت المحلي","timezone":"المنطقة الزمنية",
   "category":"الفئة","catLights":"أضواء","catObject":"جسم","catInstrument":"تسجيل بالأجهزة","catOther":"أخرى",
   "description":"تفاصيل المشاهدة","descPh":"ماذا شاهدت، وفي أي اتجاه، وكم استمر، وما هي حالة الطقس؟ لا تذكر أسماء أو عناوين شخصية.",
   "advisory":"بدون أسماء أو بريد إلكتروني أو عناوين شخصية أو إحداثيات GPS دقيقة أو ملفات. عند التفعيل يتم حفظ الوصف والتاريخ/الوقت والمنطقة الزمنية والموقع التقريبي فقط.",
   "consentPrefix":"أؤكد أنني قرأت","privacyLink":"إشعار الخصوصية والشروط","consentSuffix":"وأوافق على معالجة هذا البلاغ للمراجعة البشرية.",
   "saveDraft":"حفظ المسودة","downloadDraft":"تنزيل المسودة (JSON)","clearDraft":"مسح المسودة","sendReport":"إرسال المشاهدة",
   "receiptHeading":"تم الاستلام للمراجعة البشرية / RECEIVED FOR REVIEW","receiptNote":"احتفظ بهذا الرقم المرجعي؛ البلاغ غير منشور للعامة.","copyReceipt":"نسخ الرقم",
   "ethicsTitle":"ماذا يحدث بعد ذلك؟",
   "ethics1":"يحصل كل بلاغ مقبول على رقم مرجعي فريد ويدخل في قائمة خاصة للمراجعة البشرية. لا يتم نشر أي شيء تلقائياً. تبقى المسودات في متصفحك فقط.",
   "ethics2":"عندما يكون الاستلام متوقفاً، يقوم زر «تنزيل المسودة» بحفظ ملف JSON على جهازك فقط ولا يرسل أي شيء إلى AURORA.",
   "ethics3":"لا يوجد نظام عام لرفع الصور أو الفيديو أو بيانات الاتصال في هذه المرحلة. النشر التلقائي بالذكاء الاصطناعي معطل.",
   "statusDraft":"LOCAL DRAFT MODE · الإرسال العام غير مفعل بعد. يمكنك إعداد مسودة محلية على جهازك فقط.",
   "statusActive":"PRIVATE INTAKE ACTIVE · نستقبل البلاغات النصية فقط للمراجعة البشرية. لا يوجد نشر تلقائي.",
   "statusOffline":"INTAKE OFFLINE · تعذر تأكيد حالة نظام الاستلام. يمكنك حفظ مسودة محلية فقط.",
   "msgDraftSaved":"تم حفظ المسودة محلياً في هذا المتصفح فقط. لم يتم إرسال أي شيء إلى AURORA.",
   "msgStorageBlocked":"التخزين المحلي غير متاح في هذا المتصفح.",
   "msgNeedDesc":"يرجى إدخال وصف قبل تنزيل المسودة.",
   "msgDownloaded":"تم تنزيل المسودة على جهازك. لم يتم إرسال أي شيء إلى AURORA.",
   "msgDownloadBlocked":"التنزيل محظور في هذا المتصفح.",
   "msgCleared":"تم مسح المسودة المحلية.",
   "msgCopied":"تم نسخ الرقم المرجعي.","msgCopyManual":"انسخ الرقم المرجعي يدوياً.",
   "msgDisabledNote":"الإرسال متوقف حتى اكتمال الجاهزية القانونية والتقنية والإشرافية.",
   "msgTurnstileError":"التحقق من الحماية ضد الرسائل المزعجة غير متاح. لا يمكن إرسال البلاغ.",
   "msgNotAllowed":"الإرسال غير مفعل بعد.","msgSending":"جارٍ الإرسال للمراجعة السرية…"
  },
  "ja":{
   "heading":"目撃情報を報告する","lead":"目撃した内容を記録してください。証言と検証済みの事実を区別し、すべての報告は人間による審査を受けます。",
   "checking":"受付システムの状態を確認中…",
   "formTitle":"報告内容の作成",
   "country":"国コード","region":"地域・都道府県","regionPh":"例：バイエルン州 / ソフィア州",
   "location":"おおよその場所","locationPh":"市区町村や地域名（個人の住所は記入しないでください）",
   "occurred":"現地の日時","timezone":"タイムゾーン",
   "category":"カテゴリー","catLights":"光","catObject":"物体","catInstrument":"機器による記録","catOther":"その他",
   "description":"目撃内容の詳細","descPh":"何を見たか、方角、継続時間、天候や空の状況などを記入してください。氏名や住所などの個人情報は含めないでください。",
   "advisory":"氏名、メールアドレス、個人の住所、正確なGPS座標、ファイルは送信しないでください。有効化時は説明、日時、タイムゾーン、おおよその地域のみが記録されます。",
   "consentPrefix":"私は","privacyLink":"プライバシー通知と利用規約","consentSuffix":"を読み、審査のためにこの報告を処理することに同意します。",
   "saveDraft":"下書きを保存","downloadDraft":"下書きをダウンロード (JSON)","clearDraft":"下書きを消去","sendReport":"目撃報告を送信",
   "receiptHeading":"人間による審査のため受領済み / RECEIVED FOR REVIEW","receiptNote":"この参照番号を保管してください。報告は公開されません。","copyReceipt":"番号をコピー",
   "ethicsTitle":"今後の流れ",
   "ethics1":"受理された各報告には固有の参照番号が発行され、非公開の審査キューに入ります。自動的に公開されることはありません。下書きはブラウザ内にのみ保存されます。",
   "ethics2":"受付が無効な場合、「下書きをダウンロード」はお使いの端末にのみJSONファイルを保存し、AURORAへは何も送信しません。",
   "ethics3":"現段階では写真、動画、連絡先の公開アップロード機能はありません。AIによる自動公開は無効化されています。",
   "statusDraft":"LOCAL DRAFT MODE · 公開受付はまだ有効ではありません。端末内で下書きのみ作成できます。",
   "statusActive":"PRIVATE INTAKE ACTIVE · 人間による審査のためテキスト報告のみを受け付けています。自動公開は行われません。",
   "statusOffline":"INTAKE OFFLINE · 受付状態を確認できません。ローカル下書きの保存のみ可能です。",
   "msgDraftSaved":"下書きはこのブラウザにのみ保存されました。AURORAには送信されていません。",
   "msgStorageBlocked":"このブラウザではローカルストレージを利用できません。",
   "msgNeedDesc":"下書きをダウンロードする前に説明を入力してください。",
   "msgDownloaded":"端末に下書きをダウンロードしました。AURORAには一切送信されていません。",
   "msgDownloadBlocked":"このブラウザではダウンロードがブロックされています。",
   "msgCleared":"ローカル下書きを消去しました。",
   "msgCopied":"参照番号をコピーしました。","msgCopyManual":"参照番号を手動でコピーしてください。",
   "msgDisabledNote":"法的・技術的・審査体制の準備が整うまで送信は無効です。",
   "msgTurnstileError":"スパム防止確認が利用できないため、送信できません。",
   "msgNotAllowed":"送信はまだ有効ではありません。","msgSending":"非公開審査のために送信中…"
  },
  "ko":{
   "heading":"목격 제보하기","lead":"목격한 내용을 기록해 주세요. 목격담과 검증된 사실을 구분하며 모든 제보는 사람의 검토를 거칩니다.",
   "checking":"접수 시스템 상태 확인 중…",
   "formTitle":"제보 내용 작성",
   "country":"국가 코드","region":"지역","regionPh":"예: 바이에른 / 소피아 주",
   "location":"대략적인 위치","locationPh":"도시 또는 지역명 (개인 주소 입력 금지)",
   "occurred":"현지 날짜 및 시각","timezone":"시간대",
   "category":"분류","catLights":"불빛","catObject":"물체","catInstrument":"장비 기록","catOther":"기타",
   "description":"상세 설명","descPh":"무엇을 보았는지, 방향, 지속 시간, 기상 조건 등을 작성해 주세요. 이름이나 주소 등 개인정보는 포함하지 마세요.",
   "advisory":"이름, 이메일, 개인 주소, 정확한 GPS 좌표 또는 파일은 수집하지 않습니다. 활성화 시 설명, 일시, 시간대 및 대략적인 지역만 기록됩니다.",
   "consentPrefix":"본인은","privacyLink":"개인정보 안내 및 약관","consentSuffix":"을 읽었으며 검토를 위해 이 제보를 처리하는 데 동의합니다.",
   "saveDraft":"초안 저장","downloadDraft":"초안 다운로드 (JSON)","clearDraft":"초안 지우기","sendReport":"목격 제보 제출",
   "receiptHeading":"검토를 위해 접수됨 / RECEIVED FOR REVIEW","receiptNote":"이 참조 번호를 보관하세요. 제보는 공개되지 않습니다.","copyReceipt":"번호 복사",
   "ethicsTitle":"다음 절차 안내",
   "ethics1":"접수된 모든 제보는 고유 참조 번호를 부여받고 비공개 검토 대기열에 등록됩니다. 어떤 내용도 자동 게시되지 않으며 초안은 브라우저에만 남습니다.",
   "ethics2":"접수가 비활성화된 경우 '초안 다운로드'는 기기에만 JSON 파일을 저장하며 AURORA로 아무것도 전송하지 않습니다.",
   "ethics3":"현 단계에서는 사진, 영상 또는 연락처 업로드 기능이 없습니다. AI 자동 게시 기능은 비활성화되어 있습니다.",
   "statusDraft":"LOCAL DRAFT MODE · 공개 접수가 아직 활성화되지 않았습니다. 기기에서 로컬 초안만 작성할 수 있습니다.",
   "statusActive":"PRIVATE INTAKE ACTIVE · 사람의 검토를 위해 텍스트 제보만 접수합니다. 자동 게시되지 않습니다.",
   "statusOffline":"INTAKE OFFLINE · 접수 활성화 여부를 확인할 수 없습니다. 로컬 초안만 저장할 수 있습니다.",
   "msgDraftSaved":"초안이 이 브라우저에만 저장되었습니다. AURORA로 전송되지 않았습니다.",
   "msgStorageBlocked":"이 브라우저에서는 로컬 저장소를 사용할 수 없습니다.",
   "msgNeedDesc":"초안을 다운로드하기 전에 설명을 입력해 주세요.",
   "msgDownloaded":"기기에 초안이 다운로드되었습니다. AURORA로 아무것도 전송되지 않았습니다.",
   "msgDownloadBlocked":"이 브라우저에서 다운로드가 차단되었습니다.",
   "msgCleared":"로컬 초안이 삭제되었습니다.",
   "msgCopied":"참조 번호가 복사되었습니다.","msgCopyManual":"참조 번호를 직접 복사해 주세요.",
   "msgDisabledNote":"법적·기술적·검토 준비가 완료될 때까지 제출 기능이 비활성화됩니다.",
   "msgTurnstileError":"스팸 방지 인증을 사용할 수 없어 제보를 전송할 수 없습니다.",
   "msgNotAllowed":"제출이 아직 활성화되지 않았습니다.","msgSending":"비공개 검토를 위해 전송 중…"
  }
 };
 function pack(){
  const lang=document.documentElement.lang||"bg";
  return I18N[lang]||I18N.en;
 }
 function applyReportTranslations(){
  const t=pack();
  if($("reportHeading"))$("reportHeading").textContent=t.heading;
  if($("reportHeroLead"))$("reportHeroLead").textContent=t.lead;
  if($("reportFormTitle"))$("reportFormTitle").textContent=t.formTitle;
  document.querySelectorAll("[data-report-label]").forEach(el=>{
   const key=el.getAttribute("data-report-label");
   if(t[key])el.textContent=t[key];
  });
  if($("region"))$("region").placeholder=t.regionPh;
  if($("location"))$("location").placeholder=t.locationPh;
  if($("description"))$("description").placeholder=t.descPh;
  const cat=$("category");
  if(cat){
   const map={lights:"catLights",object:"catObject",instrument:"catInstrument",other:"catOther"};
   for(const opt of cat.options)if(map[opt.value]&&t[map[opt.value]])opt.textContent=t[map[opt.value]];
  }
  if($("reportAdvisory"))$("reportAdvisory").textContent=t.advisory;
  if($("consentPrefix"))$("consentPrefix").textContent=t.consentPrefix;
  if($("privacyLink"))$("privacyLink").textContent=t.privacyLink;
  if($("consentSuffix"))$("consentSuffix").textContent=t.consentSuffix;
  if($("saveDraft"))$("saveDraft").textContent=t.saveDraft;
  if($("downloadDraft"))$("downloadDraft").textContent=t.downloadDraft;
  if($("clearDraft"))$("clearDraft").textContent=t.clearDraft;
  if($("sendReport"))$("sendReport").textContent=t.sendReport;
  if($("receiptHeading"))$("receiptHeading").textContent=t.receiptHeading;
  if($("receiptNote"))$("receiptNote").textContent=t.receiptNote;
  if($("copyReceipt"))$("copyReceipt").textContent=t.copyReceipt;
  if($("reportEthicsTitle"))$("reportEthicsTitle").textContent=t.ethicsTitle;
  if($("reportEthics1"))$("reportEthics1").textContent=t.ethics1;
  if($("reportEthics2"))$("reportEthics2").textContent=t.ethics2;
  if($("reportEthics3"))$("reportEthics3").textContent=t.ethics3;
  if($("reportStatus")){
   if(statusState==="checking")$("reportStatus").textContent=t.checking;
   else if(statusState==="draft")$("reportStatus").textContent=t.statusDraft;
   else if(statusState==="active")$("reportStatus").textContent=t.statusActive;
   else if(statusState==="offline")$("reportStatus").textContent=t.statusOffline;
  }
 }
 const msg=(text,error=false)=>{
  $("formFeedback").textContent=text;
  $("formFeedback").style.color=error?"#ffd1c4":"#b7fff3";
 };
 const getDraft=()=>{
  const result={};
  for(const id of fields)result[id]=$(id).value;
  return result;
 };
 function saveDraft(){
  const t=pack();
  try{
   localStorage.setItem(STORAGE,JSON.stringify({...getDraft(),requestKey}));
   msg(t.msgDraftSaved);
  }catch{msg(t.msgStorageBlocked,true)}
 }
 function downloadDraft(){
  const t=pack();
  const data=getDraft();
  if(!data.description.trim()){
   msg(t.msgNeedDesc,true);
   return;
  }
  try{
   // Explicit local export: no network, email, consent tokens, or request IDs.
   const file=new Blob([JSON.stringify({format:"aurora-report-draft-v1",exported_at:new Date().toISOString(),...data},null,2)],{type:"application/json"});
   const url=URL.createObjectURL(file),a=document.createElement("a");
   a.href=url;a.download="aurora-observation-draft.json";document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   msg(t.msgDownloaded);
  }catch{msg(t.msgDownloadBlocked,true)}
 }
 function restoreDraft(){
  try{
   let draft=null;
   try{draft=JSON.parse(localStorage.getItem(STORAGE)||"null")}catch{/* A corrupt canonical draft must not block the legacy recovery path. */}
   if(!draft){
    const legacy=JSON.parse(localStorage.getItem(LEGACY_STORAGE)||"null");
    if(legacy&&typeof legacy==="object"&&!Array.isArray(legacy)&&
       ["country","place","date","description"].some(key=>typeof legacy[key]==="string"&&legacy[key].trim())){
     const migrated={};
     if(typeof legacy.country==="string"&&/^[A-Za-z]{2}$/.test(legacy.country))migrated.country=legacy.country.toUpperCase();
     if(typeof legacy.place==="string")migrated.location=legacy.place.slice(0,120);
     if(typeof legacy.date==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(legacy.date))migrated.occurred=legacy.date.slice(0,16);
     const categories={light:"lights",object:"object",other:"other"};
     if(Object.prototype.hasOwnProperty.call(categories,legacy.type))migrated.category=categories[legacy.type];
     if(typeof legacy.description==="string")migrated.description=legacy.description.slice(0,5000);
     if(Object.keys(migrated).length){
      draft={...migrated,requestKey};
      try{
       localStorage.setItem(STORAGE,JSON.stringify(draft));
       try{localStorage.removeItem(LEGACY_STORAGE)}catch{}
       msg(pack().msgDraftSaved);
      }catch{/* Keep displaying the legacy draft if storage is currently unavailable. */}
     }
    }
   }
   if(draft){
    for(const id of fields)if(typeof draft[id]==="string")$(id).value=draft[id];
    if(typeof draft.requestKey==="string"&&/^[a-f0-9-]{36}$/i.test(draft.requestKey))requestKey=draft.requestKey;
   }
  }catch{/* private browsing or blocked storage */}
 }
 function clearDraft(){
  const t=pack();
  $("receiptPanel").hidden=true;
  $("receiptValue").textContent="";
  try{localStorage.removeItem(STORAGE);localStorage.removeItem(LEGACY_STORAGE)}catch{}
  $("observationForm").reset();
  requestKey=crypto.randomUUID();
  msg(t.msgCleared);
 }
 function refreshSubmitButton(){
  $("sendReport").disabled=!enabled||!challenge||!$("consent").checked||pending;
 }
 function renderChallenge(){
  if(!window.turnstile||!enabled)return;
  widgetApi=window.turnstile;
  widget=widgetApi.render("#turnstileMount",{
   sitekey:siteKey,action:"aurora_report",theme:"dark",
   callback:token=>{challenge=token;refreshSubmitButton()},
   "expired-callback":()=>{challenge="";refreshSubmitButton()},
   "error-callback":()=>{challenge="";refreshSubmitButton()}
  });
 }
 async function initialize(){
  applyReportTranslations();
  window.addEventListener("aurora:language-changed",applyReportTranslations);
  restoreDraft();
  const country=new URLSearchParams(location.search).get("country");
  if(/^[A-Za-z]{2}$/.test(country||"")&&!$("country").value)$("country").value=country.toUpperCase();
  try{$("timezone").value||=Intl.DateTimeFormat().resolvedOptions().timeZone||"Europe/Sofia"}catch{$("timezone").value="Europe/Sofia"}
  $("country").addEventListener("input",()=>{$("country").value=$("country").value.toUpperCase()});
  $("saveDraft").addEventListener("click",saveDraft);
  $("downloadDraft").addEventListener("click",downloadDraft);
  $("clearDraft").addEventListener("click",clearDraft);
  $("copyReceipt").addEventListener("click",async()=>{
   const receipt=$("receiptValue").textContent;if(!receipt)return;
   const t=pack();
   try{await navigator.clipboard.writeText(receipt);msg(t.msgCopied)}
   catch{msg(t.msgCopyManual,true)}
  });
  $("consent").addEventListener("change",refreshSubmitButton);
  $("observationForm").addEventListener("submit",send);
  try{
   const result=await fetch("/api/intake/status",{cache:"no-store"});
   if(!result.ok)throw Error("status");
   const state=await result.json();
   if(state.accepting!==true){
    statusState="draft";
    $("reportStatus").classList.add("disabled");
    $("reportStatus").textContent=pack().statusDraft;
    msg(pack().msgDisabledNote);
    return;
   }
   if(!state.site_key||!state.policy_version)throw Error("incomplete");
   if(state.policy_url!=="https://aurorauap.org/privacy")throw Error("missing reviewed privacy URL");
   enabled=true;siteKey=state.site_key;policyVersion=state.policy_version;
   $("privacyLink").href=state.policy_url;
   statusState="active";
   $("reportStatus").classList.add("ready");
   $("reportStatus").textContent=pack().statusActive;
   $("activationControls").hidden=false;
   const script=document.createElement("script");
   script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
   script.async=true;script.defer=true;
   script.onload=renderChallenge;
   script.onerror=()=>{enabled=false;refreshSubmitButton();msg(pack().msgTurnstileError,true)};
   document.head.append(script);
  }catch{
   statusState="offline";
   $("reportStatus").classList.add("disabled");
   $("reportStatus").textContent=pack().statusOffline;
  }
 }
 async function send(event){
  event.preventDefault();
  const t=pack();
  if(!enabled||pending||!challenge||!$("consent").checked){msg(t.msgNotAllowed,true);return}
  const form=$("observationForm");
  if(!form.reportValidity())return;
  const draft=getDraft();
  const payload={
   request_key:requestKey,country_code:draft.country,region:draft.region,
   approximate_location:draft.location,occurred_local:draft.occurred,
   time_zone:draft.timezone,category:draft.category,description:draft.description,
   language_code:document.documentElement.lang||"bg",consent:true,consent_version:policyVersion,
   turnstile_token:challenge,website:$("website").value
  };
  pending=true;refreshSubmitButton();msg(t.msgSending);
  try{
   const response=await fetch("/api/intake/submit",{
    method:"POST",headers:{"Content-Type":"application/json"},
    credentials:"same-origin",body:JSON.stringify(payload)
   });
   const result=await response.json();
   if(response.status!==202||result.status!=="pending"||result.published!==false||
      !/^aur-int-[a-f0-9-]{36}$/.test(result.receipt_id||""))
    throw Error(result.error||"submit_failed");
   clearDraft();
   $("receiptValue").textContent=result.receipt_id;
   $("receiptPanel").hidden=false;
   msg("Сигналът е приет за ЧОВЕШКИ ПРЕГЛЕД. Номер: "+result.receipt_id+
    ". Не е публикуван. / Received for private review. Not published.");
  }catch(error){
   msg("Няма потвърдено получаване ("+String(error.message).slice(0,70)+"). Черновата не е изтрита. / Not confirmed; save your draft and retry.",true);
  }finally{
   pending=false;challenge="";
   if(widgetApi&&widget!==null)widgetApi.reset(widget);
   refreshSubmitButton();
  }
 }
 initialize();
})();
