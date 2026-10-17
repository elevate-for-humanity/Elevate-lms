import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  access: { allowed: true, isAdmin: false, status: 'active', plan: 'starter' },
  rpc: vi.fn(),
  adminUnavailable: false,
}));
vi.mock('@/lib/apps/website-builder-access', () => ({
  getWebsiteBuilderAccess: async () => state.access,
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => {
    if (state.adminUnavailable) throw new Error('missing credentials');
    return { rpc: state.rpc };
  },
}));
import { consumeWebsiteBuilderCredits } from '@/lib/apps/website-builder-trial';
const browser = { rpc: vi.fn() } as any;
beforeEach(() => {
  state.access = { allowed: true, isAdmin: false, status: 'active', plan: 'starter' };
  state.adminUnavailable = false;
  state.rpc.mockReset().mockResolvedValue({ data: [{ success: true, balance: 440 }], error: null });
  browser.rpc.mockReset();
});
describe('funded Website Builder usage', () => {
  it('debits paid subscribers before permitting processing', async () => {
    await expect(
      consumeWebsiteBuilderCredits(browser, 'buyer', 'initial_site_generation'),
    ).resolves.toMatchObject({ allowed: true, charged: 60, balance: 440, isTrial: false });
    expect(state.rpc).toHaveBeenCalledExactlyOnceWith('consume_website_builder_credits_v1', {
      p_user_id: 'buyer',
      p_operation: 'initial_site_generation',
      p_quantity: 1,
    });
    expect(browser.rpc).not.toHaveBeenCalled();
  });
  it('blocks a paid account whose allowance is exhausted', async () => {
    state.rpc.mockResolvedValue({ data: [{ success: false, balance: 4 }], error: null });
    await expect(
      consumeWebsiteBuilderCredits(browser, 'buyer', 'paris_edit'),
    ).resolves.toMatchObject({ allowed: false, charged: 0, balance: 4, isTrial: false });
  });
  it('fails closed when the usage service is unavailable', async () => {
    state.adminUnavailable = true;
    await expect(
      consumeWebsiteBuilderCredits(browser, 'buyer', 'paris_edit'),
    ).resolves.toMatchObject({ allowed: false, charged: 0 });
  });
  it('does not grant trial credits to a paid account', async () => {
    await consumeWebsiteBuilderCredits(browser, 'buyer', 'paris_edit');
    expect(state.rpc).not.toHaveBeenCalledWith('ensure_app_trial_wallet', expect.anything());
  });
  it('initializes a trial through the backend and then consumes usage', async () => {
    state.access.status = 'trial';
    await expect(
      consumeWebsiteBuilderCredits(browser, 'buyer', 'paris_edit'),
    ).resolves.toMatchObject({ allowed: true, charged: 8, isTrial: true });
    expect(state.rpc).toHaveBeenNthCalledWith(1, 'ensure_app_trial_wallet', {
      p_user_id: 'buyer',
      p_app_slug: 'website-builder',
      p_trial_credits: 500,
    });
  });
  it('reserves all three imported sites as one atomic debit', async () => {
    await expect(
      consumeWebsiteBuilderCredits(browser, 'buyer', 'initial_site_generation', 3),
    ).resolves.toMatchObject({ charged: 180 });
    expect(state.rpc).toHaveBeenCalledWith(
      'consume_website_builder_credits_v1',
      expect.objectContaining({ p_quantity: 3 }),
    );
  });
  for (const quantity of [0, -1, 4, 1.5, NaN])
    it(`rejects invalid quantity ${quantity}`, async () => {
      expect(
        (await consumeWebsiteBuilderCredits(browser, 'buyer', 'initial_site_generation', quantity))
          .allowed,
      ).toBe(false);
      expect(state.rpc).not.toHaveBeenCalled();
    });
  it('rejects unknown operations instead of sending an undefined cost', async () => {
    expect((await consumeWebsiteBuilderCredits(browser, 'buyer', 'unknown' as any)).allowed).toBe(
      false,
    );
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it('preserves the internal administrator path', async () => {
    state.access.isAdmin = true;
    expect(await consumeWebsiteBuilderCredits(browser, 'operator', 'paris_edit')).toMatchObject({
      allowed: true,
      charged: 0,
    });
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
