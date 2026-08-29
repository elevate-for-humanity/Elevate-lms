export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { toError, toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;
  const stripe = getStripe();
  if (!stripe)
    return NextResponse.json({ error: 'Payment system not configured.' }, { status: 503 });
  if (!stripe) {
    return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await parseBody<Record<string, any>>(request);
    const { programId, paymentType = 'full' } = body;

    if (!programId) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 });
    }

    // Get program details
    const { data: program } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .maybeSingle();

    if (!program) {
      /* Condition handled */
    }

    const price = program.tuition || 0;

    if (price === 0) {
      return NextResponse.json(
        { error: 'This program is free. No payment required.' },
        { status: 400 },
      );
    }

    // Get or create customer
    let customerId: string | undefined;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.stripe_customer_id) {
        customerId = profile.stripe_customer_id;
      } else if (profile?.email) {
        // Create Stripe customer
        const customer = await stripe.customers.create({
          email: profile.email,
          name: profile.full_name || undefined,
          metadata: {
            user_id: user.id,
          },
        });

        customerId = customer.id;

        // Save customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customer.id })
          .eq('id', user.id);
      }
    }

    const baseUrl = ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() || PLATFORM_DEFAULTS.siteUrl);
    const lmsUrl = (
      process.env.NEXT_PUBLIC_LMS_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://app.elevateforhumanity.org'
    ).replace(/\/$/, '');

    let sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      client_reference_id: user?.id,
      success_url: `${lmsUrl}/lms/payments?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/programs/${program.slug}`,
      metadata: {
        // Standardized metadata for grant/license compliance
        payment_type: paymentType === 'plan' ? 'program_subscription' : 'program_enrollment',
        funding_source: 'self_pay',
        program_id: programId,
        program_name: program.title,
        program_slug: program.slug,
        user_id: user?.id || 'guest',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    };

    if (paymentType === 'plan' && price >= 500) {
      // Payment plan - 4 monthly installments
      const monthlyAmount = Math.ceil(price / 4);

      sessionConfig = {
        ...sessionConfig,
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${program.title} - Payment Plan`,
                description: `4-month payment plan for ${program.title} program`,
                images: program.image_url ? [program.image_url] : undefined,
              },
              unit_amount: monthlyAmount * 100,
              recurring: {
                interval: 'month',
                interval_count: 1,
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            program_id: programId,
            program_name: program.title,
            total_amount: price,
            installments: 4,
            installment_amount: monthlyAmount,
          },
          trial_settings: undefined,
        },
      };
    } else {
      // One-time payment
      sessionConfig = {
        ...sessionConfig,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: program.title,
                description: `Enrollment in ${program.title} training program`,
                images: program.image_url ? [program.image_url] : undefined,
              },
              unit_amount: price * 100,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          setup_future_usage: 'off_session',
          metadata: {
            program_id: programId,
            program_name: program.title,
          },
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Log checkout session creation
    if (user) {
      await supabase.from('payment_logs').insert({
        user_id: user.id,
        program_id: programId,
        session_id: session.id,
        amount: price,
        payment_type: paymentType,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? toErrorMessage(err) : undefined,
      },
      { status: 500 },
    );
  }
}
