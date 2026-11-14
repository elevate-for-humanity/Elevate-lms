import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ sign: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn(async () => ({})) }));
vi.mock('@/lib/video/job-queue', () => ({ classifyVideoFailure: vi.fn() }));
vi.mock('@/lib/storage/lesson-playback', () => ({ signedLessonPlayback: mocks.sign }));
import { verifyPlayableRows } from '@/lib/course-factory/media-manager';

describe('canonical media playback verification', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal('fetch', mocks.fetch); });
  it('renews a private storage reference before checking video delivery', async () => {
    mocks.sign.mockResolvedValue('https://signed.example/fresh');
    mocks.fetch.mockResolvedValue(new Response('video', { status: 206, headers: { 'content-type': 'video/mp4' } }));
    expect(await verifyPlayableRows([{ id: 'job', video_url: 'https://project.supabase.co/storage/v1/object/public/course_videos/film.mp4' }]))
      .toEqual({ playable: 1, unreachable: [] });
    expect(mocks.fetch).toHaveBeenCalledWith('https://signed.example/fresh', expect.objectContaining({ headers: { Range: 'bytes=0-1023' } }));
  });
  it('fails a signing error without probing an unsigned private URL', async () => {
    mocks.sign.mockRejectedValue(new Error('LESSON_MEDIA_SIGNING_FAILED'));
    const result = await verifyPlayableRows([{ id: 'uploaded:lesson', video_url: 'https://private.example/film.mp4' }]);
    expect(result.playable).toBe(0);
    expect(result.unreachable[0].reason).toBe('LESSON_MEDIA_SIGNING_FAILED');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it('reports missing uploaded media instead of trusting its approval flag', async () => {
    mocks.sign.mockResolvedValue('https://signed.example/missing');
    mocks.fetch.mockResolvedValue(new Response('', { status: 404 }));
    const result = await verifyPlayableRows([{ id: 'uploaded:lesson', video_url: 'https://private.example/film.mp4' }]);
    expect(result.playable).toBe(0);
    expect(result.unreachable[0].reason).toBe('HTTP 404');
  });
});
