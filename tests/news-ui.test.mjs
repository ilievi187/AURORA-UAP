import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
test('news-tip moderation copy is complete for all supported locales',()=>{
 const sandbox={window:{}};
 runInNewContext(read('news-tips-i18n.js'),sandbox);
 const copy=sandbox.window.AURORA_NEWS_TIP_COPY;
 const locales=['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko'];
 const keys=['heading','intro','loading','disabled','ready','title','url','note','consent','submit','sending','sent','failed','turnstile'];
 assert.deepEqual(Object.keys(copy).sort(),locales.sort());
 for(const locale of locales)for(const key of keys)assert.ok(copy[locale][key]?.trim(),locale+' missing '+key);
});

test('news source-type and pagination copy is complete for every supported locale',()=>{
 const sandbox={window:{}};
 runInNewContext(read('news-ui-i18n.js'),sandbox);
 runInNewContext(read('news-article-i18n.js'),sandbox);
 const copy=sandbox.window.AURORA_NEWS_UI;
 const locales=['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko'];
 const roles=['all','official-institution','public-broadcaster','international-desk','specialist-press','news-search','other','editorial'];
 assert.deepEqual(Object.keys(copy).sort(),locales.sort());
 for(const locale of locales){
  assert.ok(copy[locale].sourceType&&copy[locale].previous&&copy[locale].next&&copy[locale].page,locale+' has pagination and filter labels');
  assert.ok(copy[locale].originalBody&&copy[locale].readArticle&&copy[locale].auroraPublished&&copy[locale].videoSource,locale+' has article-language and source labels');
  for(const role of roles)assert.ok(copy[locale].roles[role],locale+' has source type '+role);
 }
});
