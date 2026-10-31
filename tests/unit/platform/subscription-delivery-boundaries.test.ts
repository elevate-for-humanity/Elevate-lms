import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  role: 'org_admin',
  rpcError: null as string | null,
  rpc: [] as any[],
  events: [] as any[],
  readError: null as string | null,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'buyer', email: 'buyer@example.test' } } }),
    },
    from: (table: string) => {
      const q: any = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({
          data: { role: state.role, is_active: true, suspended: false },
        }),
        then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
      };
      return q;
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => db }));
vi.mock('@/lib/platform/orchestration/events', () => ({
  PlatformEventType: { ENTITLEMENT_REFRESHED: 'entitlement.refreshed' },
  emitPlatformEvent: async (_db: unknown, event: any) => {
    state.events.push(event);
  },
}));
vi.mock('@/lib/auth/privileged-mfa', () => ({
  PRIVILEGED_MFA_ROLES: [],
  privilegedMfaEnforcementEnabled: () => false,
}));
const db: any = {
  rpc: async (name: string, args: any) => {
    state.rpc.push({ name, args });
    return { error: state.rpcError ? { message: state.rpcError } : null };
  },
  from: (table: string) => {
    const q: any = {
      select: () => q,
      eq: () => q,
      maybeSingle: async () => ({
        data: table === 'organizations' ? { id: 'billing-org', tenant_id: 'tenant' } : null,
        error: state.readError ? { message: state.readError } : null,
      }),
      then: (resolve: any) =>
        Promise.resolve({
          data: [],
          error: state.readError ? { message: state.readError } : null,
        }).then(resolve),
    };
    return q;
  },
};
import { apiRequireAdmin } from '@/lib/admin/guards';
import { fulfillPlatformSaasSubscription } from '@/lib/platform/fulfillment';
import { getOrganizationFeatures } from '@/lib/platform/organization-features';
import { withLicense } from '@/lib/middleware/withLicense';
vi.mock('@/lib/audit-context', () => ({ setAuditContext: async () => {} }));
const meta = {
  user_id: 'buyer',
  tenant_id: 'tenant',
  billing_organization_id: 'billing-org',
  plan_id: 'business' as const,
  billing_interval: 'monthly' as const,
  billing_provider: 'quickbooks',
  addon_slugs: 'ai-addon,ai-assistant,additional-user',
  current_period_end: '2099-01-01',
};
beforeEach(() => {
  state.role = 'org_admin';
  state.rpcError = null;
  state.rpc.length = 0;
  state.events.length = 0;
  state.readError = null;
});
describe('Subscription delivery security boundaries', () => {
  it('does not allow a customer organization admin to invoke platform-wide admin APIs', async () => {
    expect((await apiRequireAdmin()).error?.status).toBe(403);
  });
  it.each(['admin', 'super_admin', 'staff'])(
    'preserves %s platform operations access',
    async (role) => {
      state.role = role;
      expect((await apiRequireAdmin()).error).toBeUndefined();
    },
  );
  it('normalizes purchased addons and uses the same atomic transaction for provider delivery', async () => {
    expect(await fulfillPlatformSaasSubscription(db, meta)).toEqual({ ok: true });
    expect(state.rpc).toEqual([
      {
        name: 'apply_platform_subscription',
        args: expect.objectContaining({
          p_tenant_id: 'tenant',
          p_organization_id: 'billing-org',
          p_interval: 'month',
          p_provider: 'quickbooks',
          p_addon_codes: ['ai-assistant', 'additional-user'],
          p_license_tier: 'business_monthly',
        }),
      },
    ]);
  });
  it('rejects a billing organization from another tenant before any writes', async () => {
    expect(
      await fulfillPlatformSaasSubscription(db, {
        ...meta,
        billing_organization_id: 'another-org',
      }),
    ).toMatchObject({ ok: false });
    expect(state.rpc).toHaveLength(0);
  });
  it('does not emit successful delivery after a failed transaction', async () => {
    state.rpcError = 'license write rejected';
    expect(await fulfillPlatformSaasSubscription(db, meta)).toEqual({
      ok: false,
      error: 'license write rejected',
    });
    expect(state.events).toHaveLength(0);
  });
  it('does not fall back to legacy access when the entitlement database is unavailable', async () => {
    state.readError = 'database unavailable';
    await expect(getOrganizationFeatures('tenant', db)).rejects.toThrow('database unavailable');
  });
});

describe('Paid QuickBooks license at the real middleware boundary', () => {
  it('loads provider fields and admits the purchased feature without Stripe identifiers', async () => {
    const row: any = {
      id: 'license',
      tier: 'business_monthly',
      status: 'active',
      features: ['crm'],
      max_users: 3,
      max_deployments: 1,
      expires_at: '2099-01-01',
      current_period_end: '2099-01-01',
      stripe_subscription_id: null,
      stripe_customer_id: null,
      billing_provider: 'quickbooks',
      provider_subscription_id: 'schedule:billing-org:platform-subscription',
      canceled_at: null,
      suspended_at: null,
    };
    const original = db.from;
    db.from = () => {
      let columns: string[] = [];
      const q: any = {
        select: (value: string) => {
          columns = value.split(',').map((v) => v.trim());
          return q;
        },
        eq: () => q,
        maybeSingle: async () => ({
          data: Object.fromEntries(columns.map((key) => [key, row[key]])),
          error: null,
        }),
      };
      return q;
    };
    try {
      const result = await withLicense(
        new NextRequest('https://example.test'),
        { tenantId: 'tenant' } as any,
        'crm',
      );
      expect(result.valid).toBe(true);
      expect(result.license?.billingAuthority).toBe('quickbooks');
    } finally {
      db.from = original;
    }
  });
});
