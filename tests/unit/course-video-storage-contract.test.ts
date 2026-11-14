import { describe, expect, it } from 'vitest';
import { validateStepOutput } from '@/lib/ultimate-course-builder/core/lesson-contract';

const render = {
  mediaUrl: 'https://elevate-course-media.s3.us-east-005.backblazeb2.com/course-videos/film.mp4',
  playbackUrl: '/api/courses/course/lessons/lesson/playback',
  duration: 60,
  captionsUrl: 'https://external-media.example/captions.vtt',
  transcriptUrl: 'https://external-media.example/transcript.txt',
};
describe('external video storage lesson contract', () => {
  it('accepts external media with an authenticated learner delivery route', () => {
    expect(validateStepOutput('lesson_film_render', { render })).toEqual([]);
  });
  it.each([
    'https://project.supabase.co/storage/v1/object/public/course-videos/film.mp4',
    'https://project.storage.supabase.co/course_videos/film.mp4',
  ])('rejects a Supabase video source: %s', (mediaUrl) => {
    expect(validateStepOutput('lesson_film_render', { render: { ...render, mediaUrl } }))
      .toContain('VIDEO_EXTERNAL_STORAGE_REQUIRED');
  });
  it('continues requiring captions and transcript delivery assets', () => {
    expect(validateStepOutput('lesson_film_render', { render: { ...render, captionsUrl: '' } }))
      .toContain('RENDER_DELIVERY_ASSETS_REQUIRED');
    expect(validateStepOutput('lesson_film_render', { render: { ...render, transcriptUrl: '' } }))
      .toContain('RENDER_DELIVERY_ASSETS_REQUIRED');
  });
});
