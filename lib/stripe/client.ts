import 'server-only';

/**
 * RETIRED STRIPE COMPATIBILITY SHIM.
 * Stripe is no longer an active Elevate payment provider.
 * Historical routes may still import these names while they are retired,
 * but no Stripe SDK is loaded and no provider operation can execute.
 */
export function getStripe(): null { return null; }
export function getStripeWriteClient(): null { return null; }
export const stripe = null;

export async function stripeCall<T>(_fn: () => Promise<T>): Promise<T> {
  throw new Error('STRIPE_RETIRED: use Elevate billing with QuickBooks or PayPal');
}
