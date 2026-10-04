import { it as test, vi, expect } from 'vitest';
import assert from 'node:assert/strict';
vi.mock('@/lib/media/licensed-course-media', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/media/licensed-course-media')>();
  return { ...actual, attachStoredLicensedMedia: vi.fn().mockResolvedValue({ id: 'stored' }) };
});
import { UltimatePlatformMedia } from '../../lib/ultimate-course-builder/adapters/platform-media';
import { attachStoredLicensedMedia } from '@/lib/media/licensed-course-media';

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

test('one approved source shared by lessons downloads once and attaches to both lessons', async () => {
  vi.mocked(attachStoredLicensedMedia).mockClear();
  const matches = ['one', 'two'].map(lesson => ({
    id: `match-${lesson}`, lesson_id: lesson, entitlement_id: 'shared', match_score: 1,
    licensed_media_entitlements: { provider: 'envato', provider_item_id: 'item', metadata: {
      assetUrl: 'https://example.org/licensed.mp4', licenseObserved: true,
    } },
  }));
  const db: any = { from(table: string) {
    const chain: any = {
      select: () => chain, eq: () => chain,
      maybeSingle: async () => ({ data: { created_by: 'admin' }, error: null }),
      in: async () => ({ data: table === 'course_lesson_media_matches' ? matches : [], error: null }),
    };
    return chain;
  } };
  const media = new UltimatePlatformMedia(db);
  const download = vi.spyOn(media as any, 'acquireApprovedEnvatoMatch').mockResolvedValue(true);
  expect(await media.acquire({ courseId: 'course' })).toEqual({ attached: 2, pending: 0 });
  expect(download).toHaveBeenCalledTimes(1);
  expect(attachStoredLicensedMedia).toHaveBeenCalledTimes(2);
  expect(vi.mocked(attachStoredLicensedMedia).mock.calls.map(([input]) => input.lessonId)).toEqual(['one', 'two']);
});
