import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

export type MicrocourseWebhookResult = {
  handled: boolean;
  response?: Record<string, boolean | string>;
};

async function ledgerExists(db: SupabaseClient, key: string) {
  const { data } = await db.from('microcourse_settlement_ledger').select('id').eq('idempotency_key', key).maybeSingle();
  return Boolean(data);
}

async function settlePaidOrder(event: Stripe.Event, session: Stripe.Checkout.Session, stripe: Stripe, db: SupabaseClient) {
  const orderId = session.metadata?.order_id;
  if (!orderId || session.metadata?.kind !== 'microcourse_purchase') return { handled: false };
  if (session.payment_status !== 'paid') return { handled: true, response: { received: true, pending: true } };

  const paymentKey = `microcourse:${event.id}:payment`;
  if (await ledgerExists(db, paymentKey)) return { handled: true, response: { received: true, duplicate: true } };

  const { data: order, error: orderError } = await db.from('microcourse_orders').select('*').eq('id', orderId).single();
  if (orderError || !order) throw orderError || new Error('Microcourse order not found');

  if (session.amount_total !== order.retail_total_cents || session.currency !== order.currency) {
    throw new Error('Paid Stripe total does not match the microcourse order');
  }

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) throw new Error('Paid microcourse checkout has no PaymentIntent');
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargeId = typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : paymentIntent.latest_charge?.id;
  if (!chargeId) throw new Error('Paid microcourse checkout has no charge');

  await db.from('microcourse_orders').update({
    stripe_payment_intent_id: paymentIntentId,
    stripe_charge_id: chargeId,
    customer_email: session.customer_details?.email?.toLowerCase() || order.customer_email,
    status: 'provider_transfer_pending',
    access_status: 'provisioning',
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', order.id);

  const { error: paymentLedgerError } = await db.from('microcourse_settlement_ledger').insert({
    order_id: order.id,
    event_type: 'payment',
    amount_cents: order.retail_total_cents,
    currency: order.currency,
    stripe_event_id: event.id,
    stripe_object_id: paymentIntentId,
    idempotency_key: paymentKey,
  });
  if (paymentLedgerError && paymentLedgerError.code !== '23505') throw paymentLedgerError;

  const { data: items, error: itemsError } = await db.from('microcourse_order_items').select('*').eq('order_id', order.id);
  if (itemsError || !items) throw itemsError || new Error('Microcourse order items not found');

  for (const item of items) {
    if (item.transfer_status === 'transferred') continue;
    const { data: provider, error: providerError } = await db.from('microcourse_providers')
      .select('stripe_account_id,active,transfers_capability_status').eq('id', item.provider_id).single();
    if (providerError || !provider) throw providerError || new Error('Microcourse provider not found');
    if (!provider.active || provider.transfers_capability_status !== 'active' || !provider.stripe_account_id) {
      throw new Error('Provider is not eligible to receive transfers');
    }

    const transfer = await stripe.transfers.create({
      amount: item.provider_cost_cents,
      currency: order.currency,
      destination: provider.stripe_account_id,
      source_transaction: chargeId,
      transfer_group: order.transfer_group,
      metadata: { kind: 'microcourse_provider_settlement', order_id: order.id, order_item_id: item.id },
    }, { idempotencyKey: `microcourse-transfer-${item.id}` });

    const { error: itemError } = await db.from('microcourse_order_items').update({
      provider_transfer_id: transfer.id,
      transfer_status: 'transferred',
      access_status: 'ready',
    }).eq('id', item.id).eq('transfer_status', 'pending');
    if (itemError) throw itemError;

    const { error: ledgerError } = await db.from('microcourse_settlement_ledger').insert([
      {
        order_id: order.id, order_item_id: item.id, event_type: 'provider_transfer',
        amount_cents: -item.provider_cost_cents, currency: order.currency,
        stripe_event_id: event.id, stripe_object_id: transfer.id,
        idempotency_key: `microcourse:${item.id}:provider-transfer`,
      },
      {
        order_id: order.id, order_item_id: item.id, event_type: 'elevate_markup',
        amount_cents: item.retail_price_cents - item.provider_cost_cents, currency: order.currency,
        stripe_event_id: event.id, stripe_object_id: paymentIntentId,
        idempotency_key: `microcourse:${item.id}:elevate-markup`,
      },
    ]);
    if (ledgerError && ledgerError.code !== '23505') throw ledgerError;
  }

  await db.from('microcourse_orders').update({
    status: 'access_ready', access_status: 'ready', updated_at: new Date().toISOString(),
  }).eq('id', order.id);

  return { handled: true, response: { received: true } };
}

async function reverseOrderTransfers(event: Stripe.Event, charge: Stripe.Charge, stripe: Stripe, db: SupabaseClient, disputed: boolean) {
  const { data: order } = await db.from('microcourse_orders').select('*').eq('stripe_charge_id', charge.id).maybeSingle();
  if (!order) return { handled: false };

  const { data: items, error } = await db.from('microcourse_order_items').select('*').eq('order_id', order.id);
  if (error) throw error;
  for (const item of items || []) {
    if (!item.provider_transfer_id || item.transfer_status !== 'transferred') continue;
    const key = `microcourse:${event.id}:reversal:${item.id}`;
    if (await ledgerExists(db, key)) continue;
    const reversal = await stripe.transfers.createReversal(item.provider_transfer_id, {
      amount: item.provider_cost_cents,
      metadata: { order_id: order.id, order_item_id: item.id, reason: disputed ? 'dispute' : 'refund' },
    }, { idempotencyKey: key });
    await db.from('microcourse_order_items').update({ transfer_status: 'reversed', access_status: disputed ? 'paused' : 'revoked' }).eq('id', item.id);
    await db.from('microcourse_settlement_ledger').insert({
      order_id: order.id, order_item_id: item.id, event_type: 'transfer_reversal',
      amount_cents: item.provider_cost_cents, currency: order.currency,
      stripe_event_id: event.id, stripe_object_id: reversal.id, idempotency_key: key,
    });
  }
  await db.from('microcourse_orders').update({
    status: disputed ? 'disputed' : 'refunded',
    access_status: disputed ? 'paused' : 'revoked',
    updated_at: new Date().toISOString(),
  }).eq('id', order.id);
  return { handled: true, response: { received: true } };
}

export async function processMicrocourseStripeEvent(
  event: Stripe.Event,
  dependencies: { stripe: Stripe; supabase: SupabaseClient },
): Promise<MicrocourseWebhookResult> {
  const { stripe, supabase } = dependencies;
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    return settlePaidOrder(event, event.data.object as Stripe.Checkout.Session, stripe, supabase);
  }
  if (event.type === 'charge.refunded') {
    return reverseOrderTransfers(event, event.data.object as Stripe.Charge, stripe, supabase, false);
  }
  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute;
    const charge = await stripe.charges.retrieve(typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id);
    return reverseOrderTransfers(event, charge, stripe, supabase, true);
  }
  return { handled: false };
}
