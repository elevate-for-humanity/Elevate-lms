import { NextRequest, NextResponse } from 'next/server';
import {
  apprenticeInvoiceEmail,
  apprenticeInvoiceIdempotencyKey,
  getApprenticeBillingAccess,
  nextWeeklyInvoiceDateAfter,
} from '@/lib/billing/apprentice-invoice-batch';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type BillingSchedule = {
  id: string;
  customer_external_key: string;
  customer_name: string;
  customer_email: string;
  canonical_product_key: string;
  product_name: string;
  product_description: string | null;
  amount_cents: number;
  next_invoice_date: string;
  remaining_invoices: number | null;
};

async function claimEmailDelivery(
  db: any,
  providerInvoiceId: string,
  schedule: BillingSchedule,
): Promise<{ eventId?: string; alreadySent: boolean }> {
  const providerEventId = `invoice-email:${providerInvoiceId}`;
  const inserted = await db
    .from('billing_provider_events')
    .insert({
      provider: 'quickbooks',
      provider_event_id: providerEventId,
      event_type: 'invoice.email',
      resource_id: providerInvoiceId,
      status: 'processing',
      payload: {
        billingScheduleId: schedule.id,
        recipient: schedule.customer_email,
      },
    })
    .select('id')
    .single();
  if (!inserted.error && inserted.data) {
    return { eventId: inserted.data.id, alreadySent: false };
  }
  if (inserted.error?.code !== '23505') {
    throw new Error(
      `Could not reserve invoice email: ${inserted.error?.message || 'unknown error'}`,
    );
  }

  const existing = await db
    .from('billing_provider_events')
    .select('id,status,attempts,updated_at')
    .eq('provider', 'quickbooks')
    .eq('provider_event_id', providerEventId)
    .maybeSingle();
  if (existing.error || !existing.data) {
    throw new Error(existing.error?.message || 'Could not load invoice email reservation.');
  }
  if (existing.data.status === 'completed') return { alreadySent: true };
  const retryBefore = Date.now() - 15 * 60 * 1000;
  if (
    existing.data.status === 'processing' &&
    new Date(existing.data.updated_at).getTime() > retryBefore
  ) {
    throw new Error('Invoice email delivery is already in progress.');
  }
  const claimed = await db
    .from('billing_provider_events')
    .update({
      status: 'processing',
      attempts: Number(existing.data.attempts || 1) + 1,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.data.id)
    .eq('status', existing.data.status)
    .select('id')
    .maybeSingle();
  if (claimed.error || !claimed.data) {
    throw new Error(claimed.error?.message || 'Another worker claimed this invoice email.');
  }
  return { eventId: claimed.data.id, alreadySent: false };
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const runAt = new Date();
  const today = runAt.toISOString().slice(0, 10);
  const { data, error } = await db
    .from('billing_schedules')
    .select(
      'id,customer_external_key,customer_name,customer_email,canonical_product_key,product_name,product_description,amount_cents,next_invoice_date,remaining_invoices',
    )
    .eq('provider', 'quickbooks')
    .eq('cadence', 'weekly')
    .eq('collection_mode', 'automatic')
    .eq('collection_provider', 'paypal')
    .eq('status', 'paused')
    .neq('provider_status', 'active')
    .like('canonical_product_key', '%apprenticeship-weekly-tuition')
    .lte('next_invoice_date', today)
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const provider = createQuickBooksBillingProvider(db);
  const results: Array<{
    scheduleId: string;
    ok: boolean;
    invoiceNumber?: string;
    emailed?: boolean;
    error?: string;
  }> = [];

  for (const rawSchedule of data || []) {
    const schedule = rawSchedule as BillingSchedule;
    const idempotencyKey = apprenticeInvoiceIdempotencyKey(schedule.id, runAt);
    try {
      const invoice = await provider.createManualInvoice({
        idempotencyKey,
        customer: {
          externalKey: schedule.customer_external_key,
          displayName: schedule.customer_name,
          email: schedule.customer_email,
        },
        dueDate: today,
        memo: `Weekly apprentice tuition invoice while PayPal automatic billing is pending | schedule=${schedule.id}`,
        lines: [
          {
            canonicalKey: schedule.canonical_product_key,
            name: schedule.product_name,
            description:
              schedule.product_description ||
              'Weekly apprenticeship tuition while PayPal automatic billing is pending',
            quantity: 1,
            unitAmountCents: Number(schedule.amount_cents),
          },
        ],
      });

      const delivery = await claimEmailDelivery(db, invoice.providerInvoiceId, schedule);
      let emailed = delivery.alreadySent;
      if (!delivery.alreadySent && delivery.eventId) {
        const userId = schedule.customer_external_key.replace(/^user:/, '');
        const billingAccess = await getApprenticeBillingAccess(db, userId, today);
        const content = apprenticeInvoiceEmail({
          customerName: schedule.customer_name,
          productName: schedule.product_name,
          invoiceNumber: invoice.invoiceNumber,
          amountCents: Number(schedule.amount_cents),
          dueDate: today,
          paymentUrl: invoice.paymentUrl,
          openInvoices: billingAccess.openInvoices,
        });
        const sent = await sendEmail({
          to: schedule.customer_email,
          subject: content.subject,
          html: content.html,
          text: content.text,
          replyTo: 'billing@elevateforhumanity.org',
        });
        await db
          .from('billing_provider_events')
          .update({
            status: sent.success ? 'completed' : 'failed',
            error_message: sent.error || null,
            processed_at: sent.success ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            payload: {
              billingScheduleId: schedule.id,
              recipient: schedule.customer_email,
              emailProvider: sent.data?.provider || 'sendgrid',
              messageId: sent.data?.messageId || null,
            },
          })
          .eq('id', delivery.eventId);
        if (!sent.success) throw new Error(sent.error || 'Invoice email was not accepted.');
        emailed = true;
      }

      const userId = schedule.customer_external_key.replace(/^user:/, '');
      const billingAccess = await getApprenticeBillingAccess(db, userId, today);
      if (billingAccess.suspended) {
        const { error: signOutError } = await db.auth.admin.signOut(userId);
        if (signOutError) {
          throw new Error(
            `Invoice email was sent, but session revocation failed: ${signOutError.message}`,
          );
        }
      }

      const remaining =
        schedule.remaining_invoices == null ? null : Math.max(0, schedule.remaining_invoices - 1);
      const nextDate = nextWeeklyInvoiceDateAfter(schedule.next_invoice_date, today);
      const advanced = await db
        .from('billing_schedules')
        .update({
          remaining_invoices: remaining,
          status: remaining === 0 ? 'completed' : 'paused',
          next_invoice_date: nextDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', schedule.id)
        .eq('next_invoice_date', schedule.next_invoice_date);
      if (advanced.error) throw new Error(advanced.error.message);

      results.push({
        scheduleId: schedule.id,
        ok: true,
        invoiceNumber: invoice.invoiceNumber,
        emailed,
      });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unknown invoice batch error';
      logger.error('[apprentice-invoice-batch] failed', cause, {
        scheduleId: schedule.id,
        idempotencyKey,
      });
      results.push({ scheduleId: schedule.id, ok: false, error: message });
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  return NextResponse.json(
    {
      ok: failed === 0,
      processed: results.length,
      sent: results.filter((result) => result.ok && result.emailed).length,
      failed,
      results,
    },
    { status: failed ? 207 : 200 },
  );
}
