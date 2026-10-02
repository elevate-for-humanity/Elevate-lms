import { it as test } from 'vitest';
import assert from 'node:assert/strict';
import { UltimatePlatformMedia } from '../../lib/ultimate-course-builder/adapters/platform-media';

test('acquisition resolves the requested course before reading its matches', async () => {
  const reads: string[] = [];
  const db = {
    from(table: string) {
      reads.push(table);
      const chain = {
        select: () => chain,
        eq: (key: string, value: string) => {
          if (key === 'id' || key === 'course_id') assert.equal(value, 'course-a');
          return chain;
        },
        maybeSingle: async () => ({ data: { created_by: 'admin-a' }, error: null }),
        in: async () => ({ data: [], error: null }),
      };
      return chain;
    },
  };
  const result = await new UltimatePlatformMedia(db as any).acquire({ courseId: 'course-a' });
  assert.deepEqual(reads, ['courses', 'course_lesson_media_matches']);
  assert.deepEqual(result, { attached: 0, pending: 0 });
});

test('acquisition without a course makes no database request', async () => {
  const db = { from() { throw new Error('unexpected database request'); } };
  assert.deepEqual(await new UltimatePlatformMedia(db as any).acquire({}), { attached: 0, pending: 0 });
});
