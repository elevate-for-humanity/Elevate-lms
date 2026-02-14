/**
 * Setup Stripe Products and Prices for LMS License Tiers
 * 
 * Run once to create products in Stripe:
 *   npx ts-node scripts/setup-license-products.ts
 * 
 * After running, add the price IDs to your .env file.
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

interface ProductConfig {
  name: string;
  description: string;
  prices: {
    nickname: string;
    amount: number; // in cents
    interval: 'month' | 'year';
    envVar: string;
    trialDays: number;
  }[];
}

const LICENSE_PRODUCTS: ProductConfig[] = [
  {
    name: 'Elevate LMS - Starter License',
    description: 'Up to 100 students, 1 admin, 3 programs. Perfect for small training providers and pilot programs.',
    prices: [
      {
        nickname: 'Starter Monthly',
        amount: 9900, // $99
        interval: 'month',
        envVar: 'STRIPE_PRICE_STARTER_MONTHLY',
        trialDays: 14,
      },
      {
        nickname: 'Starter Annual',
        amount: 89900, // $899
        interval: 'year',
        envVar: 'STRIPE_PRICE_STARTER_ANNUAL',
        trialDays: 14,
      },
    ],
  },
  {
    name: 'Elevate LMS - Professional License',
    description: 'Up to 500 students, 5 admins, unlimited programs. For growing training providers and nonprofits.',
    prices: [
      {
        nickname: 'Professional Monthly',
        amount: 29900, // $299
        interval: 'month',
        envVar: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
        trialDays: 14,
      },
      {
        nickname: 'Professional Annual',
        amount: 249900, // $2,499
        interval: 'year',
        envVar: 'STRIPE_PRICE_PROFESSIONAL_ANNUAL',
        trialDays: 14,
      },
    ],
  },
];

async function createLicenseProducts() {
  console.log('Creating Stripe license products and prices...\n');
  
  const envVars: string[] = [];

  for (const productConfig of LICENSE_PRODUCTS) {
    console.log(`Creating product: ${productConfig.name}`);
    
    // Check if product already exists
    const existingProducts = await stripe.products.search({
      query: `name:"${productConfig.name}"`,
    });
    
    let product: Stripe.Product;
    
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`  Product already exists: ${product.id}`);
    } else {
      // Create product
      product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: {
          platform: 'elevate-lms',
          type: 'license',
        },
      });
      console.log(`  Created product: ${product.id}`);
    }

    // Create prices
    for (const priceConfig of productConfig.prices) {
      // Check if price already exists
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
      });
      
      const existingPrice = existingPrices.data.find(
        p => p.nickname === priceConfig.nickname
      );
      
      if (existingPrice) {
        console.log(`  ${priceConfig.nickname} already exists: ${existingPrice.id}`);
        envVars.push(`${priceConfig.envVar}=${existingPrice.id}`);
        continue;
      }
      
      const price = await stripe.prices.create({
        product: product.id,
        nickname: priceConfig.nickname,
        unit_amount: priceConfig.amount,
        currency: 'usd',
        recurring: {
          interval: priceConfig.interval,
          trial_period_days: priceConfig.trialDays,
        },
        metadata: {
          platform: 'elevate-lms',
          type: 'license',
        },
      });
      
      console.log(`  Created ${priceConfig.nickname}: ${price.id}`);
      envVars.push(`${priceConfig.envVar}=${price.id}`);
    }
    
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('Add these to your .env file:');
  console.log('='.repeat(60));
  console.log('');
  envVars.forEach(v => console.log(v));
  console.log('');
  
  return envVars;
}

// Run
createLicenseProducts()
  .then((envVars) => {
    console.log('Done! Products created successfully.');
    console.log('\nNext steps:');
    console.log('1. Add the environment variables above to your .env file');
    console.log('2. Add them to your production environment (Netlify, etc.)');
    console.log('3. Restart your development server');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\nMake sure STRIPE_SECRET_KEY is set in your environment.');
    }
    process.exit(1);
  });
