#!/usr/bin/env node

/**
 * Create Stripe Products for All Programs
 * Run this to automatically create all products in Stripe
 */

import Stripe from 'stripe';

// Check for Stripe key
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  console.error('💡 Run: source .env.local');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
});

// All programs to create
const PROGRAMS = [
  {
    id: 'barber',
    name: 'Barber Apprenticeship',
    description:
      'Complete barber training with Milady RISE certification. Includes hands-on apprenticeship placement, state board exam preparation, and AI instructor support 24/7.',
    price: 4890,
    features: [
      'Milady RISE online coursework',
      'Hands-on apprenticeship placement',
      'State board exam preparation',
      'AI instructor support 24/7',
    ],
  },
  {
    id: 'dsp',
    name: 'Direct Support Professional (DSP)',
    description:
      'Become a certified Direct Support Professional. Includes complete DSP certification, job placement assistance, and AI instructor support.',
    price: 4325,
    features: [
      'Complete DSP certification',
      'Job placement assistance',
      'AI instructor support 24/7',
    ],
  },
  {
    id: 'hvac',
    name: 'HVAC Technician',
    description:
      'HVAC installation and repair certification. Includes EPA certification, hands-on training, and job placement assistance.',
    price: 5000,
    features: [
      'EPA certification included',
      'Hands-on training',
      'Job placement assistance',
      'AI instructor support 24/7',
    ],
  },
  {
    id: 'cpr',
    name: 'CPR Certification',
    description:
      'American Heart Association CPR certification. Same-day certification with digital certificate.',
    price: 575,
    features: ['AHA CPR/AED certification', 'Same-day certification', 'Digital certificate'],
  },
  {
    id: 'ehst',
    name: 'Emergency Health & Safety Tech',
    description:
      'Emergency medical and safety technician training. Includes EMT-Basic certification prep and job placement assistance.',
    price: 4950,
    features: [
      'EMT-Basic certification prep',
      'Safety protocols training',
      'Job placement assistance',
      'AI instructor support 24/7',
    ],
  },
  {
    id: 'esth',
    name: 'Professional Esthetician',
    description:
      'Licensed esthetician training and certification. Includes state board exam preparation and business startup guidance.',
    price: 4575,
    features: [
      'State board exam preparation',
      'Hands-on training',
      'Business startup guidance',
      'AI instructor support 24/7',
    ],
  },
  {
    id: 'prc',
    name: 'Peer Recovery Coach',
    description:
      'Certified peer recovery specialist training. Includes state certification and trauma-informed care training.',
    price: 4750,
    features: [
      'State certification',
      'Trauma-informed care training',
      'Job placement assistance',
      'AI instructor support 24/7',
    ],
  },
  {
    id: 'tax',
    name: 'Tax Prep & Financial Services',
    description:
      'IRS-certified tax preparer training. Includes IRS PTIN certification and tax software training.',
    price: 4950,
    features: [
      'IRS PTIN certification',
      'Tax software training',
      'Business startup guidance',
      'AI instructor support 24/7',
    ],
  },
  {
    id: 'biz',
    name: 'Business Startup & Marketing',
    description:
      'Launch and grow your business. Includes business plan development and digital marketing training.',
    price: 4550,
    features: [
      'Business plan development',
      'Digital marketing training',
      'LLC formation guidance',
      'AI instructor support 24/7',
    ],
  },
];

const results = [];

async function createProduct(program) {
  try {
    // Create Product
    const product = await stripe.products.create({
      name: program.name,
      description: program.description,
      metadata: {
        program_id: program.id,
        features: program.features.join(', '),
      },
    });

    // Create Price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: program.price * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        program_id: program.id,
      },
    });

    results.push({
      program: program.name,
      program_id: program.id,
      product_id: product.id,
      price_id: price.id,
      price: program.price,
    });

    return { success: true, product, price };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    results.push({
      program: program.name,
      program_id: program.id,
      error: error.message,
    });
    return { success: false, error };
  }
}

async function main() {
  for (const program of PROGRAMS) {
    await createProduct(program);
    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary

  const successful = results.filter((r) => r.price_id);
  const failed = results.filter((r) => r.error);

  if (successful.length > 0) {
    successful.forEach((r) => {
      const envVar = `STRIPE_PRICE_${r.program_id.toUpperCase()}`;
    });

    successful.forEach((r) => {});
  }

  if (failed.length > 0) {
    failed.forEach((r) => {});
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
