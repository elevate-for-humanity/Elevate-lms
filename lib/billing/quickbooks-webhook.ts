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
  return Number(invoice.Balance ?? 0) <= 0 ? 'paid' : 'open';
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
