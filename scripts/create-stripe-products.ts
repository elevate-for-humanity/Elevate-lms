/**
 * Create Stripe Products and Prices
 *
 * Creates the subscription products needed for the platform
 * Run with: STRIPE_SECRET_KEY=xxx npx tsx scripts/create-stripe-products.ts
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

interface ProductConfig {
  name: string;
  description: string;
  price: number; // in cents
  interval: 'month' | 'year';
  metadata: Record<string, string>;
}

const PRODUCTS: ProductConfig[] = [
  {
    name: 'Student Access',
    description:
      'Full access to LMS courses, career resources, and community features. Perfect for individual learners.',
    price: 3900, // $39.00
    interval: 'month',
    metadata: {
      product_type: 'subscription',
      tier: 'student',
      features: 'lms_access,career_resources,community',
    },
  },
  {
    name: 'Career Track Access',
    description:
      'Everything in Student Access plus career coaching, job placement assistance, and priority support.',
    price: 14900, // $149.00
    interval: 'month',
    metadata: {
      product_type: 'subscription',
      tier: 'career',
      features: 'lms_access,career_resources,community,coaching,job_placement,priority_support',
    },
  },
];

async function createProduct(config: ProductConfig) {
  console.log(`\nCreating product: ${config.name}`);

  // Check if product already exists
  const existingProducts = await stripe.products.search({
    query: `name:'${config.name}'',
  });

  let product: Stripe.Product;

  if (existingProducts.data.length > 0) {
    product = existingProducts.data[0];
    console.log(`  Product already exists: ${product.id}`);
  } else {
    product = await stripe.products.create({
      name: config.name,
      description: config.description,
      metadata: config.metadata,
    });
    console.log(`  Created product: ${product.id}`);
  }

  // Check if price already exists
  const existingPrices = await stripe.prices.list({
    product: product.id,
    active: true,
  });

  const matchingPrice = existingPrices.data.find(
    (p) => p.unit_amount === config.price && p.recurring?.interval === config.interval,
  );

  let price: Stripe.Price;

  if (matchingPrice) {
    price = matchingPrice;
    console.log(`  Price already exists: ${price.id}`);
  } else {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: config.price,
      currency: 'usd',
      recurring: {
        interval: config.interval,
      },
      metadata: config.metadata,
    });
    console.log(`  Created price: ${price.id}`);
  }

  return { product, price };
}

async function main() {
  console.log('='.repeat(60));
  console.log('CREATING STRIPE PRODUCTS');
  console.log('='.repeat(60));

  const results: Array<{ name: string; productId: string; priceId: string }> = [];

  for (const config of PRODUCTS) {
    try {
      const { product, price } = await createProduct(config);
      results.push({
        name: config.name,
        productId: product.id,
        priceId: price.id,
      });
    } catch (error) {
      console.error(`Failed to create ${config.name}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));

  console.log('\nAdd these to lib/stripe/app-store-products.ts:\n');

  for (const result of results) {
    console.log(`// ${result.name}`);
    console.log(`stripePriceId: '${result.priceId}',`);
    console.log('');
  }

  console.log('\n' + '='.repeat(60));
  console.log('COMPLETE');
  console.log('='.repeat(60));
}

main().catch(console.error);
