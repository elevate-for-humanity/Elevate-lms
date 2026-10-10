import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/apps/marketing/middleware';
import { GET as health } from '@/apps/marketing/app/api/health/route';
import { GET as readiness } from '@/apps/marketing/app/api/ready/route';
vi.mock('@/lib/supabase/middleware', () => ({ createMiddlewareSupabaseClient: vi.fn() }));
vi.mock('@/lib/health/service-health', () => ({
  getRuntimeReadiness: () => ({ ready: true, missing: [], commit: 'a'.repeat(40), buildId: 'test-build', builtAt: '2026-10-10T00:00:00Z', revision: 'google-revision' }),
  checkSupabaseHealth: async () => ({ ok: true, status: 200, latencyMs: 1 }),
}));
afterEach(() => vi.unstubAllEnvs());
describe('production health endpoints', () => {
  it.each([false, true])('reports real readiness evidence and the correct public runtime identity (Store=%s)', async store => {
    vi.stubEnv('STORE_ONLY_RUNTIME', String(store));
    const body = await (await health()).json();
    expect(body).toMatchObject({ service: store ? 'store' : 'marketing', healthContract: store ? 'store-v4' : 'marketing-v4', revision: 'google-revision', configuration: { ok: true }, dependencies: { supabase: { ok: true } } });
    expect(body).not.toHaveProperty('overall_score');
  });
  it('exposes a lightweight readiness response', async () => {
    const response = await readiness();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ready: true });
  });
  it.each(['/api/ready', '/api/health', '/api/ping'])('lets %s reach the handler without redirecting or authenticating', async path => {
    const response = await middleware(new NextRequest(`https://www.elevateforhumanity.org${path}`));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
