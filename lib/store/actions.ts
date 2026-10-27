'use server';

import { CERT_PROVIDERS } from '@/lib/testing/proctoring-capabilities';

type TestingCartItem = { id: string; name: string; price: number; quantity: number };

/**
 * Testing-cart checkout now routes through the canonical Testing Center checkout.
 * Payment/invoicing is created there through the current billing provider so this
 * Store helper cannot create a second payment architecture.
 */
export async function handleTestingCheckout(items: TestingCartItem[]) {
  if (!items.length) throw new Error('Cart is empty');
  const canonicalExams = new Map<string, { providerKey: string; name: string }>();
  for (const provider of Object.values(CERT_PROVIDERS)) {
    if (provider.status !== 'active' || provider.publicVisible === false) continue;
    for (const exam of provider.exams) {
      if (typeof exam !== 'object' || !exam.amountCents || exam.amountCents <= 0) continue;
      const id = `testing-${provider.key}-${exam.name}`.replace(/\s+/g, '-').toLowerCase();
      canonicalExams.set(id, { providerKey: provider.key, name: exam.name });
    }
  }
  if (items.length !== 1 || Number(items[0].quantity || 1) !== 1) {
    return { url: '/testing/checkout', requiresSelection: true };
  }
  const exam = canonicalExams.get(items[0].id);
  if (!exam) throw new Error('The selected exam is unavailable for checkout');
  return {
    url: `/testing/checkout?provider=${encodeURIComponent(exam.providerKey)}&exam=${encodeURIComponent(exam.name)}`,
  };
}
