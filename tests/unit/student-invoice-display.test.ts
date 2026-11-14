import { describe, it, expect } from 'vitest';
import { isIssuedStudentInvoice } from '../../lib/billing/invoice-display';
describe('student invoice history', () => {
  it('excludes failed QuickBooks creation records without mislabeling them as failed payments', () => {
    expect(
      isIssuedStudentInvoice({
        provider: 'quickbooks',
        status: 'failed',
        provider_invoice_id: null,
      }),
    ).toBe(false);
  });
  it('preserves issued invoices, real payment failures and paid records', () => {
    expect(
      isIssuedStudentInvoice({
        provider: 'quickbooks',
        status: 'failed',
        provider_invoice_id: 'issued-invoice',
      }),
    ).toBe(true);
    expect(
      isIssuedStudentInvoice({ provider: 'paypal', status: 'failed', provider_invoice_id: null }),
    ).toBe(true);
    expect(
      isIssuedStudentInvoice({
        provider: 'quickbooks',
        status: 'paid',
        provider_invoice_id: 'paid-invoice',
      }),
    ).toBe(true);
  });
});
