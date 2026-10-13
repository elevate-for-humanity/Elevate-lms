import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ provider: vi.fn(), config: vi.fn(), request: vi.fn() }));
vi.mock('@/lib/billing/config', () => ({ loadBillingProviderConfig: mocks.provider }));
vi.mock('@/lib/integrations/quickbooks-client', () => ({
  loadQuickBooksConfig: mocks.config,
  quickBooksRequest: mocks.request,
}));
import { getMarketplaceBillingReadiness } from '@/lib/billing/marketplace-readiness';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.provider.mockResolvedValue({ primary: 'quickbooks' });
  mocks.config.mockResolvedValue({
    clientId: 'configured',
    clientSecret: 'configured',
    accessToken: 'configured',
    refreshToken: 'configured',
    realmId: 'company',
  });
  mocks.request.mockResolvedValue({});
  vi.stubEnv('QB_WEBHOOK_VERIFIER_TOKEN', 'configured');
});
afterEach(() => vi.unstubAllEnvs());
describe('marketplace billing readiness', () => {
  it('verifies the active QuickBooks company without requiring a Stripe account', async () => {
    expect(await getMarketplaceBillingReadiness({})).toMatchObject({
      provider: 'quickbooks',
      ready: true,
      status: 'connected',
    });
    expect(mocks.request).toHaveBeenCalledWith({}, expect.any(Object), 'companyinfo/company');
  });
  it('does not treat expired authorization as ready or expose credentials', async () => {
    mocks.request.mockRejectedValue(new Error('private upstream response'));
    const result = await getMarketplaceBillingReadiness({});
    expect(result.ready).toBe(false);
    expect(JSON.stringify(result)).not.toContain('private upstream');
  });
  it('blocks activation without payment reconciliation', async () => {
    vi.stubEnv('QB_WEBHOOK_VERIFIER_TOKEN', '');
    expect(await getMarketplaceBillingReadiness({})).toMatchObject({
      ready: false,
      status: 'webhook_not_configured',
    });
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('does not advertise an unsupported checkout provider as working', async () => {
    mocks.provider.mockResolvedValue({ primary: 'paypal' });
    expect(await getMarketplaceBillingReadiness({})).toMatchObject({
      ready: false,
      status: 'checkout_provider_unsupported',
    });
  });
});
