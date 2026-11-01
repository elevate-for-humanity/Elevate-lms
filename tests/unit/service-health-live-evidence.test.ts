// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ ai: vi.fn(), config: vi.fn(), qb: vi.fn(), paypal: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from: () => ({ select: async () => ({ error: null }) }),
}) }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/ai/provider-runtime', () => ({ resolveAIRuntimeState: mocks.ai }));
vi.mock('@/lib/integrations/quickbooks-client', () => ({ loadQuickBooksConfig: mocks.config, quickBooksRequest: mocks.qb }));
vi.mock('@/lib/integrations/paypal-client', () => ({ loadPayPalConfig: mocks.paypal, verifyPayPalConnection: async () => {} }));
import { getSiteHealthSnapshot } from '@/lib/admin/get-site-health';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.ai.mockResolvedValue({ activeProvider: 'elevate', elevate: false, anyConfigured: true });
  mocks.config.mockResolvedValue({ clientId: 'id', clientSecret: 'secret', refreshToken: 'refresh', realmId: '123' });
  mocks.paypal.mockResolvedValue({});
  vi.stubEnv('RESEND_API_KEY', 'private-resend-key');
  vi.stubEnv('SENDGRID_API_KEY', '');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it('rejects a present but invalid email key and unreachable selected AI', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'private-body' }, { status: 403 })));
  const result = await getSiteHealthSnapshot();
  expect(result.services.find(x => x.name === 'Resend')?.status).toBe('degraded');
  expect(result.services.find(x => x.name === 'AI Provider')?.status).toBe('degraded');
  expect(JSON.stringify(result)).not.toContain('private-');
  // A missing access token is recoverable through the shared refresh client.
  expect(mocks.qb).toHaveBeenCalled();
});

it('requires the Resend list response contract, not just HTTP 200', async () => {
  const request = vi.fn().mockResolvedValue(Response.json({ ok: true })); vi.stubGlobal('fetch', request);
  expect((await getSiteHealthSnapshot()).services.find(x => x.name === 'Resend')?.status).toBe('degraded');
  request.mockImplementation(async () => Response.json({ object: 'list', data: [] }));
  mocks.ai.mockResolvedValue({ activeProvider: 'elevate', elevate: true, anyConfigured: true });
  const result = await getSiteHealthSnapshot();
  expect(result.services.find(x => x.name === 'Resend')?.status).toBe('healthy');
  expect(result.services.find(x => x.name === 'AI Provider')?.status).toBe('healthy');
  expect(request).toHaveBeenLastCalledWith('https://api.resend.com/domains?limit=1',
    expect.objectContaining({ redirect: 'error', signal: expect.any(AbortSignal) }));
});
