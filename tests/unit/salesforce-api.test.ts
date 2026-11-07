import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), limit: vi.fn(), client: vi.fn(), check: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: mocks.auth }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.limit }));
vi.mock('@/lib/integrations/salesforce', () => ({ getSalesforceClient: mocks.client }));
import { GET } from '@/apps/admin/app/api/admin/integrations/salesforce/route';
import { SalesforceError } from '@/lib/integrations/salesforce-client';
describe('Salesforce admin compatibility boundary', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ id: 'owner' }); mocks.limit.mockResolvedValue(null); mocks.client.mockResolvedValue({ compatibility: mocks.check }); });
  it('rejects unauthorized callers before reading credentials or contacting Salesforce', async () => {
    mocks.auth.mockResolvedValue({ error: new Response('{}', { status: 403 }) });
    expect((await GET({} as any)).status).toBe(403);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it('does not expose an unknown provider error or credentials', async () => {
    mocks.check.mockRejectedValue(new Error('private provider response token'));
    const response = await GET({} as any);
    expect(response.status).toBe(502);
    expect(await response.text()).toBe('{"connected":false,"error":"SALESFORCE_UNAVAILABLE"}');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it('reports missing credentials as configuration required rather than connected', async () => {
    mocks.check.mockRejectedValue(new SalesforceError('SALESFORCE_CREDENTIALS_REQUIRED'));
    const response = await GET({} as any);
    expect(response.status).toBe(409);
    expect((await response.json()).connected).toBe(false);
  });
});
