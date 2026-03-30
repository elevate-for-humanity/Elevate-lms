/**
 * Stripe event handler registry.
 *
 * Add new event types here. The webhook route dispatches by event.type —
 * no business logic lives in the route itself.
 *
 * Handlers not listed here are silently acknowledged (200 received:true, ignored:true).
 * The full subscription/license/refund logic from the original webhook remains
 * in app/api/webhooks/stripe/route.ts until it is extracted into handler files.
 */

import type { StripeEventHandler } from './types';
import { handleCheckoutSessionCompleted } from './checkout-session-completed';

export const stripeEventHandlers: Record<string, StripeEventHandler> = {
  'checkout.session.completed': handleCheckoutSessionCompleted,
};

export type { StripeEventHandler, StripeHandlerContext } from './types';
