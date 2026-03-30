import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

export interface CheckoutSessionData {
  programId: string;
  programName: string;
  price: number;
  userId?: string;
}

/**
 * Create a Stripe Checkout session via /api/create-checkout-session.
 * Returns the Stripe session ID.
 */
export async function createCheckoutSession(data: CheckoutSessionData): Promise<string> {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      programId: data.programId,
      programName: data.programName,
      price: data.price,
      successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/payment/cancelled`,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create checkout session');
  }

  const { sessionId } = await response.json();
  return sessionId;
}

/**
 * Redirect to Stripe Checkout using a session ID.
 */
export async function redirectToCheckout(sessionId: string): Promise<void> {
  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error('Stripe failed to load — check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) throw error;
}

/**
 * Enroll a user in a free program via /api/enrollments/create-enforced.
 */
export async function enrollFree(programId: string, userId: string): Promise<{ enrollmentId: string }> {
  const response = await fetch('/api/enrollments/create-enforced', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ programId, userId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to enroll');
  }

  return response.json();
}
