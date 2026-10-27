import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import saved from '../fixtures/legacy83-saved-config.json';
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), canManage: vi.fn(), access: vi.fn(), maybeSingle: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }) }) }));
vi.mock('@/lib/websites/can-manage-hosted-website', () => ({ canManageHostedWebsite: mocks.canManage }));
vi.mock('@/lib/apps/website-builder-access', () => ({ getWebsiteBuilderAccess: mocks.access }));
vi.mock('@/lib/tenant/published-offerings', () => ({ loadPublishedOfferings: async config => config }));
import { resolvePublishedTenantFromRequest } from '@/lib/tenant/resolve-public-tenant';
const id = '7ebfae31-6d45-43fc-b45c-8110b703d382';
function request(origin = 'https://www.elevateforhumanity.org', websiteId = id) {
  return new NextRequest('https://www.elevateforhumanity.org/api/tenant-sites/lead', { headers: { host: 'www.elevateforhumanity.org', origin, 'x-website-preview-id': websiteId } });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null });
  mocks.canManage.mockResolvedValue(true);
  mocks.access.mockResolvedValue({ allowed: true });
  mocks.maybeSingle.mockResolvedValue({ data: { id, user_id: 'owner', subdomain: 'legacy83-preview', site_name: 'Legacy 83 Business', organization_id: null, site_config: saved }, error: null });
});
describe('private draft request isolation', () => {
  it('allows the authenticated authorized owner to use a draft without publishing it', async () => {
    const result = await resolvePublishedTenantFromRequest(request());
    expect(result?.websiteId).toBe(id);
    expect(result?.previewSite?.config.pages).toHaveLength(9);
    expect(mocks.canManage).toHaveBeenCalledWith(expect.anything(), id, 'owner');
  });
  it('rejects a missing session before reading draft content', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await resolvePublishedTenantFromRequest(request())).toBeNull();
    expect(mocks.maybeSingle).not.toHaveBeenCalled();
  });
  it('rejects another customer even if they supply an exact website ID', async () => {
    mocks.canManage.mockResolvedValue(false);
    expect(await resolvePublishedTenantFromRequest(request())).toBeNull();
    expect(mocks.maybeSingle).not.toHaveBeenCalled();
  });
  it('rejects expired access', async () => {
    mocks.access.mockResolvedValue({ allowed: false });
    expect(await resolvePublishedTenantFromRequest(request())).toBeNull();
  });
  it('rejects cross-origin requests and malformed identifiers before authentication', async () => {
    expect(await resolvePublishedTenantFromRequest(request('https://other.example'))).toBeNull();
    expect(await resolvePublishedTenantFromRequest(request(undefined, 'bad-id'))).toBeNull();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
});
