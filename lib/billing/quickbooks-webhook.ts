import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyQuickBooksWebhook(rawBody: string, signature: string | null, verifier: string): boolean {
  if (!signature || !verifier) return false;
  const expected = createHmac('sha256', verifier).update(rawBody, 'utf8').digest('base64');
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function normalizeQuickBooksInvoiceStatus(invoice: { Balance?: number; TxnStatus?: string; EmailStatus?: string }): 'open' | 'paid' | 'void' {
  if (invoice.TxnStatus?.toLowerCase() === 'voided') return 'void';
  if (typeof invoice.Balance !== 'number' || !Number.isFinite(invoice.Balance) || invoice.Balance < 0) {
    throw new Error('A verified QuickBooks invoice balance is required.');
  }
  return invoice.Balance === 0 ? 'paid' : 'open';
}

/** Provider and ledger must describe the same explicit checkout revision. */
export function quickBooksRevisionMatches(invoice: { PrivateNote?: unknown }, payload?: Record<string, unknown> | null): boolean {
  const marker = typeof invoice.PrivateNote === 'string' ? invoice.PrivateNote.match(/checkout-revision=[a-f0-9]{64}/)?.[0] : undefined;
  return marker === undefined || marker === payload?.checkout_revision_marker;
}

export function invoiceIdsFromWebhook(payload: any): string[] {
  const ids = new Set<string>();
  for (const notification of payload?.eventNotifications || []) {
    for (const entity of notification?.dataChangeEvent?.entities || []) {
      if (entity?.name === 'Invoice' && typeof entity.id === 'string') ids.add(entity.id);
    }
  }
  return [...ids];
}
