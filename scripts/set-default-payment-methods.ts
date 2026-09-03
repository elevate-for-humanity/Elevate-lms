#!/usr/bin/env node

/**
 * Set default payment methods on Stripe customers
 * 
 * Natalia: pm_1TUYb1H4a2yrVOt5v4bfdcjW
 * Mercedes: pm_1THY40H4a2yrVOt5qwcZvPZ6
 */

import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_KEY || '';

if (!stripeKey) {
  console.error('❌ STRIPE_KEY required');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });

async function setDefaultPaymentMethods() {
  try {
    console.log('🛠️  Setting default payment methods...\n');

    const mappings = [
      {
        name: 'Natalia Roa',
        customerId: 'cus_UTVa6pmsYlWBsp',
        paymentMethodId: 'pm_1TUYb1H4a2yrVOt5v4bfdcjW',
      },
      {
        name: 'Mercedes Wellington',
        customerId: 'cus_UG4BIa05facQez',
        paymentMethodId: 'pm_1THY40H4a2yrVOt5qwcZvPZ6',
      },
    ];

    for (const { name, customerId, paymentMethodId } of mappings) {
      try {
        console.log(`Updating ${name}...`);

        // Attach payment method to customer if not already attached
        const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
        console.log(`  Payment method: ${pm.type} ${pm.card?.brand} ${pm.card?.last4}`);

        // Set as default for invoice
        const updated = await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        console.log(`  ✅ Set as default`);
        console.log(`  Invoice settings: ${JSON.stringify(updated.invoice_settings)}\n`);

      } catch (err) {
        console.error(`  ❌ Error:`, err instanceof Error ? err.message : err);
        console.log('');
      }
    }

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

setDefaultPaymentMethods();
