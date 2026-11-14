import { beforeEach, describe, expect, it, vi } from 'vitest';

const { syncSubscription } = vi.hoisted(() => ({ syncSubscription: vi.fn() }));

vi.mock('@/lib/apps/sync-subscription', () => ({
  appSubscriptionUpgradeUrl: (slug: string, reason: string) => `/store/apps/${slug}?reason=${reason}`,
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
    syncSubscription.mockResolvedValue({ plan: 'professional', status: 'active' });
    await expect(getWebsiteBuilderAccess('sample-customer', sampleUserClient())).resolves.toMatchObject({
      allowed: true,
      isAdmin: false,
      plan: 'professional',
      status: 'active',
    });
  });

  it('fails closed when the sample customer has no subscription', async () => {
    syncSubscription.mockResolvedValue(null);
    await expect(getWebsiteBuilderAccess('sample-customer', sampleUserClient())).resolves.toMatchObject({
      allowed: false,
      reason: 'subscription_required',
    });
  });

  it('fails closed when billing cannot verify a paid subscription', async () => {
    syncSubscription.mockResolvedValue({ plan: 'professional', status: 'billing_verification_unavailable' });
    await expect(getWebsiteBuilderAccess('sample-customer', sampleUserClient())).resolves.toMatchObject({
      allowed: false,
      reason: 'billing_verification_unavailable',
    });
  });

  it('allows platform admins without a personal subscription', async () => {
    await expect(getWebsiteBuilderAccess('sample-admin', sampleUserClient('admin'))).resolves.toMatchObject({
      allowed: true,
      isAdmin: true,
      plan: 'enterprise',
    });
    expect(syncSubscription).not.toHaveBeenCalled();
  });
});
