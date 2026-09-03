import { describe, expect, it } from 'vitest';

import { renderLessonVideo, type RenderOptions } from '@/server/lesson-video-renderer';

const options: RenderOptions = {
  courseName: 'Safety Fundamentals',
  moduleName: 'Introduction',
  moduleNumber: 1,
  lessonNumber: 1,
  instructorName: 'Elevate Instructor',
  instructorTitle: 'Instructor',
  instructorImagePath: '/tmp/instructor.png',
};

describe('lesson video renderer boundaries', () => {
  it('rejects an empty slide collection before starting FFmpeg', async () => {
    await expect(
      renderLessonVideo([], '/tmp/audio.mp3', '/tmp/output.mp4', options),
    ).rejects.toThrow('requires at least one slide');
  });
});
