import { afterEach, describe, expect, it, vi } from 'vitest';
import { getGoogleService, getGoogleServices } from '@/lib/google/runtime';

const healthy = {
  service: 'admin',
  healthy: true,
  ready: true,
  commitSha: 'a'.repeat(40),
  configuration: { ok: true },
  dependencies: { supabase: { ok: true } },
};
const service = {
  id: 'elevate-admin-migration',
  key: 'admin' as const,
  label: 'Admin',
  url: 'https://admin.elevateforhumanity.org',
  healthPath: '/api/health',
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Google runtime health', () => {
  it('accepts a ready service with verified configuration and Supabase', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(healthy)));
    expect(await getGoogleService(service)).toMatchObject({
      status: 'healthy',
      healthy: true,
      ready: true,
      commit: healthy.commitSha,
    });
  });
  it.each([
    { ...healthy, ready: false },
    { ...healthy, healthy: false },
    { ...healthy, service: 'marketing' },
    { ...healthy, configuration: { ok: false } },
    { ...healthy, dependencies: { supabase: { ok: false } } },
  ])('does not label incomplete or mismatched evidence healthy', async (body) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
    expect(await getGoogleService(service)).toMatchObject({ status: 'unhealthy', healthy: false });
  });
  it('does not follow redirects to another runtime', async () => {
    const request = vi.fn().mockResolvedValue(Response.json(healthy));
    vi.stubGlobal('fetch', request);
    await getGoogleService(service);
    expect(request.mock.calls[0][1]).toMatchObject({ cache: 'no-store', redirect: 'error' });
  });
  it.each(['https://old.northflank.app', 'https://old.code.run', 'https://api.northflank.com'])(
    'rejects retired provider URLs before making a request: %s',
    async (url) => {
      const request = vi.fn().mockResolvedValue(Response.json(healthy));
      vi.stubGlobal('fetch', request);
      await expect(getGoogleService({ ...service, url })).rejects.toThrow(/Google/);
      expect(request).not.toHaveBeenCalled();
    },
  );
  it('includes each web runtime exactly once', () => {
    expect(getGoogleServices().map((s) => s.key)).toEqual(['marketing', 'lms', 'admin', 'store']);
    expect(new Set(getGoogleServices().map((s) => s.id)).size).toBe(4);
  });
});
