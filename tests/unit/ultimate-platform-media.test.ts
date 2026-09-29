import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/media/licensed-course-media', () => ({
  recommendLicensedMediaForCourse: vi.fn().mockResolvedValue([]),
}));

import { UltimatePlatformMedia } from '@/lib/ultimate-course-builder/adapters/platform-media';

function mockDb() {
  const calls: Array<[string, ...unknown[]]> = [];
  const query: any = {
    select: (...args: unknown[]) => {
      calls.push(['select', ...args]);
      return query;
    },
    eq: (...args: unknown[]) => {
      calls.push(['eq', ...args]);
      return query;
    },
    not: (...args: unknown[]) => {
      calls.push(['not', ...args]);
      return query;
    },
    or: (...args: unknown[]) => {
      calls.push(['or', ...args]);
      return query;
    },
    is: (...args: unknown[]) => {
      calls.push(['is', ...args]);
      return query;
    },
    limit: async (...args: unknown[]) => {
      calls.push(['limit', ...args]);
      return { data: [], error: null };
    },
  };
  return {
    calls,
    db: {
      from: (table: string) => {
        calls.push(['from', table]);
        return query;
      },
    } as any,
  };
}

describe('UltimatePlatformMedia course-scoped fallback', () => {
  it('includes both lesson-specific and course-scoped assets for UUID competencies', async () => {
    const { db, calls } = mockDb();
    const lessonId = '840f94e8-6025-47d4-ac26-835a119b6062';

    await new UltimatePlatformMedia(db).find({
      courseId: '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0',
      competency: { id: lessonId },
    });

    expect(calls).toContainEqual(['or', `lesson_id.is.null,lesson_id.eq.${lessonId}`]);
  });

  it('uses only course-scoped assets for non-UUID competency keys', async () => {
    const { db, calls } = mockDb();

    await new UltimatePlatformMedia(db).find({
      courseId: '2c723bfa-8c40-4acc-b961-98d917710ffc',
      competency: { id: 'barber-a' },
    });

    expect(calls).toContainEqual(['is', 'lesson_id', null]);
    expect(calls.some(([method]) => method === 'or')).toBe(false);
  });
});
