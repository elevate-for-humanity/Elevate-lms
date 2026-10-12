import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPlaybackUrl } from './playback-source.mjs';
test('authenticated endpoint does not require an MP4 suffix', () => {
  assert.equal(renderPlaybackUrl({playbackUrl:'/api/courses/course/lessons/lesson/playback'}), '/api/courses/course/lessons/lesson/playback');
  assert.equal(renderPlaybackUrl({playbackUrl:'https://app.elevateforhumanity.org/api/courses/course/lessons/lesson/playback'}), 'https://app.elevateforhumanity.org/api/courses/course/lessons/lesson/playback');
});
test('rejects unsafe and local delivery references, preserves HTTPS assets', () => {
  for (const url of ['javascript:alert(1)', 'http://host/video.mp4', '/tmp/render.mp4', '//host/video.mp4']) assert.equal(renderPlaybackUrl({playbackUrl:url}), null);
  assert.equal(renderPlaybackUrl({videoUrl:'https://media.example/immutable.mp4'}), 'https://media.example/immutable.mp4');
});
