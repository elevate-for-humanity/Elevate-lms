'use server';

import { getStripe } from '@/lib/stripe/client';
import { logger } from '@/lib/logger';
import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';
import { hydrateProcessEnv } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type TestingCartItem = { id: string; name: string; price: number; quantity: number };

export async function handleTestingCheckout(items: TestingCartItem[]) {
  try {
    if (items.length === 0) throw new Error('Cart is empty');

    const canonicalExams = new Map<
      string,
      { id: string; providerKey: string; providerName: string; name: string; amountCents: number }
    >();
    for (const provider of Object.values(CERT_PROVIDERS)) {
      if (provider.status !== 'active' || provider.publicVisible === false) continue;
      for (const exam of provider.exams) {
        if (typeof exam !== 'object' || !exam.amountCents || exam.amountCents <= 0) continue;
        const id = `testing-${provider.key}-${exam.name}`.replace(/\s+/g, '-').toLowerCase();
        canonicalExams.set(id, {
          id,
          providerKey: provider.key,
          providerName: provider.name,
          name: exam.name,
          amountCents: exam.amountCents,
        });
      }
    }

    const resolved = items.map((item) => {
      const canonical = canonicalExams.get(item.id);
      if (!canonical) throw new Error('One or more exams are unavailable for checkout');
      const quantity = Math.max(1, Math.min(10, Math.round(item.quantity)));
      return { ...canonical, quantity };
    });

    const expandedIds = resolved.flatMap((item) => Array(item.quantity).fill(item.id));
    if (expandedIds.length > 10) throw new Error('A testing cart is limited to 10 exam registrations');

    const encodedIds = expandedIds.join(',');
    if (encodedIds.length > 480) {
      throw new Error('This testing cart is too large. Remove an exam and try again.');
    }

    await hydrateProcessEnv();
    const stripe = getStripe();
    if (!stripe) throw new Error('Payment system not configured');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: resolved.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: item.amountCents,
          product_data: {
            name: `${item.providerName} — ${item.name}`,
            metadata: { provider: item.providerKey, exam_name: item.name },
          },
        },
      })),
      success_url: `${siteUrl}/testing/book?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/testing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        payment_type: 'testing_cart',
        testing_cart_ids: encodedIds,
      },
    });

    if (!session.url) throw new Error('Stripe did not return a Checkout URL');
    return { url: session.url };
  } catch (error) {
    logger.error('Testing checkout action failed:', error);
    throw error;
  }
}
