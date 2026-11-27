import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { loadPublishedSiteBySubdomain } from '@/lib/tenant/load-published-site';

const mocks = vi.hoisted(() => ({ admin: vi.fn(), access: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/apps/website-builder-access', () => ({ getWebsiteBuilderAccess: mocks.access }));
vi.mock('@/lib/tenant/published-offerings', () => ({ loadPublishedOfferings: async (config: unknown) => config }));

function database(results: Array<{ data: unknown; error?: unknown }>) {
  const tables: string[] = [];
  const from = vi.fn((table: string) => {
    tables.push(table);
    const query = { select: vi.fn(() => query), eq: vi.fn(() => query), order: vi.fn(() => query), limit: vi.fn(() => query), maybeSingle: vi.fn(async () => results.shift() || { data: null }) };
    return query;
  });
  mocks.admin.mockResolvedValue({ from });
  return tables;
}
beforeEach(() => { vi.clearAllMocks(); mocks.access.mockResolvedValue({ allowed: true }); });
describe('public website publication boundaries', () => {
  it('keeps an explicitly unpublished address offline without organization fallback', async () => {
    const tables = database([{ data: { id: 'site', subdomain: 'business', is_published: false } }]);
    expect(await loadPublishedSiteBySubdomain('business')).toBeNull();
    expect(tables).toEqual(['user_websites']);
  });
  it('does not generate a public website for an organization with no published site', async () => {
    database([{ data: null }, { data: { id: 'org', name: 'Business', status: 'active' } }, { data: null }]);
    expect(await loadPublishedSiteBySubdomain('business')).toBeNull();
  });
  it('does not serve an unpublished site through its organization alias', async () => {
    database([{ data: null }, { data: { id: 'org', name: 'Business', status: 'active' } }, { data: { id: 'site', is_published: false } }]);
    expect(await loadPublishedSiteBySubdomain('business')).toBeNull();
  });
  it('serves the actual published configuration', async () => {
    database([{ data: { id: 'site', user_id: 'owner', subdomain: 'business', is_published: true, site_name: 'Business', site_config: buildDefaultSiteConfig({ organizationName: 'Business' }) } }, { data: { enabled: false } }]);
    const site = await loadPublishedSiteBySubdomain('business');
    expect(site?.id).toBe('site');
    expect(site?.siteName).toBe('Business');
    expect(mocks.access).toHaveBeenCalled();
  });
  it('fails closed on a database read error', async () => {
    const tables = database([{ data: null, error: { message: 'Read unavailable' } }]);
    expect(await loadPublishedSiteBySubdomain('business')).toBeNull();
    expect(tables).toEqual(['user_websites']);
  });
});
