import { beforeEach, describe, expect, it, vi } from 'vitest';

const { syncSubscription } = vi.hoisted(() => ({ syncSubscription: vi.fn() }));

vi.mock('@/lib/apps/sync-subscription', () => ({
  appSubscriptionUpgradeUrl: (slug: string, reason: string) =>
    `/store/apps/${slug}?reason=${reason}`,
  syncIndividualAppSubscription: syncSubscription,
}));

import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

function sampleUserClient(role = 'student') {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { role } }) })),
      })),
    })),
  } as any;
}

describe('Website Builder sample-user subscription gate', () => {
  beforeEach(() => syncSubscription.mockReset());

  it('allows a sample customer with an active paid subscription', async () => {
    syncSubscription.mockResolvedValue({
      plan: 'professional',
      status: 'active',
      current_period_start: new Date(Date.now() - 1000).toISOString(),
      current_period_end: new Date(Date.now() + 86400000).toISOString(),
    });
    await expect(
      getWebsiteBuilderAccess('sample-customer', sampleUserClient()),
    ).resolves.toMatchObject({
      allowed: true,
      isAdmin: false,
      plan: 'professional',
      status: 'active',
    });
  });

  it('blocks an unpaid renewal after the paid period ends', async () => {
    syncSubscription.mockResolvedValue({
      plan: 'professional',
      status: 'active',
      current_period_start: '2025-01-01T00:00:00Z',
      current_period_end: '2025-02-01T00:00:00Z',
    });
    expect(await getWebsiteBuilderAccess('sample-customer', sampleUserClient())).toMatchObject({
      allowed: false,
      reason: 'paid_period_expired',
    });
  });

  it('blocks active records without a verifiable paid period', async () => {
    syncSubscription.mockResolvedValue({ plan: 'professional', status: 'active' });
    expect(await getWebsiteBuilderAccess('sample-customer', sampleUserClient())).toMatchObject({
      allowed: false,
      reason: 'paid_period_expired',
    });
  });

  it('fails closed when the sample customer has no subscription', async () => {
    syncSubscription.mockResolvedValue(null);
    await expect(
      getWebsiteBuilderAccess('sample-customer', sampleUserClient()),
    ).resolves.toMatchObject({
      allowed: false,
      reason: 'subscription_required',
    });
  });

  it('fails closed when billing cannot verify a paid subscription', async () => {
    syncSubscription.mockResolvedValue({
      plan: 'professional',
      status: 'billing_verification_unavailable',
    });
    await expect(
      getWebsiteBuilderAccess('sample-customer', sampleUserClient()),
    ).resolves.toMatchObject({
      allowed: false,
      reason: 'billing_verification_unavailable',
    });
  });

  it('allows platform admins without a personal subscription', async () => {
    await expect(
      getWebsiteBuilderAccess('sample-admin', sampleUserClient('admin')),
    ).resolves.toMatchObject({
      allowed: true,
      isAdmin: true,
      plan: 'enterprise',
    });
    expect(syncSubscription).not.toHaveBeenCalled();
  });
});
