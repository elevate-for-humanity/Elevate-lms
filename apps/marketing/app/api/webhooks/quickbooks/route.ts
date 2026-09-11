import { NextRequest, NextResponse } from 'next/server';
import {
  invoiceIdsFromWebhook,
  normalizeQuickBooksInvoiceStatus,
  verifyQuickBooksWebhook,
} from '@/lib/billing/quickbooks-webhook';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const verifier = process.env.QB_WEBHOOK_VERIFIER_TOKEN || '';
  if (!verifyQuickBooksWebhook(rawBody, request.headers.get('intuit-signature'), verifier)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const invoiceIds = invoiceIdsFromWebhook(payload);
  const db = await requireAdminClient();
  const config = await loadQuickBooksConfig(db);

  for (const invoiceId of invoiceIds) {
    try {
      const result = await quickBooksRequest<any>(
        db,
        config,
        `invoice/${encodeURIComponent(invoiceId)}`,
      );
      const invoice = result.Invoice;
      const status = normalizeQuickBooksInvoiceStatus(invoice);
      const update = await db
        .from('billing_invoices')
        .update({
          invoice_number: invoice.DocNumber || null,
          status,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
          payment_url: invoice.InvoiceLink || null,
          provider_payload: invoice,
          updated_at: new Date().toISOString(),
        })
        .eq('provider', 'quickbooks')
        .eq('provider_invoice_id', invoiceId)
        .select('id,fulfillment_type,fulfillment_payload')
        .maybeSingle();
      if (update.error) throw new Error(update.error.message);
      if (status === 'paid' && update.data?.fulfillment_type) {
        const queued = await db.from('billing_fulfillment_jobs').upsert(
          {
            billing_invoice_id: update.data.id,
            fulfillment_type: update.data.fulfillment_type,
            payload: update.data.fulfillment_payload || {},
            status: 'pending',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'billing_invoice_id', ignoreDuplicates: true },
        );
        if (queued.error) throw new Error(queued.error.message);
      }
    } catch (cause) {
      logger.error('[quickbooks-webhook] invoice synchronization failed', cause, { invoiceId });
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, processed: invoiceIds.length });
}
