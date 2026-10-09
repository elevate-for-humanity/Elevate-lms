import { describe, expect, it, vi } from 'vitest';
import { resolveQuickBooksInvoiceLink } from '../../lib/billing/quickbooks-invoice-link';

describe('QuickBooks invoice payment link', () => {
  it('requests the hosted online payment link when invoice creation omits it', async () => {
    const read = vi
      .fn()
      .mockResolvedValue({
        Invoice: { Id: '42', InvoiceLink: 'https://connect.intuit.com/pay/42' },
      });
    expect(await resolveQuickBooksInvoiceLink({ Id: '42' }, read)).toBe(
      'https://connect.intuit.com/pay/42',
    );
    expect(read).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledWith('invoice/42?include=invoiceLink');
  });
  it('reuses an existing link without another request', async () => {
    const read = vi.fn();
    expect(
      await resolveQuickBooksInvoiceLink(
        { Id: '42', InvoiceLink: 'https://connect.intuit.com/pay/42' },
        read,
      ),
    ).toBe('https://connect.intuit.com/pay/42');
    expect(read).not.toHaveBeenCalled();
  });
  it('does not invent a link when online payments are unavailable', async () => {
    expect(
      await resolveQuickBooksInvoiceLink({ Id: '42' }, async () => ({ Invoice: { Id: '42' } })),
    ).toBeUndefined();
  });
  it('propagates a connection error without creating another invoice', async () => {
    const read = vi.fn().mockRejectedValue(new Error('Unavailable'));
    await expect(resolveQuickBooksInvoiceLink({ Id: '42' }, read)).rejects.toThrow('Unavailable');
    expect(read).toHaveBeenCalledOnce();
  });
});
