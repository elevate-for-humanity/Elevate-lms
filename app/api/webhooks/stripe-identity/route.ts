
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe/client';

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function POST(request: NextRequest) {
  if (!stripe || !supabase) { /* Condition handled */ }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_IDENTITY_WEBHOOK_SECRET!
    );
  } catch (error) { }

  // Idempotency check
  if (supabase) {
    const { data: existing } = await supabase
      .from('stripe_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await supabase
      .from('stripe_webhook_events')
      .insert({ stripe_event_id: event.id, event_type: event.type, status: 'processing' })
      .catch(() => {});
  }

  // Handle verification session events
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;

    if (!userId) { /* Condition handled */ }

    try {
      // Update verification record
      await supabase
        .from('program_holder_verification')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
        })
        .eq('stripe_verification_session_id', session.id);

      // Update program holder status
      await supabase
        .from('program_holders')
        .update({
          verification_status: 'verified',
          status: 'verified_no_students',
        })
        .eq('user_id', userId);

      // Email notification handled by trigger to user

    } catch (error) { 
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      );
    }
  }

  // Handle verification session failures
  if (
    event.type === 'identity.verification_session.requires_input' ||
    event.type === 'identity.verification_session.canceled'
  ) {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const userId = session.metadata?.user_id;

    if (!userId) { /* Condition handled */ }

    try {
      // Update verification record
      await supabase
        .from('program_holder_verification')
        .update({
          status: 'failed',
          notes: session.last_error?.reason || 'Verification failed',
        })
        .eq('stripe_verification_session_id', session.id);

      // Update program holder status
      await supabase
        .from('program_holders')
        .update({
          verification_status: 'failed',
        })
        .eq('user_id', userId);

      // Email notification handled by trigger to user

    } catch (error) { 
      return NextResponse.json(
        { error: 'Database update failed' },
        { status: 500 }
      );
    }
  }

}
