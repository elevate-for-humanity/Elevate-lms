import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { invoiceIdsFromWebhook, normalizeQuickBooksInvoiceStatus, verifyQuickBooksWebhook } from '@/lib/billing/quickbooks-webhook';

describe('QuickBooks webhook normalization', () => {
  it('verifies Intuit HMAC signatures', () => {
    const body = '{"eventNotifications":[]}';
    const signature = createHmac('sha256', 'secret').update(body).digest('base64');
    expect(verifyQuickBooksWebhook(body, signature, 'secret')).toBe(true);
    expect(verifyQuickBooksWebhook(body + 'x', signature, 'secret')).toBe(false);
  });
  it('deduplicates invoice ids', () => {
    const event = { eventNotifications: [{ dataChangeEvent: { entities: [{ name: 'Invoice', id: '1' }, { name: 'Invoice', id: '1' }, { name: 'Customer', id: '2' }] } }] };
    expect(invoiceIdsFromWebhook(event)).toEqual(['1']);
  });
  it('maps paid and void invoices', () => {
    expect(normalizeQuickBooksInvoiceStatus({ Balance: 0 })).toBe('paid');
    expect(normalizeQuickBooksInvoiceStatus({ Balance: 5 })).toBe('open');
    expect(normalizeQuickBooksInvoiceStatus({ Balance: 0, TxnStatus: 'Voided' })).toBe('void');
  });
});
