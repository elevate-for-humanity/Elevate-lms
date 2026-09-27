/** Stripe customer mutation is retired with the Stripe provider. */
export async function resolveStripeCustomer(): Promise<{ customer: null; recovered: false }> {
  return { customer: null, recovered: false };
}
