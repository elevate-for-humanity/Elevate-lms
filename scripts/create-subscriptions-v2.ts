#!/usr/bin/env node

/**
 * Step 2 (v2): Create subscriptions in Stripe for linked customers
 * Simplified version with working parameters
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
      'cus_UTVa6pmsYlWBsp', // Natalia Roa
      'cus_UG4BIa05facQez', // Mercedes Wellington
    ];

    for (const customerId of targetCustomers) {
      try {
        console.log(`Processing ${customerId}...`);

        // 1. Get barber_subscriptions record
        const { data: subs, error: subErr } = await supabase
          .from('barber_subscriptions')
          .select('id, customer_name, stripe_customer_id, stripe_subscription_id, weekly_payment_cents, weeks_remaining')
          .eq('stripe_customer_id', customerId)
          .single();

        if (subErr) throw subErr;
        if (!subs) throw new Error('No record found');

        console.log(`  Name: ${subs.customer_name}`);
        console.log(`  Weekly: $${(subs.weekly_payment_cents / 100).toFixed(2)}`);
        console.log(`  Weeks: ${subs.weeks_remaining}`);

        if (subs.stripe_subscription_id) {
          console.log(`  ⚠️  Already has subscription\n`);
          continue;
        }

        // 2. Create subscription
        const sub = await stripe.subscriptions.create({
          customer: customerId,
          items: [
            {
              price_data: {
                currency: 'usd',
                product: 'prod_QS0rN9rqMhROGF', // Barber Apprenticeship product
                recurring: { interval: 'week' },
                unit_amount: subs.weekly_payment_cents,
              },
            },
          ],
          metadata: {
            barber_id: subs.id,
            weeks: String(subs.weeks_remaining),
          },
        } as any);

        console.log(`  ✅ Created: ${sub.id}\n`);

        // 3. Update database
        await supabase
          .from('barber_subscriptions')
          .update({ stripe_subscription_id: sub.id, updated_at: new Date().toISOString() })
          .eq('id', subs.id);

      } catch (err: any) {
        console.log(`  ❌ Error: ${err.message}\n`);
      }
    }

    // 4. Verify
    console.log('📋 Verification:\n');
    const { data } = await supabase
      .from('barber_subscriptions')
      .select('customer_name, stripe_subscription_id')
      .in('stripe_customer_id', targetCustomers);

    if (data) console.table(data);
    console.log('\n✅ Step 2 complete\n');

  } catch (err: any) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

createSubscriptions();
