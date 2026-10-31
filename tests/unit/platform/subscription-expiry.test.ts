import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ row: null as any, error: null as any }));
vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: async () => ({
    from: () => {
      const q: any = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({ data: state.row, error: state.error }),
      };
      return q;
    },
  }),
}));
import {
  hasIndividualAppAccess,
  syncIndividualAppSubscription,
} from '@/lib/apps/sync-subscription';
beforeEach(() => {
  state.row = null;
  state.error = null;
});
describe('Paid individual app expiry', () => {
  it.each([null, 'invalid', '2020-01-01'])(
    'denies active records with invalid or expired period %s',
    async (end) => {
      state.row = { status: 'active', current_period_end: end };
      expect(hasIndividualAppAccess(state.row)).toBe(false);
      expect(await syncIndividualAppSubscription('buyer', 'website-builder')).toMatchObject({
        status: 'inactive',
        access_reason: 'subscription_expired',
      });
    },
  );
  it('admits current QuickBooks access without Stripe identifiers', async () => {
    state.row = {
      status: 'active',
      current_period_end: '2099-01-01',
      billing_provider: 'quickbooks',
      provider_subscription_id: 'schedule:app',
    };
    expect(hasIndividualAppAccess(state.row)).toBe(true);
    expect(await syncIndividualAppSubscription('buyer', 'website-builder')).toEqual(state.row);
  });
  it('does not accept stale data alongside a database error', async () => {
    state.row = { status: 'active', current_period_end: '2099-01-01' };
    state.error = { message: 'unavailable' };
    expect(await syncIndividualAppSubscription('buyer', 'website-builder')).toMatchObject({
      status: 'billing_verification_unavailable',
    });
  });
});
