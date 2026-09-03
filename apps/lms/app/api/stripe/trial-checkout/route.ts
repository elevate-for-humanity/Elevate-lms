import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TrialCheckoutRequest {
  trialId: string;
  plan: 'solo' | 'business' | 'professional';
  interval: 'month' | 'year';
  email: string;
  organizationName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TrialCheckoutRequest = await request.json();
    const { trialId, plan, interval, email, organizationName } = body;
    if (!trialId || !plan || !interval || !email) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const supabase = await getAdminClient();
    const { data: trial, error: trialError } = await supabase
      .from('trial_signups')
      .select('*')
      .eq('id', trialId)
      .single();

    if (trialError || !trial) return NextResponse.json({ error: 'Trial not found' }, { status: 404 });
    if (trial.status === 'converted') return NextResponse.json({ error: 'Trial already converted' }, { status: 400 });

    const pricing: Record<string, { amount: number; name: string }> = {
      solo_month: { amount: 2900, name: 'Solo Practitioner - Monthly' },
      solo_year: { amount: 29000, name: 'Solo Practitioner - Annual' },
      business_month: { amount: 9900, name: 'Business Platform - Monthly' },
      business_year: { amount: 99000, name: 'Business Platform - Annual' },
      professional_month: { amount: 29900, name: 'Professional License - Monthly' },
      professional_year: { amount: 299000, name: 'Professional License - Annual' },
    };
    const selectedPlan = pricing[`${plan}_${interval}`];
    if (!selectedPlan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const stripe = getStripe();
    if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

    let customerId = trial.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: organizationName || trial.organization_name,
        metadata: { trial_id: trialId, organization_id: trial.organization_id || '' },
      });
      customerId = customer.id;
      await supabase.from('trial_signups').update({ stripe_customer_id: customerId }).eq('id', trialId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.elevateforhumanity.org';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: selectedPlan.name,
            description: `Elevate ${plan.charAt(0).toUpperCase() + plan.slice(1)} Platform - ${interval === 'year' ? 'Annual' : 'Monthly'} Subscription`,
          },
          unit_amount: selectedPlan.amount,
          recurring: { interval },
        },
        quantity: 1,
      }],
      metadata: { trial_id: trialId, plan, interval, organization_id: trial.organization_id || '' },
      success_url: `${appUrl}/store/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/store/subscription/canceled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url, sessionId: checkoutSession.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
