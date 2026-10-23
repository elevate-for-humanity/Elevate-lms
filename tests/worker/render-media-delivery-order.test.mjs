import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

test('durable MP4 upload precedes captions and transcript so failed VTT cannot prevent video delivery', () => {
  const source = readFileSync(new URL('../../lib/video/remotion-render.ts', import.meta.url), 'utf8');
  const renderStart = source.indexOf('export async function renderStoryboardVideo(');
  const uploadMp4 = source.indexOf("const videoUrl = await uploadLessonFileFromDisk(paths.videoPath, input.lessonId, 'mp4'", renderStart);
  const uploadVtt = source.indexOf('const captionUrl = await uploadCourseVideosObject(', renderStart);
  const uploadTranscript = source.indexOf('const transcriptUrl = await uploadCourseVideosObject(', renderStart);
  assert.ok(renderStart >= 0 && uploadMp4 > renderStart, 'storyboard must upload MP4');
  assert.ok(uploadMp4 < uploadVtt && uploadVtt < uploadTranscript,
    'completed movie must reach durable storage before ancillary delivery');
});
