// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const { load, request } = vi.hoisted(() => ({ load: vi.fn(), request: vi.fn() }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn().mockResolvedValue({}) }));
vi.mock('@/lib/integrations/quickbooks-client', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/integrations/quickbooks-client')>(),
  loadQuickBooksConfig: load, quickBooksRequest: request,
}));
import { QuickBooksError } from '@/lib/integrations/quickbooks-client';
import { GET } from '../../apps/marketing/app/api/health/quickbooks/route';
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('QB_WEBHOOK_VERIFIER_TOKEN', 'verifier');
  load.mockResolvedValue({ clientId: 'id', clientSecret: 'secret', accessToken: 'access', refreshToken: 'refresh', realmId: 'company' });
  request.mockResolvedValue({ CompanyInfo: { Id: 'company' } });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe('QuickBooks health reason codes', () => {
  it('is healthy only after a successful company API call and webhook configuration', async () => {
    const r = await GET(); expect(r.status).toBe(200);
    expect(request).toHaveBeenCalledWith({}, expect.any(Object), 'companyinfo/company');
  });
  it('reports the specific safe failure code without returning provider credentials or bodies', async () => {
    load.mockRejectedValue(new QuickBooksError('settings_lookup_failed', 'private database detail'));
    const r = await GET(); expect(r.status).toBe(503);
    const body = await r.json(); expect(body.reason).toBe('settings_lookup_failed');
    expect(JSON.stringify(body)).not.toContain('private');
  });
  it('does not expose unexpected error messages', async () => {
    request.mockRejectedValue(new Error('private oauth token'));
    const r = await GET(); expect(r.status).toBe(503);
    expect((await r.json()).reason).toBe('connection_check_failed');
  });
  it('reports bounded provider timeouts', async () => {
    request.mockRejectedValue(new DOMException('private request URL', 'TimeoutError'));
    const r = await GET(); expect(r.status).toBe(503);
    expect((await r.json()).reason).toBe('provider_timeout');
  });
});

it('allows a saved refresh token to recover a missing access token during a live health probe', async () => {
  load.mockResolvedValue({clientId:'id',clientSecret:'secret',realmId:'company',accessToken:'',refreshToken:'refresh'});
  const response = await GET();
  expect(response.status).toBe(200);
  expect(request).toHaveBeenCalledOnce();
});
