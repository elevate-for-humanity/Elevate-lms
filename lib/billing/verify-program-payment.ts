import 'server-only';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';
import { normalizeQuickBooksInvoiceStatus } from './quickbooks-webhook';

/** Recover a delayed callback through the authenticated provider API, never a browser paid flag. */
export async function refreshOwnedProgramPayment(db: any, row: any, userId: string) {
  if (row.customer_external_key !== `user:${userId}` || row.fulfillment_payload?.student_id !== userId)
    throw new Error('The payment request does not belong to this learner.');
  if (row.status === 'paid') return;
  if (row.provider !== 'quickbooks' || !row.provider_invoice_id || !['open', 'past_due'].includes(row.status)) return;
  const config = await loadQuickBooksConfig(db);
  const result = await quickBooksRequest<any>(db, config,
    `invoice/${encodeURIComponent(row.provider_invoice_id)}`);
  const invoice = result.Invoice;
  const originalCustomer = row.provider_payload?.CustomerRef?.value;
  if (!originalCustomer || String(invoice?.Id) !== String(row.provider_invoice_id) ||
      String(invoice?.CustomerRef?.value) !== String(originalCustomer) ||
      Math.round(Number(invoice?.TotalAmt) * 100) !== Number(row.total_cents) ||
      !(Number(row.total_cents) > 0)) throw new Error('The provider invoice does not match the checkout.');
  if (normalizeQuickBooksInvoiceStatus(invoice) !== 'paid') return;
  const paidAt = new Date().toISOString();
  const saved = await db.from('billing_invoices').update({ status: 'paid', paid_at: paidAt,
    provider_payload: invoice, updated_at: paidAt }).eq('id', row.id)
    .eq('customer_external_key', `user:${userId}`).in('status', ['open', 'past_due']);
  if (saved.error) throw new Error('Confirmed payment could not be saved.');
  // The same durable fulfillment contract is used by the signed webhook.
  const queued = await db.from('billing_fulfillment_jobs').upsert({
    billing_invoice_id: row.id, fulfillment_type: row.fulfillment_type,
    payload: row.fulfillment_payload, status: 'pending', updated_at: paidAt,
  }, { onConflict: 'billing_invoice_id', ignoreDuplicates: true });
  if (queued.error) throw new Error('Confirmed payment fulfillment could not be queued.');
}
