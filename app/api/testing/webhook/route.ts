/**
 * DEPRECATED — canonical Stripe webhook is at /api/webhooks/stripe
 *
 * Testing checkout.session.completed is handled in
 * lib/stripe/handlers/testing-checkout-completed.ts via the canonical route.
 */
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { forwardStripeWebhookToCanonical } from '@/lib/stripe/forward-to-canonical-webhook';
import { withRuntime } from '@/lib/api/withRuntime';
import { ENV } from '@/lib/api/env-groups';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = withRuntime({ secrets: [...ENV.STRIPE_TESTING_WEBHOOK] }, async (req) => {
  logger.warn(
    '[testing/webhook] Deprecated endpoint — forwarding to /api/webhooks/stripe. Update Stripe Dashboard webhook URL.',
  );
  return forwardStripeWebhookToCanonical(req as NextRequest, 'testing/webhook');
});
