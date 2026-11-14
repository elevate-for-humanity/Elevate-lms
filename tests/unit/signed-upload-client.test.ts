// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSignedUploadClient } from '../../lib/supabase/signed-upload-client';

afterEach(() => vi.unstubAllGlobals());

describe('signed media transfers', () => {
  it('uploads using the object token without reading a stalled portal session', async () => {
    const readSession = vi.fn(() => {
      throw new Error('Portal session refresh stalled');
    });
    vi.stubGlobal('localStorage', { getItem: readSession });
    const request = vi.fn(
      async (_url: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ Key: 'course_videos/course/file.mp4' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    vi.stubGlobal('fetch', request);
    const client = createSignedUploadClient({
      url: 'https://fixture.supabase.co',
      anonKey: 'public-fixture',
    });
    const result = await client.storage
      .from('course_videos')
      .uploadToSignedUrl('course/file.mp4', 'object-scoped-fixture', new Blob(['finished-video']), {
        contentType: 'video/mp4',
      });
    expect(result.error).toBeNull();
    expect(readSession).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
    const url = String(request.mock.calls[0][0]);
    expect(url).toContain('/object/upload/sign/course_videos/course/file.mp4');
    expect(url).toContain('token=object-scoped-fixture');
    expect(url).not.toContain('/auth/');
  });

  it('preserves storage rejection rather than reporting a finished upload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              message: 'Invalid upload token',
              statusCode: '403',
              error: 'Unauthorized',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    );
    const client = createSignedUploadClient({
      url: 'https://fixture.supabase.co',
      anonKey: 'public-fixture',
    });
    const result = await client.storage
      .from('course_videos')
      .uploadToSignedUrl('course/file.mp4', 'invalid-fixture', new Blob(['video']));
    expect(result.data).toBeNull();
    expect(result.error?.message).toContain('Invalid upload token');
  });
});
