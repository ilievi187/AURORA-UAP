import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveMediaPlayback } from '../media-player.js';

const source = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const cases = JSON.parse(source('data/cases.json')).cases;
const videos = cases.flatMap(item => (item.media || []).filter(media => media.type === 'video').map(media => ({caseId: item.id, media})));

test('all eight current video records are represented in the in-site media experience', () => {
  assert.equal(videos.length, 8, 'update catalog audit when official archive grows');
  const playables = videos.filter(({media}) => resolveMediaPlayback(media));
  assert.equal(playables.length, 4, 'only verified/official playable sources; others receive honest modal fallback');
  for (const {media} of playables) assert.ok(['iframe','html5'].includes(resolveMediaPlayback(media).kind));
});

test('DVIDS Al Taqaddum original recording uses official iframe without leaving AURORA', () => {
  const media = videos.find(x => x.caseId === 'al-taqaddum-2017')?.media;
  assert.ok(media);
  assert.deepEqual(resolveMediaPlayback(media), {
    kind: 'iframe',
    provider: 'dvids',
    embedUrl: 'https://www.dvidshub.net/video/embed/960331',
    originalUrl: 'https://www.dvidshub.net/video/960331/al-taqaddum-object'
  });
});

test('DVIDS embed cannot be tricked by lookalike or unsafe links', () => {
  for (const url of [
    'http://www.dvidshub.net/video/960331/al-taqaddum-object',
    'https://dvidshub.net.evil.example/video/960331/al-taqaddum-object',
    'https://www.dvidshub.net/video/960331/../../admin',
    'https://www.dvidshub.net/video/not-an-id/anything'
  ]) assert.equal(resolveMediaPlayback({type:'video',url}), null, url);
});

test('all video cards, thumbnails and dossier and atlas buttons launch the shared in-site modal', () => {
  const mediaJs = source('media.js');
  const dossierJs = source('dossier.js');
  const worldJs = source('world-atlas.js');
  const player = source('media-player.js');
  const countryJs = source('country.js');
  for (const script of [mediaJs,dossierJs,worldJs,countryJs]) {
    assert.match(script, /aurora:play-media/);
  }
  assert.match(mediaJs, /links\.append\(play,original,dossier\)/, 'play is primary, publisher link remains available');
  assert.match(mediaJs, /media-entry-image-play/, 'thumbnail is clickable inside site');
  assert.match(player, /kind: 'unavailable'/);
  assert.match(player, /No verified embeddable player/);
  assert.match(player, /windowRef\.addEventListener\('aurora:play-media'/);
});

test('shared in-site player is loaded wherever records with video can appear', () => {
  for (const path of ['media.html','dossier.html','index.html','country.html']) {
    assert.match(source(path), /<script type="module" src="\/media-player\.js"><\/script>/, path);
    assert.match(source(path), /href="\/media-player\.css"/, path);
  }
});

test('all originals stay available as attribution, not as an automatic redirect', () => {
  assert.match(source('media-player.js'), /originalLink\.href = playback\.originalUrl/);
  assert.doesNotMatch(source('media.js'), /window\.open\(/);
  assert.doesNotMatch(source('dossier.js'), /window\.open\(/);
});
