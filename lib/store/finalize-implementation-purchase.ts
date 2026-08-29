import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export type FinalizeImplementationPurchaseResult = {
  success: boolean;
  orderId?: string;
  alreadyFinalized?: boolean;
  status?: 'deposit_paid' | 'paid_in_full';
  balanceDueCents?: number;
  error?: string;
};

function stripeId(value: string | { id: string } | null): string | null {
  if (typeof value === 'string') return value;
  return value?.id ?? null;
}

export async function finalizeImplementationPurchase({
  db,
  session,
}: {
  db: SupabaseClient;
  session: Stripe.Checkout.Session;
}): Promise<FinalizeImplementationPurchaseResult> {
  const metadata = session.metadata ?? {};
  if (
    metadata.kind !== 'implementation_package' ||
    metadata.checkout_type !== 'standalone_platform_build'
  ) {
    return { success: false, error: 'Not a standalone platform checkout session.' };
  }
  if (!['paid', 'no_payment_required'].includes(session.payment_status ?? '')) {
    return { success: false, error: 'Payment is not confirmed.' };
  }

  const orderId = metadata.implementation_order_id?.trim();
  if (!orderId) return { success: false, error: 'Implementation order metadata is missing.' };

  const { data: order, error: lookupError } = await db
    .from('implementation_orders')
    .select(
      'id,status,package_id,payment_choice,package_total_cents,checkout_amount_cents,stripe_checkout_session_id',
    )
    .eq('id', orderId)
    .maybeSingle();
  if (lookupError || !order) {
    logger.error('[implementation/finalize] pending order not found', lookupError ?? undefined, {
      orderId,
      stripeSessionId: session.id,
    });
    return { success: false, orderId, error: 'Pending implementation order was not found.' };
  }

  const completedStatuses = ['deposit_paid', 'paid_in_full'];
  if (
    completedStatuses.includes(String(order.status)) &&
    order.stripe_checkout_session_id === session.id
  ) {
    const paid = Number(session.amount_total || 0);
    return {
      success: true,
      orderId,
      alreadyFinalized: true,
      status: order.status as 'deposit_paid' | 'paid_in_full',
      balanceDueCents: Math.max(0, Number(order.package_total_cents || 0) - paid),
    };
  }
  if (order.status !== 'pending' && order.status !== 'payment_failed') {
    return { success: false, orderId, error: `Implementation order is ${order.status}.` };
  }

  const paidCents = Number(session.amount_total || 0);
  const expectedCents = Number(order.checkout_amount_cents || 0);
  const packageTotalCents = Number(order.package_total_cents || 0);
  if (
    paidCents < 1 ||
    paidCents !== expectedCents ||
    packageTotalCents < paidCents ||
    order.package_id !== metadata.implementation_package_id ||
    order.payment_choice !== metadata.payment_choice
  ) {
    logger.error('[implementation/finalize] Stripe/order validation mismatch', undefined, {
      orderId,
      stripeSessionId: session.id,
      paidCents,
      expectedCents,
      packageTotalCents,
    });
    return { success: false, orderId, error: 'Paid amount or package does not match the order.' };
  }

  const status = order.payment_choice === 'full' ? 'paid_in_full' : 'deposit_paid';
  const balanceDueCents = Math.max(0, packageTotalCents - paidCents);
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await db
    .from('implementation_orders')
    .update({
      status,
      amount_paid_cents: paidCents,
      balance_due_cents: balanceDueCents,
      customer_email: session.customer_details?.email ?? session.customer_email ?? null,
      customer_name: session.customer_details?.name ?? null,
      customer_phone: session.customer_details?.phone ?? null,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: stripeId(session.payment_intent),
      stripe_customer_id: stripeId(session.customer),
      paid_at: now,
      updated_at: now,
      metadata: {
        stripe_payment_status: session.payment_status,
        stripe_currency: session.currency,
      },
    })
    .eq('id', orderId)
    .in('status', ['pending', 'payment_failed'])
    .select('id')
    .maybeSingle();

  if (updateError || !updated) {
    const { data: recheck } = await db
      .from('implementation_orders')
      .select('status,stripe_checkout_session_id')
      .eq('id', orderId)
      .maybeSingle();
    if (
      completedStatuses.includes(String(recheck?.status)) &&
      recheck?.stripe_checkout_session_id === session.id
    ) {
      return { success: true, orderId, alreadyFinalized: true, status, balanceDueCents };
    }
    logger.error('[implementation/finalize] paid order update failed', updateError ?? undefined, {
      orderId,
      stripeSessionId: session.id,
    });
    return {
      success: false,
      orderId,
      error: 'Payment is confirmed but the implementation order could not be finalized.',
    };
  }

  return { success: true, orderId, status, balanceDueCents };
}

export async function markImplementationCheckoutStatus({
  db,
  session,
  status,
}: {
  db: SupabaseClient;
  session: Stripe.Checkout.Session;
  status: 'payment_failed' | 'cancelled';
}): Promise<void> {
  if (session.metadata?.kind !== 'implementation_package') return;
  const orderId = session.metadata.implementation_order_id?.trim();
  if (!orderId) return;
  await db
    .from('implementation_orders')
    .update({
      status,
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .in('status', ['pending', 'payment_failed']);
}
