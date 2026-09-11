import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

describe('POST /api/billing/payment-method/setup', () => {
  it('fails closed because saved-card setup is retired', async () => {
    const { POST } = await import('@/apps/lms/app/api/billing/payment-method/setup/route');
    const response = await POST(
      new NextRequest('https://app.elevateforhumanity.org/api/billing/payment-method/setup', {
        method: 'POST',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toMatchObject({ code: 'STRIPE_CHECKOUT_RETIRED', destination: '/lms/documents' });
  });
});
