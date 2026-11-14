import { beforeEach, describe, expect, it, vi } from 'vitest';
const tenant = '10000000-0000-4000-8000-000000000001';
const organization = '20000000-0000-4000-8000-000000000001';
const state = vi.hoisted(() => ({ tenant: '', platformWide: false, data: { id: 'saved' } as { id: string } | null, filters: [] as unknown[][], update: vi.fn(), invalidate: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: state.invalidate }));
vi.mock('@/lib/auth/provider-access', () => ({ requireProviderPortal: async () => ({ tenantId: state.tenant, platformWide: state.platformWide }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => { const q: any = { update: (values: unknown) => {state.update(values);return q;}, eq: (...args: unknown[]) => {state.filters.push(args);return q;}, select: () => q, maybeSingle: async () => ({data:state.data,error:null}) };return q; } }) }));
import { saveProviderOrganization } from '@/apps/marketing/app/provider/settings/actions';
const values = { name: 'Example Training', tagline: null, support_email: 'support@example.invalid', website: 'https://example.invalid', phone: null, address: null, city: null, state: null, zip: null, logo_url: null };
beforeEach(() => {state.tenant=tenant;state.platformWide=false;state.data={id:'saved'};state.filters=[];state.update.mockClear();state.invalidate.mockClear();});
describe('provider organization settings boundary', () => {
  it('saves only whitelisted profile fields within the authorized tenant', async () => {
    await saveProviderOrganization(tenant,organization,{...values,tenant_id:'attacker',status:'approved'});
    expect(state.update).toHaveBeenCalledWith(values);
    expect(state.filters).toEqual([['id',organization],['tenant_id',tenant]]);
    expect(state.invalidate).toHaveBeenCalledWith('/provider/settings');
  });
  it('denies a request for another tenant before any write', async () => {
    state.tenant='another-tenant';
    await expect(saveProviderOrganization(tenant,organization,values)).rejects.toThrow('access denied');
    expect(state.update).not.toHaveBeenCalled();
  });
  it('does not report a successful save when the organization does not match', async () => {
    state.data=null;
    await expect(saveProviderOrganization(tenant,organization,values)).rejects.toThrow('not found in your tenant');
    expect(state.invalidate).not.toHaveBeenCalled();
  });
  it('rejects an executable profile URL', async () => {
    await expect(saveProviderOrganization(tenant,organization,{...values,website:'javascript:alert(1)'})).rejects.toThrow();
    expect(state.update).not.toHaveBeenCalled();
  });
});
