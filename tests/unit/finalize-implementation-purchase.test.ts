import { describe, expect, it } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { finalizeImplementationPurchase } from '@/lib/store/finalize-implementation-purchase';

function checkoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: 'cs_test_platform',
    object: 'checkout.session',
    amount_total: 75_000,
    currency: 'usd',
    customer: 'cus_test',
    customer_details: {
      address: null,
      email: 'owner@example.com',
      name: 'Business Owner',
      phone: '3175550100',
      tax_exempt: 'none',
      tax_ids: [],
    },
    customer_email: null,
    metadata: {
      kind: 'implementation_package',
      checkout_type: 'standalone_platform_build',
      implementation_order_id: 'order-1',
      implementation_package_id: 'standalone-launch',
      payment_choice: 'deposit',
    },
    payment_intent: 'pi_test',
    payment_status: 'paid',
    ...overrides,
  } as Stripe.Checkout.Session;
}

function database(order: Record<string, unknown>) {
  let updateValues: Record<string, unknown> | null = null;
  const db = {
    from(table: string) {
      expect(table).toBe('implementation_orders');
      return {
        select() {
          return {
            eq() {
              return { maybeSingle: async () => ({ data: order, error: null }) };
            },
          };
        },
        update(values: Record<string, unknown>) {
          updateValues = values;
          return {
            eq() {
              return {
                in() {
                  return {
                    select() {
                      return {
                        maybeSingle: async () => ({ data: { id: 'order-1' }, error: null }),
                      };
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
  };
  return {
    db: db as unknown as SupabaseClient,
    updated: () => updateValues,
  };
}

describe('finalizeImplementationPurchase', () => {
  it('records a deposit and preserves the remaining manual-invoice balance', async () => {
    const fake = database({
      id: 'order-1',
      status: 'pending',
      package_id: 'standalone-launch',
      payment_choice: 'deposit',
      package_total_cents: 300_000,
      checkout_amount_cents: 75_000,
      stripe_checkout_session_id: 'cs_test_platform',
    });

    const result = await finalizeImplementationPurchase({
      db: fake.db,
      session: checkoutSession(),
    });

    expect(result).toMatchObject({
      success: true,
      orderId: 'order-1',
      status: 'deposit_paid',
      balanceDueCents: 225_000,
    });
    expect(fake.updated()).toMatchObject({
      status: 'deposit_paid',
      amount_paid_cents: 75_000,
      balance_due_cents: 225_000,
      customer_email: 'owner@example.com',
      stripe_payment_intent_id: 'pi_test',
    });
  });

  it('rejects a Stripe amount that differs from the server-owned order', async () => {
    const fake = database({
      id: 'order-1',
      status: 'pending',
      package_id: 'standalone-launch',
      payment_choice: 'deposit',
      package_total_cents: 300_000,
      checkout_amount_cents: 75_000,
      stripe_checkout_session_id: 'cs_test_platform',
    });

    const result = await finalizeImplementationPurchase({
      db: fake.db,
      session: checkoutSession({ amount_total: 1 }),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('does not match');
    expect(fake.updated()).toBeNull();
  });
});
