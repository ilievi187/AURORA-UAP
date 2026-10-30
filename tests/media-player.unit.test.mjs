import test from 'node:test';
import assert from 'node:assert/strict';

const loaded = await import('../media-player.js').catch(error => ({ importError: error }));
const resolveMediaPlayback = loaded.resolveMediaPlayback;

test('YouTube watch links resolve to a privacy-enhanced official embed without autoplay', () => {
  assert.equal(
    typeof resolveMediaPlayback,
    'function',
    `media-player.js must export resolveMediaPlayback${loaded.importError ? ` (${loaded.importError.message})` : ''}`
  );
  assert.deepEqual(
    resolveMediaPlayback({ type: 'video', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' }),
    {
      kind: 'iframe',
      provider: 'youtube',
      embedUrl: 'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?rel=0&playsinline=1',
      originalUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'
    }
  );
});

test('Vimeo public links resolve to the official privacy-conscious Vimeo player', () => {
  assert.deepEqual(
    resolveMediaPlayback({ type: 'video', url: 'https://vimeo.com/76979871' }),
    {
      kind: 'iframe',
      provider: 'vimeo',
      embedUrl: 'https://player.vimeo.com/video/76979871?dnt=1',
      originalUrl: 'https://vimeo.com/76979871'
    }
  );
});

test('direct HTML5 playback requires verified explicit hosting permission and a current rights record', () => {
  const record = {
    type: 'video',
    url: 'https://publisher.example/story',
    playback: {
      mode: 'html5',
      url: 'https://cdn.publisher.example/footage.mp4',
      mime_type: 'video/mp4',
      rights_status: 'verified',
      hosting_permission: true,
      authorization_type: 'public_domain',
      rights_checked_at: '2026-10-29',
      rights_evidence_ref: 'permission-record-123'
    }
  };
  assert.deepEqual(resolveMediaPlayback(record), {
    kind: 'html5',
    provider: 'direct',
    mediaUrl: 'https://cdn.publisher.example/footage.mp4',
    mimeType: 'video/mp4',
    originalUrl: 'https://publisher.example/story'
  });
  assert.equal(resolveMediaPlayback({ ...record, playback: { ...record.playback, hosting_permission: false } }), null);
  assert.equal(resolveMediaPlayback({ ...record, playback: { ...record.playback, rights_status: 'pending' } }), null);
  assert.equal(resolveMediaPlayback({ ...record, playback: { ...record.playback, rights_evidence_ref: '' } }), null);
  assert.equal(resolveMediaPlayback({ ...record, playback: { ...record.playback, rights_checked_at: 'not-a-date' } }), null);
  assert.equal(resolveMediaPlayback({ ...record, playback: { ...record.playback, rights_checked_at: '2999-01-01' } }), null);
  assert.equal(resolveMediaPlayback({ ...record, playback: { ...record.playback, url: 'https://cdn.publisher.example/footage.webm' } }), null);
});

test('lookalike domains, insecure URLs and non-video items never become embeds', () => {
  const unsafe = [
    'http://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://youtube.com.evil.example/watch?v=aqz-KE-bpKQ',
    'https://www.youtube.com@evil.example/watch?v=aqz-KE-bpKQ',
    'https://vimeo.com.evil.example/76979871',
    'https://www.youtube.com/watch?v=bad'
  ];
  for (const url of unsafe) assert.equal(resolveMediaPlayback({ type: 'video', url }), null, url);
  assert.equal(resolveMediaPlayback({ type: 'document', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' }), null);
});
