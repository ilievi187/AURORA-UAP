import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('public pages are crawlable while private routes are not advertised',()=>{
 const robots=read('robots.txt');
 assert.match(robots,/User-agent:\s*\*/);
 assert.doesNotMatch(robots,/^Disallow:\s*\/\s*$/m);
 assert.match(robots,/^Allow:\s*\/$/m);
 for(const route of ['/api/','/moderation','/news-editor']) assert.ok(robots.includes('Disallow: '+route));
 assert.match(robots,/^Sitemap:\s*https:\/\/aurorauap\.org\/sitemap\.xml/m);
});
test('real XML sitemap lists only indexable public routes and country directories',()=>{
 const xml=read('sitemap.xml');
 assert.match(xml,/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
 assert.match(xml,/<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
 assert.ok(urls.length>=30);
 assert.equal(new Set(urls).size,urls.length);
 assert.ok(urls.includes('https://aurorauap.org/'));
 for(const route of ['/archive','/countries','/countries/US','/countries/FR','/news','/media','/sources','/privacy']) assert.ok(urls.includes('https://aurorauap.org'+route),route);
 for(const url of urls){
   assert.match(url,/^https:\/\/aurorauap\.org\/(?:|archive|countries(?:\/[A-Z]{2})?|news|media|sources|privacy)$/);
   assert.doesNotMatch(url,/\/api\/|\/report|\/donate|\/moderation|\/news-editor|\/archive\//);
 }
 assert.match(read('archive.html'),/<link rel="canonical" href="https:\/\/aurorauap\.org\/archive">/);
 assert.match(read('sources.html'),/<link rel="canonical" href="https:\/\/aurorauap\.org\/sources">/);
});
