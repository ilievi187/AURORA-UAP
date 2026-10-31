import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const LOCALES=['bg','en','de','ru','zh-CN','fr','es','it','pt','tr','ro','el','sr','uk','pl','ar','ja','ko'];

test('subpage-i18n.js and localized route scripts parse cleanly and cover all 18 locales',()=>{
  for(const file of ['subpage-i18n.js','news.js','home-news.js','countries.js','country.js','dossier.js','report.js','media.js']){
    const source=read(file);
    assert.doesNotThrow(()=>new Script(source,{filename:file}),file+' syntax');
  }
  const subpage=read('subpage-i18n.js');
  const homeNews=read('home-news.js');
  const countries=read('countries.js');
  const country=read('country.js');
  const media=read('media.js');
  for(const locale of LOCALES){
    assert.ok(subpage.includes('"'+locale+'"'),`subpage-i18n.js missing ${locale}`);
    assert.ok(homeNews.includes('"'+locale+'"'),`home-news.js missing ${locale}`);
    assert.ok(countries.includes(locale+':')||countries.includes('"'+locale+'"'),`countries.js missing ${locale}`);
    assert.ok(country.includes(locale+':')||country.includes('"'+locale+'"'),`country.js missing ${locale}`);
    assert.ok(media.includes(locale+':')||media.includes('"'+locale+'"'),`media.js missing ${locale}`);
  }
});

test('all subpage templates load subpage-i18n.js and style .page-language for responsive headers',()=>{
  for(const htmlFile of ['news.html','countries.html','country.html','dossier.html','report.html','media.html']){
    assert.match(read(htmlFile),/src="\/subpage-i18n\.js"/,`${htmlFile} should include /subpage-i18n.js`);
  }
  for(const cssFile of ['live-tools.css','countries.css','country.css','dossier.css','report.css']){
    assert.match(read(cssFile),/\.page-language/,`${cssFile} should style .page-language`);
  }
});
