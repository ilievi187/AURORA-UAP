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
  return {
    kind: 'html5',
    provider: 'direct',
    mediaUrl: asset.href,
    mimeType,
    originalUrl: original.href
  };
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
  return directPlayback(media, original);
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
  }
};

function localeFor(documentRef) {
  let stored = '';
  try { stored = documentRef.defaultView?.localStorage?.getItem('aurora-lang') || ''; } catch { /* storage may be restricted */ }
  const language = stored || documentRef.documentElement.lang || 'bg';
  return language.toLowerCase().startsWith('bg') ? 'bg' : 'en';
}

function localizedTitle(media, locale, fallback) {
  const value = media?.title;
  if (value && typeof value === 'object') return String(value[locale] || value.en || value.bg || fallback || COPY[locale].fallbackTitle).trim();
  return String(value || fallback || COPY[locale].fallbackTitle).trim();
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

  const locale = localeFor(documentRef);
  const words = COPY[locale];
  const index = new Map();
  let catalogReady = false;
  let dialog = null;
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

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = documentRef.createElement('dialog');
    dialog.className = 'aurora-player-dialog';
    dialog.setAttribute('aria-labelledby', 'aurora-player-title');
    dialog.setAttribute('aria-describedby', 'aurora-player-status');

    const panel = documentRef.createElement('div');
    panel.className = 'aurora-player-panel';
    const header = documentRef.createElement('header');
    header.className = 'aurora-player-header';
    const headingGroup = documentRef.createElement('div');
    const kicker = documentRef.createElement('p');
    kicker.className = 'aurora-player-kicker';
    kicker.textContent = words.kicker;
    playerTitle = documentRef.createElement('h2');
    playerTitle.className = 'aurora-player-title';
    playerTitle.id = 'aurora-player-title';
    playerContext = documentRef.createElement('p');
    playerContext.className = 'aurora-player-context';
    headingGroup.append(kicker, playerTitle, playerContext);

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
    const attributionLabel = documentRef.createElement('span');
    attributionLabel.textContent = `${words.source}: `;
    sourceName = documentRef.createElement('strong');
    sourceName.className = 'aurora-player-source-name';
    attribution.append(attributionLabel, sourceName);
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
    video.setAttribute('src', playback.mediaUrl);
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
    if (!catalogReady) return;
    for (const card of gallery.querySelectorAll('.media-entry')) {
      if (card.querySelector('.aurora-player-button') || card.querySelector('video.archive-video')) continue;
      const sourceLink = card.querySelector('.media-entry-links a[target="_blank"]');
      if (!sourceLink) continue;
      const record = recordForCard(card, sourceLink);
      const badgeText = card.querySelector('.media-entry-image span')?.textContent || '';
      const isVideo = record?.mediaItem?.type === 'video' || /\bvideo\b|видео/i.test(badgeText);
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
  return { destroy() { observer?.disconnect(); dialog?.remove(); } };
}

if (typeof document !== 'undefined' && document.querySelector('#mediaGallery')) {
  initializeMediaPlayer(document);
}
