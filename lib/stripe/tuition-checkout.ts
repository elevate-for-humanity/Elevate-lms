import { logger } from '@/lib/logger';

/**
 * TUITION CHECKOUT LOGIC
 * 
 * Handles three payment paths:
 * 1. Pay in Full - Single Stripe Checkout session
 * 2. BNPL (Klarna/Afterpay/Zip/Klarna) - Stripe Checkout with BNPL methods enabled
 * 3. School Installment Plan - Two-step: Deposit checkout + Subscription creation
 */

import Stripe from 'stripe';
import { getStripe, stripe } from '@/lib/stripe/client';
import { getTuitionConfig, PAYMENT_METHODS, INSTALLMENT_RULES } from './tuition-config';



export type PaymentOption = 'pay_in_full' | 'bnpl' | 'installment_plan';

interface CheckoutParams {
  programId: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  paymentOption: PaymentOption;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Create checkout session based on payment option
 */
export async function createTuitionCheckout(params: CheckoutParams): Promise<CheckoutResult> {
  const config = getTuitionConfig(params.programId);
  
  if (!config) {
    return { success: false, error: 'Program not found' };
  }
  
  try {
    switch (params.paymentOption) {
      case 'pay_in_full':
        return await createPayInFullCheckout(config, params);
      
      case 'bnpl':
        return await createBnplCheckout(config, params);
      
      case 'installment_plan':
        return await createInstallmentDepositCheckout(config, params);
      
      default:
        return { success: false, error: 'Invalid payment option' };
    }
  } catch (error) {
    logger.error('Checkout error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Checkout failed' 
    };
  }
}

/**
 * PAY IN FULL - Single payment checkout
 */
async function createPayInFullCheckout(
  config: typeof import('./tuition-config').TUITION_PRODUCTS[0],
  params: CheckoutParams
): Promise<CheckoutResult> {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.studentEmail,
    payment_method_types: ['card', 'us_bank_account'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: config.programName,
            description: 'Full tuition payment',
            metadata: {
              program_id: params.programId,
              payment_type: 'tuition_full',
            },
          },
          unit_amount: config.payInFull.amount * 100, // Stripe uses cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      student_id: params.studentId,
      program_id: params.programId,
      payment_option: 'pay_in_full',
      tuition_amount: config.totalTuition.toString(),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  
  return {
    success: true,
    checkoutUrl: session.url!,
    sessionId: session.id,
  };
}

/**
 * BNPL - Checkout with Klarna/Afterpay/Zip/Klarna enabled (subject to approval)
 */
async function createBnplCheckout(
  config: typeof import('./tuition-config').TUITION_PRODUCTS[0],
  params: CheckoutParams
): Promise<CheckoutResult> {
  // Build payment method types based on what's enabled
  const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ['card'];
  
  if (PAYMENT_METHODS.klarna) paymentMethodTypes.push('klarna');
  if (PAYMENT_METHODS.afterpay_clearpay) paymentMethodTypes.push('afterpay_clearpay');
  if (PAYMENT_METHODS.zip) paymentMethodTypes.push('zip');
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.studentEmail,
    payment_method_types: paymentMethodTypes,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: config.programName,
            description: 'Tuition payment (Pay over time subject to approval)',
            metadata: {
              program_id: params.programId,
              payment_type: 'tuition_bnpl',
            },
          },
          unit_amount: config.totalTuition * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      student_id: params.studentId,
      program_id: params.programId,
      payment_option: 'bnpl',
      tuition_amount: config.totalTuition.toString(),
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
  
  return {
    success: true,
    checkoutUrl: session.url!,
    sessionId: session.id,
  };
}

/**
 * INSTALLMENT PLAN - Step 1: Deposit checkout
 * After deposit is paid, weekly subscription is created via webhook
 */
async function createInstallmentDepositCheckout(
  config: typeof import('./tuition-config').TUITION_PRODUCTS[0],
  params: CheckoutParams
): Promise<CheckoutResult> {
  const { installmentPlan } = config;
  const remainingBalance = config.totalTuition - installmentPlan.depositAmount;
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.studentEmail,
    payment_method_types: ['card', 'us_bank_account'],
    // Require saving payment method for future subscription
    payment_intent_data: {
      setup_future_usage: 'off_session',
    },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${config.programName} - Enrollment Deposit`,
            description: `Non-refundable deposit. Includes $${config.registrationFee} registration fee. Remaining balance: $${remainingBalance} over ${installmentPlan.numberOfWeeks} weekly payments of $${installmentPlan.weeklyAmount}.`,
            metadata: {
              program_id: params.programId,
              payment_type: 'tuition_deposit',
            },
          },
          unit_amount: installmentPlan.depositAmount * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      student_id: params.studentId,
      program_id: params.programId,
      payment_option: 'installment_plan',
      deposit_amount: installmentPlan.depositAmount.toString(),
      weekly_amount: installmentPlan.weeklyAmount.toString(),
      number_of_weeks: installmentPlan.numberOfWeeks.toString(),
      tuition_amount: config.totalTuition.toString(),
      // Flag to create subscription after deposit
      create_subscription: 'true',
      payment_interval: 'week',
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    // Consent for future charges
    consent_collection: {
      terms_of_service: 'required',
    },
  });
  
  return {
    success: true,
    checkoutUrl: session.url!,
    sessionId: session.id,
  };
}

/**
 * Create weekly subscription after deposit is paid (called from webhook)
 */
export async function createInstallmentSubscription(
  customerId: string,
  paymentMethodId: string,
  metadata: {
    student_id: string;
    program_id: string;
    weekly_amount?: string;
    number_of_weeks?: string;
    // Legacy support for monthly
    monthly_amount?: string;
    number_of_months?: string;
    payment_interval?: string;
  }
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  try {
    // Determine if weekly or monthly (default to weekly for new subscriptions)
    const isWeekly = metadata.payment_interval === 'week' || metadata.weekly_amount;
    
    const amount = isWeekly 
      ? parseInt(metadata.weekly_amount || '0')
      : parseInt(metadata.monthly_amount || '0');
    
    const numberOfPayments = isWeekly
      ? parseInt(metadata.number_of_weeks || '0')
      : parseInt(metadata.number_of_months || '0');
    
    const interval = isWeekly ? 'week' : 'month';
    
    // Create a price for the subscription
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: amount * 100,
      recurring: {
        interval: interval,
        interval_count: 1,
      },
      product_data: {
        name: `Tuition ${isWeekly ? 'Weekly' : 'Monthly'} Payment`,
        metadata: {
          program_id: metadata.program_id,
          payment_type: 'tuition_installment',
          payment_interval: interval,
        },
      },
    });
    
    // Create subscription with automatic weekly/monthly billing
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      default_payment_method: paymentMethodId,
      items: [{ price: price.id }],
      metadata: {
        student_id: metadata.student_id,
        program_id: metadata.program_id,
        payment_type: 'tuition_installment',
        payment_interval: interval,
        total_installments: numberOfPayments.toString(),
        installments_paid: '0',
        amount_per_payment: amount.toString(),
      },
      // Automatic billing
      cancel_at_period_end: false,
      collection_method: 'charge_automatically',
      payment_settings: {
        payment_method_types: ['card', 'us_bank_account'],
        save_default_payment_method: 'on_subscription',
      },
    });
    
    logger.info(`Created ${interval}ly subscription ${subscription.id} for student ${metadata.student_id}: $${amount}/${interval} x ${numberOfPayments}`);
    
    return {
      success: true,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    logger.error('Subscription creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription',
    };
  }
}

/**
 * Cancel subscription after all installments are paid (called from webhook)
 */
export async function checkAndCancelCompletedSubscription(
  subscriptionId: string
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const totalInstallments = parseInt(subscription.metadata.total_installments || '0');
  const installmentsPaid = parseInt(subscription.metadata.installments_paid || '0') + 1;
  
  // Update count
  await stripe.subscriptions.update(subscriptionId, {
    metadata: {
      ...subscription.metadata,
      installments_paid: installmentsPaid.toString(),
    },
  });
  
  // Cancel if all installments paid
  if (installmentsPaid >= totalInstallments) {
    await stripe.subscriptions.cancel(subscriptionId);
    logger.info(`Subscription ${subscriptionId} completed - all ${totalInstallments} installments paid`);
  }
}

/**
 * Handle failed payment - suspend access
 */
export async function handleFailedPayment(
  subscriptionId: string,
  studentId: string,
  supabaseClient?: any
): Promise<void> {
  let supabase = supabaseClient;
  
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logger.error('Supabase not configured for payment failure handling');
      return;
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  logger.info(`Payment failed for subscription ${subscriptionId}, student ${studentId}`);
  
  // Update enrollment status to suspended
  const { error } = await supabase
    .from('program_enrollments')
    .update({ 
      status: 'SUSPENDED',
      payment_status: 'FAILED',
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId);
  
  if (error) {
    logger.error('Failed to suspend enrollment:', error);
  } else {
    logger.info(`Enrollment suspended for student ${studentId}`);
  }
  
  // Log the payment failure
  await supabase.from('payment_logs').insert({
    student_id: studentId,
    stripe_subscription_id: subscriptionId,
    status: 'failed',
    metadata: { reason: 'payment_failed', suspended: true },
  }).catch((err: Error) => logger.warn('Failed to log payment failure:', err));
}
