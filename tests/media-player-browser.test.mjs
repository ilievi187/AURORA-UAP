import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mime = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp'
};
const catalog = {
  schema_version: 1,
  cases: [
    {
      id: 'youtube-fixture', date: '2024-06-01', country: 'US',
      title: { en: 'YouTube fixture case', bg: 'Тестов случай YouTube' },
      summary: { en: 'Browser-only player fixture.', bg: 'Тест за браузъра.' },
      source: { name: 'Fixture Channel', url: 'https://www.youtube.com/' },
      media: [{ type: 'video', title: { en: 'YouTube sample', bg: 'YouTube пример' }, source_name: 'Fixture Channel', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' }],
      visual: { src: '/assets/feature-media.webp', kind: 'illustration' }
    },
    {
      id: 'vimeo-fixture', date: '2024-05-01', country: 'GB',
      title: { en: 'Vimeo fixture case', bg: 'Тестов случай Vimeo' },
      summary: { en: 'Browser-only player fixture.', bg: 'Тест за браузъра.' },
      source: { name: 'Vimeo Test Publisher', url: 'https://vimeo.com/' },
      media: [{ type: 'video', title: { en: 'Vimeo sample', bg: 'Vimeo пример' }, url: 'https://vimeo.com/76979871' }],
      visual: { src: '/assets/feature-media.webp', kind: 'illustration' }
    },
    {
      id: 'authorized-direct-fixture', date: '2024-04-01', country: 'AU',
      title: { en: 'Authorized direct fixture', bg: 'Разрешен директен тест' },
      summary: { en: 'Browser-only player fixture.', bg: 'Тест за браузъра.' },
      source: { name: 'Authorized Test Publisher', url: 'https://publisher.example/' },
      media: [{ type: 'video', title: { en: 'Rights-cleared sample', bg: 'Тест с проверени права' },
        url: 'https://publisher.example/story', playback: {
          mode: 'html5', url: 'https://cdn.publisher.example/footage.mp4', mime_type: 'video/mp4',
          rights_status: 'verified', hosting_permission: true, authorization_type: 'public_domain',
          rights_checked_at: '2026-10-29', rights_evidence_ref: 'permission-record-123'
        } }],
      visual: { src: '/assets/feature-media.webp', kind: 'illustration' }
    },
    {
      id: 'unapproved-direct-fixture', date: '2024-03-01', country: 'CA',
      title: { en: 'Unapproved direct fixture', bg: 'Неразрешен директен тест' },
      summary: { en: 'Browser-only player fixture.', bg: 'Тест за браузъра.' },
      source: { name: 'Unapproved Test Publisher', url: 'https://publisher.example/' },
      media: [{ type: 'video', title: { en: 'Unapproved sample', bg: 'Неразрешен тест' },
        url: 'https://publisher.example/unapproved', playback: {
          mode: 'html5', url: 'https://cdn.publisher.example/unapproved.mp4', mime_type: 'video/mp4',
          rights_status: 'pending', hosting_permission: false, authorization_type: 'public_domain'
        } }],
      visual: { src: '/assets/feature-media.webp', kind: 'illustration' }
    },
    {
      id: 'unsupported-fixture', date: '2024-02-01', country: 'NZ',
      title: { en: 'Unsupported fixture case', bg: 'Неподдържан тестов случай' },
      summary: { en: 'Browser-only player fixture.', bg: 'Тест за браузъра.' },
      source: { name: 'ABC Australia', url: 'https://www.abc.net.au/' },
      media: [{ type: 'video', title: { en: 'Publisher-hosted report', bg: 'Материал при издателя' }, url: 'https://www.abc.net.au/news/example' }],
      visual: { src: '/assets/feature-media.webp', kind: 'illustration' }
    }
  ]
};

let server;
let browser;
let ownsBrowser = false;
let port;

before(async () => {
  server = createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    if (pathname === '/data/cases.json') {
      response.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(catalog));
      return;
    }
    const decoded = decodeURIComponent(pathname);
    const file = resolve(join(root, decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '')));
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[file.slice(file.lastIndexOf('.'))] || 'application/octet-stream' }).end(body);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  port = server.address().port;
  browser = await chromium.launch({
    headless: true,
    ...(process.env.AURORA_CHROMIUM_PATH ? { executablePath: process.env.AURORA_CHROMIUM_PATH } : {})
  });
  ownsBrowser = true;
});

after(async () => {
  if (ownsBrowser) await browser?.close();
  if (server) await new Promise(resolveClose => server.close(resolveClose));
});

async function openMediaPage(viewport = { width: 1280, height: 860 }, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(options.live ? 30000 : 5000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('aurora-lang', 'en'));
  if (options.stubEmbeds !== false) {
    await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({
      status: 200, contentType: 'text/html', body: '<!doctype html><title>Local YouTube embed fixture</title><p>Local rendering fixture</p>'
    }));
    await page.route('https://player.vimeo.com/**', route => route.fulfill({
      status: 200, contentType: 'text/html', body: '<!doctype html><title>Local Vimeo embed fixture</title><p>Local rendering fixture</p>'
    }));
  }
  await page.goto(`http://127.0.0.1:${port}/media.html`);
  await page.waitForFunction(() => document.querySelectorAll('#mediaGallery .media-entry').length === 5);
  await page.waitForFunction(() => document.querySelectorAll('#mediaGallery [data-player-action]').length === 3);
  return { context, page, errors };
}

test('only supported providers and rights-cleared direct assets get an in-site play action', async () => {
  const { context, page, errors } = await openMediaPage();
  try {
    assert.equal(await page.locator('[data-player-action]').count(), 3);
    assert.equal(await page.locator('#mediaGallery article').filter({ hasText: 'Unapproved direct fixture' }).locator('[data-player-action]').count(), 0);
    assert.equal(await page.locator('#mediaGallery article').filter({ hasText: 'Unsupported fixture case' }).locator('[data-player-action]').count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

test('YouTube opens lazily in an accessible modal and Escape restores focus', async () => {
  const { context, page, errors } = await openMediaPage();
  try {
    const button = page.locator('[data-player-provider="youtube"]');
    await button.click();
    const dialog = page.locator('dialog.aurora-player-dialog');
    assert.equal(await dialog.evaluate(element => element.open), true);
    assert.equal(await dialog.locator('.aurora-player-title').textContent(), 'YouTube sample');
    assert.equal(await dialog.locator('.aurora-player-context').textContent(), 'YouTube fixture case');
    assert.equal(await dialog.locator('.aurora-player-source-name').textContent(), 'Fixture Channel');
    const frame = dialog.locator('iframe');
    const src = await frame.getAttribute('src');
    assert.equal(src, 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0&playsinline=1');
    assert.doesNotMatch(src, /autoplay=1/i);
    assert.equal(await frame.getAttribute('loading'), 'lazy');
    assert.ok((await frame.getAttribute('allow')).includes('fullscreen'));
    assert.equal(await dialog.locator('.aurora-player-original').getAttribute('href'), 'https://www.youtube.com/watch?v=aqz-KE-bpKQ');
    assert.match(await dialog.locator('.aurora-player-status').textContent(), /if.*blocked|unavailable/i);
    if (process.env.AURORA_PLAYER_SCREENSHOT_PATH) await page.screenshot({ path: process.env.AURORA_PLAYER_SCREENSHOT_PATH, fullPage: true });
    await page.keyboard.press('Escape');
    assert.equal(await dialog.evaluate(element => element.open), false);
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.playerProvider), 'youtube');
    await page.waitForFunction(() => document.querySelector('dialog.aurora-player-dialog iframe') === null);
    assert.equal(await dialog.locator('iframe').count(), 0, 'closing must unload the expensive embed');
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

test('Vimeo opens its official player and direct HTML5 requires controls without autoplay', async () => {
  const { context, page, errors } = await openMediaPage();
  try {
    await page.locator('[data-player-provider="vimeo"]').click();
    let dialog = page.locator('dialog.aurora-player-dialog');
    assert.equal(await dialog.locator('iframe').getAttribute('src'), 'https://player.vimeo.com/video/76979871?dnt=1');
    await page.locator('.aurora-player-close').click();
    assert.equal(await dialog.evaluate(element => element.open), false);

    await page.route('https://cdn.publisher.example/**', route => route.abort());
    await page.locator('[data-player-provider="direct"]').click();
    dialog = page.locator('dialog.aurora-player-dialog');
    const video = dialog.locator('video');
    assert.equal(await video.getAttribute('src'), 'https://cdn.publisher.example/footage.mp4');
    assert.equal(await video.getAttribute('preload'), 'metadata');
    assert.equal(await video.getAttribute('controls'), '');
    assert.equal(await video.getAttribute('autoplay'), null);
    assert.equal(await dialog.locator('.aurora-player-original').getAttribute('href'), 'https://publisher.example/story');
    await video.evaluate(element => element.dispatchEvent(new Event('error')));
    assert.match(await dialog.locator('.aurora-player-status').textContent(), /could not be loaded|original source/i);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

test('mobile player fits the viewport and provider errors keep an original-source fallback', async () => {
  const { context, page, errors } = await openMediaPage({ width: 390, height: 844 });
  try {
    await page.locator('[data-player-provider="vimeo"]').click();
    const dialog = page.locator('dialog.aurora-player-dialog');
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      dialog: document.querySelector('dialog.aurora-player-dialog').getBoundingClientRect().width
    }));
    assert.ok(dimensions.page <= dimensions.viewport + 1, `page overflow: ${JSON.stringify(dimensions)}`);
    assert.ok(dimensions.dialog <= dimensions.viewport, `dialog overflow: ${JSON.stringify(dimensions)}`);
    await dialog.locator('iframe').evaluate(frame => frame.dispatchEvent(new Event('error')));
    assert.match(await dialog.locator('.aurora-player-status').textContent(), /could not load|blocked|unavailable/i);
    assert.equal(await dialog.locator('.aurora-player-original').getAttribute('href'), 'https://vimeo.com/76979871');
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});

if (process.env.AURORA_LIVE_EMBED_TEST === '1') {
  test('LIVE only: a real YouTube sample can reach playback inside the in-site modal', async t => {
    const { context, page, errors } = await openMediaPage({ width: 1280, height: 860 }, { live: true, stubEmbeds: false });
    const providerEvents = [];
    const framePredicate = candidate => candidate.url().includes('youtube-nocookie.com/embed/aqz-KE-bpKQ');
    page.on('requestfailed', request => {
      if (/youtube-nocookie\.com/i.test(request.url())) providerEvents.push({ kind: 'requestfailed', url: request.url(), error: request.failure()?.errorText });
    });
    page.on('response', response => {
      if (/youtube-nocookie\.com/i.test(response.url())) providerEvents.push({ kind: 'response', url: response.url(), status: response.status() });
    });
    page.on('framenavigated', frame => {
      if (/youtube-nocookie|chrome-error/i.test(frame.url())) providerEvents.push({ kind: 'framenavigated', url: frame.url() });
    });
    try {
      const navigation = page.waitForEvent('framenavigated', { predicate: framePredicate, timeout: 30000 });
      await page.locator('[data-player-provider="youtube"]').click();
      await page.locator('iframe.aurora-player-frame').waitFor();
      await page.waitForFunction(() => document.querySelector('iframe.aurora-player-frame')?.src.includes('youtube-nocookie.com/embed/aqz-KE-bpKQ'));
      let frame = page.frames().find(framePredicate);
      if (!frame) frame = await navigation;
      await frame.waitForLoadState('domcontentloaded', { timeout: 30000 });
      const video = frame.locator('video').first();
      try { await video.waitFor({ state: 'attached', timeout: 20000 }); }
      catch {
        t.skip('The live YouTube player did not expose its video element; live playback remains unverified.');
        return;
      }
      const playButton = frame.locator('.ytp-large-play-button');
      try { await playButton.waitFor({ state: 'visible', timeout: 15000 }); }
      catch {
        const diagnostic = {
          url: frame.url(), title: await frame.title().catch(() => ''),
          text: (await frame.locator('body').innerText().catch(() => '')).slice(0, 800),
          playerStatus: await page.locator('.aurora-player-status').textContent(), providerEvents
        };
        t.skip(`The live embed loaded but exposed no Play control; playback remains unverified: ${JSON.stringify(diagnostic)}`);
        return;
      }
      const beforePlay = await video.evaluate(element => ({ paused: element.paused, time: element.currentTime }));
      if (beforePlay.paused) await playButton.click({ timeout: 15000 });
      await frame.waitForFunction(() => {
        const playerVideo = document.querySelector('video');
        return Boolean(playerVideo && !playerVideo.paused && playerVideo.currentTime >= 0.25);
      }, null, { timeout: 30000 });
      const playback = await video.evaluate(element => ({ paused: element.paused, time: element.currentTime }));
      assert.equal(playback.paused, false);
      assert.ok(playback.time >= 0.25);
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  });
}
