// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ secrets: vi.fn() }));
vi.mock('@/lib/devstudio/api-auth', () => ({
  apiRequireDevStudio: async () => ({ id: 'operator' }),
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ getSecrets: state.secrets }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
vi.mock('@/lib/studio/master-runtime', () => ({ recordMasterStudioArtifact: vi.fn() }));
import { GET, POST } from '@/apps/admin/app/api/admin/dev-studio/runtime/route';
beforeEach(() => {
  state.secrets.mockResolvedValue({
    STUDIO_BROWSER_URL: 'https://private-runtime.example',
    STUDIO_BROWSER_SECRET: 'private-secret',
  });
});
afterEach(() => vi.restoreAllMocks());
it.each(['GET', 'POST'])(
  'returns a redacted retryable response for %s transport failure without replaying',
  async (method) => {
    const transport = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('private-secret network failure'));
    const request = new NextRequest(
      'https://admin.example/api/runtime',
      method === 'POST'
        ? {
            method,
            body: JSON.stringify({ operation: 'exec', command: 'pwd' }),
            headers: { 'content-type': 'application/json' },
          }
        : undefined,
    );
    const response = await (method === 'POST' ? POST : GET)(request);
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(await response.json()).toMatchObject({ error: 'STUDIO_RUNTIME_UNAVAILABLE' });
    expect(transport).toHaveBeenCalledTimes(1);
  },
);
it('keeps runtime authentication rejection distinct from browser authentication', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 403 }));
  const response = await GET(new NextRequest('https://admin.example/api/runtime'));
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ error: 'STUDIO_RUNTIME_AUTH_REJECTED' });
});
it('handles configuration lookup failure without contacting the runtime', async () => {
  state.secrets.mockRejectedValueOnce(new Error('secret backend unavailable'));
  const transport = vi.spyOn(globalThis, 'fetch');
  const response = await GET(new NextRequest('https://admin.example/api/runtime'));
  expect(response.status).toBe(503);
  expect(transport).not.toHaveBeenCalled();
});
