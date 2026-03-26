

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function _POST(request: Request) {
  try {
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
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) { 
      return NextResponse.json(
        {
          error: `Webhook Error: ${'Internal server error'}`,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

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

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const donationId = session.metadata?.donation_id;

        if (donationId) {
          // Update donation status
          await supabase
            .from('donations')
            .update({
              payment_status: 'succeeded',
              stripe_payment_intent_id: session.payment_intent as string,
              stripe_subscription_id: (session.subscription as string) || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', donationId);

          // Get donation details for receipt
          const { data: donation } = await supabase
            .from('donations')
            .select('*')
            .eq('id', donationId)
            .single();

          if (donation && !donation.receipt_sent) {
            // Send receipt email
            await supabase.from('email_queue').insert({
              to_email: donation.donor_email,
              from_email: 'noreply@elevateforhumanity.org',
              subject: 'Thank you for your donation - Receipt',
              template_name: 'donation_receipt',
              template_data: {
                donorName: donation.donor_name,
                amount: donation.amount,
                date: new Date().toISOString(),
                transactionId: session.payment_intent,
              },
              related_type: 'donation',
              related_id: donation.id,
            });

            // Mark receipt as sent
            await supabase
              .from('donations')
              .update({
                receipt_sent: true,
                receipt_sent_at: new Date().toISOString(),
              })
              .eq('id', donationId);
          }

          // Track conversion
          if (donation?.user_id) {
            await supabase.from('conversions').insert({
              user_id: donation.user_id,
              conversion_type: 'donation_made',
              value: donation.amount,
            });
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Find donation by payment intent
        const { data: donation } = await supabase
          .from('donations')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (donation) {
          await supabase
            .from('donations')
            .update({
              payment_status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', donation.id);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;

        // Find donation by payment intent
        const { data: donation } = await supabase
          .from('donations')
          .select('id')
          .eq('stripe_payment_intent_id', charge.payment_intent as string)
          .single();

        if (donation) {
          await supabase
            .from('donations')
            .update({
              payment_status: 'refunded',
              updated_at: new Date().toISOString(),
            })
            .eq('id', donation.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find donation by subscription ID
        const { data: donation } = await supabase
          .from('donations')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (donation) {
          await supabase
            .from('donations')
            .update({
              payment_status: 'cancelled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', donation.id);
        }
        break;
      }

      default:
    }

  } catch (error) { 
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/donations/webhook', _POST, { actor_type: 'webhook', skip_body: true });
