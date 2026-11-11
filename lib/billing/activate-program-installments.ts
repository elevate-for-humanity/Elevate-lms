import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { firstWeeklyInvoiceDate } from '@/lib/programs/installment-terms';

/** A full-tuition payment must never activate an older deposit schedule. */
export async function activateProgramInstallments(
  db: SupabaseClient,
  payment: {
    userId: string;
    programId: string;
    invoiceId: string;
    paidCents: number;
    tuitionCents: number;
  },
) {
  if (payment.paidCents >= payment.tuitionCents) return;
  const schedules = await db
    .from('billing_schedules')
    .select('id,cadence,updated_at,fulfillment_payload')
    .eq('customer_external_key', `user:${payment.userId}`)
    .eq('canonical_product_key', `program-installments-${payment.programId}`)
    .eq('provider', 'quickbooks')
    .eq('status', 'paused');
  if (schedules.error) throw new Error('The payment schedule could not be loaded.');
  for (const row of schedules.data || []) {
    const terms = row.fulfillment_payload || {};
    if (
      terms.initial_invoice_id &&
      (terms.initial_invoice_id !== payment.invoiceId ||
        terms.initial_payment_amount_cents !== payment.paidCents ||
        terms.total_tuition_cents !== payment.tuitionCents)
    )
      continue;
    const now = new Date();
    const activated = await db
      .from('billing_schedules')
      .update({
        status: 'active',
        updated_at: now.toISOString(),
        ...(row.cadence === 'weekly' ? { next_invoice_date: firstWeeklyInvoiceDate(now) } : {}),
      })
      .eq('id', row.id)
      .eq('status', 'paused')
      .eq('updated_at', row.updated_at);
    if (activated.error) throw new Error('The payment schedule could not be activated.');
  }
}
