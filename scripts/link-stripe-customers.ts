#!/usr/bin/env node

/**
 * Step 1: Link Stripe customers to barber_subscriptions records
 * 
 * Maps:
 * - Jordan White: stripe_customer_id = cus_UGFxoJKjtlNoy8
 * - Natalia Roa: stripe_customer_id = cus_UTVa6pmsYlWBsp
 * - Mercedes Wellington: stripe_customer_id = cus_UG4BIa05facQez
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuxzzpsyufcewtmicszk.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function linkStripeCustomers() {
  try {
    console.log('🔗 Step 1: Linking Stripe customers to barber_subscriptions...\n');

    // Find the users by email from the applications
    const { data: apps, error: appErr } = await supabase
      .from('applications')
      .select('id, user_id, email, full_name')
      .in('email', [
        'jordan.white@example.com',
        'natalia.roa@example.com', 
        'mercedes.wellington@example.com',
      ]);

    if (appErr) {
      console.error('Error finding applications:', appErr);
    }

    console.log('Found applications:', apps?.length || 0);
    console.log('');

    // Manual mapping - we know the customer IDs from Stripe verification
    const mappings = [
      { name: 'Jordan White', stripe_customer_id: 'cus_UGFxoJKjtlNoy8' },
      { name: 'Natalia Roa', stripe_customer_id: 'cus_UTVa6pmsYlWBsp' },
      { name: 'Mercedes Wellington', stripe_customer_id: 'cus_UG4BIa05facQez' },
    ];

    for (const { name, stripe_customer_id } of mappings) {
      try {
        // Find barber_subscriptions records by customer_name or search unlinked records
        let { data: subs, error: queryErr } = await supabase
          .from('barber_subscriptions')
          .select('id, user_id, customer_name, stripe_customer_id, created_at')
          .textSearch('customer_name', name, { type: 'phrase' })
          .limit(1);

        if (queryErr || !subs || subs.length === 0) {
          // Try to find any unlinked record for this name
          ({ data: subs, error: queryErr } = await supabase
            .from('barber_subscriptions')
            .select('id, user_id, customer_name, stripe_customer_id, created_at')
            .ilike('customer_name', `%${name}%`)
            .limit(1));

          if (queryErr) throw queryErr;
        }

        if (!subs || subs.length === 0) {
          console.log(`⚠️  No barber_subscriptions found for ${name}`);
          continue;
        }

        const target = subs[0];
        
        // Skip if already linked to a different customer ID
        if (target.stripe_customer_id && target.stripe_customer_id !== stripe_customer_id) {
          console.log(`⚠️  ${name} already linked to ${target.stripe_customer_id}, skipping`);
          continue;
        }

        // Update with stripe_customer_id
        const { data: updated, error: updateErr } = await supabase
          .from('barber_subscriptions')
          .update({
            stripe_customer_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', target.id)
          .select();

        if (updateErr) throw updateErr;

        console.log(`✅ Linked ${name} → ${stripe_customer_id}`);
        console.log(`   barber_subscriptions ID: ${target.id}`);
        console.log(`   User ID: ${target.user_id}\n`);

      } catch (err) {
        console.error(`❌ Error linking ${name}:`, err);
      }
    }

    // Verify all three target links
    console.log('\n📋 Verification - Target customers in barber_subscriptions:\n');
    const { data: verified, error: verifyErr } = await supabase
      .from('barber_subscriptions')
      .select('id, customer_name, stripe_customer_id, stripe_subscription_id, status, created_at')
      .in('stripe_customer_id', [
        'cus_UGFxoJKjtlNoy8',
        'cus_UTVa6pmsYlWBsp',
        'cus_UG4BIa05facQez'
      ])
      .order('created_at', { ascending: false });

    if (verifyErr) throw verifyErr;

    if (verified && verified.length > 0) {
      console.table(verified);
      console.log(`\n✅ Step 1 complete: ${verified.length} customers linked\n`);
    } else {
      console.log('⚠️  No linked records found after operation\n');
    }

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

linkStripeCustomers();
