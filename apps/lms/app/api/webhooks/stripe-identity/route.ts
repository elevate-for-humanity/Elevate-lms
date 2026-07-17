import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';

import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  await hydrateProcessEnv();
  const supabase = await getAdminClient();

  const stripeClient = getStripe();
  if (!stripeClient) {
    return NextResponse.json({ received: true, warning: 'stripe_not_configured' }, { status: 200 });
  }

  const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ received: true, warning: 'misconfigured' }, { status: 200 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ received: true, warning: 'supabase_not_configured' }, { status: 200 });
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await supabase
    .from('stripe_webhook_events')
    .insert({ stripe_event_id: event.id, event_type: event.type, status: 'processing' })
    .then(()=>{}, ()=>{});

  let processingError = false;

  // Handle verification session events
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;
    const verifiedAt = new Date().toISOString();

    try {
      // Prefer exact match by Stripe verification session ID to avoid cross-updating rows.
      let verifyUpdateError: { message?: string } | null = null;
      const sessionScopedUpdate = await supabase
        .from('program_holder_verification')
        .update({
          status: 'verified',
          verified_at: verifiedAt,
        })
        .eq('stripe_verification_session_id', session.id)
        .eq('status', 'pending')
        .select('id');

      verifyUpdateError = sessionScopedUpdate.error;

      if (!verifyUpdateError && sessionScopedUpdate.data.length === 0 && userId) {
        const fallbackUpdate = await supabase
          .from('program_holder_verification')
          .update({
            status: 'verified',
            verified_at: verifiedAt,
          })
          .eq('user_id', userId)
          .eq('status', 'pending');
        verifyUpdateError = fallbackUpdate.error;
      }

      if (verifyUpdateError) {
        processingError = true;
      }

      // Email notification handled by trigger to user
    } catch {
      processingError = true;
    }
  }

  // Handle verification session failures
  if (
    event.type === 'identity.verification_session.requires_input' ||
    event.type === 'identity.verification_session.canceled'
  ) {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;
    const failureReason = session.last_error?.reason || 'Verification failed';

    try {
      // Prefer exact match by Stripe verification session ID to avoid cross-updating rows.
      let failUpdateError: { message?: string } | null = null;
      const sessionScopedUpdate = await supabase
        .from('program_holder_verification')
        .update({
          status: 'failed',
          notes: failureReason,
        })
        .eq('stripe_verification_session_id', session.id)
        .eq('status', 'pending')
        .select('id');

      failUpdateError = sessionScopedUpdate.error;

      if (!failUpdateError && sessionScopedUpdate.data.length === 0 && userId) {
        const fallbackUpdate = await supabase
          .from('program_holder_verification')
          .update({
            status: 'failed',
            notes: failureReason,
          })
          .eq('user_id', userId)
          .eq('status', 'pending');
        failUpdateError = fallbackUpdate.error;
      }

      if (failUpdateError) {
        processingError = true;
      }

      // Email notification handled by trigger to user
    } catch {
      processingError = true;
    }
  }

  await supabase
    .from('stripe_webhook_events')
    .update({ status: processingError ? 'failed' : 'processed' })
    .eq('stripe_event_id', event.id)
    .then(()=>{}, ()=>{});

  if (processingError) {
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
export const POST = withApiAudit('/api/webhooks/stripe-identity', _POST, {
  actor_type: 'webhook',
  skip_body: true,
  critical: true,
});
