'use server';

import { createCheckoutSession } from './stripe';
import { logger } from '@/lib/logger';

export async function handleTestingCheckout(items: { id: string; name: string; price: number; quantity: number }[]) {
  try {
    if (items.length === 0) throw new Error('Cart is empty');

    // For testing, we just use the first item or a summary
    const firstItem = items[0];
    const totalCents = items.reduce((sum, i) => sum + (i.price * 100 * i.quantity), 0);

    const session = await createCheckoutSession({
      productId: firstItem.id,
      productTitle: items.length > 1 ? `Batch Test (${items.length} items)` : firstItem.name,
      price: totalCents,
      successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/store/checkout/cancel`,
    });

    return { url: session.url };
  } catch (error) {
    logger.error('Testing checkout action failed:', error);
    throw error;
  }
}
