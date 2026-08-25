'use server';

import { createCheckoutSession } from './stripe';
import { logger } from '@/lib/logger';
import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';

export async function handleTestingCheckout(items: { id: string; name: string; price: number; quantity: number }[]) {
  try {
    if (items.length === 0) throw new Error('Cart is empty');

    const canonicalExams = new Map<string, { name: string; amountCents: number }>();
    for (const provider of Object.values(CERT_PROVIDERS)) {
      if (provider.status !== 'active' || provider.publicVisible === false) continue;
      for (const exam of provider.exams) {
        if (typeof exam !== 'object' || !exam.amountCents || exam.amountCents <= 0) continue;
        const id = `testing-${provider.key}-${exam.name}`.replace(/\s+/g, '-').toLowerCase();
        canonicalExams.set(id, { name: exam.name, amountCents: exam.amountCents });
      }
    }

    const resolved = items.map((item) => {
      const canonical = canonicalExams.get(item.id);
      if (!canonical) throw new Error('One or more exams are unavailable for checkout');
      const quantity = Math.max(1, Math.min(100, Math.round(item.quantity)));
      return { ...canonical, id: item.id, quantity };
    });
    const firstItem = resolved[0];
    const totalCents = resolved.reduce(
      (sum, item) => sum + item.amountCents * item.quantity,
      0,
    );

    const session = await createCheckoutSession({
      productId: firstItem.id,
      productTitle: resolved.length > 1 ? `Testing cart (${resolved.length} exams)` : firstItem.name,
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
