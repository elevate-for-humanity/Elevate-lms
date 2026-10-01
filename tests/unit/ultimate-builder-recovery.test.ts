import { fixtureArtifact } from '../fixtures/ultimate-contract';
import { describe, expect, it, vi } from 'vitest';
import { UltimateBuildRunner } from '../../lib/ultimate-course-builder/core/build-runner';
import { ULTIMATE_BUILD_STEPS } from '../../lib/ultimate-course-builder/core/types';
import { UltimatePlatformCredential } from '../../lib/ultimate-course-builder/adapters/platform-credential';
import {
  prepareUltimateStoryboardInput,
  refreshLicensedVisualUrls,
  requireResolvedVisualEvidence,
  UltimatePlatformRenderer,
} from '../../lib/ultimate-course-builder/adapters/platform-renderer';
import { UltimateSupabasePersistence } from '../../lib/ultimate-course-builder/persistence/supabase-persistence';
import { createProductionHandlers } from '../../lib/ultimate-course-builder/core/production-handlers';
import { evaluateUltimateLesson } from '../../lib/ultimate-course-builder/quality/lesson-quality';
import { auditTraceability } from '../../lib/ultimate-course-builder/release/traceability';

describe('Ultimate builder recovery', () => {
  it('does not approve a rendered lesson with no learning objectives or traceability rows', () => {
    const quality = evaluateUltimateLesson({
      distinctShots: 7,
      loopDetected: false,
      captionSync: true,
      narrationVisualAlignment: 1,
      naturalNarration: true,
      objectivesTaught: 0,
      objectivesTotal: 0,
      guidedPractice: true,
      independentPractice: true,
      assessmentCoverage: 1,
      remediation: true,
      learnerRunthrough: true,
    });
    expect(quality).toMatchObject({ pass: false, failures: ['LEARNING_OBJECTIVES_MISSING'] });
    expect(auditTraceability([])).toMatchObject({ pass: false, missingRows: true });
  });
  it('stops at a failed prerequisite instead of fabricating downstream artifacts', async () => {
    const called: string[] = [];
    const handlers = Object.fromEntries(
      ULTIMATE_BUILD_STEPS.map((step) => [
        step,
        async () => {
          called.push(step);
          if (step === 'learning_objectives') throw new Error('owned inference unavailable');
          return { artifacts: fixtureArtifact(step) };
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

  it('persists a failed quality result as failed and blocks downstream steps', async () => {
    const called: string[] = [];
    const persisted: Array<{ step: string; state: string; artifacts?: unknown }> = [];
    const handlers = Object.fromEntries(
      ULTIMATE_BUILD_STEPS.map((step) => [
        step,
        async () => {
          called.push(step);
          if (step === 'finished_media_qa') {
            return {
              passed: false,
              artifacts: { mediaQA: { pass: false, failures: ['INSUFFICIENT_DISTINCT_SHOTS'] } },
            };
          }
          return { artifacts: fixtureArtifact(step) };
        },
      ]),
    );
    const ctx: any = {
      buildId: 'build:competency',
      courseId: 'course',
      profile: { competencies: [] },
      artifacts: {},
      findings: [],
      persistStep: async (input: any) => persisted.push(input),
    };
    await new UltimateBuildRunner(handlers).run(ctx);
    expect(called.at(-1)).toBe('finished_media_qa');
    expect(called).not.toContain('credential_release');
    expect(persisted.at(-1)).toMatchObject({
      step: 'finished_media_qa',
      state: 'failed',
      artifacts: { mediaQA: { pass: false } },
    });
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

  it('rejects unversioned saved step passes when resuming a partially built lesson', async () => {
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
    expect(checkpoint.passedSteps).toEqual([]);
    expect(checkpoint.artifacts.learning_objectives).toBeUndefined();
  });
  it('rebuilds an old five-scene storyboard before retrying licensed media', async () => {
    const steps = ULTIMATE_BUILD_STEPS.slice(0, 8).map((step) => ({
      step,
      state: 'passed',
      artifacts:
        step === 'storyboard'
          ? {
              storyboard: {
                scenes: Array.from({ length: 5 }, (_, index) => ({ id: `scene-${index}` })),
              },
            }
          : {},
    }));
    const db = {
      from: (table: string) => ({
        select: () => ({
          eq: () =>
            table === 'ultimate_lesson_builds'
              ? { single: async () => ({ data: { artifacts: {}, findings: [] }, error: null }) }
              : Promise.resolve({ data: steps, error: null }),
        }),
      }),
    } as any;
    const checkpoint = await new UltimateSupabasePersistence(db).loadLessonCheckpoint({
      lessonBuildId: 'lesson-1',
    });
    expect(checkpoint.passedSteps).toEqual([]);
  });
  it('maps stored Envato media into unique render scenes without stock fallbacks', () => {
    const prepared = prepareUltimateStoryboardInput({
      lessonId: 'lesson-1',
      courseTitle: 'HVAC Fundamentals',
      artifacts: {
        storyboard: {
          storyboard: {
            scenes: Array.from({ length: 6 }, (_, index) => ({
              id: `s${index + 1}`,
              title: `Scene ${index + 1}`,
              teachingPoint: `Teaching point ${index + 1}`,
            })),
          },
        },
        visual_assignment: {
          media: {
            assignments: Array.from({ length: 6 }, (_, index) => ({
              sceneId: `s${index + 1}`,
              assetId: `asset-${index + 1}`,
            })),
            readyAssets: Array.from({ length: 6 }, (_, index) => ({
              id: `asset-${index + 1}`,
              lesson_id: 'lesson-1',
              public_url:
                index === 0
                  ? 'https://cdn.example.com/licensed/scene.jpg'
                  : `https://cdn.example.com/licensed/scene-${index + 1}.mp4`,
              mime_type: index === 0 ? 'image/jpeg' : 'video/mp4',
              entitlement_id: `entitlement-${index + 1}`,
              provider_item_id: `item-${index + 1}`,
            })),
            licensedSuggestions: [],
          },
        },
      },
    });
    const scenes = prepared.sceneData?.scenes as Record<string, unknown>[];
    expect(scenes[0]).toMatchObject({
      reference_image_url: 'https://cdn.example.com/licensed/scene.jpg',
      media_source: 'elevate-owned',
      resolved_provider: 'envato',
    });
    expect(scenes[1]).toMatchObject({
      source_video_url: 'https://cdn.example.com/licensed/scene-2.mp4',
      media_source: 'elevate-owned',
      resolved_provider: 'envato',
    });
    expect(
      new Set(scenes.map((scene) => scene.source_video_url ?? scene.reference_image_url)).size,
    ).toBe(6);
  });

  it('renews a checkpointed licensed video URL immediately before rendering', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/fresh.mp4' },
      error: null,
    });
    const input = {
      artifacts: {
        visual_assignment: {
          media: {
            readyAssets: [
              {
                id: 'asset-1',
                storage_path: 'licensed-library/envato/asset-1.mp4',
                public_url: 'https://storage.example.com/expired.mp4',
                entitlement_id: 'license-1',
              },
            ],
          },
        },
      },
    };
    const db = { storage: { from: vi.fn().mockReturnValue({ createSignedUrl }) } } as any;
    const refreshed = await refreshLicensedVisualUrls(input, db);
    expect(createSignedUrl).toHaveBeenCalledWith('licensed-library/envato/asset-1.mp4', 3600);
    expect(refreshed.artifacts.visual_assignment.media.readyAssets[0].public_url).toBe(
      'https://storage.example.com/fresh.mp4',
    );
    expect(input.artifacts.visual_assignment.media.readyAssets[0].public_url).toBe(
      'https://storage.example.com/expired.mp4',
    );
  });

  it('fails closed when a licensed video URL cannot be renewed', async () => {
    const db = {
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: null,
            error: new Error('storage unavailable'),
          }),
        }),
      },
    } as any;
    await expect(
      refreshLicensedVisualUrls(
        {
          artifacts: {
            visual_assignment: {
              media: {
                readyAssets: [{ id: 'asset-1', storage_path: 'licensed-library/asset-1.mp4' }],
              },
            },
          },
        },
        db,
      ),
    ).rejects.toThrow('ULTIMATE_LICENSED_VISUAL_URL_REFRESH_FAILED:asset-1');
  });

  it('rejects a rendered storyboard whose scenes do not contain real visual assets', () => {
    expect(() =>
      requireResolvedVisualEvidence({
        scenes: Array.from({ length: 6 }, (_, index) => ({
          id: `scene-${index + 1}`,
          sourceVideoUrl: index === 0 ? 'https://cdn.example.com/only-one.mp4' : undefined,
        })),
      }),
    ).toThrow('ULTIMATE_RENDER_VISUAL_ASSETS_MISSING');
  });

  it('counts distinct resolved images and clips instead of storyboard cards', () => {
    const result = requireResolvedVisualEvidence({
      scenes: Array.from({ length: 6 }, (_, index) => ({
        id: `scene-${index + 1}`,
        ...(index % 2 === 0
          ? { sourceVideoUrl: `https://cdn.example.com/scene-${index + 1}.mp4` }
          : { referenceImageUrl: `https://cdn.example.com/scene-${index + 1}.jpg` }),
      })),
    });
    expect(result).toEqual({ visualAssetCount: 6, distinctShots: 6 });
  });

  it('blocks Ultimate rendering when stored Envato visuals do not cover every scene', () => {
    const storyboard = {
      title: 'HVAC safety',
      objective: 'Inspect equipment safely',
      scenes: Array.from({ length: 6 }, (_, index) => ({
        id: `scene-${index + 1}`,
        teachingPoint: `Teaching point ${index + 1}`,
      })),
    };
    expect(() =>
      prepareUltimateStoryboardInput({
        lessonId: 'lesson-1',
        courseTitle: 'HVAC',
        storyboard,
        artifacts: {
          visual_assignment: {
            media: {
              readyAssets: [
                {
                  lesson_id: 'lesson-1',
                  entitlement_id: 'envato-1',
                  public_url: 'https://cdn.example.com/one.jpg',
                  mime_type: 'image/jpeg',
                },
              ],
            },
          },
        },
      }),
    ).toThrow('ULTIMATE_ENVATO_VISUALS_REQUIRED:1:6');
  });

  it('blocks narration before synthesis when Envato visuals do not cover the storyboard', async () => {
    const generate = vi.fn();
    const handlers = createProductionHandlers({ narration: { generate } } as any);
    const context = {
      buildId: 'build:lesson-1',
      courseId: 'course-1',
      profile: { competencies: [{ id: 'lesson-1' }] },
      artifacts: {
        storyboard: {
          storyboard: {
            scenes: Array.from({ length: 7 }, (_, index) => ({ id: `scene-${index + 1}` })),
          },
        },
        visual_assignment: { media: { readyAssets: [] } },
        instructor_script: { script: 'Teach the lesson.' },
      },
    };

    await expect(handlers.natural_narration(context as any)).rejects.toThrow(
      'ULTIMATE_ENVATO_VISUALS_REQUIRED:0:7',
    );
    expect(generate).not.toHaveBeenCalled();
  });
  it('selectively repairs failed media QA and resumes downstream stages', async () => {
    const called: string[] = [];
    let qaAttempts = 0;
    const handlers = Object.fromEntries(
      ULTIMATE_BUILD_STEPS.map((step) => [
        step,
        async () => {
          called.push(step);
          if (step === 'finished_media_qa' && qaAttempts++ === 0) {
            return {
              findings: [{
                step,
                severity: 'error',
                code: 'INSUFFICIENT_DISTINCT_SHOTS',
                message: 'Rendered lesson repeated visual material.',
              }],
              artifacts: { mediaQA: { pass: false } },
            };
          }
          return { artifacts: fixtureArtifact(step) };
        },
      ]),
    );
    const ctx: any = {
      buildId: 'build:competency',
      courseId: 'course',
      profile: { competencies: [] },
      artifacts: {},
      findings: [],
      passedSteps: new Set(),
    };
    await new UltimateBuildRunner(handlers).run(ctx);
    expect(called.filter((step) => step === 'visual_assignment')).toHaveLength(2);
    expect(called.filter((step) => step === 'natural_narration')).toHaveLength(2);
    expect(called.at(-1)).toBe('credential_release');
    expect(ctx.findings.some((f: any) => f.severity === 'error')).toBe(false);
  });

  it('keeps explicit media approval failures as durable blockers', async () => {
    const called: string[] = [];
    const handlers = Object.fromEntries(
      ULTIMATE_BUILD_STEPS.map((step) => [
        step,
        async () => {
          called.push(step);
          if (step === 'visual_assignment') {
            throw new Error('MEDIA_LICENSE_REQUIRED:approved entitlement is required');
          }
          return { artifacts: fixtureArtifact(step) };
        },
      ]),
    );
    const ctx: any = {
      buildId: 'build:competency',
      courseId: 'course',
      profile: { competencies: [] },
      artifacts: {},
      findings: [],
      passedSteps: new Set(),
    };
    await new UltimateBuildRunner(handlers).run(ctx);
    expect(called.filter((step) => step === 'visual_assignment')).toHaveLength(1);
    expect(called).not.toContain('natural_narration');
    expect(ctx.findings).toMatchObject([{ code: 'MEDIA_LICENSE_REQUIRED' }]);
  });

});
