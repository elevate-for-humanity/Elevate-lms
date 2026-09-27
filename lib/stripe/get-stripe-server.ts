import 'server-only';

/** Stripe is retired. Historical callers fail closed instead of loading the SDK. */
export async function getStripeServer(): Promise<never> {
  throw new Error('STRIPE_RETIRED: use Elevate billing with QuickBooks or PayPal');
}
