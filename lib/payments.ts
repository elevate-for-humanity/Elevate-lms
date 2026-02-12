
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// PAYMENT TYPES
// =====================================================
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'cancelled';
export type PaymentMethod = 'card' | 'bank_transfer' | 'paypal' | 'free';
export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  stripe_payment_intent_id?: string;
  stripe_customer_id?: string;
  course_id?: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}
// =====================================================
// STRIPE CUSTOMER MANAGEMENT
// =====================================================
/**
 * Get or create Stripe customer for user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const supabase = await createClient();
  // Check if customer already exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();
  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }
  // Create new Stripe customer
  if (!stripe) throw new Error('Stripe not configured');
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      user_id: userId,
    },
  });
  // Save customer ID to profile
  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);
  return customer.id;
}
/**
 * Update Stripe customer
 */
export async function updateStripeCustomer(
  customerId: string,
  updates: {
    email?: string;
    name?: string;
    phone?: string;
    address?: Stripe.AddressParam;
  }
): Promise<void> {
  await stripe.customers.update(customerId, updates);
}
// =====================================================
// PAYMENT INTENT CREATION
// =====================================================
/**
 * Create payment intent for course purchase
 */
export async function createCoursePaymentIntent(
  userId: string,
  courseId: string,
  amount: number,
  currency: string = 'usd',
  referralCode?: string
): Promise<PaymentIntent> {
  const supabase = await createClient();
  // Get user email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', userId)
    .single();
  if (!profile) {
    throw new Error('User not found');
  }
  // Get or create Stripe customer
  const customerId = await getOrCreateStripeCustomer(
    userId,
    profile.email,
    `${profile.first_name} ${profile.last_name}`
  );
  // Apply referral discount if provided
  let finalAmount = amount;
  if (referralCode) {
    const { applyReferralDiscount } = await import('@/lib/referrals');
    const discount = await applyReferralDiscount(referralCode, amount);
    finalAmount = discount.finalAmount;
  }
  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(finalAmount * 100), // Convert to cents
    currency,
    customer: customerId,
    metadata: {
      user_id: userId,
      course_id: courseId,
      referral_code: referralCode || '',
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });
  // Create payment record
  await supabase.from('payments').insert({
    user_id: userId,
    amount: finalAmount,
    currency,
    status: 'pending',
    payment_method: 'card',
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id: customerId,
    course_id: courseId,
    description: `Course purchase: ${courseId}`,
    metadata: {
      referral_code: referralCode,
    },
  });
  return {
    id: paymentIntent.id,
    amount: finalAmount,
    currency,
    status: paymentIntent.status,
    client_secret: paymentIntent.client_secret!,
  };
}
/**
 * Create subscription payment intent
 */
export async function createSubscriptionPaymentIntent(
  userId: string,
  planId: string,
  amount: number,
  currency: string = 'usd'
): Promise<PaymentIntent> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', userId)
    .single();
  if (!profile) {
    throw new Error('User not found');
  }
  const customerId = await getOrCreateStripeCustomer(
    userId,
    profile.email,
    `${profile.first_name} ${profile.last_name}`
  );
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    customer: customerId,
    metadata: {
      user_id: userId,
      plan_id: planId,
      type: 'subscription',
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });
  await supabase.from('payments').insert({
    user_id: userId,
    amount,
    currency,
    status: 'pending',
    payment_method: 'card',
    stripe_payment_intent_id: paymentIntent.id,
    stripe_customer_id: customerId,
    description: `Subscription: ${planId}`,
    metadata: {
      plan_id: planId,
      type: 'subscription',
    },
  });
  return {
    id: paymentIntent.id,
    amount,
    currency,
    status: paymentIntent.status,
    client_secret: paymentIntent.client_secret!,
  };
}
// =====================================================
// PAYMENT PROCESSING
// =====================================================
/**
 * Confirm payment and process enrollment
 */
export async function confirmPayment(
  paymentIntentId: string
): Promise<{ success: boolean; enrollmentId?: string }> {
  const supabase = await createClient();
  // Get payment intent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status !== 'succeeded') {
    return { success: false };
  }
  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId);
  // Get payment details
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();
  if (!payment) {
    return { success: false };
  }
  // If course purchase, create enrollment
  if (payment.course_id) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .insert({
        user_id: payment.user_id,
        course_id: payment.course_id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();
    // Trigger webhook
    const { triggerEnrollmentCreated } = await import('@/lib/webhooks');
    await triggerEnrollmentCreated(
      enrollment.id,
      payment.user_id,
      payment.course_id
    );
    // Track referral if applicable
    if (payment.metadata?.referral_code) {
      const { trackReferral } = await import('@/lib/referrals');
      try {
        await trackReferral(payment.metadata.referral_code, payment.user_id);
      } catch (error) { /* Error handled silently */ 
        // Error: $1
      }
    }
    return { success: true, enrollmentId: enrollment.id };
  }
  return { success: true };
}
/**
 * Handle failed payment
 */
export async function handleFailedPayment(
  paymentIntentId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId);
}
// =====================================================
// REFUNDS
// =====================================================
/**
 * Process refund
 */
export async function processRefund(
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<{ success: boolean; refundId?: string }> {
  const supabase = await createClient();
  // Get payment
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();
  if (!payment || !payment.stripe_payment_intent_id) {
    return { success: false };
  }
  // Create refund in Stripe
  const refund = await stripe.refunds.create({
    payment_intent: payment.stripe_payment_intent_id,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason: reason as any,
  });
  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);
  // If course enrollment, cancel it
  if (payment.course_id) {
    await supabase
      .from('enrollments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', payment.user_id)
      .eq('course_id', payment.course_id);
  }
  return { success: true, refundId: refund.id };
}
// =====================================================
// PAYMENT METHODS
// =====================================================
/**
 * Get customer payment methods
 */
export async function getPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
  return paymentMethods.data;
}
/**
 * Attach payment method to customer
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<void> {
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}
/**
 * Detach payment method from customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<void> {
  await stripe.paymentMethods.detach(paymentMethodId);
}
/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<void> {
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}
// =====================================================
// SUBSCRIPTIONS
// =====================================================
/**
 * Create subscription
 */
export async function createSubscription(
  userId: string,
  priceId: string,
  paymentMethodId?: string
): Promise<Stripe.Subscription> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name, last_name, stripe_customer_id')
    .eq('id', userId)
    .single();
  if (!profile) {
    throw new Error('User not found');
  }
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    customerId = await getOrCreateStripeCustomer(
      userId,
      profile.email,
      `${profile.first_name} ${profile.last_name}`
    );
  }
  const subscriptionData: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    metadata: {
      user_id: userId,
    },
  };
  if (paymentMethodId) {
    subscriptionData.default_payment_method = paymentMethodId;
  }
  const subscription = await stripe.subscriptions.create(subscriptionData);
  // Save subscription to database
  await supabase.from('subscriptions').insert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status,
    current_period_start: new Date(
      (subscription as string).current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      (subscription as string).current_period_end * 1000
    ).toISOString(),
  });
  return subscription;
}
/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<void> {
  const supabase = await createClient();
  if (immediately) {
    await stripe.subscriptions.cancel(subscriptionId);
  } else {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
  await supabase
    .from('subscriptions')
    .update({
      status: immediately ? 'cancelled' : 'cancelling',
      cancelled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);
}
// =====================================================
// PAYMENT HISTORY
// =====================================================
/**
 * Get user payment history
 */
export async function getPaymentHistory(
  userId: string,
  limit: number = 50
): Promise<Payment[]> {
  const supabase = await createClient();
  const { data, error }: any = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
/**
 * Get payment by ID
 */
export async function getPayment(paymentId: string): Promise<Payment | null> {
  const supabase = await createClient();
  const { data, error }: any = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();
  if (error) return null;
  return data;
}
// =====================================================
// WEBHOOK HANDLING
// =====================================================
/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
/**
 * Handle Stripe webhook event
 */
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  const supabase = await createClient();
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await confirmPayment(paymentIntent.id);
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedIntent = event.data.object as Stripe.PaymentIntent;
      await handleFailedPayment(failedIntent.id);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: new Date(
            (subscription as string).current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            (subscription as string).current_period_end * 1000
          ).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const deletedSub = event.data.object as Stripe.Subscription;
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', deletedSub.id);
      break;
    }
    default:
  }
}
// =====================================================
// PRICING
// =====================================================
/**
 * Get course price
 */
export async function getCoursePrice(courseId: string): Promise<number> {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from('courses')
    .select('price')
    .eq('id', courseId)
    .single();
  return course?.price || 0;
}
/**
 * Calculate total with tax
 */
export function calculateTotalWithTax(
  amount: number,
  taxRate: number = 0
): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const tax = amount * taxRate;
  const total = amount + tax;
  return {
    subtotal: amount,
    tax,
    total,
  };
}
