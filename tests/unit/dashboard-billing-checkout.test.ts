import { describe, expect, it } from 'vitest';
import {
  affirmInvoiceOrderId,
  invoiceBelongsToUser,
  isAffirmInvoiceAmount,
} from '@/lib/billing/invoice-checkout';

describe('dashboard billing checkout', () => {
  it('matches invoices by either Elevate user key or verified account email', () => {
    expect(
      invoiceBelongsToUser(
        { customer_external_key: 'user:user-1', customer_email: null },
        'user-1',
        'learner@example.com',
      ),
    ).toBe(true);
    expect(
      invoiceBelongsToUser(
        { customer_external_key: '4', customer_email: 'Learner@Example.com' },
        'user-1',
        'learner@example.com',
      ),
    ).toBe(true);
    expect(
      invoiceBelongsToUser(
        { customer_external_key: '4', customer_email: 'other@example.com' },
        'user-1',
        'learner@example.com',
      ),
    ).toBe(false);
  });

  it('binds the Affirm order to the exact invoice and amount', () => {
    expect(affirmInvoiceOrderId('invoice-1', 10_000)).toBe('billing-invoice--invoice-1--10000');
    expect(isAffirmInvoiceAmount(5_000)).toBe(true);
    expect(isAffirmInvoiceAmount(3_000_000)).toBe(true);
    expect(isAffirmInvoiceAmount(4_999)).toBe(false);
    expect(isAffirmInvoiceAmount(3_000_001)).toBe(false);
  });
});
