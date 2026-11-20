import { describe, expect, it } from 'vitest';
import {
  affirmInvoiceOrderId,
  invoiceBelongsToUser,
  isAffirmInvoiceAmount,
} from '@/lib/billing/invoice-checkout';

import { invoiceLineDescriptions } from '@/lib/billing/invoice-display';

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

  it('rejects email matches when another Elevate account owns the invoice', () => {
    for (const key of ['user:another-learner', 'd53ef845-b95a-4a70-8b54-9468dea338b6']) {
      expect(invoiceBelongsToUser({
        customer_external_key: key, customer_email: 'learner@example.com',
      }, 'user-1', 'learner@example.com')).toBe(false);
    }
  });

  it('uses the issued invoice charge descriptions and omits subtotal lines', () => {
    const line = { DetailType: 'SalesItemLineDetail', Description: 'Barber Apprenticeship – Week 4' };
    expect(invoiceLineDescriptions({ Line: [
      line, line, { DetailType: 'SubTotalLineDetail', Description: 'Subtotal' },
    ] })).toEqual(['Barber Apprenticeship – Week 4']);
    expect(invoiceLineDescriptions({ Line: null })).toEqual([]);
  });

  it('binds the Affirm order to the exact invoice and amount', () => {
    expect(affirmInvoiceOrderId('invoice-1', 10_000)).toBe('billing-invoice--invoice-1--10000');
    expect(isAffirmInvoiceAmount(5_000)).toBe(true);
    expect(isAffirmInvoiceAmount(3_000_000)).toBe(true);
    expect(isAffirmInvoiceAmount(4_999)).toBe(false);
    expect(isAffirmInvoiceAmount(3_000_001)).toBe(false);
  });
});
