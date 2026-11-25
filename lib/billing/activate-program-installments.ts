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
    .select('id,cadence,updated_at,fulfillment_payload,collection_mode,provider_status,provider_subscription_id,fulfillment_type')
    .eq('customer_external_key', `user:${payment.userId}`)
    .eq('canonical_product_key', `program-installments-${payment.programId}`)
    .eq('provider', 'quickbooks')
    .eq('status', 'paused');
  if (schedules.error) throw new Error('The payment schedule could not be loaded.');
  for (const row of schedules.data || []) {
    if (row.collection_mode === 'automatic') {
      // The database refuses to activate an automatic schedule whose
      // collection provider is not fully active
      // (enforce_automatic_billing_activation: paypal + subscription +
      // provider_status 'active', plus an approved recurring-tuition
      // migration authorization for tuition schedules). Attempting the
      // update anyway throws AFTER the enrollment was already activated,
      // stranding a paid student mid-flow — leave such schedules paused
      // until the student authorizes a collection method.
      if (!row.provider_subscription_id || row.provider_status !== 'active') continue;
      if (row.fulfillment_type === 'tuition_payment') {
        const authorization = await db
          .from('billing_migration_authorizations')
          .select('id')
          .eq('billing_schedule_id', row.id)
          .eq('status', 'approved')
          .eq('authorization_scope', 'recurring_tuition')
          .maybeSingle();
        if (authorization.error || !authorization.data) continue;
      }
    }
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

