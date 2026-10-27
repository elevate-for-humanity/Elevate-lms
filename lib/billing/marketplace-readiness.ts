import 'server-only';
import { loadBillingProviderConfig } from '@/lib/billing/config';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';

/** Checks the provider used by tenant checkout; no retired Stripe account is required. */
export async function getMarketplaceBillingReadiness(db: any) {
  const base = {
    merchantOfRecord: 'elevate',
    connectUrl: 'https://admin.elevateforhumanity.org/integrations/quickbooks',
  };
  try {
    const provider = (await loadBillingProviderConfig(db)).primary;
    if (provider !== 'quickbooks')
      return { ...base, provider, ready: false, status: 'checkout_provider_unsupported' };
    const config = await loadQuickBooksConfig(db);
    if (
      !config.clientId ||
      !config.clientSecret ||
      !config.accessToken ||
      !config.refreshToken ||
      !config.realmId
    ) {
      return { ...base, provider, ready: false, status: 'not_configured' };
    }
    if (!process.env.QB_WEBHOOK_VERIFIER_TOKEN)
      return { ...base, provider, ready: false, status: 'webhook_not_configured' };
    await quickBooksRequest(db, config, `companyinfo/${config.realmId}`);
    return { ...base, provider, ready: true, status: 'connected' };
  } catch {
    // A configured secret is not proof of a valid company authorization.
    return { ...base, provider: 'quickbooks', ready: false, status: 'connection_unavailable' };
  }
}
