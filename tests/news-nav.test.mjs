import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const news = readFileSync(new URL('../news.html', import.meta.url), 'utf8');

test('the primary desktop and mobile navigation expose the news archive', () => {
  for (const [start, end] of [
    ['<nav class="desktop-nav"', '</nav>'],
    ['<nav class="mobile-nav"', '</nav>'],
  ]) {
    const left = html.indexOf(start);
    assert.ok(left >= 0, start + ' exists');
    const right = html.indexOf(end, left);
    const section = html.slice(left, right);
    assert.match(section, /href="\/news\.html" data-i18n="navNews"/);
  }
});

test('the footer also points to the same canonical news page', () => {
  assert.match(html, /<footer class="footer">[\s\S]*href="\/news\.html" data-i18n="navNews"/);
});

test('news page remains independently navigable and loads its client', () => {
  assert.match(news, /src="\/news\.js"/);
  assert.match(news, /id="newsList"/);
});

test('news menu has an explicit nonempty label for every locale', () => {
  const codes = ['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko'];
  const block = script.match(/const navNewsLabels = \{([\s\S]*?)\n\};/);
  assert.ok(block, 'news locale map exists');
  for (const code of codes) {
    assert.ok(block[1].includes(JSON.stringify(code) + ': '), 'missing locale ' + code);
  }
  assert.equal((block[1].match(/: "/g)||[]).length, 18);
});
