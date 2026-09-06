import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  resolveCustomer: vi.fn(),
  checkoutCreate: vi.fn(),
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
vi.mock('@/lib/stripe/customer-resolver', () => ({ resolveStripeCustomer: mocks.resolveCustomer }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn(async () => null) }));
vi.mock('@/lib/audit/withApiAudit', () => ({
  withApiAudit: (_endpoint: string, handler: (req: NextRequest) => Promise<Response>) => handler,
}));

function emptyLookup() {
  const terminal = { maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue(terminal),
      or: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue(terminal) }),
        }),
      }),
    }),
  };
}

describe('universal payment-method setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a Stripe-hosted setup session for an authenticated user with no enrollment', async () => {
    const user = { id: 'test-user-universal', email: 'universal@example.test', user_metadata: {} };
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({ data: { user }, error: null });
    mocks.from.mockImplementation((table: string) => {
      if (table === 'user_billing_customers') return { ...emptyLookup(), upsert };
      if (table === 'program_enrollments') return emptyLookup();
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.resolveCustomer.mockResolvedValue({
      customer: { id: 'cus_test_universal' },
      recovered: false,
    });
    mocks.checkoutCreate.mockResolvedValue({
      id: 'cs_test_universal',
      url: 'https://checkout.stripe.test/setup/universal',
    });

    const { POST } = await import('@/apps/lms/app/api/billing/payment-method/setup/route');
    const response = await POST(new NextRequest(
      'https://app.elevateforhumanity.org/api/billing/payment-method/setup',
      { method: 'POST' },
    ));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: 'https://checkout.stripe.test/setup/universal',
    });
    expect(mocks.resolveCustomer).toHaveBeenCalledWith(expect.objectContaining({
      email: user.email,
      createIfMissing: true,
    }));
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: user.id,
      stripe_customer_id: 'cus_test_universal',
    }), { onConflict: 'user_id' });
    const checkoutArgs = mocks.checkoutCreate.mock.calls[0][0];
    expect(checkoutArgs).toMatchObject({
      mode: 'setup',
      currency: 'usd',
      customer: 'cus_test_universal',
      client_reference_id: user.id,
      metadata: { kind: 'universal_payment_method_setup', user_id: user.id },
    });
    expect(checkoutArgs).not.toHaveProperty('payment_method_types');
  });

  it('rejects unauthenticated requests before creating a Stripe customer or session', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import('@/apps/lms/app/api/billing/payment-method/setup/route');
    const response = await POST(new NextRequest(
      'https://app.elevateforhumanity.org/api/billing/payment-method/setup',
      { method: 'POST' },
    ));

    expect(response.status).toBe(401);
    expect(mocks.resolveCustomer).not.toHaveBeenCalled();
    expect(mocks.checkoutCreate).not.toHaveBeenCalled();
  });
});
