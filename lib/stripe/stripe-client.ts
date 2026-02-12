// Stripe Integration for Course Payments and Subscriptions
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
  : null;
export interface CheckoutSessionParams {
  courseId: string;
  courseName: string;
  price: number;
  userId: string;
  userEmail: string;
}
export interface SubscriptionParams {
  userId: string;
  userEmail: string;
  priceId: string;
  customerId?: string;
}
// Create a checkout session for one-time course purchase
export async function createCheckoutSession(params: CheckoutSessionParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  const { courseId, courseName, price, userId, userEmail } = params;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: courseName,
            description: `Access to ${courseName} course`,
            metadata: {
              courseId,
            },
          },
          unit_amount: Math.round(price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}`,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      courseId,
      userId,
    },
  });
  return session;
}
// Create a subscription for recurring access
export async function createSubscription(params: SubscriptionParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  const { userId, userEmail, priceId, customerId } = params;
  // Create or retrieve customer
  let customer = customerId;
  if (!customer) {
    const newCustomer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customer = newCustomer.id;
  }
  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
  return {
    subscription,
    customerId: customer,
  };
}
// Cancel a subscription
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}
// Reactivate a cancelled subscription
export async function reactivateSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}
// Create a refund
export async function createRefund(paymentIntentId: string, amount?: number) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  });
}
// Get customer by ID
export async function getCustomer(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.customers.retrieve(customerId);
}
// Get subscription by ID
export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.subscriptions.retrieve(subscriptionId);
}
// List customer subscriptions
export async function listCustomerSubscriptions(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
  });
}
// Create a coupon
export async function createCoupon(params: {
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: 'forever' | 'once' | 'repeating';
  durationInMonths?: number;
  name?: string;
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return await stripe.coupons.create(params);
}
// Apply coupon to checkout session
export async function createCheckoutSessionWithCoupon(
  params: CheckoutSessionParams,
  couponId: string
) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  const { courseId, courseName, price, userId, userEmail } = params;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: courseName,
            description: `Access to ${courseName} course`,
            metadata: {
              courseId,
            },
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      },
    ],
    discounts: [
      {
        coupon: couponId,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}`,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      courseId,
      userId,
    },
  });
  return session;
}
// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
// Handle webhook events
export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Handle successful payment
      //
      break;
    }
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      // Handle new subscription
      //
      break;
    }
    case 'customer.subscription.updated': {
      const updatedSubscription = event.data.object as Stripe.Subscription;
      // Handle subscription update
      //
      break;
    }
    case 'customer.subscription.deleted': {
      const deletedSubscription = event.data.object as Stripe.Subscription;
      // Handle subscription cancellation
      //
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      // Handle successful payment
      //
      break;
    }
    case 'invoice.payment_failed': {
      const failedInvoice = event.data.object as Stripe.Invoice;
      // Handle failed payment
      //
      break;
    }
    default:
      //
  }
}
export { stripe };
