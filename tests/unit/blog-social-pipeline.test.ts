import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/social/token-resolver', () => ({
  getSocialTokens: vi.fn(async () => ({
    access_token: 'test-page-token',
    organization_id: 'page-123',
  })),
}));

import { nextRetryAt, publishFacebookPageLink, publishFacebookPageReel } from '@/lib/social/blog-social-pipeline';

describe('canonical blog social pipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T12:00:00.000Z'));
    process.env.META_GRAPH_API_VERSION = 'v26.0';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('backs retries off without exceeding the six-hour ceiling', () => {
    expect(nextRetryAt(1)).toBe('2026-08-29T12:00:30.000Z');
    expect(nextRetryAt(20)).toBe('2026-08-29T12:16:00.000Z');
  });

  it('publishes a real Page link through the configured Graph API', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'page-123_post-456' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await publishFacebookPageLink({ message: 'Original Elevate post', link: 'https://www.elevateforhumanity.org/blog/example' });
    expect(result).toEqual({ postId: 'page-123_post-456', publishedUrl: 'https://www.facebook.com/page-123/posts/post-456' });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://graph.facebook.com/v26.0/page-123/feed');
  });

  it('uses the official three-phase Page Reel publishing flow', async () => {
    const responses = [
      { video_id: 'video-789', upload_url: 'https://rupload.facebook.com/video-upload' },
      { success: true },
      { success: true },
    ];
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(responses.shift()), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await publishFacebookPageReel({ description: 'Elevate Reel', videoUrl: 'https://cdn.example.com/reel.mp4' });
    expect(result).toEqual({ postId: 'video-789', publishedUrl: 'https://www.facebook.com/reel/video-789' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('never fabricates a post ID when Meta rejects publication', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'Invalid token' } }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })));
    await expect(publishFacebookPageLink({ message: 'Post', link: 'https://www.elevateforhumanity.org/blog/example' }))
      .rejects.toThrow('META_PUBLISH_FAILED: Invalid token');
  });
});
