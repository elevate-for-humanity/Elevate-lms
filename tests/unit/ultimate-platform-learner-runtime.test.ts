import { describe, expect, it } from 'vitest';

import { UltimatePlatformLearnerRuntime } from '@/lib/ultimate-course-builder/adapters/platform-learner-runtime';

function query(result: { data: unknown; error: unknown }) {
  const chain: Record<string, any> = {};
  for (const method of ['select', 'eq', 'order', 'limit']) chain[method] = () => chain;
  chain.maybeSingle = async () => result;
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

describe('UltimatePlatformLearnerRuntime', () => {
  it('requires a real lesson, playable film, and both production progress stores', async () => {
    const results = [
      { data: { id: 'lesson-1' }, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ];
    const db = { from: () => query(results.shift()!) } as any;
    const runtime = new UltimatePlatformLearnerRuntime(db);

    const evidence = await runtime.verify({
      courseId: 'course-1',
      lessonId: 'lesson-1',
      videoUrl: 'https://media.example.org/lesson.mp4',
    });

    expect(evidence).toMatchObject({
      progress_save: true,
      resume: true,
      completion: true,
      evidence: {
        courseLesson: true,
        playableFilm: true,
        videoProgressStore: true,
        lessonCompletionStore: true,
      },
    });
  });

  it('fails closed when a production progress store cannot be queried', async () => {
    const results = [
      { data: { id: 'lesson-1' }, error: null },
      { data: null, error: { message: 'missing learner_video_progress' } },
      { data: [], error: null },
    ];
    const db = { from: () => query(results.shift()!) } as any;
    const runtime = new UltimatePlatformLearnerRuntime(db);

    const evidence = await runtime.verify({
      courseId: 'course-1',
      lessonId: 'lesson-1',
      videoUrl: 'https://media.example.org/lesson.mp4',
    });

    expect(evidence.progress_save).toBe(false);
    expect(evidence.resume).toBe(false);
    expect(evidence.completion).toBe(false);
    expect(evidence.evidence.videoProgressStore).toBe(false);
  });

  it('verifies a staged lesson build when the competency uses a stable non-UUID key', async () => {
    const results = [
      { data: { id: 'lesson-build-1' }, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ];
    const db = { from: () => query(results.shift()!) } as any;
    const runtime = new UltimatePlatformLearnerRuntime(db);

    const evidence = await runtime.verify({
      courseId: 'course-1',
      lessonId: 'barber-a',
      videoUrl: 'https://media.example.org/lesson.mp4',
    });

    expect(evidence).toMatchObject({
      progress_save: true,
      resume: true,
      completion: true,
      evidence: {
        courseLesson: true,
        stagedLesson: true,
        resolvedLessonId: null,
        videoProgressStore: true,
        lessonCompletionStore: true,
      },
    });
  });
});
