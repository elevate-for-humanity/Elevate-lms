import { processCleaningOutbox } from '@/lib/cleaning/outbox';
import { NextRequest, NextResponse } from 'next/server';
import { fulfillPaidBillingInvoice } from '@/lib/billing/fulfillment';
import { recordStoreSubscriptionPayment } from '@/lib/store/subscription-ledger';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

export interface BillingFulfillmentProcessingResult {
  processed: number;
  completed: number;
  failed: number;
  skipped: number;
  error?: string;
}

/**
 * Drain the billing fulfillment outbox. This is the only code that advances
 * a paid invoice into its enrollment/subscription effects, so every path
 * that confirms a payment (QuickBooks webhook, learner payment refresh)
 * calls it inline right after queueing; the cron route remains as the
 * retry sweeper for anything that still fails here.
 */
export async function processBillingFulfillmentJobs(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  limit = 100,
): Promise<BillingFulfillmentProcessingResult> {
  const { data: jobs, error } = await db
    .from('billing_fulfillment_jobs')
    .select('id,billing_invoice_id,fulfillment_type,payload,attempts')
    .in('status', ['pending', 'failed'])
    .lt('attempts', 5)
    .order('created_at')
    .limit(limit);
  if (error) return { processed: 0, completed: 0, failed: 0, skipped: 0, error: 'Could not load billing fulfillment jobs.' };
  let completed = 0;
  let failed = 0;
  let skipped = 0;
  for (const job of jobs || []) {
    const claimed = await db
      .from('billing_fulfillment_jobs')
      .update({
        status: 'processing',
        attempts: job.attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id)
      .in('status', ['pending', 'failed'])
      .select('id')
      .maybeSingle();
    if (claimed.error) {
      failed += 1;
      continue;
    }
    if (!claimed.data) {
      skipped += 1;
      continue;
    }
    try {
      const invoice = await db
        .from('billing_invoices')
        .select('status,fulfillment_type,fulfillment_payload,paid_at,customer_email')
        .eq('id', job.billing_invoice_id)
        .maybeSingle();
      if (
        invoice.error ||
        invoice.data?.status !== 'paid' ||
        invoice.data?.fulfillment_type !== job.fulfillment_type
      )
        throw new Error('Paid invoice delivery could not be verified.');
      if (['platform_subscription', 'individual_app_subscription'].includes(job.fulfillment_type)) {
        // Confirm the independent commerce ledger before granting application
        // access. A failed destination delivery stays retryable in this outbox.
        await recordStoreSubscriptionPayment(job.billing_invoice_id);
      }
      await fulfillPaidBillingInvoice(db, {
        ...job,
        payload: invoice.data.fulfillment_payload,
        paid_at: invoice.data.paid_at,
        customer_email: invoice.data.customer_email,
      });
      const saved = await db
        .from('billing_fulfillment_jobs')
        .update({ status: 'completed', last_error: null, updated_at: new Date().toISOString() })
        .eq('id', job.id);
      if (saved.error) throw new Error('Delivery completed but its status could not be saved.');
      completed += 1;
    } catch (cause) {
      failed += 1;
      const message = cause instanceof Error ? cause.message : String(cause);
      logger.error('[billing-fulfillment] job failed', cause, {
        jobId: job.id,
        type: job.fulfillment_type,
      });
      await db
        .from('billing_fulfillment_jobs')
        .update({
          status: 'failed',
          last_error: message.slice(0, 1000),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    }
  }
  return { processed: (jobs || []).length, completed, failed, skipped };
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await requireAdminClient();
  const result = await processBillingFulfillmentJobs(db);
  if (result.error)
    return NextResponse.json(
      { error: result.error },
      { status: 500 },
    );
  const { processed, completed, failed, skipped } = result;
  let cleaningNotifications: { sent: number; held: number } | null = null;
  let cleaningNotificationError: string | null = null;
  try { cleaningNotifications = await processCleaningOutbox(db); } catch { cleaningNotificationError = 'Cleaning notification processing needs review.'; }
  // Notification failure is reported separately; unrelated paid deliveries retain their own result.
  return NextResponse.json(
    { cleaningNotifications, cleaningNotificationError, ok: failed === 0 && !cleaningNotificationError, processed, completed, failed, skipped },
    { status: failed || cleaningNotificationError ? 207 : 200 },
  );
}
