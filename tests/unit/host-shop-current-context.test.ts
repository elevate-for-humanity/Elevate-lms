// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  preview: null as any,
  selected: [] as string[],
  role: 'admin',
  secondary: [] as string[],
  archived: false,
  sessionUser: { id: 'actor' } as { id: string } | null,
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (state.cookie ? { value: state.cookie } : undefined) }),
}));
vi.mock('@/lib/admin/host-shop-preview', () => ({
  resolveHostShopAdminPreview: async () => state.preview,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.sessionUser }, error: null }) },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from(table: string) {
      let id = '';
      const q: any = {};
      q.select = () => q;
      q.limit = () => q;
      q.eq = (key: string, value: string) => {
        if (key === 'id') id = value;
        return q;
      };
      q.maybeSingle = async () => {
        if (table === 'profiles') return { data: { role: state.role }, error: null };
        if (table === 'partner_users') return { data: { partner_id: 'owner-partner', status: 'active' }, error: null };
        state.selected.push(id);
        return { data: { id, status: 'active', approval_status: 'approved', is_active: true }, error: null };
      };
      q.then = (resolve: any) => Promise.resolve({ data: table === 'user_roles'
        ? state.secondary.map(name => ({ roles: { name } }))
        : table === 'program_holders' && state.archived ? [{ features: { portal_access_archived: true } }] : [], error: null }).then(resolve);
      return q;
    },
  }),
}));
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';
beforeEach(() => {
  state.cookie = undefined;
  state.preview = null;
  state.selected = [];
  state.role = 'admin';
  state.secondary = [];
  state.archived = false;
  state.sessionUser = { id: 'actor' };
});
it('uses the signed selected shop even without the companion cookie', async () => {
  state.preview = { actorId: 'actor', partnerId: 'styles' };
  expect((await requireCurrentHostShopPartner()).partner.id).toBe('styles');
});
it('keeps finance API context aligned with the board when a stale selector remains', async () => {
  state.cookie = 'country';
  state.preview = { actorId: 'actor', partnerId: 'styles' };
  expect((await requireCurrentHostShopPartner()).partner.id).toBe('styles');
  expect(state.selected).toEqual(['styles']);
});
it('never borrows another administrators preview', async () => {
  state.preview = { actorId: 'other', partnerId: 'styles' };
  await expect(requireCurrentHostShopPartner()).rejects.toThrow('HOST_SHOP_ADMIN_PARTNER_REQUIRED');
  expect(state.selected).toEqual([]);
});
it('retains the authenticated selector fallback', async () => {
  state.cookie = 'country';
  expect((await requireCurrentHostShopPartner()).partner.id).toBe('country');
});

it('allows document APIs through the verified Admin handoff without a cross-domain Supabase session', async () => {
  state.sessionUser = null;
  state.preview = { actorId: 'actor', actorEmail: 'admin@example.com', partnerId: 'styles' };
  const ctx = await requireCurrentHostShopPartner();
  expect(ctx.partner.id).toBe('styles');
  expect(ctx.user.id).toBe('actor');
});
it('rejects a missing session when no valid handoff exists', async () => {
  state.sessionUser = null;
  await expect(requireCurrentHostShopPartner()).rejects.toThrow('HOST_SHOP_UNAUTHENTICATED');
});
it('resolves organization administrators through their own membership, ignoring foreign selector cookies', async () => {
  state.role = 'org_admin';
  state.cookie = 'foreign-partner';
  const context = await requireCurrentHostShopPartner();
  expect(context.partner.id).toBe('owner-partner');
  expect(context.isPlatformAdmin).toBe(false);
  expect(state.selected).not.toContain('foreign-partner');
});
it('does not restore global preview from an archived Host Shop owners legacy admin grant', async () => {
  state.role = 'host_shop';
  state.secondary = ['admin'];
  state.archived = true;
  state.cookie = 'foreign-partner';
  const context = await requireCurrentHostShopPartner();
  expect(context.partner.id).toBe('owner-partner');
  expect(context.effectiveRoles).toEqual(['host_shop']);
  expect(context.isPlatformAdmin).toBe(false);
});
