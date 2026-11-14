/**
 * Setup Drug Testing Products and Courses in Stripe
 * Run with: npx tsx scripts/setup-drug-testing-products.ts
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// Drug Testing Services (40% markup from NDS prices)
const drugTestingServices = [
  // Urine Tests
  {
    name: 'DOT Urine Drug Test',
    price: 105,
    ndsPrice: 75,
    category: 'Urine Drug Test',
    description: 'DOT-compliant 5-panel urine drug test with MRO review',
  },
  {
    name: '5 Panel Drug Test',
    price: 97,
    ndsPrice: 69,
    category: 'Urine Drug Test',
    description: 'Standard 5-panel urine drug test (COC, THC, OPI, AMP, PCP)',
  },
  {
    name: '10 Panel Drug Test',
    price: 97,
    ndsPrice: 69,
    category: 'Urine Drug Test',
    description: 'Expanded 10-panel urine drug test',
  },
  {
    name: '5 Panel + Expanded Opiates',
    price: 105,
    ndsPrice: 75,
    category: 'Urine Drug Test',
    description: 'Includes testing for synthetic opioids',
  },
  {
    name: '4 Panel (NO THC)',
    price: 105,
    ndsPrice: 75,
    category: 'Urine Drug Test',
    description: 'Drug test without marijuana for states with legal cannabis',
  },
  {
    name: '5 Panel + Alcohol',
    price: 119,
    ndsPrice: 85,
    category: 'Urine Drug Test',
    description: '5-panel drug test plus alcohol screening',
  },
  {
    name: '10 Panel + Alcohol',
    price: 119,
    ndsPrice: 85,
    category: 'Urine Drug Test',
    description: '10-panel drug test plus alcohol screening',
  },
  {
    name: '5 Panel + Alcohol EtG',
    price: 237,
    ndsPrice: 169,
    category: 'Urine Drug Test',
    description: '5-panel plus EtG alcohol test (detects up to 80 hours)',
  },
  {
    name: '10 Panel + Alcohol EtG + Exp Opi',
    price: 251,
    ndsPrice: 179,
    category: 'Urine Drug Test',
    description: 'Comprehensive test with extended alcohol detection',
  },
  {
    name: '5 Panel + Nicotine',
    price: 144,
    ndsPrice: 103,
    category: 'Urine Drug Test',
    description: '5-panel drug test plus nicotine/cotinine screening',
  },

  // Instant Tests
  {
    name: 'Instant Rapid 5 Panel',
    price: 84,
    ndsPrice: 60,
    category: 'Instant Rapid Test',
    description: 'Rapid on-site testing with immediate results',
  },
  {
    name: 'Instant Rapid 10 Panel',
    price: 97,
    ndsPrice: 69,
    category: 'Instant Rapid Test',
    description: 'Rapid 10-panel on-site testing',
  },
  {
    name: 'Instant Rapid 4 Panel (NO THC)',
    price: 84,
    ndsPrice: 60,
    category: 'Instant Rapid Test',
    description: 'Rapid testing without marijuana',
  },
  {
    name: 'Instant Rapid 9 Panel (NO THC)',
    price: 91,
    ndsPrice: 65,
    category: 'Instant Rapid Test',
    description: 'Expanded rapid testing without marijuana',
  },

  // Hair Tests
  {
    name: 'Hair Drug Test 10 Panel',
    price: 412,
    ndsPrice: 294,
    category: 'Hair Drug Test',
    description: 'Hair follicle testing (90-day detection window)',
  },
  {
    name: 'Hair Drug Test 13 Panel + Exp Opi',
    price: 962,
    ndsPrice: 687,
    category: 'Hair Drug Test',
    description: 'Comprehensive hair testing with expanded opiates',
  },
  {
    name: 'Hair Drug Test 18 Panel + Exp Opi',
    price: 1042,
    ndsPrice: 744,
    category: 'Hair Drug Test',
    description: 'Most comprehensive hair drug test available',
  },
  {
    name: 'Hair 4 Panel + Exp Opi + Oxi (NO THC)',
    price: 267,
    ndsPrice: 191,
    category: 'Hair Drug Test',
    description: 'Hair testing without marijuana',
  },

  // DOT Specialty
  {
    name: 'DOT Pre-Employment Drug Test',
    price: 105,
    ndsPrice: 75,
    category: 'DOT Specialty',
    description: 'Required for FMCSA-regulated drivers',
  },
  {
    name: 'Return to Duty DOT Test',
    price: 525,
    ndsPrice: 375,
    category: 'DOT Specialty',
    description: 'For drivers returning after positive test',
  },
];

// Training Courses (40% markup from NDS prices)
const trainingCourses = [
  // Collector Training
  {
    name: 'DOT Urine Specimen Collector Training and Mocks',
    price: 917,
    ndsPrice: 655,
    category: 'Collector Training',
    description: 'Complete DOT urine collector training with 5 required mock collections',
    duration: '4-6 hours + mocks',
  },
  {
    name: 'DOT Urine Collector Mock Collections',
    price: 462,
    ndsPrice: 330,
    category: 'Collector Training',
    description: 'Mock collections only (for those already trained)',
    duration: '90 minutes',
  },
  {
    name: 'DOT Oral Fluid Collector Training Course (Mocks Included)',
    price: 979,
    ndsPrice: 699,
    category: 'Collector Training',
    description: 'Complete DOT oral fluid collector training with mocks',
    duration: '4-6 hours + mocks',
  },
  {
    name: 'Saliva-Oral Fluid Non-DOT Drug Testing Training',
    price: 490,
    ndsPrice: 350,
    category: 'Collector Training',
    description: 'Non-DOT oral fluid collection training',
    duration: '3-4 hours',
  },

  // Supervisor Training
  {
    name: 'DOT Supervisor Training Course',
    price: 91,
    ndsPrice: 65,
    category: 'Supervisor Training',
    description: 'Required training for supervisors of DOT-regulated employees',
    duration: '60 minutes',
  },
  {
    name: 'Non-DOT Supervisor Training Course',
    price: 91,
    ndsPrice: 65,
    category: 'Supervisor Training',
    description: 'Supervisor training for non-DOT workplace drug testing programs',
    duration: '60 minutes',
  },

  // DER Training
  {
    name: 'DER Training Course - FMCSA',
    price: 308,
    ndsPrice: 220,
    category: 'DER Training',
    description: 'Designated Employer Representative training for FMCSA (trucking)',
    duration: '2-3 hours',
  },
  {
    name: 'DER Training Course - FAA',
    price: 308,
    ndsPrice: 220,
    category: 'DER Training',
    description: 'Designated Employer Representative training for FAA (aviation)',
    duration: '2-3 hours',
  },
  {
    name: 'Non-DOT General Designated Employer Representative Training (DER)',
    price: 308,
    ndsPrice: 220,
    category: 'DER Training',
    description: 'DER training for non-DOT workplace programs',
    duration: '2-3 hours',
  },

  // Employee Training
  {
    name: 'Drug Free Workplace Training for Employees',
    price: 31,
    ndsPrice: 22,
    category: 'Employee Training',
    description: 'Employee education on drug-free workplace policies',
    duration: '30 minutes',
  },

  // Advanced Training
  {
    name: 'DOT Urine Specimen Collector Train the Trainer',
    price: 2450,
    ndsPrice: 1750,
    category: 'Advanced Training',
    description: 'Become a qualified trainer for DOT urine collectors',
    duration: '2 days',
  },
  {
    name: 'Drug Testing Start-Up Overview',
    price: 139,
    ndsPrice: 99,
    category: 'Advanced Training',
    description: 'Learn how to start and operate a drug testing business',
    duration: '2 hours',
  },
];

async function createProduct(item: any, type: 'service' | 'course') {
  try {
    // Create product
    const product = await stripe.products.create({
      name: item.name,
      description: item.description,
      metadata: {
        type: type === 'service' ? 'drug_testing_service' : 'training_course',
        category: item.category,
        nds_price: item.ndsPrice.toString(),
        markup: '40%',
        ...(type === 'course' && item.duration ? { duration: item.duration } : {}),
      },
    });

    // Create price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: item.price * 100, // Convert to cents
      currency: 'usd',
    });

    return { product, price };
  } catch (error) {
    return null;
  }
}

async function main() {
  // Create Drug Testing Services
  let servicesCreated = 0;
  for (const service of drugTestingServices) {
    const result = await createProduct(service, 'service');
    if (result) servicesCreated++;
    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Create Training Courses
  let coursesCreated = 0;
  for (const course of trainingCourses) {
    const result = await createProduct(course, 'course');
    if (result) coursesCreated++;
    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Summary
}

main().catch(console.error);
