import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const tokenResolverMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/social/token-resolver', () => ({
  getSocialTokens: tokenResolverMock,
}));

import {
  generateBlogSocialPackage,
  nextRetryAt,
  publishFacebookPageLink,
  publishFacebookPageReel,
  publishInstagramImage,
} from '@/lib/social/blog-social-pipeline';

describe('canonical blog social pipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T12:00:00.000Z'));
    process.env.META_GRAPH_API_VERSION = 'v26.0';
    tokenResolverMock.mockResolvedValue({
      access_token: 'test-page-token',
      organization_id: 'page-123',
      dry_run: false,
    });
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
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: 'page-123_post-456' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await publishFacebookPageLink({
      message: 'Original Elevate post',
      link: 'https://www.elevateforhumanity.org/blog/example',
    });
    expect(result).toEqual({
      postId: 'page-123_post-456',
      publishedUrl: 'https://www.facebook.com/page-123/posts/post-456',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://graph.facebook.com/v26.0/page-123/feed',
    );
  });

  it('uses the official three-phase Page Reel publishing flow', async () => {
    const responses = [
      { video_id: 'video-789', upload_url: 'https://rupload.facebook.com/video-upload' },
      { success: true },
      { success: true },
    ];
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(responses.shift()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await publishFacebookPageReel({
      description: 'Elevate Reel',
      videoUrl: 'https://cdn.example.com/reel.mp4',
    });
    expect(result).toEqual({
      postId: 'video-789',
      publishedUrl: 'https://www.facebook.com/reel/video-789',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('never fabricates a post ID when Meta rejects publication', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: { message: 'Invalid token' } }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    );
    await expect(
      publishFacebookPageLink({
        message: 'Post',
        link: 'https://www.elevateforhumanity.org/blog/example',
      }),
    ).rejects.toThrow('META_PUBLISH_FAILED: Invalid token');
  });

  it('builds Elevate-specific content deterministically without a provider call', async () => {
    const first = await generateBlogSocialPackage({
      id: 'blog-1',
      title: 'Fall HVAC Orientation',
      slug: 'fall-hvac-orientation',
      excerpt: '<p>Orientation is October 4 at the Elevate training center.</p>',
    });
    const second = await generateBlogSocialPackage({
      id: 'blog-1',
      title: 'Fall HVAC Orientation',
      slug: 'fall-hvac-orientation',
      excerpt: '<p>Orientation is October 4 at the Elevate training center.</p>',
    });
    expect(first).toEqual(second);
    expect(first.provider).toBe('elevate-deterministic');
    expect(first.package.caption).toContain(
      'https://www.elevateforhumanity.org/blog/fall-hvac-orientation',
    );
    expect(first.package.caption).toContain('Share this with 10 people');
    expect(first.package.caption).toContain('may qualify for workforce funding');
    expect(first.package.caption).not.toMatch(/guaranteed|everyone qualifies|accredited/i);
    expect(first.package.hashtags).toContain('#HVACTraining');
  });

  it('blocks Meta writes while the verified connection remains in dry-run', async () => {
    tokenResolverMock.mockResolvedValueOnce({
      access_token: 'test-page-token',
      organization_id: 'page-123',
      dry_run: true,
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      publishFacebookPageLink({
        message: 'Approved post',
        link: 'https://www.elevateforhumanity.org',
      }),
    ).rejects.toThrow('FACEBOOK_DRY_RUN');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('publishes an Instagram image and verifies the provider permalink', async () => {
    tokenResolverMock.mockResolvedValueOnce({
      access_token: 'test-instagram-token',
      organization_id: 'ig-123',
      dry_run: false,
    });
    const responses = [
      { id: 'container-123' },
      { id: 'media-456' },
      { permalink: 'https://www.instagram.com/p/verified-shortcode/' },
    ];
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify(responses.shift()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      publishInstagramImage({
        caption: 'Elevate update',
        imageUrl: 'https://cdn.example.com/update.jpg',
      }),
    ).resolves.toEqual({
      postId: 'media-456',
      publishedUrl: 'https://www.instagram.com/p/verified-shortcode/',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
