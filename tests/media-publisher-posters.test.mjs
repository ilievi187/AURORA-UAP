import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedPublisherPoster,providerVideoId,extractPublisherPoster,validatePosterData,expectedVideos} from '../scripts/build-source-video-posters.mjs';
import {resolveDvidsSourcePoster,resolveVideoPoster,resolveMediaPlayback} from '../media-player.js';
const read=file=>JSON.parse(readFileSync(new URL('../'+file,import.meta.url),'utf8'));
const cases=read('data/cases.json').cases;
const manifest=read('data/media-source-posters.json');
const dvids=cases.flatMap(c=>(c.media||[]).filter(m=>m.type==='video'&&providerVideoId(m.url)).map(m=>({caseId:c.id,media:m})));
test('all 13 sourced DVIDS videos have individually matched original publisher frames and no fabricated images',()=>{
 assert.equal(dvids.length,13);
 assert.deepEqual(validatePosterData(manifest,cases),{total:13,withSourceImage:13});
 assert.equal(expectedVideos(cases).size,13);
 for(const {media} of dvids){
  const id=providerVideoId(media.url);
  const poster=resolveDvidsSourcePoster(media,manifest);
  assert.equal(poster,manifest.items.find(v=>v.source_url===media.url)?.poster_url);
  assert.equal(approvedPublisherPoster(poster,media.url),true);
  assert.ok(poster.includes('/'+id+'/'),id);
  assert.equal(resolveVideoPoster(media),null,'no forged image was attached to media rights record');
  const playback=resolveMediaPlayback(media);
  assert.equal(playback.kind,'iframe');
  assert.match(playback.embedUrl,/www\.dvidshub\.net\/video\/embed/);
 }
});
test('publisher OG metadata is extracted only for exact original video ID and approved publisher CDN',()=>{
 const url=dvids[0].media.url;
 const image=manifest.items.find(x=>x.source_url===url).poster_url;
 const html=`<html><meta property="og:image" content="https://evil.example/fake.jpg"><meta name="twitter:image" content="${image}"></html>`;
 assert.equal(extractPublisherPoster(html,url),image);
 const bad=html.replaceAll(image,'https://d1ldvf68ux039x.cloudfront.net/thumbs/frames/video/2609/999999/DOD_111985782.0000001/486x274_q95.jpg');
 assert.throws(()=>extractPublisherPoster(bad,url),/No source-approved/);
 assert.equal(providerVideoId('https://www.dvidshub.net/video/123456'), '123456');
 for(const input of ['http://www.dvidshub.net/video/123456','https://evil.example/video/123456','https://www.dvidshub.net/video/123456?redirect=1#fragment','javascript:alert(1)'])
  assert.equal(providerVideoId(input),null,input);
});
test('manifest cannot attach an unrelated still, unapproved hostname, or image with credentials',()=>{
 const valid=dvids[0].media;
 for(const fake of [
  {source_url:valid.url,video_id:'123456',poster_url:manifest.items[0].poster_url},
  {source_url:valid.url,video_id:providerVideoId(valid.url),poster_url:'https://evil.example/picture.jpg'},
  {source_url:valid.url,video_id:providerVideoId(valid.url),poster_url:'https://user:secret@d1ldvf68ux039x.cloudfront.net/thumbs/frames/video/2609/1023397/DOD_111985782.0000001/486x274_q95.jpg'}]){
   const mutated={...manifest,items:manifest.items.map(x=>x.source_url===valid.url?fake:x)};
   assert.throws(()=>validatePosterData(mutated,cases),/Invalid/);
   assert.equal(resolveDvidsSourcePoster(valid,mutated),null);
  }
  assert.equal(resolveDvidsSourcePoster({...valid,url:'https://www.youtube.com/watch?v=aqz-KE-bpKQ'},manifest),null);
  assert.equal(resolveDvidsSourcePoster(valid,{provider:'other',schema_version:1,items:manifest.items}),null);
});
test('video source poster data remains independent of source license and recording link',()=>{
 assert.ok(!JSON.stringify(manifest).includes('hosting_permission'));
 assert.ok(!JSON.stringify(manifest).includes('media_url'));
 assert.equal(resolveVideoPoster({type:'video',url:'https://evil.example/vid.mp4'}),null);
 assert.equal(resolveMediaPlayback({type:'video',url:'https://www.dvidshub.net/video/960331/al-taqaddum-object'}).kind,'iframe');
});
