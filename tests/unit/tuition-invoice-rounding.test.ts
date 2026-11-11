// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ row: {} as Record<string, any>, invoice: vi.fn() }));
vi.mock('@/lib/billing/providers/quickbooks', () => ({
  createQuickBooksBillingProvider: () => ({ createManualInvoice: state.invoice }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      const q: any = {
        error: null,
        select: () => q,
        eq: () => q,
        lte: () => q,
        limit: async () => ({
          data: state.row.status === 'active' ? [state.row] : [],
          error: null,
        }),
        update: (values: Record<string, unknown>) => {
          state.row = { ...state.row, ...values };
          return q;
        },
      };
      return q;
    },
  }),
}));
import { POST } from '@/lib/billing/handlers/generate-billing-invoices';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it('issues exactly $4,380 over 29 weekly invoices, capping the final invoice and stopping the schedule', async () => {
  vi.stubEnv('CRON_SECRET', 'test-cron');
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2027-12-01T15:00:00Z'));
  state.row = {
    id: 'schedule',
    status: 'active',
    customer_external_key: 'user:student',
    customer_name: 'Student',
    customer_email: 'student@example.test',
    canonical_product_key: 'barber',
    product_name: 'Barber tuition',
    amount_cents: 15104,
    cadence: 'weekly',
    next_invoice_date: '2026-11-13',
    remaining_invoices: 29,
    fulfillment_type: 'tuition_payment',
    fulfillment_payload: { remaining_tuition_cents: 438000 },
  };
  try {
    for (let i = 0; i < 30; i++) {
      expect(
        (
          await POST(
            new NextRequest('https://example.test/cron', {
              method: 'POST',
              headers: { authorization: 'Bearer test-cron' },
            }),
          )
        ).status,
      ).toBe(200);
    }
    const amounts = state.invoice.mock.calls.map(([input]) => input.lines[0].unitAmountCents);
    expect(amounts).toHaveLength(29);
    expect(amounts[28]).toBe(15088);
    expect(amounts.reduce((sum, amount) => sum + amount, 60000)).toBe(498000);
    expect(new Set(state.invoice.mock.calls.map(([input]) => input.idempotencyKey)).size).toBe(29);
    expect(state.row.status).toBe('completed');
    expect(state.row.fulfillment_payload.remaining_tuition_cents).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});
