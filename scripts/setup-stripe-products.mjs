#!/usr/bin/env node
/**
 * Setup Stripe Products for Elevate for Humanity Programs
 * Creates products and prices for all training programs
 */

import Stripe from 'stripe';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '..', '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// PAID PROGRAMS
const PAID_PROGRAMS = [
  {
    name: 'Barber Apprenticeship',
    description: 'Complete barber training with Milady RISE certification',
    price: 498000, // $4,980.00 (in cents)
    paymentPlans: [
      { name: 'Full Payment', amount: 498000, installments: 1 },
      { name: '3-Month Plan', amount: 166000, installments: 3 },
      { name: '6-Month Plan', amount: 83000, installments: 6 },
    ],
    metadata: {
      program_slug: 'barber',
      vendor_name: 'milady',
      vendor_cost: '295',
      program_type: 'paid',
    },
  },
  {
    name: 'Professional Esthetician',
    description: 'Licensed esthetician training and certification',
    price: 457500, // $4,575.00 (in cents)
    paymentPlans: [
      { name: 'Full Payment', amount: 457500, installments: 1 },
      { name: '3-Month Plan', amount: 152500, installments: 3 },
      { name: '6-Month Plan', amount: 76300, installments: 6 },
    ],
    metadata: {
      program_slug: 'esth',
      vendor_name: 'null',
      vendor_cost: '0',
      program_type: 'paid',
    },
  },
];

// WIO (Workforce Innovation Opportunity) PROGRAMS - FREE
const WIO_PROGRAMS = [
  {
    name: 'Direct Support Professional (DSP)',
    description:
      'Become a certified Direct Support Professional - WIO funded, free for participants',
    price: 0,
    paymentPlans: [],
    metadata: {
      program_slug: 'dsp',
      program_type: 'wio',
      wio_funded: 'true',
    },
  },
  {
    name: 'HVAC Technician',
    description: 'HVAC installation and repair certification - WIO funded, free for participants',
    price: 0,
    paymentPlans: [],
    metadata: {
      program_slug: 'hvac',
      program_type: 'wio',
      wio_funded: 'true',
    },
  },
  {
    name: 'CPR Certification',
    description: 'American Heart Association CPR certification - WIO funded, free for participants',
    price: 0,
    paymentPlans: [],
    metadata: {
      program_slug: 'cpr',
      program_type: 'wio',
      wio_funded: 'true',
    },
  },
  {
    name: 'Emergency Health & Safety Tech',
    description:
      'Emergency medical and safety technician training - WIO funded, free for participants',
    price: 0,
    paymentPlans: [],
    metadata: {
      program_slug: 'ehst',
      program_type: 'wio',
      wio_funded: 'true',
    },
  },
  {
    name: 'Peer Recovery Coach',
    description: 'Certified peer recovery specialist training - WIO funded, free for participants',
    price: 0,
    paymentPlans: [],
    metadata: {
      program_slug: 'prc',
      program_type: 'wio',
      wio_funded: 'true',
    },
  },
  {
    name: 'Tax Prep & Financial Services',
    description: 'IRS-certified tax preparer training - WIO funded, free for participants',
    price: 0,
    paymentPlans: [],
    metadata: {
      program_slug: 'tax',
      program_type: 'wio',
      wio_funded: 'true',
    },
  },
  {
    name: 'Business Startup & Marketing',
    description: 'Launch and grow your business - WIO funded, free for participants',
    price: 0,
    paymentPlans: [],
    metadata: {
      program_slug: 'biz',
      program_type: 'wio',
      wio_funded: 'true',
    },
  },
];

const PROGRAMS = [...PAID_PROGRAMS, ...WIO_PROGRAMS];

async function createProduct(programData) {
  try {
    const isWIO = programData.metadata.program_type === 'wio';

    // Create Stripe product
    const productData = {
      name: programData.name,
      description: programData.description,
      metadata: programData.metadata,
    };

    // Only add price for paid programs
    if (!isWIO && programData.price > 0) {
      productData.default_price_data = {
        currency: 'usd',
        unit_amount: programData.price,
      };
    }

    const product = await stripe.products.create(productData);
    console.log(
      `✅ Created: ${programData.name}${isWIO ? ' (WIO - FREE)' : ` ($${programData.price / 100})`}`,
    );

    // Create additional payment plan prices for paid programs
    const prices = [];
    if (!isWIO && programData.paymentPlans.length > 0) {
      for (const plan of programData.paymentPlans) {
        if (plan.installments === 1) {
          prices.push({
            id: product.default_price,
            name: plan.name,
            amount: plan.amount,
            installments: 1,
          });
          continue;
        }

        const price = await stripe.prices.create({
          product: product.id,
          currency: 'usd',
          unit_amount: plan.amount,
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
          metadata: {
            payment_plan: plan.name,
            installments: plan.installments.toString(),
            total_amount: (plan.amount * plan.installments).toString(),
          },
        });

        prices.push({
          id: price.id,
          name: plan.name,
          amount: plan.amount,
          installments: plan.installments,
        });
        console.log(`   └─ Payment plan: ${plan.name}`);
      }
    }

    return {
      product,
      prices,
    };
  } catch (error) {
    console.error(`❌ Error creating ${programData.name}: ${error.message}`);
    return null;
  }
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
    console.error('   Please set it in your .env.local file');
    process.exit(1);
  }

  const results = [];

  for (const program of PROGRAMS) {
    const result = await createProduct(program);
    if (result) {
      results.push({
        program: program.name,
        slug: program.metadata.program_slug,
        productId: result.product.id,
        defaultPriceId: result.product.default_price,
        paymentPlans: result.prices,
      });
    }
  }
}

main().catch(console.error);
