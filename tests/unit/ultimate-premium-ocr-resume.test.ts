import { describe, expect, it, vi } from 'vitest';
import { UltimateSupabasePersistence } from '@/lib/ultimate-course-builder/persistence/supabase-persistence';
import { contractHash, ULTIMATE_LESSON_CONTRACT_VERSION } from '@/lib/ultimate-course-builder/core/lesson-contract';
import { runUltimateCourse } from '@/lib/ultimate-course-builder/core/full-course-runner';
import { ULTIMATE_BUILD_STEPS } from '@/lib/ultimate-course-builder/core/types';
import { fixtureCheckpoint } from '../fixtures/ultimate-contract';

function certified(payload: any) {
  return { ...payload, contractEvidence: {
    version: ULTIMATE_LESSON_CONTRACT_VERSION, passed: true,
    outputHash: contractHash(payload), inputHash: 'runner-rechecks-inputs',
  } };
}

async function checkpoint(code = 'MEDIA_TEXT_UNREADABLE', tampered = false, presentationVersion = 'approved-moment-cues-v2') {
  const previous = certified({ scenes: { shots: [{ sceneId: 'scene', assetId: 'photo', loop: false }] } });
  if (tampered) previous.scenes.shots[0].assetId = 'changed';
  const film = certified({ render: { layoutVersion: 4, presentationVersion, videoUrl: 'saved-film.mp4' } });
  const repair = { directive: { failedStep: 'finished_media_qa', target: 'scene_construction', previous, requirements: [{ code }] } };
  const db: any = { from(table: string) { return { select() { return { eq() {
    return table === 'ultimate_lesson_builds'
      ? { single: async () => ({ data: { artifacts: { __repairState: repair }, findings: [] }, error: null }) }
      : Promise.resolve({ data: [{ step: 'lesson_film_render', state: 'passed', artifacts: film }], error: null });
  } }; } }; } };
  return new UltimateSupabasePersistence(db).loadLessonCheckpoint({ lessonBuildId: 'lesson' });
}

describe('legacy premium OCR checkpoint recovery', () => {
  it('restores the certified producer and saved film for fresh independent QA', async () => {
    const result = await checkpoint();
    expect(result.passedSteps).toContain('scene_construction');
    expect(result.passedSteps).toContain('lesson_film_render');
    expect(result.passedSteps).not.toContain('finished_media_qa');
    expect(result.recoveredSteps).toEqual(['scene_construction']);
    expect(result.artifacts.__repairState).toBeUndefined();
    expect((result.artifacts.lesson_film_render as any).render.videoUrl).toBe('saved-film.mp4');
  });

  it.each(['MEDIA_TEXT_UNREADABLE_AFTER_REGION', 'MEDIA_TEACHING_STATE_NOT_VISIBLE', 'MEDIA_LICENSE_REQUIRED'])('retains repair for %s', async code => {
    const result = await checkpoint(code);
    expect(result.passedSteps).not.toContain('scene_construction');
    expect(result.recoveredSteps).toEqual([]);
    expect(result.artifacts.__repairState).toBeDefined();
  });

  it('rejects a tampered producer certificate', async () => {
    const result = await checkpoint('MEDIA_TEXT_UNREADABLE', true);
    expect(result.passedSteps).not.toContain('scene_construction');
    expect(result.artifacts.__repairState).toBeDefined();
  });

  it('does not apply premium recovery to another presentation', async () => {
    const result = await checkpoint('MEDIA_TEXT_UNREADABLE', false, 'other');
    expect(result.passedSteps).not.toContain('scene_construction');
  });

  it.each([true, false])('reconciles the checkpoint table only with complete acceptance: %s', async accepted => {
    const profile: any = { id: 'profile', title: 'Course', competencies: [{ id: 'intro', type: 'knowledge' }] };
    const artifacts = fixtureCheckpoint(profile, ULTIMATE_BUILD_STEPS.length);
    if (!accepted) artifacts.finished_media_qa.mediaQA.pass = false;
    const recordStep = vi.fn(async () => {});
    const persistence: any = {
      updateBuild: async () => {}, createLesson: async () => ({ id: 'lesson' }),
      loadLessonCheckpoint: async () => ({ artifacts: {}, passedSteps: [], findings: [], recoveredSteps: ['scene_construction'] }),
      recordStep, finishLesson: async () => {},
    };
    const result = await runUltimateCourse({ buildId: 'build', courseId: 'course', profile },
      () => ({ run: async () => ({ artifacts, findings: [] }) }) as any, persistence);
    expect(result.completed).toBe(accepted);
    expect(recordStep).toHaveBeenCalledTimes(accepted ? 1 : 0);
    if (accepted) expect(recordStep).toHaveBeenCalledWith(expect.objectContaining({
      lessonBuildId: 'lesson', step: 'scene_construction', state: 'passed', artifacts: artifacts.scene_construction,
    }));
  });
});
