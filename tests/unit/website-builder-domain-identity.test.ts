import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/apps/marketing/app/api/apps/website-builder/sites/[websiteId]/domains/[domainId]/route';
import { POST } from '@/apps/marketing/app/api/apps/website-builder/sites/[websiteId]/domains/verify/route';

const mocks = vi.hoisted(() => ({ resolve: vi.fn(), get: vi.fn() }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/domainee/site-resolver', () => ({ resolveOwnedSite: mocks.resolve }));
vi.mock('@/lib/domainee/client', () => ({ getDomain: mocks.get, isDomaineeConfigured: () => true, deleteDomain: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  const row = { id: 'local-id', website_id: 'website', domainee_domain_id: 'provider-id', status: 'pending' };
  const update = { eq: vi.fn(async () => ({ error: null })) };
  const query = { select: vi.fn(() => query), eq: vi.fn(() => query), maybeSingle: vi.fn(async () => ({ data: row, error: null })), update: vi.fn(() => update) };
  mocks.resolve.mockResolvedValue({ supabase: { from: () => query } });
  mocks.get.mockResolvedValue({ domain: { id: 'provider-id', status: 'active', dnsRecords: [] } });
});
describe('website domain identity', () => {
  it('keeps the local ID after a provider status refresh', async () => {
    const response = await GET(new NextRequest('https://example.com/status'), { params: Promise.resolve({ websiteId: 'website', domainId: 'local-id' }) });
    expect(response.status).toBe(200);
    expect((await response.json()).domain).toMatchObject({ id: 'local-id', domainee_domain_id: 'provider-id', status: 'active' });
    expect(mocks.get).toHaveBeenCalledWith('provider-id');
  });
  it('keeps the local ID after verification so polling and disconnect use the correct record', async () => {
    const request = new NextRequest('https://example.com/verify', { method: 'POST', body: JSON.stringify({ domainId: 'local-id' }) });
    const response = await POST(request, { params: Promise.resolve({ websiteId: 'website' }) });
    expect(response.status).toBe(200);
    expect((await response.json()).domain).toMatchObject({ id: 'local-id', domainee_domain_id: 'provider-id', status: 'active' });
  });
});
