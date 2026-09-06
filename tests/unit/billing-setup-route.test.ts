import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  checkoutCreate: vi.fn(),
  resolveCustomer: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}));

vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: vi.fn(async () => ({ from: mocks.from })),
}));

vi.mock('@/lib/stripe/client', () => ({
  getStripeWriteClient: vi.fn(() => ({ checkout: { sessions: { create: mocks.checkoutCreate } } })),
}));

vi.mock('@/lib/stripe/customer-resolver', () => ({
  resolveStripeCustomer: mocks.resolveCustomer,
}));

vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rateLimit }));
vi.mock('@/lib/audit/withApiAudit', () => ({
  withApiAudit: (_endpoint: string, handler: (req: NextRequest) => Promise<Response>) => handler,
}));

type ProgramSlug = 'barber-apprenticeship' | 'cosmetology-apprenticeship';

function request(authorized = true) {
  return new NextRequest('https://app.elevateforhumanity.org/api/billing/setup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ authorized }),
  });
}

function arrangeEligibleUser(programSlug: ProgramSlug, suffix: string) {
  const user = { id: `test-user-${suffix}`, email: `${suffix}@example.test` };
  const enrollment = {
    id: `test-enrollment-${suffix}`,
    user_id: user.id,
    program_slug: programSlug,
    email: user.email,
    full_name: `Test ${suffix}`,
    stripe_customer_id: `cus_stale_${suffix}`,
    stripe_subscription_id: null,
    funding_source: 'self_pay',
    status: 'active',
    amount_paid_cents: 60000,
    down_payment: 600,
  };
  const enrollmentUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  const billingIs = vi.fn().mockResolvedValue({ error: null });
  const billingUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({ is: billingIs }),
  });
  const authorizationInsert = vi.fn().mockResolvedValue({ error: null });

  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.from.mockImplementation((table: string) => {
    if (table === 'program_enrollments') {
      return {
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: enrollment, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
        update: enrollmentUpdate,
      };
    }
    if (table === 'barber_subscriptions' || table === 'cosmetology_subscriptions') {
      return { update: billingUpdate };
    }
    if (table === 'billing_authorizations') return { insert: authorizationInsert };
    throw new Error(`Unexpected table: ${table}`);
  });
  mocks.resolveCustomer.mockResolvedValue({
    customer: { id: `cus_valid_${suffix}` },
    recovered: true,
  });
  mocks.checkoutCreate.mockResolvedValue({
    id: `cs_test_${suffix}`,
    url: `https://checkout.stripe.test/setup/${suffix}`,
  });

  return { user, enrollment, enrollmentUpdate, billingUpdate, authorizationInsert };
}

describe('POST /api/billing/setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue(null);
  });

  it.each([
    ['barber-apprenticeship', 'barber_subscriptions', 'barber'],
    ['cosmetology-apprenticeship', 'cosmetology_subscriptions', 'cosmetology'],
  ] as const)(
    'lets an eligible %s test user securely save a payment method',
    async (programSlug, subscriptionTable, suffix) => {
      const arranged = arrangeEligibleUser(programSlug, suffix);
      const { POST } = await import('@/apps/lms/app/api/billing/setup/route');

      const response = await POST(request());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.url).toBe(`https://checkout.stripe.test/setup/${suffix}`);
      expect(mocks.checkoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'setup',
          currency: 'usd',
          customer: `cus_valid_${suffix}`,
          client_reference_id: arranged.user.id,
          metadata: expect.objectContaining({
            user_id: arranged.user.id,
            enrollment_id: arranged.enrollment.id,
            program_slug: programSlug,
          }),
        }),
      );
      const checkoutArgs = mocks.checkoutCreate.mock.calls.at(-1)?.[0];
      expect(checkoutArgs).not.toHaveProperty('payment_method_types');
      expect(mocks.from).toHaveBeenCalledWith(subscriptionTable);
      expect(arranged.enrollmentUpdate).toHaveBeenCalledWith({
        stripe_customer_id: `cus_valid_${suffix}`,
      });
      expect(arranged.billingUpdate).toHaveBeenCalledWith({
        stripe_customer_id: `cus_valid_${suffix}`,
      });
      expect(arranged.authorizationInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: arranged.user.id,
          status: 'checkout_started',
          stripe_checkout_session_id: `cs_test_${suffix}`,
        }),
      );
    },
  );

  it('does not create a Stripe session without explicit automatic-payment authorization', async () => {
    const { POST } = await import('@/apps/lms/app/api/billing/setup/route');
    const response = await POST(request(false));

    expect(response.status).toBe(400);
    expect(mocks.checkoutCreate).not.toHaveBeenCalled();
  });
});
