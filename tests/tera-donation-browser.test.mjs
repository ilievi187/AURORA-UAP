import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mime = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.webp':'image/webp' };
const server = createServer(async (req, res) => {
  const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!path.startsWith(root + sep)) return res.writeHead(403).end();
  try { const body = await readFile(path); res.writeHead(200, { 'Content-Type':mime[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
  for (const [width, isMobile] of [[320,true], [375,true], [390,true], [428,true], [320,false], [375,false], [768,false], [1280,false]]) {
    await test(`donation page fits and remains usable at ${width}px${isMobile ? ' mobile' : ''}`, async () => {
      const page = await browser.newPage({viewport:{width,height:800}, isMobile, reducedMotion:'reduce'});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.goto(`http://127.0.0.1:${server.address().port}/donate.html`);
        for (const language of ['bg', 'en', 'de', 'ru', 'zh-CN']) {
          await page.locator('#langSelect').selectOption(language);
          assert.equal(await page.locator('html').getAttribute('lang'), language);
          assert.equal(await page.locator('#donateCheckout').isDisabled(), true);
          const statusText = await page.locator('#paymentStatus').innerText();
          assert.ok(statusText.length > 15, `${language} checkout state must be explicit`);
          assert.doesNotMatch(statusText, /prepar|vorbere|准备中|en préparation|προετοιμά|у припреми|w przygotowaniu|يجري إعداد|準備中|준비 중/i);
          for (const selector of ['.brand', '#langSelect', '.header-actions a', '#donateCheckout']) {
            const box = await page.locator(selector).boundingBox();
            assert.ok(box && box.x >= -1 && box.x + box.width <= width + 1, `${language} ${selector} extends beyond viewport: ${JSON.stringify(box)}`);
          }
          const overflow = await page.evaluate(() => ({ width:document.documentElement.scrollWidth, elements:[...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => `${el.tagName}.${el.className}`) }));
          assert.ok(overflow.width <= width, `${language} page overflows horizontally: ${JSON.stringify(overflow)}`);
        }
        assert.deepEqual(errors, []);
      } finally { await page.close(); }
    });
  }
  await test('unconfigured checkout is disabled and exposes its explanation to assistive technology', async () => {
    const page = await browser.newPage({viewport:{width:375,height:800}, reducedMotion:'reduce'});
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/donate.html`);
      assert.equal(await page.locator('#langSelect').getAttribute('id'), await page.locator('label[for="langSelect"]').getAttribute('for'));
      assert.equal(await page.locator('#donateCheckout').isDisabled(), true);
      assert.equal(await page.locator('#donateCheckout').getAttribute('aria-describedby'), 'paymentStatus');
      assert.equal(await page.locator('#paymentStatus').getAttribute('role'), 'status');
      assert.equal(await page.locator('#paymentStatus').getAttribute('aria-live'), 'polite');
      assert.equal(await page.locator('#paymentStatus').isVisible(), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.className), 'brand');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'langSelect');
      const focus = await page.locator('#langSelect').evaluate(el => ({style:getComputedStyle(el).outlineStyle, width:getComputedStyle(el).outlineWidth}));
      assert.notEqual(focus.style, 'none');
      assert.notEqual(focus.width, '0px');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.tagName), 'A');
      const url = page.url();
      assert.equal(await page.locator('#donateCheckout').isDisabled(), true);
      assert.equal(page.url(), url);
    } finally { await page.close(); }
  });
  await test('all 18 donation locales disclose unavailable checkout and keep payment disabled', async () => {
    const page = await browser.newPage({reducedMotion:'reduce'});
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/donate.html`);
      for (const language of ['bg', 'en', 'de', 'ru', 'zh-CN', 'fr', 'es', 'it', 'pt', 'tr', 'ro', 'el', 'sr', 'uk', 'pl', 'ar', 'ja', 'ko']) {
        await page.locator('#langSelect').selectOption(language);
        const statusText = await page.locator('#paymentStatus').innerText();
        assert.equal(await page.locator('html').getAttribute('lang'), language);
        assert.equal(await page.locator('#donateCheckout').isDisabled(), true);
        assert.ok(statusText.length > 15, `${language} must explain why checkout is unavailable`);
        assert.doesNotMatch(statusText, /prepar|vorbere|准备中|en préparation|προετοιμά|у припреми|w przygotowaniu|يجري إعداد|準備中|준비 중/i);
      }
    } finally { await page.close(); }
  });
  await test('malicious configured URL remains unavailable and cannot navigate', async () => {
    const page = await browser.newPage({reducedMotion:'reduce'});
    await page.route('**/payment-config.js', route => route.fulfill({contentType:'application/javascript', body:'window.AURORA_PAYMENT_LINK = "https://buymeacoffee.com.attacker.example/fake";'}));
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/donate.html`);
      assert.equal(await page.locator('#donateCheckout').isDisabled(), true);
      assert.equal(await page.locator('#paymentStatus').isVisible(), true);
      assert.match(await page.locator('#paymentStatus').innerText(), /не са налични/i);
    } finally { await page.close(); }
  });
  await test('a future valid creator URL enables checkout and navigates only to that URL', async () => {
    const page = await browser.newPage({reducedMotion:'reduce'});
    await page.route('**/payment-config.js', route => route.fulfill({contentType:'application/javascript', body:'window.AURORA_PAYMENT_LINK = "https://buymeacoffee.com/test-creator";'}));
    await page.route('https://buymeacoffee.com/test-creator', route => route.fulfill({contentType:'text/html', body:'<!doctype html><title>Intercepted test destination</title>'}));
    try {
      await page.goto(`http://127.0.0.1:${server.address().port}/donate.html`);
      assert.equal(await page.locator('#donateCheckout').isEnabled(), true);
      assert.equal(await page.locator('#paymentStatus').isVisible(), false);
      await page.locator('#donateCheckout').click();
      await page.waitForURL('https://buymeacoffee.com/test-creator');
      assert.equal(page.url(), 'https://buymeacoffee.com/test-creator');
      assert.equal(await page.title(), 'Intercepted test destination');
    } finally { await page.close(); }
  });
  await test('language persists across reload and browser history', async () => {
    const page = await browser.newPage({reducedMotion:'reduce'});
    try {
      const base = `http://127.0.0.1:${server.address().port}`;
      await page.goto(`${base}/donate.html`);
      await page.locator('#langSelect').selectOption('en');
      await page.reload();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      await page.locator('.header-actions a').click();
      await page.goBack();
      assert.equal(await page.locator('#langSelect').inputValue(), 'en');
      assert.equal(await page.evaluate(() => localStorage.getItem('aurora-lang')), 'en');
    } finally { await page.close(); }
  });
} finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
