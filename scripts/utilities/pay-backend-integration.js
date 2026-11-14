/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// Pay Backend Integration with Supabase Memory Service
// Add this to your existing Pay service (pay.elevateforhumanity.org)

const { createClient } = require('@supabase/supabase-js');

// Provide fallbacks to prevent no-undef during lint where integration host not loaded
// (These stubs are harmless and can be removed when real server wiring is in place)

let appRef = global.__EFH_PAY_APP__;
if (!appRef) {
  const express = require('express');
  appRef = express();
  global.__EFH_PAY_APP__ = appRef;
}
const stripeLib = (() => {
  try {
    return require('stripe')(process.env.STRIPE_SECRET_KEY || '');
  } catch {
    return null;
  }
})();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Environment variables to add to your Pay backend .env
// SUPABASE_URL=https://YOUR-PROJECT.supabase.co
// SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY

const supaAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * Mark enrollment as paid/active in Supabase after successful Stripe payment
 * Call this function from your existing Stripe webhook handler
 */
async function markPaidInSupabase({
  email,
  program_slug,
  stripe_customer_id,
  session_id,
  funding_metadata = {},
}) {
  try {
    // Find user_id from email
    const { data: appUser, error: userError } = await supaAdmin
      .from('app_users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !appUser) {
      return false;
    }

    const user_id = appUser.id;

    // Upsert enrollment → active
    const { error: enrollError } = await supaAdmin.from('enrollments').upsert(
      {
        user_id,
        program_slug,
        status: 'active',
        started_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,program_slug',
        ignoreDuplicates: false,
      },
    );

    if (enrollError) {
      return false;
    }

    // Record payment with funding metadata
    const { error: paymentError } = await supaAdmin.from('payments').insert({
      user_id,
      stripe_customer_id,
      last_payment_at: new Date().toISOString(),
      last_checkout_session: session_id,
    });

    if (paymentError) {
      // Don't return false here - enrollment is more important than payment record
    }

    // Store funding info in notes if provided
    if (funding_metadata && Object.keys(funding_metadata).length > 0) {
      const fundingNote = `Payment completed with funding details: ${JSON.stringify(funding_metadata, null, 2)}`;

      await supaAdmin.from('notes').insert({
        user_id,
        type: 'funding',
        content: fundingNote,
        created_at: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Example integration with your existing Stripe webhook handler
 * Add this to your checkout.session.completed event handler
 */
function integrateWithStripeWebhook() {
  // In your existing webhook handler, after verifying the Stripe event:

  if (!stripeLib) return;
  appRef.post(
    '/webhook',
    require('express').raw({ type: 'application/json' }),
    async (request, response) => {
      const sig = request.headers['stripe-signature'];
      let event;

      try {
        event = stripeLib.webhooks.constructEvent(request.body, sig, endpointSecret);
      } catch (err) {
        return response.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Extract funding metadata passed from Account Drawer
        const fundingMeta = {};
        if (session.metadata?.voucher_id) fundingMeta.voucher_id = session.metadata.voucher_id;
        if (session.metadata?.case_manager_email)
          fundingMeta.case_manager_email = session.metadata.case_manager_email;
        if (session.metadata?.funding_source)
          fundingMeta.funding_source = session.metadata.funding_source;
        if (session.metadata?.coupon) fundingMeta.coupon = session.metadata.coupon;

        // Your existing logic here...

        // NEW: Mark enrollment as paid in Supabase with funding info
        await markPaidInSupabase({
          email: session.customer_details?.email,
          program_slug: session.metadata?.program_slug,
          stripe_customer_id: session.customer || null,
          session_id: session.id,
          funding_metadata: fundingMeta,
        });
      }

      response.status(200).send('OK');
    },
  );
}

module.exports = { markPaidInSupabase, integrateWithStripeWebhook };
