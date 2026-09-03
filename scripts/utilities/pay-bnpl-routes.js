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

// Buy Now Pay Later (BNPL) Routes with Stripe Installments
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// BNPL Payment Plans Configuration
const BNPL_PLANS = {
  '3_months': {
    name: '3 Monthly Payments',
    installments: 3,
    frequency: 'monthly',
    setup_fee_percent: 0, // No setup fee
    interest_rate: 0.05, // 5% total interest
  },
  '6_months': {
    name: '6 Monthly Payments',
    installments: 6,
    frequency: 'monthly',
    setup_fee_percent: 0,
    interest_rate: 0.08, // 8% total interest
  },
  '12_months': {
    name: '12 Monthly Payments',
    installments: 12,
    frequency: 'monthly',
    setup_fee_percent: 0,
    interest_rate: 0.12, // 12% total interest
  },
};

// Get available BNPL plans for a program
router.get('/api/bnpl/plans/:programSlug', async (req, res) => {
  try {
    const { programSlug } = req.params;

    // Load program details
    const programs = require('./config/all-programs.json');
    const program = programs.find((p) => p.slug === programSlug);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const plans = Object.entries(BNPL_PLANS).map(([planId, plan]) => {
      const totalAmount = program.retail_price * (1 + plan.interest_rate);
      const installmentAmount = Math.round(totalAmount / plan.installments);

      return {
        id: planId,
        name: plan.name,
        installments: plan.installments,
        frequency: plan.frequency,
        total_amount: totalAmount,
        installment_amount: installmentAmount,
        first_payment: installmentAmount,
        interest_rate: plan.interest_rate * 100,
        savings_vs_credit_card: Math.round(program.retail_price * 0.2), // Assume 20% savings vs credit cards
        program_price: program.retail_price,
        program_name: program.name,
      };
    });

    res.json({ plans, program });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load payment plans' });
  }
});

// Create BNPL checkout session
router.post('/api/bnpl/checkout', async (req, res) => {
  try {
    const { programSlug, planId, customerEmail, metadata = {} } = req.body;

    if (!programSlug || !planId || !customerEmail) {
      return res.status(400).json({
        error: 'Program slug, plan ID, and customer email required',
      });
    }

    // Load program and plan details
    const programs = require('./config/all-programs.json');
    const program = programs.find((p) => p.slug === programSlug);
    const plan = BNPL_PLANS[planId];

    if (!program || !plan) {
      return res.status(404).json({ error: 'Program or plan not found' });
    }

    // Calculate payment amounts
    const totalAmount = program.retail_price * (1 + plan.interest_rate);
    const installmentAmount = Math.round(totalAmount / plan.installments);

    // Create or get customer
    let customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            program_slug: programSlug,
            payment_plan: planId,
          },
        });
      }
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create customer' });
    }

    // Create subscription for installment payments
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${program.name} - ${plan.name}`,
              description: `${plan.installments} installments of $${(installmentAmount / 100).toFixed(2)}`,
            },
            unit_amount: installmentAmount,
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
        },
      ],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        program_slug: programSlug,
        payment_plan: planId,
        total_installments: plan.installments.toString(),
        installment_amount: installmentAmount.toString(),
        original_price: (program.retail_price * 100).toString(),
        partner_connect_acc: program.partner_connect_acc || '',
        ...metadata,
      },
      trial_period_days: 0,
    });

    // Store BNPL record in database
    const bnplRecord = {
      subscription_id: subscription.id,
      customer_id: customer.id,
      customer_email: customerEmail,
      program_slug: programSlug,
      plan_id: planId,
      total_amount: totalAmount,
      installment_amount: installmentAmount,
      installments_total: plan.installments,
      installments_paid: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      metadata: metadata,
    };

    await supabase.from('bnpl_subscriptions').insert(bnplRecord);

    // Create checkout session for first payment
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customer.id,
      payment_method_types: ['card'],
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=bnpl`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        subscription_id: subscription.id,
        program_slug: programSlug,
        payment_plan: planId,
      },
    });

    res.json({
      checkout_url: checkoutSession.url,
      subscription_id: subscription.id,
      plan_summary: {
        program_name: program.name,
        plan_name: plan.name,
        installments: plan.installments,
        installment_amount: installmentAmount / 100,
        total_amount: totalAmount / 100,
        first_payment_date: 'Today',
        next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment plan' });
  }
});

// Get customer's BNPL subscriptions
router.get('/api/bnpl/subscriptions/:customerEmail', async (req, res) => {
  try {
    const { customerEmail } = req.params;

    const { data: subscriptions } = await supabase
      .from('bnpl_subscriptions')
      .select('*')
      .eq('customer_email', customerEmail);

    // Get latest payment status from Stripe
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(sub.subscription_id);
          return {
            ...sub,
            stripe_status: stripeSubscription.status,
            current_period_end: stripeSubscription.current_period_end,
            latest_invoice: stripeSubscription.latest_invoice,
          };
        } catch (error) {
          return { ...sub, stripe_status: 'unknown' };
        }
      }),
    );

    res.json({ subscriptions: enrichedSubscriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load subscriptions' });
  }
});

// Cancel BNPL subscription
router.post('/api/bnpl/cancel/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason = 'customer_request' } = req.body;

    // Cancel in Stripe
    await stripe.subscriptions.cancel(subscriptionId, {
      metadata: { cancellation_reason: reason },
    });

    // Update in database
    await supabase
      .from('bnpl_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('subscription_id', subscriptionId);

    res.json({ success: true, message: 'Subscription canceled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

module.exports = router;
