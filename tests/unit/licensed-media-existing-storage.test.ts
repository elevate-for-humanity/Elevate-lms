import { describe, it, expect } from 'vitest';
import { storedLicensedMediaMetadata } from '@/lib/media/licensed-course-media';
const courseId = '9ca9fb50-7119-46ea-ab81-9b0193c29c31';
describe('existing licensed course files', () => {
  it('recognizes historical course-owned private storage without re-downloading it', () => {
    expect(
      storedLicensedMediaMetadata({ courseId, storagePath: `${courseId}/existing.mov` }),
    ).toMatchObject({ storage_bucket: 'course_videos', storage_path: `${courseId}/existing.mov` });
  });
  it('preserves secure library paths', () => {
    expect(
      storedLicensedMediaMetadata({
        storage_bucket: 'course_videos',
        storage_path: 'licensed-library/envato/item/existing.mp4',
      }),
    ).not.toBeNull();
  });
  it('rejects a different course, public bucket and traversal paths', () => {
    for (const metadata of [
      { courseId, storagePath: 'other-course/existing.mp4' },
      { courseId, storage_bucket: 'media', storagePath: `${courseId}/existing.mp4` },
      { courseId, storagePath: `${courseId}/../other.mp4` },
      { courseId, storagePath: `${courseId}/https://example.org/file.mp4` },
    ])
      expect(storedLicensedMediaMetadata(metadata)).toBeNull();
  });
});
