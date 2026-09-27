import { describe, expect, it, vi } from 'vitest';
import { UltimateBuildRunner } from '../../lib/ultimate-course-builder/core/build-runner';
import { ULTIMATE_BUILD_STEPS } from '../../lib/ultimate-course-builder/core/types';
import { UltimatePlatformCredential } from '../../lib/ultimate-course-builder/adapters/platform-credential';
import { UltimatePlatformRenderer } from '../../lib/ultimate-course-builder/adapters/platform-renderer';
import { UltimateSupabasePersistence } from '../../lib/ultimate-course-builder/persistence/supabase-persistence';

describe('Ultimate builder recovery', () => {
  it('stops at a failed prerequisite instead of fabricating downstream artifacts', async () => {
    const called: string[] = [];
    const handlers = Object.fromEntries(
      ULTIMATE_BUILD_STEPS.map((step) => [
        step,
        async () => {
          called.push(step);
          if (step === 'learning_objectives') throw new Error('owned inference unavailable');
          return { artifacts: { step } };
        },
      ]),
    );
    const ctx: any = {
      buildId: 'build:competency',
      courseId: 'course',
      profile: { competencies: [] },
      artifacts: {},
      findings: [],
    };
    await new UltimateBuildRunner(handlers).run(ctx);
    expect(called).toEqual(ULTIMATE_BUILD_STEPS.slice(0, 2));
    expect(ctx.findings).toMatchObject([{ step: 'learning_objectives', severity: 'error' }]);
  });

  it('does not compare a text credential profile against the UUID column', async () => {
    const or = vi.fn().mockReturnThis();
    const client: any = {
      from: () => ({
        select: () => ({
          or,
          limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }),
    };
    await new UltimatePlatformCredential(client).load('barber-0030cb-2025-07-10');
    expect(or.mock.calls[0][0]).not.toContain('id.eq.');
  });

  it('requires a multi-scene storyboard before rendering', async () => {
    await expect(
      new UltimatePlatformRenderer().render({
        lessonId: 'barber-a',
        artifacts: { storyboard: { storyboard: { scenes: {} } } },
      }),
    ).rejects.toThrow('ULTIMATE_RENDER_MULTISCENE_STORYBOARD_REQUIRED');
  });

  it('restores saved step artifacts when resuming a partially built lesson', async () => {
    const from = (table: string) => ({
      select: () => ({
        eq: () =>
          table === 'ultimate_lesson_builds'
            ? { single: async () => ({ data: { artifacts: {}, findings: [] }, error: null }) }
            : Promise.resolve({
                data: [
                  {
                    step: 'learning_objectives',
                    state: 'passed',
                    artifacts: { objectives: ['cutting'] },
                  },
                ],
                error: null,
              }),
      }),
    });
    const checkpoint = await new UltimateSupabasePersistence({ from } as any).loadLessonCheckpoint({
      lessonBuildId: 'lesson',
    });
    expect(checkpoint.passedSteps).toEqual(['learning_objectives']);
    expect(checkpoint.artifacts.learning_objectives).toEqual({ objectives: ['cutting'] });
  });
});
