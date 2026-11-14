import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { activateProgramInstallments } from '@/lib/billing/activate-program-installments';

afterEach(() => vi.useRealTimers());
describe('paid application installment activation', () => {
  const payment = {
    userId: 'student',
    programId: 'barber',
    invoiceId: 'deposit',
    paidCents: 60000,
    tuitionCents: 498000,
  };
  function fixture(terms: Record<string, unknown>) {
    const writes: unknown[] = [];
    const from = vi.fn(() => {
      const q: any = {
        select: () => q,
        eq: () => q,
        update: (value: unknown) => {
          writes.push(value);
          return q;
        },
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({
            error: null,
            data: [
              {
                id: 'schedule',
                cadence: 'weekly',
                updated_at: 'previous-version',
                fulfillment_payload: terms,
              },
            ],
          }).then(resolve),
      };
      return q;
    });
    return { db: { from } as unknown as SupabaseClient, writes, from };
  }
  it('never activates an older installment schedule after full tuition is paid', async () => {
    const f = fixture({});
    await activateProgramInstallments(f.db, { ...payment, paidCents: 498000 });
    expect(f.from).not.toHaveBeenCalled();
  });
  it.each([
    { initial_invoice_id: 'other' },
    {
      initial_invoice_id: 'deposit',
      initial_payment_amount_cents: 200000,
      total_tuition_cents: 498000,
    },
    {
      initial_invoice_id: 'deposit',
      initial_payment_amount_cents: 60000,
      total_tuition_cents: 468000,
    },
  ])('leaves a schedule for different payment terms paused', async (terms) => {
    const f = fixture(terms);
    await activateProgramInstallments(f.db, payment);
    expect(f.writes).toHaveLength(0);
  });
  it('activates only the matching plan and starts it on the following Friday after the full application', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T15:00:00Z'));
    const f = fixture({
      initial_invoice_id: 'deposit',
      initial_payment_amount_cents: 60000,
      total_tuition_cents: 498000,
    });
    await activateProgramInstallments(f.db, payment);
    expect(f.writes).toEqual([
      expect.objectContaining({ status: 'active', next_invoice_date: '2026-11-27' }),
    ]);
  });
});
