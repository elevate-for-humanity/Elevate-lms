import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  retrieveSession: vi.fn(),
  updateCustomer: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: vi.fn(async () => ({
    from: vi.fn(() => ({ upsert: mocks.upsert })),
  })),
}));
vi.mock('@/lib/stripe/client', () => ({
  getStripeWriteClient: vi.fn(() => ({
    checkout: { sessions: { retrieve: mocks.retrieveSession } },
    customers: { update: mocks.updateCustomer },
  })),
}));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn() }));

describe('universal payment-method completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-universal', email: 'universal@example.test' } },
      error: null,
    });
    mocks.retrieveSession.mockResolvedValue({
      id: 'cs_test_universal',
      status: 'complete',
      mode: 'setup',
      client_reference_id: 'test-user-universal',
      customer: 'cus_test_universal',
      setup_intent: { payment_method: 'pm_test_card' },
      metadata: {
        kind: 'universal_payment_method_setup',
        user_id: 'test-user-universal',
      },
    });
    mocks.updateCustomer.mockResolvedValue({ id: 'cus_test_universal' });
    mocks.upsert.mockResolvedValue({ error: null });
  });

  it('sets the test card as default only after a matching completed Setup session', async () => {
    const { GET } = await import('@/apps/lms/app/api/billing/payment-method/complete/route');
    const response = await GET(new NextRequest(
      'https://app.elevateforhumanity.org/api/billing/payment-method/complete?session_id=cs_test_universal',
    ));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/account/payment-methods?setup=success');
    expect(mocks.updateCustomer).toHaveBeenCalledWith('cus_test_universal', {
      invoice_settings: { default_payment_method: 'pm_test_card' },
    });
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'test-user-universal',
      stripe_customer_id: 'cus_test_universal',
      stripe_default_payment_method_id: 'pm_test_card',
    }), { onConflict: 'user_id' });
  });

  it('rejects a completed session belonging to a different user', async () => {
    mocks.retrieveSession.mockResolvedValue({
      status: 'complete',
      mode: 'setup',
      client_reference_id: 'different-user',
      metadata: { kind: 'universal_payment_method_setup', user_id: 'different-user' },
    });
    const { GET } = await import('@/apps/lms/app/api/billing/payment-method/complete/route');
    const response = await GET(new NextRequest(
      'https://app.elevateforhumanity.org/api/billing/payment-method/complete?session_id=cs_other',
    ));

    expect(response.headers.get('location')).toContain('/account/payment-methods?setup=invalid');
    expect(mocks.updateCustomer).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
