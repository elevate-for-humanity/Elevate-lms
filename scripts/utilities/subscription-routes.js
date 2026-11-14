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

// Subscription API Routes
// Defined subscription plans (replace pricing with live values as needed)
const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    price_monthly: 9900, // $99.00
    price_yearly: 99000, // $990.00 (2 months free)
    features: ['Access to core courses', 'Basic progress tracking', 'Email support'],
  },
  professional: {
    name: 'Professional',
    price_monthly: 19900,
    price_yearly: 199000,
    features: [
      'All Starter features',
      'Advanced analytics',
      'Certificate generation',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price_monthly: 49900,
    price_yearly: 499000,
    features: [
      'All Professional features',
      'Custom integrations',
      'Dedicated success manager',
      'SLA & compliance reporting',
    ],
  },
};

// Subscription API Routes
const express = require('express');
const { SubscriptionManager } = require('./subscription-manager');

const router = express.Router();
const subscriptionManager = new SubscriptionManager();

// Get subscription plans
router.get('/api/subscription/plans', (req, res) => {
  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
    id,
    name: plan.name,
    price_monthly: plan.price_monthly,
    price_yearly: plan.price_yearly,
    features: plan.features,
    savings_yearly: Math.round((plan.price_monthly * 12 - plan.price_yearly) / 100),
  }));

  res.json({ plans });
});

// Create subscription checkout
router.post('/api/subscription/checkout', async (req, res) => {
  try {
    const { email, planId, billingPeriod } = req.body;

    if (!email || !planId) {
      return res.status(400).json({ error: 'Email and plan ID required' });
    }

    const result = await subscriptionManager.createSubscription(email, planId, billingPeriod);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Get user's current subscription
router.get('/api/subscription/current', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const subscription = await subscriptionManager.getUserSubscription(email);
    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Check course access
router.get('/api/subscription/access/:courseSlug', async (req, res) => {
  try {
    const { email } = req.query;
    const { courseSlug } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const hasAccess = await subscriptionManager.canAccessCourse(email, courseSlug);
    res.json({ hasAccess });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check access' });
  }
});

module.exports = router;
