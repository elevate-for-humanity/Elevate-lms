import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { BASE_PLANS } from '@/lib/store/platform-pricing';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

const state = vi.hoisted(() => ({
  invoices: [] as any[], schedules: [] as any[],
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'buyer', email: 'buyer@example.test', user_metadata: {} } } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from: (table: string) => {
    const result = table === 'partner_users' ? [{ partner_id: 'partner', status: 'active' }]
      : table === 'partners' ? { id: 'partner', name: 'Shop', approval_status: 'approved' }
      : table === 'shops' ? { id: 'shop' }
      : table === 'host_shop_partnerships' ? { id: 'partnership' } : null;
    const q: any = { select: () => q, eq: () => q,
      maybeSingle: async () => ({ data: result }),
      then: (resolve: any) => Promise.resolve({ data: result }).then(resolve),
      upsert: async (row: any) => { state.schedules.push(row); return { error: null }; },
    }; return q;
  },
}) }));
vi.mock('@/lib/platform/resolve-tenant-for-user', () => ({ resolveTenantIdForUser: async () => 'tenant' }));
vi.mock('@/lib/platform/organization-features', () => ({ resolveBillingOrganizationId: async () => 'organization' }));
vi.mock('@/lib/billing/providers/quickbooks', () => ({ createQuickBooksBillingProvider: () => ({ createManualInvoice: async (input: any) => { state.invoices.push(input); return { paymentUrl: 'https://example.test/pay', providerInvoiceId: 'invoice' }; } }) }));

function request(body: any) { return new NextRequest('https://example.test/checkout', { method: 'POST', body: JSON.stringify(body) }); }
function assertRenewalDelivery() {
  const invoice = state.invoices[0]; const schedule = state.schedules[0];
  expect(schedule.fulfillment_type).toBe(invoice.fulfillment.type);
  expect(schedule.fulfillment_payload).toEqual(invoice.fulfillment.payload);
  expect(schedule.amount_cents).toBe(invoice.lines.reduce((sum: number, line: any) => sum + line.quantity * line.unitAmountCents, 0));
  expect(schedule.fulfillment_payload.amount_cents).toBe(schedule.amount_cents);
}
beforeEach(() => { state.invoices.length = 0; state.schedules.length = 0; });
describe('Store subscriptions preserve delivery on every renewal invoice', () => {
  for (const plan of Object.values(BASE_PLANS)) for (const interval of ['monthly', 'annual']) {
    it(`${plan.id} ${interval} delivers the same organization features after renewal`, async () => {
      const { POST } = await import('@/apps/marketing/app/api/store/platform-checkout/route');
      expect((await POST(request({ planId: plan.id, interval, addonSlugs: [] }))).status).toBe(200);
      assertRenewalDelivery();
      expect(state.schedules[0].fulfillment_payload).toMatchObject({ organization_id: 'organization', tenant_id: 'tenant', billing_interval: interval, plan_id: plan.id });
    });
  }
  for (const app of Object.values(INDIVIDUAL_APP_CATALOG)) for (const plan of app.plans) {
    it(`${app.slug} ${plan.id} preserves the purchased app and buyer`, async () => {
      const { POST } = await import('@/apps/marketing/app/api/apps/upgrade/route');
      expect((await POST(request({ appSlug: app.slug, plan: plan.id }))).status).toBe(200);
      assertRenewalDelivery();
      expect(state.schedules[0].fulfillment_payload).toMatchObject({ user_id: 'buyer', app_slug: app.slug, plan_id: plan.id });
    });
  }
  for (const tier of ['bronze', 'silver', 'gold', 'platinum']) {
    it(`${tier} host-shop renewal retains the authorized partnership`, async () => {
      const { POST } = await import('@/apps/marketing/app/api/host-shop/subscription/checkout/route');
      expect((await POST(request({ tier }))).status).toBe(200);
      assertRenewalDelivery();
      expect(state.schedules[0].fulfillment_payload).toMatchObject({ partnership_id: 'partnership', partner_id: 'partner', shop_id: 'shop', tier });
    });
  }
});
