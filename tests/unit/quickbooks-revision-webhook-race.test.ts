// @vitest-environment node
import { createHmac } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  total: 498000,
  providerMarker: '',
  storedMarker: '',
  update: vi.fn(),
  queue: vi.fn(),
}));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => {} }));
vi.mock('@/lib/integrations/quickbooks-client', () => ({
  loadQuickBooksConfig: async () => ({}),
  quickBooksRequest: async () => ({
    Invoice: {
      Id: '799',
      Balance: 0,
      TotalAmt: 600,
      CustomerRef: { value: '24' },
      PrivateNote: state.providerMarker,
    },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      let updating = false;
      const q: any = {
        select: () => q,
        eq: () => q,
        update: (values: unknown) => {
          updating = true;
          state.update(values);
          return q;
        },
        maybeSingle: async () => ({
          error: null,
          data: updating
            ? {
                id: 'tracked',
                fulfillment_type: 'program_enrollment',
                fulfillment_payload: { required_amount_cents: 60000 },
              }
            : {
                total_cents: state.total,
                provider_payload: { CustomerRef: { value: '24' } },
                fulfillment_payload: { checkout_revision_marker: state.storedMarker },
              },
        }),
        upsert: (values: unknown) => {
          state.queue(table, values);
          return { error: null };
        },
      };
      return q;
    },
  }),
}));
import { POST } from '@/apps/marketing/app/api/webhooks/quickbooks/route';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  state.providerMarker = '';
  state.storedMarker = '';
});
it('also waits for a same-amount coupon or schedule revision before delivering a paid invoice', async () => {
  state.total = 60000;
  state.providerMarker = `checkout-revision=${'a'.repeat(64)}`;
  expect((await POST(request())).status).toBe(500);
  expect(state.update).not.toHaveBeenCalled();
  state.storedMarker = state.providerMarker;
  expect((await POST(request())).status).toBe(200);
  expect(state.queue).toHaveBeenCalledOnce();
});
const request = () => {
  vi.stubEnv('QB_WEBHOOK_VERIFIER_TOKEN', 'test-verifier');
  const body = JSON.stringify({
    eventNotifications: [{ dataChangeEvent: { entities: [{ name: 'Invoice', id: '799' }] } }],
  });
  return new NextRequest('https://example.test/webhook', {
    method: 'POST',
    body,
    headers: {
      'intuit-signature': createHmac('sha256', 'test-verifier').update(body).digest('base64'),
    },
  });
};
it('retries a paid deposit webhook until the old full-tuition ledger has reconciled', async () => {
  state.total = 498000;
  expect((await POST(request())).status).toBe(500);
  expect(state.update).not.toHaveBeenCalled();
  expect(state.queue).not.toHaveBeenCalled();
  state.total = 60000;
  expect((await POST(request())).status).toBe(200);
  expect(state.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }));
  expect(state.queue).toHaveBeenCalledWith(
    'billing_fulfillment_jobs',
    expect.objectContaining({ payload: expect.objectContaining({ required_amount_cents: 60000 }) }),
  );
});
