import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';

export type StripeHandlerContext = {
  stripe: Stripe;
  supabase: SupabaseClient;
};

/**
 * A handler receives the full verified Stripe event and a context object
 * containing the Stripe client and an admin Supabase client.
 *
 * Handlers should throw on unrecoverable errors — the webhook route will
 * catch and return 500 so Stripe retries. For expected no-ops (e.g. wrong
 * metadata kind), return without throwing.
 */
export type StripeEventHandler = (
  event: Stripe.Event,
  ctx: StripeHandlerContext,
) => Promise<void>;
