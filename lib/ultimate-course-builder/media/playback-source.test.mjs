import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMediaUrl, renderPlaybackUrl } from './playback-source.mjs';
test('authenticated endpoint does not require an MP4 suffix', () => {
  assert.equal(renderPlaybackUrl({playbackUrl:'/api/courses/course/lessons/lesson/playback'}), '/api/courses/course/lessons/lesson/playback');
  assert.equal(renderPlaybackUrl({playbackUrl:'https://app.elevateforhumanity.org/api/courses/course/lessons/lesson/playback'}), 'https://app.elevateforhumanity.org/api/courses/course/lessons/lesson/playback');
});
test('worker inspects underlying media while learners use a protected endpoint', () => {
  const render = {videoUrl:'https://media.example/source', playbackUrl:'/api/courses/course/lessons/lesson/playback'};
  assert.equal(renderMediaUrl(render), render.videoUrl);
  assert.equal(renderPlaybackUrl(render), render.playbackUrl);
  assert.equal(renderMediaUrl({playbackUrl:render.playbackUrl}), null);
  assert.equal(renderMediaUrl({mediaUrl:'https://media.example/private-signed-source', ...render}), 'https://media.example/private-signed-source');
});
test('rejects unsafe and local delivery references, preserves HTTPS assets', () => {
  for (const url of ['javascript:alert(1)', 'http://host/video.mp4', '/tmp/render.mp4', '//host/video.mp4']) assert.equal(renderPlaybackUrl({playbackUrl:url}), null);
  assert.equal(renderPlaybackUrl({videoUrl:'https://media.example/immutable.mp4'}), 'https://media.example/immutable.mp4');
});
