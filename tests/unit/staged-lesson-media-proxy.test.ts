import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  sign: vi.fn(async () => 'https://signed.example/media'),
  stream: vi.fn(async () => new Response('media', { status: 200 })),
}));
vi.mock('@/lib/ultimate-course-builder/testing/test-run-access', () => ({ loadOwnedLearnerTest: mocks.access }));
vi.mock('@/lib/storage/lesson-playback', () => ({ signedLessonPlayback: mocks.sign }));
vi.mock('@/lib/storage/lesson-stream', () => ({ streamLessonMedia: mocks.stream }));
vi.mock('@/lib/ultimate-course-builder/media/playback-source.mjs', () => ({ renderPlaybackUrl: (render:any) => render.playbackUrl }));

import { GET } from '@/apps/lms/app/api/learner-testing/runs/[runId]/media/route';

describe('staged learner media proxy', () => {
  it('rechecks QA ownership and proxies the saved caption reference', async () => {
    mocks.access.mockResolvedValue({ db: { owner: true }, run: { snapshot: { render: {
      playbackUrl: 'https://private.example/video', captionsUrl: 'https://private.example/captions',
    } } } });
    const request = new Request('https://app.elevateforhumanity.org/api/learner-testing/runs/run/media?asset=captions') as any;
    request.nextUrl = new URL(request.url);
    const response = await GET(request, { params: Promise.resolve({ runId: '00000000-0000-0000-0000-000000000001' }) });
    expect(response.status).toBe(200);
    expect(mocks.sign).toHaveBeenCalledWith({ owner: true }, 'https://private.example/captions');
    expect(mocks.stream).toHaveBeenCalledWith(request, 'https://signed.example/media', 'captions');
  });

  it('does not sign media for an unauthenticated test identity', async () => {
    mocks.access.mockResolvedValue(null);
    const request = new Request('https://app.elevateforhumanity.org/api/learner-testing/runs/run/media?asset=video') as any;
    request.nextUrl = new URL(request.url);
    const response = await GET(request, { params: Promise.resolve({ runId: '00000000-0000-0000-0000-000000000001' }) });
    expect(response.status).toBe(401);
  });
});
