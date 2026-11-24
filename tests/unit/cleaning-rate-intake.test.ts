import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ tenant: vi.fn(), admin: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/tenant/resolve-public-tenant', () => ({ resolvePublishedTenantFromRequest: mocks.tenant }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
import { POST } from '@/apps/marketing/app/api/tenant-sites/lead/route';
const request = (extra: Record<string, unknown> = {}) => new NextRequest('https://www.elevateforhumanity.org/api/tenant-sites/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Provider', email: 'provider@example.com', message: 'A'.repeat(4000), ...extra }) });
let insert: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.clearAllMocks();
  insert = vi.fn(async () => ({ error: null }));
  mocks.admin.mockResolvedValue({ from: vi.fn(() => ({ insert })) });
  mocks.tenant.mockResolvedValue({ websiteId: 'resolved-site', ownerUserId: 'owner', externalBackend: null, host: 'www.elevateforhumanity.org' });
});
describe('provider rate intake', () => {
  it('preserves the selected rate before long application text and scopes it to the resolved site', async () => {
    const response = await POST(request({ providerHourlyRate: '30.25', websiteId: 'attacker-site' }));
    expect(response.status).toBe(200);
    expect(insert.mock.calls[0][0]).toMatchObject({ website_id: 'resolved-site', user_id: 'owner' });
    expect(insert.mock.calls[0][0].message).toMatch(/^Requested business pay per cleaner-hour: \$30.25 USD/);
  });
  it('rejects invalid rates before saving anything', async () => {
    expect((await POST(request({ providerHourlyRate: '1e2' }))).status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });
  it('preserves ordinary customer lead behavior without a rate', async () => {
    expect((await POST(request({ message: 'Please quote my cleaning.' }))).status).toBe(200);
    expect(insert.mock.calls[0][0].message).toBe('Please quote my cleaning.');
  });
});
