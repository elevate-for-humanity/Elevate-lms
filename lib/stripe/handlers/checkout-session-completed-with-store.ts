import type Stripe from 'stripe';
import type { StripeEventHandler } from './types';
import { handleCheckoutSessionCompleted as handleExistingCheckoutSessionCompleted } from './checkout-session-completed';
import { finalizeCartPurchase } from '@/lib/store/finalize-cart-purchase';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

/**
 * Canonical checkout.session.completed wrapper used by the Marketing Stripe
 * webhook. Store-cart checkout is finalized here so payment completion does
 * not depend on the customer returning to /store/cart-success in the browser.
 * All other checkout kinds continue through the existing extracted handler
 * unchanged.
 */
export const handleCheckoutSessionCompleted: StripeEventHandler = async (
  event,
  context,
) => {
  const session = event.data.object as Stripe.Checkout.Session;

  if (
    session.metadata?.kind === 'store_purchase' &&
    session.metadata?.checkout_type === 'store_cart'
  ) {
    try {
      const result = await finalizeCartPurchase({
        db: context.supabase,
        session,
      });

      if (!result.success) {
        const error = new Error(result.error || 'Store purchase finalization failed');
        Sentry.captureException(error, {
          tags: {
            subsystem: 'stripe_webhook',
            kind: 'store_purchase',
          },
          extra: {
            sessionId: session.id,
            orderId: result.orderId,
          },
        });
        logger.error('[webhook/store] Store purchase could not be finalized', error, {
          sessionId: session.id,
          orderId: result.orderId,
        });
        return;
      }

      logger.info('[webhook/store] Store purchase finalized', {
        sessionId: session.id,
        orderId: result.orderId,
        alreadyFinalized: result.alreadyFinalized ?? false,
      });
      return;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          subsystem: 'stripe_webhook',
          kind: 'store_purchase',
        },
      });
      logger.error('[webhook/store] Unexpected store purchase finalization error', error);
      return;
    }
  }

  return handleExistingCheckoutSessionCompleted(event, context);
};
