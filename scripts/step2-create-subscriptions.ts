#!/usr/bin/env node

/**
 * Step 2: Create subscriptions with correct product ID
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuxzzpsyufcewtmicszk.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const stripeKey = process.env.STRIPE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });

const PRODUCT_ID = 'prod_UVF2b5Sqx3HaEX'; // Barber Apprenticeship product
const TARGETS = [
  { name: 'Natalia Roa', id: 'cus_UTVa6pmsYlWBsp' },
  { name: 'Mercedes Wellington', id: 'cus_UG4BIa05facQez' },
];

async function main() {
  try {
    console.log('💳 Step 2: Creating subscriptions...\n');

    for (const { id: customerId, name } of TARGETS) {
      try {
        console.log(`${name}:`);
        const { data: subs, error } = await supabase
          .from('barber_subscriptions')
          .select('id, weekly_payment_cents, weeks_remaining, stripe_subscription_id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (error || !subs) throw new Error('Record not found');
        if (subs.stripe_subscription_id) {
          console.log(`  ⚠️  Already linked\n`);
          continue;
        }

        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{  price_data: {
              currency: 'usd',
              product: PRODUCT_ID,
              recurring: { interval: 'week' },
              unit_amount: subs.weekly_payment_cents,
            }
          }],
          metadata: {
            barber_id: subs.id,
            weeks: String(subs.weeks_remaining),
          },
        } as any);

        await supabase
          .from('barber_subscriptions')
          .update({ stripe_subscription_id: subscription.id })
          .eq('id', subs.id);

        console.log(`  ✅ ${subscription.id}\n`);
      } catch (err: any) {
        console.log(`  ❌ ${err.message}\n`);
      }
    }

    const { data } = await supabase
      .from('barber_subscriptions')
      .select('customer_name, stripe_subscription_id')
      .in('stripe_customer_id', TARGETS.map(t => t.id));

    console.log('\n📊 Result:');
    console.table(data);
    console.log('\n✅ Done\n');
  } catch (err: any) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

main();
