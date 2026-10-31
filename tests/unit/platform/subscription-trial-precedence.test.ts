import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  status: 'canceled' as string | null,
  features: [] as string[],
  trialChecks: 0,
}));
vi.mock('@/lib/admin/guards', () => ({ apiAuthGuard: async () => ({ id: 'buyer' }) }));
vi.mock('@/lib/platform/resolve-tenant-for-user', () => ({
  resolveTenantIdForUser: async () => 'tenant',
  hasActiveTrialLicense: async () => {
    state.trialChecks++;
    return true;
  },
}));
vi.mock('@/lib/platform/organization-features', () => ({
  getOrganizationFeatures: async () => ({ status: state.status, features: state.features }),
}));
vi.mock('@/lib/api/require-organization-feature', () => ({
  apiRequireOrganizationFeature: async () => ({ ok: true }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      const q: any = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({ data: { id: 'org' } }),
      };
      return q;
    },
  }),
}));
import { requireFeatureForAuth } from '@/lib/platform/require-feature-for-auth';
import { FEATURES } from '@/lib/platform/feature-catalog';
beforeEach(() => {
  state.status = 'canceled';
  state.features = [];
  state.trialChecks = 0;
});
describe('Recurring subscription takes precedence over old trials', () => {
  it.each(['canceled', 'past_due', 'expired', 'trial_expired', 'active'])(
    'cannot regain a missing paid feature through an old trial when %s',
    async (status) => {
      state.status = status;
      const result = await requireFeatureForAuth(
        new NextRequest('https://example.test'),
        FEATURES.CRM,
      );
      expect((result as Response).status).toBe(403);
      expect(state.trialChecks).toBe(0);
    },
  );
  it('preserves a legitimate trial with no recurring subscription', async () => {
    state.status = null;
    expect(
      await requireFeatureForAuth(new NextRequest('https://example.test'), FEATURES.CRM),
    ).toEqual({ userId: 'buyer', tenantId: 'tenant' });
    expect(state.trialChecks).toBe(1);
  });
  it('allows a currently purchased feature without consulting an older trial', async () => {
    state.status = 'active';
    state.features = ['crm'];
    expect(
      await requireFeatureForAuth(new NextRequest('https://example.test'), FEATURES.CRM),
    ).toMatchObject({ tenantId: 'tenant' });
    expect(state.trialChecks).toBe(0);
  });
});
