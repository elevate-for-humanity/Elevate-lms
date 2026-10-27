import {beforeEach, describe, expect, it, vi} from 'vitest';
const signed = vi.hoisted(() => vi.fn());
vi.mock('@/lib/storage/elevate-media-storage', () => ({
  getElevateMediaStorageConfig: () => ({publicUrl:'https://media.example/course-media',endpoint:'https://s3.us-east-005.backblazeb2.com',bucket:'elevate-course-media'}),
  getSignedElevateMediaUrl: signed,
}));
import {signedLessonPlayback, managedLessonPlaybackUrl} from '@/lib/storage/lesson-playback';
describe('server-bound lesson playback delivery', () => {
  beforeEach(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'; signed.mockReset(); });
  it('signs only the saved Supabase object key', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({data:{signedUrl:'https://signed.example/video'},error:null});
    const db = {storage:{from:vi.fn(() => ({createSignedUrl}))}};
    expect(await signedLessonPlayback(db, 'https://project.supabase.co/storage/v1/object/public/course-videos/generated-lessons/lesson.mp4')).toBe('https://signed.example/video');
    expect(db.storage.from).toHaveBeenCalledWith('course-videos');
    expect(createSignedUrl).toHaveBeenCalledWith('generated-lessons/lesson.mp4',3600);
  });
  it('uses configured B2-compatible signing without arbitrary redirects', async () => {
    signed.mockResolvedValue('https://signed.example/b2');
    expect(await signedLessonPlayback({},'https://media.example/course-media/course-videos/film.mp4')).toBe('https://signed.example/b2');
    expect(signed).toHaveBeenCalledWith('course-videos/film.mp4',3600);
    await expect(signedLessonPlayback({},'https://attacker.example/film.mp4')).rejects.toThrow('LESSON_MEDIA_STORAGE_REFERENCE_REQUIRED');
  });
  it('routes and signs private manually uploaded lessons without exposing the bucket', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({data:{signedUrl:'https://signed.example/upload'},error:null});
    const db = {storage:{from:vi.fn(() => ({createSignedUrl}))}};
    const source = 'https://project.supabase.co/storage/v1/object/public/course_videos/course/lesson.mp4';
    expect(managedLessonPlaybackUrl(source,'course','lesson')).toBe('/api/courses/course/lessons/lesson/playback');
    expect(await signedLessonPlayback(db,source)).toBe('https://signed.example/upload');
    expect(db.storage.from).toHaveBeenCalledWith('course_videos');
    expect(createSignedUrl).toHaveBeenCalledWith('course/lesson.mp4',3600);
    await expect(signedLessonPlayback(db,'https://project.supabase.co/storage/v1/object/public/course_videos/%2e%2e/private.mp4')).rejects.toThrow('LESSON_MEDIA_REFERENCE_INVALID');
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
  });
  it('rejects encoded traversal before signing', async () => {
    await expect(signedLessonPlayback({},'https://media.example/course-media/%2e%2e/private.mp4')).rejects.toThrow('LESSON_MEDIA_REFERENCE_INVALID');
    expect(signed).not.toHaveBeenCalled();
  });
  it('renews an expired private B2 reference only in the configured bucket', async () => {
    signed.mockResolvedValue('https://signed.example/fresh');
    for (const base of ['https://elevate-course-media.s3.us-east-005.backblazeb2.com/', 'https://s3.us-east-005.backblazeb2.com/elevate-course-media/']) {
      expect(await signedLessonPlayback({},base+'course-videos/film.mp4?X-Amz-Date=20261018T000145Z&X-Amz-Expires=21600')).toBe('https://signed.example/fresh');
    }
    expect(signed).toHaveBeenCalledWith('course-videos/film.mp4',3600);
    await expect(signedLessonPlayback({},'https://other-bucket.s3.us-east-005.backblazeb2.com/private.mp4')).rejects.toThrow('LESSON_MEDIA_STORAGE_REFERENCE_REQUIRED');
    await expect(signedLessonPlayback({},'https://elevate-course-media.s3.us-east-005.backblazeb2.com/%2e%2e/private.mp4')).rejects.toThrow('LESSON_MEDIA_REFERENCE_INVALID');
    expect(signed).toHaveBeenCalledTimes(2);
  });
  it('routes managed media through the authenticated endpoint while retaining external player integrations', () => {
    expect(managedLessonPlaybackUrl('https://media.example/course-media/film.mp4','course','lesson')).toBe('/api/courses/course/lessons/lesson/playback');
    expect(managedLessonPlaybackUrl('https://external.example/player','course','lesson')).toBe('https://external.example/player');
  });
});
