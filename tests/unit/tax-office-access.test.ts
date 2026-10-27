import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), assurance: vi.fn(), admin: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.auth, mfa: { getAuthenticatorAssuranceLevel: mocks.assurance } },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
import { officeAccess } from '@/lib/tax-software/server/office-access';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ data: { user: { id: 'current' } }, error: null });
  mocks.assurance.mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null });
});
describe('tax office permission gate', () => {
  it('requires authentication before privileged queries', async () => {
    mocks.auth.mockResolvedValue({ data: { user: null }, error: null });
    await expect(officeAccess()).rejects.toMatchObject({ status: 401 });
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it('requires MFA before privileged queries', async () => {
    mocks.assurance.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null });
    await expect(officeAccess()).rejects.toMatchObject({ code: 'MFA_REQUIRED' });
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it('does not grant access to authenticated applicants with no office assignment', async () => {
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve);
    mocks.admin.mockResolvedValue({ from: () => chain });
    await expect(officeAccess()).rejects.toMatchObject({ code: 'OFFICE_ACCESS_REQUIRED' });
  });
});
