import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../../apps/marketing/middleware';

vi.mock('@/lib/supabase/middleware', () => ({ createMiddlewareSupabaseClient: vi.fn() }));

afterEach(() => vi.unstubAllEnvs());
describe('Store runtime readiness', () => {
  it('serves its own readiness handler without redirecting to Marketing', async () => {
    vi.stubEnv('STORE_ONLY_RUNTIME', 'true');
    const response = await middleware(new NextRequest('https://store.elevateforhumanity.org/api/ready'));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
  it('keeps unrelated pages outside the Store runtime', async () => {
    vi.stubEnv('STORE_ONLY_RUNTIME', 'true');
    const response = await middleware(new NextRequest('https://store.elevateforhumanity.org/programs'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://www.elevateforhumanity.org/programs');
  });
});
