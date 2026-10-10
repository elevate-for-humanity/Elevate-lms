import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const state = vi.hoisted(() => ({ subscription: null as any }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'buyer' } } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => { const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: state.subscription }) }; return q; } }) }));
vi.mock('@/lib/platform/resolve-tenant-for-user', () => ({ resolveTenantIdForUser: async () => 'tenant' }));
vi.mock('@/lib/platform/organization-features', () => ({ resolveBillingOrganizationId: async () => 'organization' }));
import SubscriptionSuccessPage from '@/apps/marketing/app/store/subscription-success/page';
beforeEach(() => { state.subscription = null; });
describe('Store subscription confirmation', () => {
  it('does not claim payment or active access without a verified subscription', async () => {
    const html = renderToStaticMarkup(await SubscriptionSuccessPage());
    expect(html).toContain('Subscription is not active yet'); expect(html).not.toContain('Payment received');
  });
  it('does not claim an expired subscription is active', async () => {
    state.subscription = { status: 'active', current_period_end: '2020-01-01T00:00:00Z' };
    expect(renderToStaticMarkup(await SubscriptionSuccessPage())).toContain('Subscription is not active yet');
  });
  it('shows access only for a current authenticated subscription', async () => {
    state.subscription = { status: 'active', current_period_end: '2099-01-01T00:00:00Z', billing_provider: 'quickbooks', subscription_plans: { name: 'Business' } };
    const html = renderToStaticMarkup(await SubscriptionSuccessPage());
    expect(html).toContain('Subscription active'); expect(html).toContain('Business');
  });
});
