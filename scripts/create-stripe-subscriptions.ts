#!/usr/bin/env node

/**
 * Step 2: Create subscriptions in Stripe for linked customers
 * 
 * For each customer with a linked payment method, create a Stripe subscription
 * with the weekly payment amount and duration from barber_subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuxzzpsyufcewtmicszk.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const stripeKey = process.env.STRIPE_KEY || '';

if (!supabaseUrl || !serviceRoleKey || !stripeKey) {
  console.error('❌ Missing required env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });

async function createSubscriptions() {
  try {
    console.log('💳 Step 2: Creating subscriptions in Stripe...\n');

    // Target customers (only those with payment methods: Natalia and Mercedes)
    const targetCustomers = [
      'cus_UTVa6pmsYlWBsp', // Natalia Roa - has pm_1TUYb1H4a2yrVOt5v4bfdcjW
      'cus_UG4BIa05facQez', // Mercedes Wellington - has pm_1THY40H4a2yrVOt5qwcZvPZ6
    ];

    for (const customerId of targetCustomers) {
      try {
        console.log(`Processing ${customerId}...`);

        // 1. Get barber_subscriptions record
        const { data: subs, error: subErr } = await supabase
          .from('barber_subscriptions')
          .select('id, customer_name, stripe_customer_id, stripe_subscription_id, weekly_payment_cents, weeks_remaining, billing_cycle_anchor, status')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subErr) throw new Error(`Supabase query error: ${subErr.message}`);
        if (!subs) throw new Error('No barber_subscriptions record found');

        console.log(`  Name: ${subs.customer_name}`);
        console.log(`  Weekly payment: $${(subs.weekly_payment_cents / 100).toFixed(2)}`);
        console.log(`  Weeks remaining: ${subs.weeks_remaining}`);

        // Skip if already has subscription
        if (subs.stripe_subscription_id) {
          console.log(`  ⚠️  Already has subscription: ${subs.stripe_subscription_id}\n`);
          continue;
        }

        // 2. Get Stripe customer to find default payment method
        const customer = await stripe.customers.retrieve(customerId);
        console.log(`  Payment method: ${customer.invoice_settings?.default_payment_method || 'NONE'}`);

        if (!customer.invoice_settings?.default_payment_method) {
          console.log(`  ❌ No default payment method set on customer\n`);
          continue;
        }

        // 3. Create subscription
        const subscriptionData: any = {
          customer: customerId,
          items: [
            {
              price_data: {
                currency: 'usd',
                product: 'prod_barber_weekly', // Use fixed product ID
                recurring: {
                  interval: 'week',
                  interval_count: 1,
                },
                unit_amount: subs.weekly_payment_cents,
              },
            },
          ],
          metadata: {
            barber_subscription_id: subs.id,
            customer_name: subs.customer_name,
            weeks: String(subs.weeks_remaining),
          },
        };

        // Set billing cycle anchor if available
        if (subs.billing_cycle_anchor) {
          subscriptionData.billing_cycle_anchor = Math.floor(new Date(subs.billing_cycle_anchor).getTime() / 1000);
        }

        // Set cancel_at to limit subscription duration to weeks_remaining
        if (subs.weeks_remaining && subs.weeks_remaining > 0) {
          const cancelDate = new Date();
          cancelDate.setDate(cancelDate.getDate() + subs.weeks_remaining * 7);
          subscriptionData.cancel_at = Math.floor(cancelDate.getTime() / 1000);
        }

        const subscription = await stripe.subscriptions.create(subscriptionData);

        console.log(`  ✅ Created subscription: ${subscription.id}`);
        console.log(`  Status: ${subscription.status}`);
        console.log(`  Next billing: ${new Date(subscription.current_period_end * 1000).toISOString()}`);

        // 4. Update Supabase record with subscription ID
        const { error: updateErr } = await supabase
          .from('barber_subscriptions')
          .update({
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subs.id);

        if (updateErr) throw new Error(`Update error: ${updateErr.message}`);

        console.log(`  ✅ Updated Supabase record\n`);

      } catch (err) {
        console.error(`  ❌ Error:`, err instanceof Error ? err.message : err);
        console.log('');
      }
    }

    // 5. Verify subscriptions created
    console.log('\n📋 Verification - Subscriptions created:\n');
    const { data: verified, error: verifyErr } = await supabase
      .from('barber_subscriptions')
      .select('customer_name, stripe_customer_id, stripe_subscription_id, status, weeks_remaining')
      .in('stripe_customer_id', targetCustomers)
      .order('created_at', { ascending: false });

    if (verifyErr) throw verifyErr;

    if (verified && verified.length > 0) {
      console.table(verified);
      const linked = verified.filter((v) => v.stripe_subscription_id).length;
      console.log(`\n✅ Step 2 complete: ${linked}/${verified.length} subscriptions created\n`);
    }

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createSubscriptions();
