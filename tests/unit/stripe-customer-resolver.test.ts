import { describe, expect, it, vi } from 'vitest';
import { resolveStripeCustomer } from '@/lib/stripe/customer-resolver';

function stripeMock(overrides: Record<string, unknown> = {}) {
  return {
    customers: {
      retrieve: vi.fn(),
      search: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn(),
      ...overrides,
    },
  } as any;
}

describe('resolveStripeCustomer', () => {
  it('uses a valid stored customer without searching', async () => {
    const customer = { id: 'cus_valid', email: 'learner@example.com' };
    const stripe = stripeMock({ retrieve: vi.fn().mockResolvedValue(customer) });

    const result = await resolveStripeCustomer({
      stripe,
      email: 'learner@example.com',
      candidateIds: ['cus_valid'],
    });

    expect(result.customer).toBe(customer);
    expect(stripe.customers.search).not.toHaveBeenCalled();
  });

  it('recovers a stale cross-account customer ID by email', async () => {
    const recovered = { id: 'cus_current', email: 'learner@example.com' };
    const stripe = stripeMock({
      retrieve: vi.fn().mockRejectedValue({ code: 'resource_missing' }),
      search: vi.fn().mockResolvedValue({ data: [recovered] }),
    });

    const result = await resolveStripeCustomer({
      stripe,
      email: 'learner@example.com',
      candidateIds: ['cus_stale'],
    });

    expect(result).toEqual({ customer: recovered, recovered: true });
    expect(stripe.customers.search).toHaveBeenCalledWith({
      query: "email:'learner@example.com'",
      limit: 10,
    });
  });

  it('creates a customer only when explicitly allowed', async () => {
    const created = { id: 'cus_new', email: 'learner@example.com' };
    const stripe = stripeMock({ create: vi.fn().mockResolvedValue(created) });

    const result = await resolveStripeCustomer({
      stripe,
      email: 'learner@example.com',
      createIfMissing: true,
    });

    expect(result.customer).toBe(created);
    expect(stripe.customers.create).toHaveBeenCalledOnce();
  });
});
