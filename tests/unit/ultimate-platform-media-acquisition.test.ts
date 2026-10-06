import { it as test, vi, expect } from 'vitest';
import assert from 'node:assert/strict';
vi.mock('@/lib/media/licensed-course-media', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/media/licensed-course-media')>();
  return { ...actual, attachStoredLicensedMedia: vi.fn().mockResolvedValue({ id: 'stored' }) };
});
import {
  canAutoApproveLicensedMediaMatch,
  UltimatePlatformMedia,
} from '../../lib/ultimate-course-builder/adapters/platform-media';
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
    id: `match-${lesson}`, status: 'approved', lesson_id: lesson, entitlement_id: 'shared', match_score: 1,
    licensed_media_entitlements: { provider: 'envato', provider_item_id: 'item', metadata: {
      assetUrl: 'https://example.org/licensed.mp4', licenseObserved: true, courseId: 'course',
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


test('approved media scoped to a different course is never acquired or attached', async () => {
  vi.mocked(attachStoredLicensedMedia).mockClear();
  const matches = [{
    id: 'match-wrong-course',
    lesson_id: 'lesson-a',
    entitlement_id: 'asset-b',
    match_score: 1,
    licensed_media_entitlements: {
      provider: 'envato',
      provider_item_id: 'item-b',
      metadata: {
        courseId: 'course-b',
        assetUrl: 'https://example.org/licensed.mp4',
        licenseObserved: true,
      },
    },
  }];
  const db: any = { from(table: string) {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({ data: { created_by: 'admin' }, error: null }),
      in: async () => ({ data: table === 'course_lesson_media_matches' ? matches : [], error: null }),
    };
    return chain;
  } };
  const media = new UltimatePlatformMedia(db);
  const download = vi.spyOn(media as any, 'acquireApprovedEnvatoMatch').mockResolvedValue(true);
  expect(await media.acquire({ courseId: 'course-a' })).toEqual({ attached: 0, pending: 0 });
  expect(download).not.toHaveBeenCalled();
  expect(attachStoredLicensedMedia).not.toHaveBeenCalled();
});


test('auto-approval requires course ownership, license evidence, usable media, and semantic evidence', () => {
  const base = {
    status: 'suggested',
    match_score: 0.4,
    match_reasons: ['Shared topic: sanitation'],
    licensed_media_entitlements: {
      provider: 'envato',
      provider_item_id: 'item-a',
      license_document_url: 'https://license.example/item-a',
      metadata: {
        courseId: 'course-a',
        storage_bucket: 'course_videos',
        storage_path: 'licensed-library/envato/item-a/file.mp4',
      },
    },
  };
  expect(canAutoApproveLicensedMediaMatch(base, 'course-a')).toBe(true);
  expect(canAutoApproveLicensedMediaMatch({
    ...base,
    licensed_media_entitlements: {
      ...base.licensed_media_entitlements,
      metadata: { ...base.licensed_media_entitlements.metadata, courseId: 'course-b' },
    },
  }, 'course-a')).toBe(false);
  expect(canAutoApproveLicensedMediaMatch({ ...base, match_reasons: [] }, 'course-a')).toBe(false);
  expect(canAutoApproveLicensedMediaMatch({
    ...base,
    licensed_media_entitlements: {
      ...base.licensed_media_entitlements,
      license_document_url: '',
      metadata: { courseId: 'course-a' },
    },
  }, 'course-a')).toBe(false);
});
