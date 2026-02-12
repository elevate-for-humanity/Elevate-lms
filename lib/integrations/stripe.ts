import { getStripe } from '@/lib/stripe/client';



export async function createCheckoutSession(params: {
  amount: number;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  return await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Donation',
          },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  });
}

export async function constructWebhookEvent(
  body: string,
  signature: string,
  secret: string
) {
  return getStripe().webhooks.constructEvent(body, signature, secret);
}
