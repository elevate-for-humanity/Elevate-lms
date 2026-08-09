import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

type OrderSnapshotItem = {
  product_id: string;
  slug: string;
  name: string;
  unit_price_cents: number;
  quantity: number;
  type?: string | null;
  requires_shipping?: boolean | null;
  track_inventory?: boolean | null;
};

export type FinalizeCartPurchaseResult = {
  success: boolean;
  orderId?: string;
  alreadyFinalized?: boolean;
  error?: string;
};

/**
 * Finalize one Stripe-backed server cart purchase.
 *
 * Idempotency comes from store_orders.status plus the unique
 * store_orders.stripe_session_id and user_entitlements(user_id, product_id)
 * indexes shipped with the same remediation branch.
 */
export async function finalizeCartPurchase({
  db,
  session,
  expectedUserId,
}: {
  db: SupabaseClient;
  session: Stripe.Checkout.Session;
  expectedUserId?: string;
}): Promise<FinalizeCartPurchaseResult> {
  const metadata = session.metadata ?? {};
  if (metadata.kind !== 'store_purchase' || metadata.checkout_type !== 'store_cart') {
    return { success: false, error: 'Not a canonical store-cart checkout session.' };
  }

  if (!['paid', 'no_payment_required'].includes(session.payment_status ?? '')) {
    return { success: false, error: 'Payment is not confirmed.' };
  }

  const orderId = metadata.store_order_id?.trim();
  const userId = (metadata.user_id || session.client_reference_id || '').trim();
  if (!orderId || !userId) {
    return { success: false, error: 'Store checkout metadata is incomplete.' };
  }
  if (expectedUserId && expectedUserId !== userId) {
    return { success: false, error: 'Store order does not belong to this user.' };
  }

  const { data: order, error: orderError } = await db
    .from('store_orders')
    .select('id, user_id, status, total_cents, stripe_session_id, items')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order) {
    logger.error('[store/finalize] pending store order not found', orderError ?? undefined, {
      orderId,
      stripeSessionId: session.id,
    });
    return { success: false, error: 'Pending store order was not found.' };
  }
  if (order.user_id && order.user_id !== userId) {
    return { success: false, error: 'Store order user mismatch.' };
  }
  if (order.status === 'paid' && order.stripe_session_id === session.id) {
    return { success: true, orderId, alreadyFinalized: true };
  }
  if (order.status !== 'pending') {
    return { success: false, orderId, error: `Store order is ${order.status}.` };
  }

  const items = Array.isArray(order.items) ? (order.items as OrderSnapshotItem[]) : [];
  if (!items.length) {
    return { success: false, orderId, error: 'Store order has no item snapshot.' };
  }

  const expectedTotal = Number(order.total_cents || 0);
  const stripeTotal = Number(session.amount_total || 0);
  if (expectedTotal < 1 || stripeTotal !== expectedTotal) {
    logger.error('[store/finalize] Stripe/order total mismatch', undefined, {
      orderId,
      stripeSessionId: session.id,
      expectedTotal,
      stripeTotal,
    });
    return { success: false, orderId, error: 'Paid amount does not match the pending order.' };
  }

  const paymentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || session.id;
  const now = new Date().toISOString();
  const digitalItems = items.filter((item) => !item.requires_shipping);

  if (digitalItems.length) {
    const entitlementRows = digitalItems.map((item) => ({
      user_id: userId,
      product_id: item.product_id,
      name: item.name,
      description: `Store purchase: ${item.name}`,
      status: 'active',
      entitlement_type: item.type || 'store_product',
      granted_at: now,
      stripe_payment_id: paymentId,
      updated_at: now,
    }));

    const { error: entitlementError } = await db
      .from('user_entitlements')
      .upsert(entitlementRows, { onConflict: 'user_id,product_id' });
    if (entitlementError) {
      logger.error('[store/finalize] entitlement grant failed', entitlementError, {
        orderId,
        userId,
      });
      return { success: false, orderId, error: 'Payment is confirmed but digital access could not be granted.' };
    }
  }

  const shippingDetails =
    (session as Stripe.Checkout.Session & { shipping_details?: unknown }).shipping_details ??
    (session as Stripe.Checkout.Session & { collected_information?: { shipping_details?: unknown } })
      .collected_information?.shipping_details ??
    session.customer_details?.address ??
    {};

  const { data: updated, error: updateError } = await db
    .from('store_orders')
    .update({
      status: 'paid',
      stripe_session_id: session.id,
      shipping_address: shippingDetails,
      notes: `Stripe payment confirmed ${now}`,
      updated_at: now,
    })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (updateError || !updated) {
    logger.error('[store/finalize] order status update failed', updateError ?? undefined, {
      orderId,
      stripeSessionId: session.id,
    });
    return { success: false, orderId, error: 'Payment is confirmed but the order could not be finalized.' };
  }

  const purchasedProductIds = items.map((item) => item.product_id).filter(Boolean);
  if (purchasedProductIds.length) {
    const { error: cartClearError } = await db
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .in('product_id', purchasedProductIds);
    if (cartClearError) {
      logger.warn('[store/finalize] paid cart items could not be cleared', {
        orderId,
        userId,
        error: cartClearError.message,
      });
    }
  }

  // Inventory decrement is best-effort and runs only after the order has moved
  // from pending -> paid, so retries cannot double-decrement.
  for (const item of items.filter((row) => row.track_inventory)) {
    const { data: product } = await db
      .from('products')
      .select('inventory_quantity')
      .eq('id', item.product_id)
      .maybeSingle();
    if (!product || product.inventory_quantity === null) continue;
    const nextQuantity = Math.max(0, Number(product.inventory_quantity) - Number(item.quantity || 0));
    const { error } = await db
      .from('products')
      .update({ inventory_quantity: nextQuantity })
      .eq('id', item.product_id);
    if (error) {
      logger.warn('[store/finalize] inventory decrement failed', {
        orderId,
        productId: item.product_id,
        error: error.message,
      });
    }
  }

  return { success: true, orderId };
}
