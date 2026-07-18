import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ConvertTrialRequest {
  trialId: string;
  selectedPlan: 'solo' | 'business' | 'professional';
  billingInterval: 'month' | 'year';
  paymentMethodId?: string;
  customerId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConvertTrialRequest = await request.json();
    const { trialId, selectedPlan, billingInterval } = body;

    if (!trialId || !selectedPlan || !billingInterval) {
      return NextResponse.json(
        { error: 'Missing required fields: trialId, selectedPlan, billingInterval' },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // 1. Get the trial signup
    const { data: trial, error: trialError } = await supabase
      .from('trial_signups')
      .select('*')
      .eq('id', trialId)
      .single();

    if (trialError || !trial) {
      return NextResponse.json(
        { error: 'Trial not found' },
        { status: 404 }
      );
    }

    // 2. Check if trial is still valid
    if (trial.status === 'converted') {
      return NextResponse.json(
        { error: 'Trial already converted' },
        { status: 400 }
      );
    }

    if (trial.status === 'expired') {
      return NextResponse.json(
        { error: 'Trial has expired' },
        { status: 400 }
      );
    }

    // 3. Get the selected plan from store_prices
    const planSlug = `${selectedPlan}_${billingInterval}`;
    const { data: plan, error: planError } = await supabase
      .from('store_prices')
      .select('*, store_products(*)')
      .eq('stripe_price_id', `price_${planSlug}`)
      .eq('active', true)
      .single();

    if (planError || !plan) {
      // Fallback to hardcoded pricing if not in DB
      const pricing: Record<string, { amount: number; interval: string }> = {
        'solo_month': { amount: 2900, interval: 'month' },
        'solo_year': { amount: 29000, interval: 'year' },
        'business_month': { amount: 9900, interval: 'month' },
        'business_year': { amount: 99000, interval: 'year' },
        'professional_month': { amount: 29900, interval: 'month' },
        'professional_year': { amount: 299000, interval: 'year' },
      };

      const selected = pricing[planSlug];
      if (!selected) {
        return NextResponse.json(
          { error: 'Invalid plan selected' },
          { status: 400 }
        );
      }

      // 4. Create organization if needed
      let organizationId = trial.organization_id;

      if (!organizationId) {
        // Create new organization from trial
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: trial.organization_name,
            type: 'training_provider',
            status: 'active',
            contact_email: trial.email,
            contact_name: trial.contact_name,
            contact_phone: trial.contact_phone,
            is_trial: false,
            trial_ends_at: null,
          })
          .select('id')
          .single();

        if (orgError) {
          return NextResponse.json(
            { error: 'Failed to create organization' },
            { status: 500 }
          );
        }

        organizationId = newOrg.id;
      }

      // 5. Create subscription record
      const { data: subscription, error: subError } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: organizationId,
          plan_id: selectedPlan,
          billing_interval: billingInterval,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (billingInterval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
          stripe_customer_id: body.customerId || null,
          stripe_subscription_id: null, // Will be updated after Stripe checkout
          trial_converted: true,
        })
        .select('id')
        .single();

      if (subError) {
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        );
      }

      // 6. Update trial status
      await supabase
        .from('trial_signups')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          organization_id: organizationId,
        })
        .eq('id', trialId);

      // 7. Return Stripe checkout session info
      return NextResponse.json({
        success: true,
        organizationId,
        subscriptionId: subscription.id,
        plan: selectedPlan,
        billingInterval,
        amount: selected.amount,
        message: 'Trial converted successfully. Redirecting to payment.',
        nextStep: 'create_checkout',
      });
    }

    // Plan found in DB - proceed with conversion
    const organizationId = trial.organization_id;

    // Create subscription
    const { data: subscription, error: subError } = await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: organizationId,
        plan_id: selectedPlan,
        billing_interval: billingInterval,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + (billingInterval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
        stripe_customer_id: body.customerId || null,
        stripe_subscription_id: null,
        trial_converted: true,
      })
      .select('id')
      .single();

    if (subError) {
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Update trial status
    await supabase
      .from('trial_signups')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
      })
      .eq('id', trialId);

    return NextResponse.json({
      success: true,
      organizationId,
      subscriptionId: subscription.id,
      plan: selectedPlan,
      amount: plan.amount_cents,
      message: 'Trial converted successfully',
    });

  } catch (error) {
    console.error('Trial conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check trial status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trialId = searchParams.get('trialId');
  const email = searchParams.get('email');

  if (!trialId && !email) {
    return NextResponse.json(
      { error: 'Provide trialId or email' },
      { status: 400 }
    );
  }

  const supabase = await getAdminClient();

  let query = supabase.from('trial_signups').select('*');
  
  if (trialId) {
    query = query.eq('id', trialId);
  } else if (email) {
    query = query.eq('email', email);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch trial' }, { status: 500 });
  }

  return NextResponse.json({ trials: data });
}
