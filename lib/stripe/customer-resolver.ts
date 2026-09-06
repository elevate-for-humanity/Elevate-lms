import type Stripe from 'stripe';

type ResolveStripeCustomerOptions = {
  stripe: Stripe;
  email: string;
  name?: string | null;
  candidateIds?: Array<string | null | undefined>;
  metadata?: Record<string, string>;
  createIfMissing?: boolean;
};

function isActiveCustomer(customer: Stripe.Customer | Stripe.DeletedCustomer): customer is Stripe.Customer {
  return !('deleted' in customer) || customer.deleted !== true;
}

function searchLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Resolve a customer in the Stripe account used by the current runtime key.
 *
 * Stored customer IDs can become stale when an enrollment was created with a
 * different Stripe account or key. Validate every candidate before use, then
 * recover by email. This prevents a stale `cus_` value from turning a billing
 * action into an opaque HTTP 500.
 */
export async function resolveStripeCustomer({
  stripe,
  email,
  name,
  candidateIds = [],
  metadata,
  createIfMissing = false,
}: ResolveStripeCustomerOptions): Promise<{ customer: Stripe.Customer | null; recovered: boolean }> {
  const normalizedEmail = email.trim();
  const candidates = [...new Set(candidateIds.filter((id): id is string => Boolean(id?.startsWith('cus_'))))];

  for (const id of candidates) {
    try {
      const customer = await stripe.customers.retrieve(id);
      if (isActiveCustomer(customer)) return { customer, recovered: false };
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== 'resource_missing') throw error;
    }
  }

  if (!normalizedEmail) return { customer: null, recovered: false };

  const found = await stripe.customers.search({
    query: `email:'${searchLiteral(normalizedEmail)}'`,
    limit: 10,
  });
  const existing = found.data.find(isActiveCustomer) ?? null;
  if (existing) return { customer: existing, recovered: candidates.length > 0 };
  if (!createIfMissing) return { customer: null, recovered: false };

  const customer = await stripe.customers.create({
    email: normalizedEmail,
    name: name || undefined,
    metadata,
  });
  return { customer, recovered: candidates.length > 0 };
}
