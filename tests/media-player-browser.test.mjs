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
  await page.waitForFunction(() => document.querySelectorAll('#mediaGallery [data-inline-player-action="play"]').length === 3);
  return { context, page, errors };
}

test('one source-safe Play control per playable card, no stacked or modal launchers', async () => {
 const {context,page,errors}=await openMediaPage();
 try{
  assert.equal(await page.locator('[data-inline-player-action="play"]').count(),3);
  assert.equal(await page.locator('#mediaGallery .archive-video-box').count(),0);
  assert.equal(await page.locator('#mediaGallery .aurora-player-button').count(),0);
  assert.equal(await page.locator('#mediaGallery .media-inline-play').count(),3);
  assert.equal(await page.locator('#mediaGallery article').filter({hasText:'Unapproved direct fixture'}).locator('.media-inline-play').count(),0);
  assert.equal(await page.locator('#mediaGallery article').filter({hasText:'Unsupported fixture case'}).locator('.media-inline-play').count(),0);
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
});

test('Vimeo opens in the thumbnail with publisher source fallback and close unloads it', async()=>{
 const {context,page,errors}=await openMediaPage();
 try{
  const card=page.locator('#mediaGallery article').filter({hasText:'Vimeo fixture case'});
  await card.locator('.media-inline-play').click();
  assert.equal(await card.locator('.media-entry-image iframe').getAttribute('src'),'https://player.vimeo.com/video/76979871?dnt=1');
  assert.equal(await card.locator('.media-entry-links a[target="_blank"]').getAttribute('href'),'https://vimeo.com/76979871');
  assert.equal(await page.locator('dialog.aurora-player-dialog[open]').count(),0);
  await card.locator('.media-inline-close').click();
  assert.equal(await card.locator('iframe').count(),0);
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
});

test('opening a second thumbnail stops the first, even at mobile width',async()=>{
 const {context,page,errors}=await openMediaPage({width:390,height:844});
 try{
  const youtube=page.locator('#mediaGallery article').filter({hasText:'YouTube fixture case'});
  const vimeo=page.locator('#mediaGallery article').filter({hasText:'Vimeo fixture case'});
  await youtube.locator('.media-inline-play').click();
  assert.equal(await youtube.locator('iframe').count(),1);
  await vimeo.locator('.media-inline-play').click();
  assert.equal(await youtube.locator('iframe').count(),0,'previous embed must be unloaded');
  assert.equal(await vimeo.locator('iframe').count(),1);
  const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(widths.scroll<=widths.client+1,'inline video must not overflow mobile viewport');
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
});


test('Play over the actual video card reveals a real inline iframe, not an outbound website',async()=>{
  const {context,page,errors}=await openMediaPage();
  try{
    const card=page.locator('#mediaGallery article').filter({hasText:'YouTube fixture case'});
    const overlay=card.locator('button[data-inline-player-action="play"]');
    assert.equal(await overlay.count(),1);
    assert.equal(await card.locator('.media-entry-image iframe').count(),0,'no network embed before click');
    await overlay.click();
    const picture=card.locator('.media-entry-image');
    assert.equal(await picture.locator('iframe').getAttribute('src'),'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0&playsinline=1');
    assert.equal(await picture.locator('img').isHidden(),true);
    assert.equal(await picture.locator('button.media-inline-play').isHidden(),true);
    assert.equal(await picture.locator('button.media-inline-close').count(),1);
    assert.equal(await page.locator('dialog.aurora-player-dialog[open]').count(),0,'overlay opens inline, not a separate modal');
    assert.equal(await page.locator('#mediaGallery article').filter({hasText:'Unsupported fixture case'}).locator('.media-inline-play').count(),0);
    await picture.locator('button.media-inline-close').click();
    assert.equal(await picture.locator('iframe').count(),0);
    assert.equal(await picture.locator('img').isVisible(),true);
    assert.equal(await picture.locator('button.media-inline-play').isVisible(),true);
    assert.equal(await overlay.evaluate(button=>document.activeElement===button),true);
    assert.deepEqual(errors,[]);
  }finally{await context.close()}
});

test('HTML5 Play loads real rights-cleared video inside the same thumbnail with controls',async()=>{
  const {context,page,errors}=await openMediaPage({width:390,height:844});
  try{
    await page.route('https://cdn.publisher.example/**',route=>route.abort());
    const card=page.locator('#mediaGallery article').filter({hasText:'Authorized direct fixture'});
    await card.locator('button[data-inline-player-action="play"]').click();
    const video=card.locator('.media-entry-image video');
    assert.equal(await video.getAttribute('src'),'https://cdn.publisher.example/footage.mp4');
    assert.equal(await video.getAttribute('controls'),'');
    assert.equal(await video.getAttribute('autoplay'),null);
    assert.equal(await video.getAttribute('preload'),'metadata');
    assert.equal(await card.locator('.media-entry-links a[target="_blank"]').getAttribute('href'),'https://publisher.example/story');
    const widths=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(widths.scroll<=widths.client+1,'the inline player cannot create mobile overflow');
    await card.locator('.media-inline-close').click();
    assert.equal(await video.count(),0,'closing unloads the network video');
    assert.deepEqual(errors,[]);
  }finally{await context.close()}
});
