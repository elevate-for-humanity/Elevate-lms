import { NextRequest, NextResponse } from 'next/server';
import { createQuickBooksBillingProvider } from '@/lib/billing/providers/quickbooks';
import { nextInvoiceDate, type BillingCadence } from '@/lib/billing/schedule';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: schedules, error } = await db
    .from('billing_schedules')
    .select('*')
    .eq('provider', 'quickbooks')
    .eq('status', 'active')
    .lte('next_invoice_date', today)
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const provider = createQuickBooksBillingProvider(db);
  const results: Array<{ scheduleId: string; ok: boolean; error?: string }> = [];
  for (const schedule of schedules || []) {
    try {
      await provider.createManualInvoice({
        idempotencyKey: `schedule:${schedule.id}:${schedule.next_invoice_date}`,
        customer: {
          externalKey: schedule.customer_external_key,
          displayName: schedule.customer_name,
          email: schedule.customer_email,
        },
        lines: [
          {
            canonicalKey: schedule.canonical_product_key,
            name: schedule.product_name,
            description: schedule.product_description || undefined,
            quantity: 1,
            unitAmountCents: schedule.amount_cents,
          },
        ],
        dueDate: schedule.next_invoice_date,
        memo: `Scheduled ${schedule.cadence} Elevate invoice`,
        fulfillment: schedule.fulfillment_type
          ? {
              type: schedule.fulfillment_type,
              payload: schedule.fulfillment_payload || {},
            }
          : undefined,
      });
      const remaining =
        schedule.remaining_invoices == null ? null : Math.max(0, schedule.remaining_invoices - 1);
      const completed = remaining === 0;
      const update = await db
        .from('billing_schedules')
        .update({
          remaining_invoices: remaining,
          status: completed ? 'completed' : 'active',
          next_invoice_date: completed
            ? schedule.next_invoice_date
            : nextInvoiceDate(schedule.next_invoice_date, schedule.cadence as BillingCadence),
          updated_at: new Date().toISOString(),
        })
        .eq('id', schedule.id)
        .eq('next_invoice_date', schedule.next_invoice_date);
      if (update.error) throw new Error(update.error.message);
      results.push({ scheduleId: schedule.id, ok: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unknown billing error';
      logger.error('[billing-schedule] invoice generation failed', cause, {
        scheduleId: schedule.id,
      });
      results.push({ scheduleId: schedule.id, ok: false, error: message });
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  return NextResponse.json(
    { ok: failed === 0, processed: results.length, failed, results },
    { status: failed ? 207 : 200 },
  );
}
