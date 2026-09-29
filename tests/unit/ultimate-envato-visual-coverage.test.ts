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
          scenes: Array.from({ length: 7 }, (_, index) => ({ id: `scene-${index + 1}` })),
        },
      },
    },
    findings: [],
  } as any;
}

function licensedAssets(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    entitlement_id: `entitlement-${index + 1}`,
    public_url: `https://media.example/envato-${index + 1}.mp4`,
    // Source ownership is course-scoped even when first attached to another lesson.
    lesson_id: 'lesson-a',
  }));
}

describe('Ultimate Envato visual coverage', () => {
  it('accepts a seven-shot licensed course library for another lesson in that course', async () => {
    const find = vi.fn().mockResolvedValue({
      policy: 'licensed-first',
      licensedSuggestions: [],
      readyAssets: licensedAssets(7),
      storyboard: null,
    });
    const handlers = createProductionHandlers({ media: { find } } as any);

    await expect(handlers.visual_assignment(context())).resolves.toMatchObject({
      artifacts: { media: { readyAssets: expect.arrayContaining(licensedAssets(7)) } },
    });
  });

  it('blocks at visual assignment before narration when fewer than seven shots exist', async () => {
    const handlers = createProductionHandlers({
      media: {
        find: vi.fn().mockResolvedValue({
          policy: 'licensed-first',
          licensedSuggestions: [],
          readyAssets: licensedAssets(6),
          storyboard: null,
        }),
      },
    } as any);

    await expect(handlers.visual_assignment(context())).rejects.toThrow(
      'ULTIMATE_ENVATO_VISUALS_REQUIRED:6:7',
    );
  });
});
