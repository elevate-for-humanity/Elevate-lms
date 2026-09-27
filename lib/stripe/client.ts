import 'server-only';

// Compatibility boundary for legacy callers while their billing flows move to
// QuickBooks and PayPal. No legacy payment request may be sent or accepted.
// Keep the return type permissive so old routes can fail closed at runtime
// without pulling the retired SDK into the Marketing production image.
type LegacyPaymentClient = Record<string, any>;

export function getStripe(): LegacyPaymentClient | null {
  return null;
}

export function getStripeWriteClient(): LegacyPaymentClient | null {
  return null;
}

export const stripe: LegacyPaymentClient | null = null;

export async function stripeCall(_operation: () => Promise<any>): Promise<any> {
  throw new Error('Legacy payment provider is unavailable; use the active billing provider.');
}
