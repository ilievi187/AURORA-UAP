import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const publicTitles = {
 'archive.html': 'AURORA UAP | World Case Archive',
 'donate.html': 'AURORA UAP | Support the Project',
 'media.html': 'AURORA UAP | Media Archive',
 'news.html': 'AURORA UAP | World News',
 'sources.html': 'AURORA UAP | International Sources'
};
test('public English-only launch has readable English browser titles on every target page',()=>{
 for(const [file,title] of Object.entries(publicTitles)){
  const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const titles=[...html.matchAll(/<title[^>]*>(.*?)<\/title>/gsi)];
  assert.equal(titles.length,1,file+' must have exactly one title element');
  assert.equal(titles[0][1],title,file+' title');
  assert.doesNotMatch(title,/\p{Script=Cyrillic}/u,file+' must not show a legacy Cyrillic tab title');
 }
});
