import { logger } from '@/lib/logger';

import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'canceled';
  clientSecret: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  priceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval?: 'month' | 'year';
}

export class StripeService {
  private static instance: StripeService;

  private constructor() {}

  static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  // Create payment intent
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status as PaymentIntent['status'],
        clientSecret: paymentIntent.client_secret || '',
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status as PaymentIntent['status'],
        clientSecret: paymentIntent.client_secret || '',
      };
    } catch (error) {
      logger.error('Error confirming payment:', error);
      throw error;
    }
  }

  // Create customer
  async createCustomer(email: string, name: string): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
      });

      return customer.id;
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        priceId: subscription.items.data[0].price.id,
        status: subscription.status as Subscription['status'],
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        priceId: subscription.items.data[0].price.id,
        status: subscription.status as Subscription['status'],
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Get subscription
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    if (!subscriptionId) {
      return null;
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      return {
        id: subscription.id,
        customerId: subscription.customer as string,
        priceId: subscription.items.data[0].price.id,
        status: subscription.status as Subscription['status'],
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        return null;
      }
      logger.error('Error getting subscription:', error);
      throw error;
    }
  }

  // List products
  async listProducts(): Promise<Product[]> {
    try {
      const products = await stripe.products.list({
        active: true,
        expand: ['data.default_price'],
      });

      return products.data.map((product) => {
        const price = product.default_price as Stripe.Price;
        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: price?.unit_amount || 0,
          currency: price?.currency || 'usd',
          interval: price?.recurring?.interval as 'month' | 'year' | undefined,
        };
      });
    } catch (error) {
      logger.error('Error listing products:', error);
      throw error;
    }
  }

  // Process refund
  async createRefund(
    paymentIntentId: string,
    amount?: number
  ): Promise<boolean> {
    if (!paymentIntentId) {
      return false;
    }

    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = amount;
      }

      const refund = await stripe.refunds.create(refundParams);

      return refund.status === 'succeeded' || refund.status === 'pending';
    } catch (error) {
      logger.error('Error creating refund:', error);
      return false;
    }
  }

  // Webhook handler
  async handleWebhook(payload: string, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          logger.info('Payment succeeded:', paymentIntent.id);
          // Handle successful payment (e.g., update order status, send confirmation email)
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          logger.info('Payment failed:', failedPayment.id);
          // Handle failed payment (e.g., notify user, update order status)
          break;

        case 'customer.subscription.created':
          const newSubscription = event.data.object as Stripe.Subscription;
          logger.info('Subscription created:', newSubscription.id);
          // Handle new subscription (e.g., grant access, send welcome email)
          break;

        case 'customer.subscription.updated':
          const updatedSubscription = event.data.object as Stripe.Subscription;
          logger.info('Subscription updated:', updatedSubscription.id);
          // Handle subscription update (e.g., update user access level)
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          logger.info('Subscription deleted:', deletedSubscription.id);
          // Handle subscription cancellation (e.g., revoke access, send cancellation email)
          break;

        case 'invoice.paid':
          const paidInvoice = event.data.object as Stripe.Invoice;
          logger.info('Invoice paid:', paidInvoice.id);
          // Handle paid invoice (e.g., extend subscription, send receipt)
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          logger.info('Invoice payment failed:', failedInvoice.id);
          // Handle failed invoice payment (e.g., notify user, retry payment)
          break;

        default:
          logger.info('Unhandled event type:', event.type);
      }
    } catch (error) {
      logger.error('Webhook error:', error);
      throw error;
    }
  }
}

export const stripeService = StripeService.getInstance();
