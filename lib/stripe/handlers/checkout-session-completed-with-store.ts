import type Stripe from 'stripe';
import type { StripeEventHandler } from './types';
import { handleCheckoutSessionCompleted as handleExistingCheckoutSessionCompleted } from './checkout-session-completed';
import { finalizeCartPurchase } from '@/lib/store/finalize-cart-purchase';
import { finalizePaidDomainPurchase } from '@/lib/domainee/finalize-paid-domain-purchase';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

/**
 * Canonical checkout.session.completed wrapper used by Marketing.
 * Server-side fulfillment for store-cart and Website Builder domain purchases
 * lives here so neither flow depends on the customer returning from Stripe.
 */
export const handleCheckoutSessionCompleted: StripeEventHandler = async (
  event,
  context,
) => {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.kind === 'website_domain_purchase') {
    try {
      const result = await finalizePaidDomainPurchase({
        db: context.supabase,
        stripe: context.stripe,
        session,
      });
      if (!result.success) {
        const error = new Error(result.error || 'Website domain fulfillment failed');
        Sentry.captureException(error, {
          tags: { subsystem: 'stripe_webhook', kind: 'website_domain_purchase' },
          extra: { sessionId: session.id, domainId: result.domainId },
        });
        logger.error('[webhook/domain] Domain purchase could not be finalized', error, {
          sessionId: session.id,
          domainId: result.domainId,
        });
      } else {
        logger.info('[webhook/domain] Domain purchase finalized', {
          sessionId: session.id,
          domainId: result.domainId,
          alreadyFinalized: result.alreadyFinalized ?? false,
        });
      }
      return;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { subsystem: 'stripe_webhook', kind: 'website_domain_purchase' },
      });
      logger.error('[webhook/domain] Unexpected domain fulfillment error', error);
      return;
    }
  }

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
          tags: { subsystem: 'stripe_webhook', kind: 'store_purchase' },
          extra: { sessionId: session.id, orderId: result.orderId },
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
        tags: { subsystem: 'stripe_webhook', kind: 'store_purchase' },
      });
      logger.error('[webhook/store] Unexpected store purchase finalization error', error);
      return;
    }
  }

  return handleExistingCheckoutSessionCompleted(event, context);
};
