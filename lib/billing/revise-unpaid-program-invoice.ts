import 'server-only';
import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ManualInvoiceInput } from './contracts';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';

export class InvoiceTermsConflict extends Error {}

interface ProviderInvoice {
  Id: string;
  SyncToken: string;
  TotalAmt: number;
  Balance: number;
  CustomerRef: { value: string };
  InvoiceLink?: string;
  DocNumber?: string;
  PrivateNote?: string;
  Line?: Array<{
    Id?: string;
    Amount: number;
    DetailType: string;
    SalesItemLineDetail?: {
      ItemRef: { value: string; name?: string };
      Qty?: number;
      UnitPrice?: number;
      TaxCodeRef?: { value: string };
    };
  }>;
}

export interface TrackedProgramInvoice {
  id: string;
  provider_invoice_id: string;
  customer_external_key: string;
  customer_email: string;
  status: string;
  total_cents: number;
  payment_url: string | null;
  fulfillment_type: string | null;
  fulfillment_payload: Record<string, unknown>;
  provider_payload: ProviderInvoice;
}

/** Update the same invoice, rather than issuing a second payable tuition bill.
 * Fresh provider balance + SyncToken protect payments; the conditional ledger
 * write protects a concurrent webhook. A retry reconciles an already-updated
 * provider invoice if the previous local write failed. */
export async function reviseUnpaidProgramInvoice(
  db: SupabaseClient,
  stored: TrackedProgramInvoice,
  input: ManualInvoiceInput,
  amountCents: number,
) {
  const conflict = () =>
    new InvoiceTermsConflict(
      'This payment request changed or already has a payment. Contact admissions before paying again.',
    );
  const payload = input.fulfillment?.payload;
  if (
    !input.allowUnpaidProgramRevision ||
    input.fulfillment?.type !== 'program_enrollment' ||
    stored.fulfillment_type !== 'program_enrollment' ||
    !['open', 'past_due'].includes(stored.status) ||
    stored.customer_external_key !== input.customer.externalKey ||
    stored.customer_email.toLowerCase() !== input.customer.email.toLowerCase() ||
    !payload ||
    !['enrollment_id', 'student_id', 'program_id'].every(
      (key) => typeof payload[key] === 'string' && payload[key] === stored.fulfillment_payload[key],
    )
  )
    throw conflict();

  const config = await loadQuickBooksConfig(db);
  const revision = createHash('sha256')
    .update(JSON.stringify({ key: input.idempotencyKey, amountCents, payload }))
    .digest('hex');
  const revisionMarker = `checkout-revision=${revision}`;
  let { Invoice: invoice } = await quickBooksRequest<{ Invoice: ProviderInvoice }>(
    db,
    config,
    `invoice/${encodeURIComponent(stored.provider_invoice_id)}`,
  );
  const cents = (value: number) => Math.round(Number(value) * 100);
  if (
    !invoice ||
    String(invoice.Id) !== stored.provider_invoice_id ||
    !invoice.CustomerRef?.value ||
    invoice.CustomerRef.value !== stored.provider_payload?.CustomerRef?.value ||
    typeof invoice.SyncToken !== 'string' ||
    !Number.isFinite(invoice.TotalAmt) ||
    !Number.isFinite(invoice.Balance) ||
    invoice.TotalAmt <= 0 ||
    invoice.Balance < 0 ||
    invoice.Balance > invoice.TotalAmt ||
    (cents(invoice.Balance) !== cents(invoice.TotalAmt) &&
      !(
        cents(invoice.TotalAmt) === amountCents && invoice.PrivateNote?.includes(revisionMarker)
      )) ||
    ![Number(stored.total_cents), amountCents].includes(cents(invoice.TotalAmt))
  )
    throw conflict();

  if (cents(invoice.TotalAmt) !== amountCents || !invoice.PrivateNote?.includes(revisionMarker)) {
    const lines = invoice.Line?.filter((line) => line.DetailType === 'SalesItemLineDetail') || [];
    const line = lines[0];
    // Enrollment invoices have one untaxed tuition line. Don't overwrite an
    // invoice that an accountant has split, taxed, or otherwise adjusted.
    if (
      input.lines.length !== 1 ||
      input.lines[0].quantity !== 1 ||
      lines.length !== 1 ||
      !line?.Id ||
      !line.SalesItemLineDetail?.ItemRef?.value ||
      (line.SalesItemLineDetail.Qty ?? 1) !== 1 ||
      cents(line.Amount) !== cents(invoice.TotalAmt) ||
      invoice.Line?.some(
        (row) =>
          !['SalesItemLineDetail', 'SubTotalLineDetail', 'DescriptionOnly'].includes(
            row.DetailType,
          ),
      )
    )
      throw conflict();
    const requestId = createHash('sha256')
      .update(`${input.idempotencyKey}:${invoice.SyncToken}:${revision}`)
      .digest('hex')
      .slice(0, 50);
    try {
      const updated = await quickBooksRequest<{ Invoice: ProviderInvoice }>(
        db,
        config,
        `invoice?requestid=${requestId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            Id: invoice.Id,
            SyncToken: invoice.SyncToken,
            sparse: true,
            PrivateNote: `${input.memo || 'Elevate enrollment'} | key=${input.idempotencyKey} | ${revisionMarker}`,
            Line: [
              {
                Id: line.Id,
                Amount: amountCents / 100,
                DetailType: 'SalesItemLineDetail',
                Description: input.lines[0].description || input.lines[0].name,
                SalesItemLineDetail: {
                  ItemRef: line.SalesItemLineDetail.ItemRef,
                  ...(line.SalesItemLineDetail.TaxCodeRef
                    ? { TaxCodeRef: line.SalesItemLineDetail.TaxCodeRef }
                    : {}),
                  Qty: 1,
                  UnitPrice: amountCents / 100,
                },
              },
            ],
          }),
        },
      );
      invoice = updated.Invoice;
    } catch {
      throw conflict(); // Includes a stale SyncToken when a payment wins the race.
    }
  }
  if (
    !invoice ||
    String(invoice.Id) !== stored.provider_invoice_id ||
    invoice.CustomerRef?.value !== stored.provider_payload.CustomerRef.value ||
    cents(invoice.TotalAmt) !== amountCents ||
    !invoice.PrivateNote?.includes(revisionMarker) ||
    !Number.isFinite(invoice.Balance) ||
    invoice.Balance < 0 ||
    invoice.Balance > invoice.TotalAmt
  )
    throw conflict();

  const paymentUrl = invoice.InvoiceLink || stored.payment_url || undefined;
  const saved = await db
    .from('billing_invoices')
    .update({
      total_cents: amountCents,
      fulfillment_payload: {
        ...payload,
        checkout_revision_marker: revisionMarker,
        previous_required_amount_cents: stored.total_cents,
      },
      provider_payload: invoice,
      payment_url: paymentUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stored.id)
    .eq('total_cents', stored.total_cents)
    .in('status', ['open', 'past_due'])
    .is('paid_at', null)
    .select('id')
    .maybeSingle();
  if (saved.error || !saved.data)
    throw new InvoiceTermsConflict(
      'Payment terms are being reconciled. Refresh checkout before paying.',
    );
  return {
    provider: 'quickbooks' as const,
    providerInvoiceId: invoice.Id,
    invoiceNumber: invoice.DocNumber,
    paymentUrl,
    totalCents: amountCents,
  };
}
