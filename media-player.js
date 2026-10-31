const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be'
]);
const DIRECT_TYPES = {
  'video/mp4': ['mp4', 'm4v'],
  'video/webm': ['webm'],
  'video/ogg': ['ogv', 'ogg']
};
const AUTHORIZATION_TYPES = new Set(['license', 'written_permission', 'public_domain']);

function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    return url;
  } catch {
    return null;
  }
}

function youtubeId(url) {
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const pathParts = url.pathname.split('/').filter(Boolean);
  let id = null;
  if (url.hostname.toLowerCase() === 'youtu.be') {
    if (pathParts.length === 1) id = pathParts[0];
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v');
  } else if (['embed', 'shorts'].includes(pathParts[0]) && pathParts.length === 2) {
    id = pathParts[1];
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

function vimeoEmbed(url) {
  const host = url.hostname.toLowerCase();
  if (!['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  const id = host === 'player.vimeo.com'
    ? (parts.length === 2 && parts[0] === 'video' ? parts[1] : null)
    : (parts.length === 1 ? parts[0] : null);
  if (!id || !/^\d{6,12}$/.test(id)) return null;
  const hash = url.searchParams.get('h');
  const query = new URLSearchParams({ dnt: '1' });
  if (hash && /^[A-Za-z0-9]{6,32}$/.test(hash)) query.set('h', hash);
  return `https://player.vimeo.com/video/${id}?${query.toString()}`;
}

function validRightsRecord(playback) {
  if (!playback || playback.mode !== 'html5' || playback.rights_status !== 'verified' || playback.hosting_permission !== true) return false;
  if (!AUTHORIZATION_TYPES.has(playback.authorization_type)) return false;
  const date = String(playback.rights_checked_at || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return false;
  if (date > new Date().toISOString().slice(0, 10)) return false;
  const evidenceRef = typeof playback.rights_evidence_ref === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{3,119}$/.test(playback.rights_evidence_ref);
  const evidenceUrl = Boolean(safeHttpsUrl(playback.rights_evidence_url));
  if (!evidenceRef && !evidenceUrl) return false;
  if (playback.authorization_type === 'license') {
    if (typeof playback.license_name !== 'string' || !playback.license_name.trim() || !safeHttpsUrl(playback.license_url)) return false;
  }
  return true;
}

function directPlayback(media, original) {
  const playback = media.playback;
  if (!validRightsRecord(playback)) return null;
  const asset = safeHttpsUrl(playback.url);
  const mimeType = String(playback.mime_type || '').toLowerCase();
  const extension = asset?.pathname.toLowerCase().split('.').at(-1);
  if (!asset || !DIRECT_TYPES[mimeType]?.includes(extension)) return null;
  const resolved = {
    kind: 'html5',
    provider: 'direct',
    mediaUrl: asset.href,
    mimeType,
    originalUrl: original.href,
    alternatives:(Array.isArray(playback.fallback_urls)?playback.fallback_urls:[])
     .slice(0,3).filter(v=>{
      const u=safeHttpsUrl(v?.url);
      return u&&["www.navair.navy.mil","upload.wikimedia.org"].includes(u.hostname)&&
       DIRECT_TYPES[String(v.mime_type||"").toLowerCase()]?.includes(u.pathname.toLowerCase().split(".").at(-1));
     }).map(v=>({url:safeHttpsUrl(v.url).href,mimeType:String(v.mime_type).toLowerCase()}))
  };
  if(!resolved.alternatives.length)delete resolved.alternatives;
  return resolved;
}

// Stream only verified and approved sources. If a public-domain video CDN
// rate-limits the client, switch to the authorized government original.
export function loadVerifiedVideo(video,playback,onStatus=()=>{}){
 if(!video||playback?.kind!=="html5")return false;
 const queue=[playback.mediaUrl,...(playback.alternatives||[]).map(v=>v.url)];
 let index=0;
 video.addEventListener("error",()=>{
  if(!video.isConnected)return;
  if(index<queue.length-1){
   index++;onStatus("fallback");video.src=queue[index];
  }else onStatus("failed");
 });
 video.src=queue[0];
 return true;
}

export function resolveMediaPlayback(media) {
  if (!media || media.type !== 'video') return null;
  const original = safeHttpsUrl(media.url);
  if (!original) return null;
  const id = youtubeId(original);
  if (id) {
    return {
      kind: 'iframe',
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`,
      originalUrl: original.href
    };
  }
  const embedUrl = vimeoEmbed(original);
  if (embedUrl) {
    return { kind: 'iframe', provider: 'vimeo', embedUrl, originalUrl: original.href };
  }
  // DVIDS publishes its own iframe Embed Example for source video pages.
  // Accept the original Al Taqaddum case plus metadata explicitly marked
  // as a provider-provided embed by our allowlisted case importer.
  const dvidsId = original.hostname.toLowerCase() === 'www.dvidshub.net' &&
    original.pathname.match(/^\/video\/([1-9][0-9]{5,8})(?:\/[a-z0-9-]+)?\/?$/);
  const publishedEmbed = media.playback?.mode === 'provider_embed' &&
    media.playback?.provider === 'dvids' &&
    media.playback?.permission === 'public_embed' &&
    media.playback?.source_url === original.href;
  if (dvidsId && (dvidsId[1] === '960331' || publishedEmbed)) {
    return { kind: 'iframe', provider: 'dvids',
      embedUrl: 'https://www.dvidshub.net/video/embed/' + dvidsId[1],
      originalUrl: original.href };
  }
  return directPlayback(media, original);
}


/**
 * Source-safe thumbnail resolver. Returns a real provider preview only where the
 * video platform publishes one or a separate rights-verified poster is supplied.
 * Callers must label their own AURORA artwork as an illustration otherwise.
 */
export function resolveVideoPoster(media){
 if(!media||media.type!=="video")return null;
 const original=safeHttpsUrl(media.url);
 if(!original)return null;
 const youtube=youtubeId(original);
 if(youtube)return "https://i.ytimg.com/vi/"+youtube+"/hqdefault.jpg";
 const p=media.playback;
 if(p?.poster_rights_status==="verified"&&p.poster_hosting_permission===true&&
   (p.poster_rights_evidence_url&&safeHttpsUrl(p.poster_rights_evidence_url))){
  const url=safeHttpsUrl(p.poster_url);
  if(url&&/\.(?:jpe?g|png|webp|avif)$/i.test(url.pathname))return url.href;
 }
 return null;
}

const COPY = {
  en: {
    play: 'Watch in AURORA', close: 'Close player', kicker: 'AURORA player',
    source: 'Source', original: 'Open original source',
    iframeLoading: 'Loading the official player. If playback is blocked or unavailable, open the original source.',
    iframeReady: 'Player loaded. Use its controls. If playback is blocked or unavailable, open the original source.',
    iframeError: 'The embedded player could not load. The publisher may block embedding, or the video may be unavailable. Open the original source.',
    videoLoading: 'Loading the rights-cleared video. Playback does not start automatically.',
    videoReady: 'Video ready. Use the playback controls; it will not start automatically.',
    videoError: 'This video could not be loaded here. Open the original source to check availability.',
    fallbackTitle: 'Video'
  },
  bg: {
    play: 'Гледай в AURORA', close: 'Затвори плейъра', kicker: 'Плейър на AURORA',
    source: 'Източник', original: 'Отвори оригиналния източник',
    iframeLoading: 'Зарежда се официалният плейър. Ако възпроизвеждането е блокирано или недостъпно, отвори оригиналния източник.',
    iframeReady: 'Плейърът се зареди. Използвай контролите му. Ако възпроизвеждането е блокирано или недостъпно, отвори оригиналния източник.',
    iframeError: 'Вграденият плейър не се зареди. Издателят може да блокира вграждането или видеото да е недостъпно. Отвори оригиналния източник.',
    videoLoading: 'Зарежда се видеозапис с проверени права. Възпроизвеждането не започва автоматично.',
    videoReady: 'Видеото е готово. Използвай контролите; възпроизвеждането не започва автоматично.',
    videoError: 'Видеото не можа да се зареди тук. Провери наличността в оригиналния източник.',
    fallbackTitle: 'Видео'
  },
  de: {
    play: 'In AURORA ansehen', close: 'Player schließen', kicker: 'AURORA-Player',
    source: 'Quelle', original: 'Originalquelle öffnen',
    iframeLoading: 'Offizieller Player wird geladen. Falls die Wiedergabe blockiert ist, öffnen Sie die Originalquelle.',
    iframeReady: 'Player geladen. Nutzen Sie die Steuerelemente oder öffnen Sie die Originalquelle.',
    iframeError: 'Der eingebettete Player konnte nicht geladen werden. Öffnen Sie die Originalquelle.',
    videoLoading: 'Rechtegeprüftes Video wird geladen. Keine automatische Wiedergabe.',
    videoReady: 'Video bereit. Nutzen Sie die Wiedergabesteuerung; es startet nicht automatisch.',
    videoError: 'Dieses Video konnte hier nicht geladen werden. Prüfen Sie die Originalquelle.',
    fallbackTitle: 'Video'
  },
  fr: {
    play: 'Regarder dans AURORA', close: 'Fermer le lecteur', kicker: 'Lecteur AURORA',
    source: 'Source', original: 'Ouvrir la source originale',
    iframeLoading: 'Chargement du lecteur officiel. Si la lecture est bloquée, ouvrez la source originale.',
    iframeReady: 'Lecteur chargé. Utilisez ses commandes ou ouvrez la source originale.',
    iframeError: 'Le lecteur intégré n’a pas pu être chargé. Ouvrez la source originale.',
    videoLoading: 'Chargement de la vidéo aux droits vérifiés. Pas de lecture automatique.',
    videoReady: 'Vidéo prête. Utilisez les commandes de lecture ; elle ne démarre pas automatiquement.',
    videoError: 'Cette vidéo n’a pas pu être chargée ici. Ouvrez la source originale.',
    fallbackTitle: 'Vidéo'
  },
  es: {
    play: 'Ver en AURORA', close: 'Cerrar reproductor', kicker: 'Reproductor AURORA',
    source: 'Fuente', original: 'Abrir fuente original',
    iframeLoading: 'Cargando el reproductor oficial. Si la reproducción está bloqueada, abra la fuente original.',
    iframeReady: 'Reproductor cargado. Use sus controles o abra la fuente original.',
    iframeError: 'El reproductor integrado no pudo cargarse. Abra la fuente original.',
    videoLoading: 'Cargando vídeo con derechos verificados. No se reproduce automáticamente.',
    videoReady: 'Vídeo listo. Use los controles de reproducción; no comienza automáticamente.',
    videoError: 'Este vídeo no pudo cargarse aquí. Abra la fuente original.',
    fallbackTitle: 'Vídeo'
  },
  it: {
    play: 'Guarda in AURORA', close: 'Chiudi lettore', kicker: 'Lettore AURORA',
    source: 'Fonte', original: 'Apri fonte originale',
    iframeLoading: 'Caricamento del lettore ufficiale. Se la riproduzione è bloccata, apri la fonte originale.',
    iframeReady: 'Lettore caricato. Usa i controlli o apri la fonte originale.',
    iframeError: 'Impossibile caricare il lettore incorporato. Apri la fonte originale.',
    videoLoading: 'Caricamento del video con diritti verificati. Nessun avvio automatico.',
    videoReady: 'Video pronto. Usa i controlli di riproduzione; non parte automaticamente.',
    videoError: 'Impossibile caricare il video qui. Apri la fonte originale.',
    fallbackTitle: 'Video'
  },
  pt: {
    play: 'Ver na AURORA', close: 'Fechar reprodutor', kicker: 'Reprodutor AURORA',
    source: 'Fonte', original: 'Abrir fonte original',
    iframeLoading: 'Carregando o reprodutor oficial. Se a reprodução estiver bloqueada, abra a fonte original.',
    iframeReady: 'Reprodutor carregado. Use os controles ou abra a fonte original.',
    iframeError: 'Não foi possível carregar o reprodutor incorporado. Abra a fonte original.',
    videoLoading: 'Carregando vídeo com direitos verificados. A reprodução não inicia automaticamente.',
    videoReady: 'Vídeo pronto. Use os controles de reprodução; não inicia automaticamente.',
    videoError: 'Não foi possível carregar este vídeo aqui. Abra a fonte original.',
    fallbackTitle: 'Vídeo'
  },
  ru: {
    play: 'Смотреть в AURORA', close: 'Закрыть плеер', kicker: 'Плеер AURORA',
    source: 'Источник', original: 'Открыть первоисточник',
    iframeLoading: 'Загрузка официального плеера. Если воспроизведение заблокировано, откройте первоисточник.',
    iframeReady: 'Плеер загружен. Используйте элементы управления или откройте первоисточник.',
    iframeError: 'Встроенный плеер не удалось загрузить. Откройте первоисточник.',
    videoLoading: 'Загрузка видео с проверенными правами. Автовоспроизведение отключено.',
    videoReady: 'Видео готово. Используйте элементы управления; оно не запускается автоматически.',
    videoError: 'Не удалось загрузить видео здесь. Проверьте первоисточник.',
    fallbackTitle: 'Видео'
  },
  pl: {
    play: 'Oglądaj w AURORA', close: 'Zamknij odtwarzacz', kicker: 'Odtwarzacz AURORA',
    source: 'Źródło', original: 'Otwórz oryginalne źródło',
    iframeLoading: 'Ładowanie oficjalnego odtwarzacza. Jeśli odtwarzanie jest zablokowane, otwórz oryginalne źródło.',
    iframeReady: 'Odtwarzacz załadowany. Użyj elementów sterujących lub otwórz oryginalne źródło.',
    iframeError: 'Nie udało się załadować osadzonego odtwarzacza. Otwórz oryginalne źródło.',
    videoLoading: 'Ładowanie wideo ze zweryfikowanymi prawami. Brak autoodtwarzania.',
    videoReady: 'Wideo gotowe. Użyj elementów sterujących; nie uruchamia się automatycznie.',
    videoError: 'Nie udało się załadować tego wideo. Otwórz oryginalne źródło.',
    fallbackTitle: 'Wideo'
  },
  nl: {
    play: 'Bekijk in AURORA', close: 'Speler sluiten', kicker: 'AURORA-speler',
    source: 'Bron', original: 'Originele bron openen',
    iframeLoading: 'Officiële speler laden. Open de originele bron als afspelen is geblokkeerd.',
    iframeReady: 'Speler geladen. Gebruik de bediening of open de originele bron.',
    iframeError: 'De ingesloten speler kon niet worden geladen. Open de originele bron.',
    videoLoading: 'Video met geverifieerde rechten laden. Start niet automatisch.',
    videoReady: 'Video gereed. Gebruik de afspeelknoppen; start niet automatisch.',
    videoError: 'Deze video kon hier niet worden geladen. Open de originele bron.',
    fallbackTitle: 'Video'
  },
  ro: {
    play: 'Vizionează în AURORA', close: 'Închide playerul', kicker: 'Player AURORA',
    source: 'Sursă', original: 'Deschide sursa originală',
    iframeLoading: 'Se încarcă playerul oficial. Dacă redarea este blocată, deschide sursa originală.',
    iframeReady: 'Player încărcat. Folosește comenzile sau deschide sursa originală.',
    iframeError: 'Playerul încorporat nu a putut fi încărcat. Deschide sursa originală.',
    videoLoading: 'Se încarcă videoclipul cu drepturi verificate. Nu pornește automat.',
    videoReady: 'Videoclip pregătit. Folosește comenzile de redare; nu pornește automat.',
    videoError: 'Acest videoclip nu a putut fi încărcat aici. Deschide sursa originală.',
    fallbackTitle: 'Video'
  },
  el: {
    play: 'Προβολή στο AURORA', close: 'Κλείσιμο προγράμματος αναπαραγωγής', kicker: 'Πρόγραμμα αναπαραγωγής AURORA',
    source: 'Πηγή', original: 'Άνοιγμα αρχικής πηγής',
    iframeLoading: 'Φόρτωση επίσημου προγράμματος αναπαραγωγής. Αν η αναπαραγωγή αποκλείεται, ανοίξτε την αρχική πηγή.',
    iframeReady: 'Το πρόγραμμα αναπαραγωγής φορτώθηκε. Χρησιμοποιήστε τα χειριστήρια ή ανοίξτε την αρχική πηγή.',
    iframeError: 'Δεν ήταν δυνατή η φόρτωση του ενσωματωμένου προγράμματος. Ανοίξτε την αρχική πηγή.',
    videoLoading: 'Φόρτωση βίντεο με επαληθευμένα δικαιώματα. Δεν ξεκινά αυτόματα.',
    videoReady: 'Το βίντεο είναι έτοιμο. Χρησιμοποιήστε τα χειριστήρια αναπαραγωγής.',
    videoError: 'Δεν ήταν δυνατή η φόρτωση αυτού του βίντεο εδώ. Ανοίξτε την αρχική πηγή.',
    fallbackTitle: 'Βίντεο'
  },
  tr: {
    play: 'AURORA’da izle', close: 'Oynatıcıyı kapat', kicker: 'AURORA oynatıcı',
    source: 'Kaynak', original: 'Orijinal kaynağı aç',
    iframeLoading: 'Resmi oynatıcı yükleniyor. Oynatma engellenmişse orijinal kaynağı açın.',
    iframeReady: 'Oynatıcı yüklendi. Kontrollerini kullanın veya orijinal kaynağı açın.',
    iframeError: 'Yerleşik oynatıcı yüklenemedi. Orijinal kaynağı açın.',
    videoLoading: 'Hakları doğrulanmış video yükleniyor. Otomatik başlamaz.',
    videoReady: 'Video hazır. Oynatma kontrollerini kullanın; otomatik başlamaz.',
    videoError: 'Bu video burada yüklenemedi. Orijinal kaynağı açın.',
    fallbackTitle: 'Video'
  },
  sv: {
    play: 'Titta i AURORA', close: 'Stäng spelare', kicker: 'AURORA-spelare',
    source: 'Källa', original: 'Öppna originalkälla',
    iframeLoading: 'Laddar officiell spelare. Om uppspelning blockeras, öppna originalkällan.',
    iframeReady: 'Spelaren har laddats. Använd kontrollerna eller öppna originalkällan.',
    iframeError: 'Den inbäddade spelaren kunde inte laddas. Öppna originalkällan.',
    videoLoading: 'Laddar rättighetskontrollerad video. Startar inte automatiskt.',
    videoReady: 'Videon är klar. Använd uppspelningskontrollerna; den startar inte automatiskt.',
    videoError: 'Den här videon kunde inte laddas här. Öppna originalkällan.',
    fallbackTitle: 'Video'
  },
  ja: {
    play: 'AURORAで再生', close: 'プレーヤーを閉じる', kicker: 'AURORAプレーヤー',
    source: '出典', original: '元の出典を開く',
    iframeLoading: '公式プレーヤーを読み込んでいます。再生できない場合は元の出典を開いてください。',
    iframeReady: 'プレーヤーが読み込まれました。コントロールを使用するか元の出典を開いてください。',
    iframeError: '埋め込みプレーヤーを読み込めませんでした。元の出典を開いてください。',
    videoLoading: '権利確認済みの動画を読み込んでいます。自動再生はされません。',
    videoReady: '動画の準備ができました。再生コントロールを使用してください。',
    videoError: 'この動画をここで読み込めませんでした。元の出典を確認してください。',
    fallbackTitle: '動画'
  },
  ko: {
    play: 'AURORA에서 보기', close: '플레이어 닫기', kicker: 'AURORA 플레이어',
    source: '출처', original: '원본 출처 열기',
    iframeLoading: '공식 플레이어를 불러오는 중입니다. 재생이 차단된 경우 원본 출처를 여세요.',
    iframeReady: '플레이어가 로드되었습니다. 컨트롤을 사용하거나 원본 출처를 여세요.',
    iframeError: '임베드된 플레이어를 불러올 수 없습니다. 원본 출처를 여세요.',
    videoLoading: '권리가 확인된 동영상을 불러오는 중입니다. 자동 재생되지 않습니다.',
    videoReady: '동영상 준비 완료. 재생 컨트롤을 사용하세요.',
    videoError: '이 동영상을 여기서 불러올 수 없습니다. 원본 출처를 확인하세요.',
    fallbackTitle: '동영상'
  },
  zh: {
    play: '在 AURORA 中观看', close: '关闭播放器', kicker: 'AURORA 播放器',
    source: '来源', original: '打开原始来源',
    iframeLoading: '正在加载官方播放器。如果播放受阻，请打开原始来源。',
    iframeReady: '播放器已加载。请使用其控件或打开原始来源。',
    iframeError: '无法加载嵌入式播放器。请打开原始来源。',
    videoLoading: '正在加载已核实版权的视频。不会自动播放。',
    videoReady: '视频已就绪。请使用播放控件；不会自动开始播放。',
    videoError: '无法在此处加载此视频。请打开原始来源查看。',
    fallbackTitle: '视频'
  },
  'zh-CN': {
    play: '在 AURORA 中观看', close: '关闭播放器', kicker: 'AURORA 播放器',
    source: '来源', original: '打开原始来源',
    iframeLoading: '正在加载官方播放器。如果播放受阻，请打开原始来源。',
    iframeReady: '播放器已加载。请使用其控件或打开原始来源。',
    iframeError: '无法加载嵌入式播放器。请打开原始来源。',
    videoLoading: '正在加载已核实版权的视频。不会自动播放。',
    videoReady: '视频已就绪。请使用播放控件；不会自动开始播放。',
    videoError: '无法在此处加载此视频。请打开原始来源查看。',
    fallbackTitle: '视频'
  },
  sr: {
    play: 'Гледај у AURORA', close: 'Затвори плејер', kicker: 'AURORA плејер',
    source: 'Извор', original: 'Отвори изворни линк',
    iframeLoading: 'Учитавање званичног плејера. Ако је репродукција блокирана, отворите изворни линк.',
    iframeReady: 'Плејер је учитан. Користите контроле или отворите изворни линк.',
    iframeError: 'Уграђени плејер није могао да се учита. Отворите изворни линк.',
    videoLoading: 'Учитавање видео снимка са провереним правима. Не покреће се аутоматски.',
    videoReady: 'Видео је спреман. Користите контроле за репродукцију.',
    videoError: 'Овај видео није могао да се учита овде. Отворите изворни линк.',
    fallbackTitle: 'Видео'
  },
  uk: {
    play: 'Дивитися в AURORA', close: 'Закрити плеєр', kicker: 'Плеєр AURORA',
    source: 'Джерело', original: 'Відкрити першоджерело',
    iframeLoading: 'Завантаження офіційного плеєра. Якщо відтворення заблоковано, відкрийте першоджерело.',
    iframeReady: 'Плеєр завантажено. Використовуйте елементи керування або відкрийте першоджерело.',
    iframeError: 'Вбудований плеєр не вдалося завантажити. Відкрийте першоджерело.',
    videoLoading: 'Завантаження відео з перевіреними правами. Автовідтворення вимкнено.',
    videoReady: 'Відео готове. Використовуйте елементи керування відтворенням.',
    videoError: 'Не вдалося завантажити це відео тут. Перевірте першоджерело.',
    fallbackTitle: 'Відео'
  },
  ar: {
    play: 'شاهد في AURORA', close: 'إغلاق المشغل', kicker: 'مشغل AURORA',
    source: 'المصدر', original: 'فتح المصدر الأصلي',
    iframeLoading: 'جارٍ تحميل المشغل الرسمي. إذا تعذر التشغيل، افتح المصدر الأصلي.',
    iframeReady: 'تم تحميل المشغل. استخدم عناصر التحكم أو افتح المصدر الأصلي.',
    iframeError: 'تعذر تحميل المشغل المضمن. افتح المصدر الأصلي.',
    videoLoading: 'جارٍ تحميل الفيديو الموثق الحقوق. لا يبدأ التشغيل تلقائياً.',
    videoReady: 'الفيديو جاهز. استخدم عناصر التحكم في التشغيل.',
    videoError: 'تعذر تحميل هذا الفيديو هنا. افتح المصدر الأصلي للتحقق.',
    fallbackTitle: 'فيديو'
  }
};

// Shared 18-language player controls used by dossier and archival video UI.
export function mediaWordsFor(lang){
  const raw=String(lang||"en").trim();
  return COPY[raw]||COPY[raw.toLowerCase().split("-")[0]]||COPY.en;
}

function localeFor(documentRef) {
  let stored = '';
  try { stored = documentRef.defaultView?.localStorage?.getItem('aurora-lang') || ''; } catch { /* storage may be restricted */ }
  const full = String(stored || documentRef.documentElement.lang || 'bg').trim();
  if (Object.hasOwn(COPY, full)) return full;
  const raw = full.toLowerCase().split('-')[0];
  return Object.hasOwn(COPY, raw) ? raw : 'en';
}

function localizedTitle(media, locale, fallback) {
  const value = media?.title;
  const pack = COPY[locale] || COPY.en;
  if (value && typeof value === 'object') return String(value[locale] || value[locale.split('-')[0]] || value.en || value.bg || fallback || pack.fallbackTitle).trim();
  return String(value || fallback || pack.fallbackTitle).trim();
}

function normalizeTitle(value) {
  return String(value || '').replace(/\s*↗\s*$/, '').trim().normalize('NFKC').toLocaleLowerCase();
}

function cardCaseId(card, documentRef) {
  const link = card.querySelector('.media-entry-links a[href^="/archive/"], .media-entry-links a[href^="/cases/"]');
  if (!link) return '';
  try {
    return decodeURIComponent(new URL(link.href, documentRef.location.href).pathname.split('/').filter(Boolean).at(-1) || '');
  } catch {
    return '';
  }
}

function catalogIndex(data) {
  const index = new Map();
  if (!Array.isArray(data?.cases)) return index;
  for (const caseItem of data.cases) {
    if (!Array.isArray(caseItem?.media)) continue;
    for (const mediaItem of caseItem.media) {
      if (mediaItem?.type !== 'video') continue;
      const url = safeHttpsUrl(mediaItem.url);
      if (!url) continue;
      const records = index.get(url.href) || [];
      records.push({ caseItem, mediaItem });
      index.set(url.href, records);
    }
  }
  return index;
}

function hostnameLabel(value) {
  const url = safeHttpsUrl(value);
  return url?.hostname.replace(/^www\./i, '') || '';
}

export function initializeMediaPlayer(documentRef = globalThis.document, options = {}) {
  if (!documentRef) return null;
  const gallery = documentRef.querySelector('#mediaGallery');
  const windowRef = documentRef.defaultView;
  if (!gallery || !windowRef) return null;

  let locale = localeFor(documentRef);
  let words = COPY[locale];
  const index = new Map();
  let catalogReady = false;
  let dialog = null;
  let kickerNode = null;
  let attributionLabelNode = null;
  let playerHost = null;
  let playerStatus = null;
  let playerTitle = null;
  let playerContext = null;
  let sourceName = null;
  let originalLink = null;
  let closeButton = null;
  let focusedTrigger = null;
  let iframeTimer = null;
  let activeNode = null;
  let activeInline = null;
  const inlineOnly = options.inlineOnly === true;
  function resetInline({restoreFocus=false}={}) {
    if(!activeInline)return;
    const current=activeInline;activeInline=null;
    const {picture,stage,trigger,img,badge,close,player,status}=current;
    if(player?.tagName==="VIDEO"){
      try{player.pause();player.removeAttribute("src");player.load()}catch{}
    }else if(player?.tagName==="IFRAME"){player.removeAttribute("src")}
    stage.remove();close.remove();status.remove();
    picture.classList.remove("media-inline-active");
    if(img)img.hidden=false;
    if(badge)badge.hidden=false;
    if(trigger?.isConnected)trigger.hidden=false;
    if(restoreFocus&&trigger?.isConnected)trigger.focus();
  }
  function openInlinePlayback(card,picture,trigger,playback,details){
    resetInline();
    syncLocale();
    const img=picture.querySelector("img"),badge=picture.querySelector("span");
    if(img)img.hidden=true;
    if(badge)badge.hidden=true;
    trigger.hidden=true;
    picture.classList.add("media-inline-active");
    const stage=documentRef.createElement("div");
    stage.className="media-inline-player-stage";
    const status=documentRef.createElement("p");
    status.className="media-inline-status";
    status.setAttribute("role","status");
    status.textContent=playback.kind==="iframe"?words.iframeLoading:words.videoLoading;
    const close=documentRef.createElement("button");
    close.type="button";close.className="media-inline-close";
    close.textContent="×";close.setAttribute("aria-label",words.close);
    close.addEventListener("click",()=>resetInline({restoreFocus:true}));
    picture.append(stage,status,close);
    let player;
    if(playback.kind==="iframe"){
      player=documentRef.createElement("iframe");
      player.title=details.title+" — "+details.sourceName;
      player.loading="lazy";
      player.allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      player.allowFullscreen=true;
      player.referrerPolicy="strict-origin-when-cross-origin";
      player.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");
      player.addEventListener("load",()=>{status.textContent=words.iframeReady},{once:true});
      player.addEventListener("error",()=>{status.textContent=words.iframeError},{once:true});
      stage.append(player);
      // The user pressed Play: request playback in this single inline embed.
      // The provider can still restrict autoplay; its own controls remain available.
      const embed=new URL(playback.embedUrl);
      if(["youtube","vimeo","dvids"].includes(playback.provider))embed.searchParams.set("autoplay","1");
      player.src=embed.href;
    }else{
      player=documentRef.createElement("video");
      player.controls=true;player.preload="metadata";player.playsInline=true;
      player.setAttribute("aria-label",details.title);
      player.addEventListener("loadedmetadata",()=>{status.textContent=words.videoReady},{once:true});
      player.addEventListener("error",()=>{status.textContent=words.videoError},{once:true});
      stage.append(player);
      loadVerifiedVideo(player,playback,state=>{status.textContent=state==="fallback"?"Trying official backup video…":words.videoError});
      // Playback is requested only in direct response to the user's Play click.
      // Do not claim success if the browser or the publisher blocks it.
      const attempt=player.play();
      if(attempt?.catch)attempt.catch(()=>{if(player.isConnected)status.textContent=words.videoReady;});
    }
    activeInline={card,picture,stage,trigger,img,badge,close,player,status};
    close.focus();
  }


  function syncLocale() {
    locale = localeFor(documentRef);
    words = COPY[locale] || COPY.en;
    if (kickerNode) kickerNode.textContent = words.kicker;
    if (closeButton) closeButton.setAttribute('aria-label', words.close);
    if (attributionLabelNode) attributionLabelNode.textContent = `${words.source}: `;
    if (originalLink) originalLink.textContent = `${words.original} ↗`;
  }

  function ensureDialog() {
    if (dialog) {
      syncLocale();
      return dialog;
    }
    dialog = documentRef.createElement('dialog');
    dialog.className = 'aurora-player-dialog';
    dialog.setAttribute('aria-labelledby', 'aurora-player-title');
    dialog.setAttribute('aria-describedby', 'aurora-player-status');

    const panel = documentRef.createElement('div');
    panel.className = 'aurora-player-panel';
    const header = documentRef.createElement('header');
    header.className = 'aurora-player-header';
    const headingGroup = documentRef.createElement('div');
    kickerNode = documentRef.createElement('p');
    kickerNode.className = 'aurora-player-kicker';
    kickerNode.textContent = words.kicker;
    playerTitle = documentRef.createElement('h2');
    playerTitle.className = 'aurora-player-title';
    playerTitle.id = 'aurora-player-title';
    playerContext = documentRef.createElement('p');
    playerContext.className = 'aurora-player-context';
    headingGroup.append(kickerNode, playerTitle, playerContext);

    closeButton = documentRef.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'aurora-player-close';
    closeButton.setAttribute('aria-label', words.close);
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => dialog.close());
    header.append(headingGroup, closeButton);

    playerHost = documentRef.createElement('div');
    playerHost.className = 'aurora-player-stage';
    playerHost.setAttribute('aria-label', 'Video player');
    playerStatus = documentRef.createElement('p');
    playerStatus.className = 'aurora-player-status';
    playerStatus.id = 'aurora-player-status';
    playerStatus.setAttribute('role', 'status');
    playerStatus.setAttribute('aria-live', 'polite');

    const footer = documentRef.createElement('footer');
    footer.className = 'aurora-player-footer';
    const attribution = documentRef.createElement('p');
    attribution.className = 'aurora-player-attribution';
    attributionLabelNode = documentRef.createElement('span');
    attributionLabelNode.textContent = `${words.source}: `;
    sourceName = documentRef.createElement('strong');
    sourceName.className = 'aurora-player-source-name';
    attribution.append(attributionLabelNode, sourceName);
    originalLink = documentRef.createElement('a');
    originalLink.className = 'aurora-player-original';
    originalLink.target = '_blank';
    originalLink.rel = 'noopener noreferrer';
    originalLink.textContent = `${words.original} ↗`;
    footer.append(attribution, originalLink);

    panel.append(header, playerHost, playerStatus, footer);
    dialog.append(panel);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', cleanupPlayer);
    documentRef.body.append(dialog);
    return dialog;
  }

  function cleanupPlayer() {
    if (iframeTimer !== null) windowRef.clearTimeout(iframeTimer);
    iframeTimer = null;
    if (activeNode?.tagName === 'VIDEO') {
      try { activeNode.pause(); } catch { /* the node may already be detached */ }
      activeNode.removeAttribute('src');
      activeNode.load();
    }
    playerHost?.replaceChildren();
    activeNode = null;
    const trigger = focusedTrigger;
    focusedTrigger = null;
    if (trigger?.isConnected) trigger.focus();
  }

  function showEmbedError() {
    if (iframeTimer !== null) windowRef.clearTimeout(iframeTimer);
    iframeTimer = null;
    if (playerStatus) {
      playerStatus.textContent = words.iframeError;
      playerStatus.dataset.state = 'error';
    }
  }

  function setReady(message) {
    if (playerStatus) {
      playerStatus.textContent = message;
      playerStatus.dataset.state = 'ready';
    }
  }

  function openPlayback(playback, details, trigger) {
    syncLocale();
    const modal = ensureDialog();
    focusedTrigger = trigger;
    playerTitle.textContent = details.title;
    playerContext.textContent = details.caseTitle;
    playerContext.hidden = !details.caseTitle || details.caseTitle === details.title;
    sourceName.textContent = details.sourceName;
    originalLink.href = playback.originalUrl;
    playerHost.replaceChildren();
    playerStatus.dataset.state = 'loading';

    if (!modal.open) modal.showModal();
    closeButton.focus();

    if (playback.kind === 'iframe') {
      playerStatus.textContent = words.iframeLoading;
      const frame = documentRef.createElement('iframe');
      frame.className = 'aurora-player-frame';
      frame.title = `${details.title} — ${details.sourceName}`;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.addEventListener('load', () => {
        if (iframeTimer !== null) windowRef.clearTimeout(iframeTimer);
        iframeTimer = null;
        setReady(words.iframeReady);
      }, { once: true });
      frame.addEventListener('error', showEmbedError);
      activeNode = frame;
      playerHost.append(frame);
      iframeTimer = windowRef.setTimeout(showEmbedError, Number(options.embedTimeoutMs) || 15000);
      frame.src = playback.embedUrl;
      return;
    }

    playerStatus.textContent = words.videoLoading;
    const video = documentRef.createElement('video');
    video.className = 'aurora-player-video';
    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.setAttribute('aria-label', details.title);
    video.addEventListener('loadedmetadata', () => setReady(words.videoReady), { once: true });
    video.addEventListener('error', () => {
      playerStatus.textContent = words.videoError;
      playerStatus.dataset.state = 'error';
    });
    activeNode = video;
    playerHost.append(video);
    loadVerifiedVideo(video,playback,state=>{playerStatus.textContent=state==='fallback'?'Trying official backup video…':words.videoError});
  }

  function recordForCard(card, sourceLink) {
    const href = safeHttpsUrl(sourceLink.href)?.href;
    if (!href) return null;
    const candidates = index.get(href) || [];
    if (!candidates.length) return null;
    const caseId = cardCaseId(card, documentRef);
    const linkTitle = normalizeTitle(sourceLink.textContent);
    return candidates.find(({ caseItem, mediaItem }) =>
      (!caseId || caseItem.id === caseId) &&
      (!linkTitle || !normalizeTitle(localizedTitle(mediaItem, locale)) || normalizeTitle(localizedTitle(mediaItem, locale)) === linkTitle)
    ) || candidates.find(({ caseItem }) => !caseId || caseItem.id === caseId) || candidates[0];
  }

  function decorate() {
    // A filter/language change can discard a playing card: unload its media promptly.
    if (activeInline && !activeInline.picture.isConnected) resetInline();
    if (!catalogReady) return;
    syncLocale();
    for (const card of gallery.querySelectorAll('.media-entry')) {
      if (card.querySelector('.aurora-player-button') || card.querySelector('.media-inline-play') || card.querySelector('video.archive-video')) continue;
      const sourceLink = card.querySelector('.media-entry-links a[target="_blank"]');
      if (!sourceLink) continue;
      const record = recordForCard(card, sourceLink);
      const badgeText = card.querySelector('.media-entry-image span')?.textContent || '';
      const isVideo = record?.mediaItem?.type === 'video' || /\bvideo\b|видео|wideo|βίντεο|فيديو|動画|동영상|视频/i.test(badgeText);
      if (!isVideo) continue;
      const media = record?.mediaItem || { type: 'video', url: sourceLink.href };
      const playback = resolveMediaPlayback(media);
      if (!playback) continue;

      const title = localizedTitle(media, locale, sourceLink.textContent.replace(/\s*↗\s*$/, ''));
      const caseTitle = record?.caseItem?.title
        ? localizedTitle({ title: record.caseItem.title }, locale, '')
        : '';
      const sourceHost = hostnameLabel(playback.originalUrl);
      const providerLabel = playback.provider === 'youtube' ? 'YouTube' : playback.provider === 'vimeo' ? 'Vimeo' : sourceHost;
      const attribution = String(media.source_name || media.publisher || providerLabel || sourceHost).trim();
      if (!inlineOnly) {
      const button = documentRef.createElement('button');
      button.type = 'button';
      button.className = 'aurora-player-button';
      button.dataset.playerAction = 'play';
      button.dataset.playerProvider = playback.provider;
      if (record?.caseItem?.id) button.dataset.playerCaseId = record.caseItem.id;
      button.setAttribute('aria-label', `${words.play}: ${title}`);
      button.textContent = words.play;
      button.addEventListener('click', () => openPlayback(playback, {
        title,
        caseTitle,
        sourceName: attribution || sourceHost || providerLabel
      }, button));
      sourceLink.after(button);
      }
      const picture=card.querySelector(".media-entry-image");
      if(picture){
        const thumb=resolveVideoPoster(media),img=picture.querySelector("img");
        if(img){
          img.src=thumb||"/assets/media-ufo-earth-preview.svg";
          img.alt=thumb?
            ("Published video thumbnail: "+title):
            ("AURORA UFO artwork, not an original incident frame");
        }
        const credit=card.querySelector(".media-caption");
        if(credit)credit.textContent=thumb?
          "Preview from the credited video provider.":
          "AURORA preview artwork · not an original frame from the incident.";
        const inline=documentRef.createElement("button");
        inline.type="button";inline.className="media-inline-play";
        inline.dataset.inlinePlayerAction="play";
        inline.dataset.inlineProvider=playback.provider;
        inline.setAttribute("aria-label",words.play+": "+title);
        inline.title=words.play+": "+title;
        inline.textContent="▶";
        inline.addEventListener("click",()=>openInlinePlayback(card,picture,inline,playback,{
          title,caseTitle,sourceName:attribution||sourceHost||providerLabel
        }));
        picture.append(inline);
      }
    }
  }

  const Observer = windowRef.MutationObserver;
  const observer = Observer ? new Observer(decorate) : null;
  observer?.observe(gallery, { childList: true, subtree: true });
  if (typeof windowRef.fetch === 'function') {
    windowRef.fetch('/data/cases.json', { cache: 'force-cache', credentials: 'same-origin' })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        const records = catalogIndex(data);
        for (const [url, items] of records) index.set(url, items);
        catalogReady = true;
        decorate();
      })
      .catch(() => {
        catalogReady = true;
        decorate();
      });
  } else {
    catalogReady = true;
    decorate();
  }
  return { destroy() { observer?.disconnect(); resetInline(); dialog?.remove(); } };
}

if (typeof document !== 'undefined' && document.querySelector('#mediaGallery')) {
  // The public media gallery has one in-thumbnail player, never two competing launchers.
  initializeMediaPlayer(document, { inlineOnly: true });
}
