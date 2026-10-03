import { describe, expect, it, vi } from 'vitest';

import { createProductionHandlers } from '@/lib/ultimate-course-builder/core/production-handlers';

function context() {
  return {
    buildId: 'build:lesson-b',
    courseId: 'course-a',
    profile: {
      competencies: [{ id: 'lesson-b', title: 'Lesson B' }],
    },
    artifacts: {
      storyboard: {
        storyboard: {
          scenes: Array.from({ length: 13 }, (_, index) => ({ id: `scene-${index + 1}` })),
        },
      },
    },
    findings: [],
  } as any;
}

function licensedAssets(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `asset-${index + 1}`,
    license_evidence_url: 'https://media.example/license',
    entitlement_id: `entitlement-${index + 1}`,
    public_url: `https://media.example/envato-${index + 1}.mp4`,
    // Source ownership is course-scoped even when first attached to another lesson.
    lesson_id: 'lesson-a',
  }));
}

function assignments(count: number) { return Array.from({length:count},(_,i)=>({sceneId:`scene-${i+1}`,assetId:`asset-${i+1}`,licenseEvidenceUrl:'https://media.example/license',relevanceReason:'Reviewed scene teaching coverage'})); }

describe('Ultimate Envato visual coverage', () => {
  it('accepts a thirteen-shot licensed course library for another lesson in that course', async () => {
    const find = vi.fn().mockResolvedValue({
      policy: 'licensed-first',
      licensedSuggestions: [],
      readyAssets: licensedAssets(13),
      assignments: assignments(13),
      storyboard: null,
    });
    const handlers = createProductionHandlers({ media: { find } } as any);

    await expect(handlers.visual_assignment(context())).resolves.toMatchObject({
      artifacts: { media: { readyAssets: expect.arrayContaining(licensedAssets(13)) } },
    });
  });

  it('acquires approved stored media and retries discovery before blocking', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({
        policy: 'licensed-first',
        licensedSuggestions: [],
        readyAssets: licensedAssets(12),
      assignments: assignments(12),
        storyboard: null,
      })
      .mockResolvedValueOnce({
        policy: 'licensed-first',
        licensedSuggestions: [],
        readyAssets: licensedAssets(13),
      assignments: assignments(13),
        storyboard: null,
      });
    const acquire = vi.fn().mockResolvedValue({ attached: 1, pending: 0 });
    const handlers = createProductionHandlers({ media: { find, acquire } } as any);

    await expect(handlers.visual_assignment(context())).resolves.toMatchObject({
      artifacts: { media: { readyAssets: expect.arrayContaining(licensedAssets(13)) } },
    });
    expect(acquire).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledTimes(2);
  });

  it('retries transient HTML discovery responses without invoking media acquisition', async () => {
    const find = vi
      .fn()
      .mockRejectedValueOnce(
        new SyntaxError(`Unexpected token '<', "<html>\r\n<h"... is not valid JSON`),
      )
      .mockResolvedValueOnce({
        policy: 'licensed-first',
        licensedSuggestions: [],
        readyAssets: licensedAssets(13),
        assignments: assignments(13),
        storyboard: null,
      });
    const acquire = vi.fn();
    const handlers = createProductionHandlers({ media: { find, acquire } } as any);

    await expect(handlers.visual_assignment(context())).resolves.toMatchObject({
      artifacts: { media: { readyAssets: expect.arrayContaining(licensedAssets(13)) } },
    });
    expect(find).toHaveBeenCalledTimes(2);
    expect(acquire).not.toHaveBeenCalled();
  });

  it('blocks at visual assignment before narration when fewer than thirteen shots exist', async () => {
    const handlers = createProductionHandlers({
      media: {
        find: vi.fn().mockResolvedValue({
          policy: 'licensed-first',
          licensedSuggestions: [],
          readyAssets: licensedAssets(12),
      assignments: assignments(12),
          storyboard: null,
        }),
      },
    } as any);

    await expect(handlers.visual_assignment(context())).rejects.toThrow(
      'ULTIMATE_SCENE_ASSIGNMENT_COVERAGE_REQUIRED:12:13',
    );
  });
});
