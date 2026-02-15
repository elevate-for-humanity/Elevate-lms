
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { stripe } from '@/lib/stripe/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const body = await parseBody<Record<string, any>>(request);

    const {
      amount,
      donor_name,
      donor_email,
      donor_phone,
      campaign_id,
      is_recurring,
      recurring_frequency,
      message,
      anonymous,
    } = body;

    // Validate required fields
    if (!amount || !donor_name || !donor_email) {
      return NextResponse.json(
        { error: 'Amount, donor name, and email are required' },
        { status: 400 }
      );
    }

    // Validate amount
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least $1' },
        { status: 400 }
      );
    }

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Create donation record
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        donor_name,
        donor_email,
        donor_phone: donor_phone || null,
        amount: donationAmount,
        campaign_id: campaign_id || null,
        payment_status: 'pending',
        is_recurring: is_recurring || false,
        recurring_frequency: recurring_frequency || null,
        message: message || null,
        anonymous: anonymous || false,
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (donationError) {
      return NextResponse.json(
        { error: donationError.message },
        { status: 500 }
      );
    }

    // Create Stripe checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: is_recurring ? 'subscription' : 'payment',
      customer_email: donor_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: campaign_id ? 'Campaign Donation' : 'General Fund Donation',
              description: message || 'Thank you for your support!',
            },
            unit_amount: Math.round(donationAmount * 100), // Convert to cents
            ...(is_recurring && {
              recurring: {
                interval:
                  recurring_frequency === 'yearly'
                    ? 'year'
                    : recurring_frequency === 'quarterly'
                      ? 'month'
                      : 'month',
                interval_count: recurring_frequency === 'quarterly' ? 3 : 1,
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/rise-foundation/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/rise-foundation/donate?cancelled=true`,
      metadata: {
        donation_id: donation.id,
        campaign_id: campaign_id || '',
        donor_name,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update donation with Stripe session ID
    await supabase
      .from('donations')
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: 'processing',
      })
      .eq('id', donation.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      donation_id: donation.id,
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
