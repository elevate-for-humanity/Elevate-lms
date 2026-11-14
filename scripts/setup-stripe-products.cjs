/**
 * Script to automatically create all training products in Stripe
 * Run with: node scripts/setup-stripe-products.js
 */

const Stripe = require('stripe');
const fs = require('fs');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

const TRAINING_PRODUCTS = [
  {
    name: 'Tax Preparation Fundamentals',
    description:
      'Complete beginner course covering everything you need to start preparing tax returns. No prior experience required! 12 hours, 24 lessons.',
    price: 19900, // $199.00 in cents
    courseId: 'tax-basics',
  },
  {
    name: 'IRS Ethics & Professional Standards',
    description:
      'Learn IRS regulations, preparer responsibilities, and ethical standards required for all tax preparers. 6 hours, 12 lessons.',
    price: 14900, // $149.00 in cents
    courseId: 'irs-regulations',
  },
  {
    name: 'Advanced Tax Returns',
    description:
      'Master complex tax situations including rental property, investments, and multi-state returns. 16 hours, 20 lessons.',
    price: 19900, // $199.00 in cents
    courseId: 'advanced-returns',
  },
  {
    name: 'Small Business Tax Returns',
    description:
      'Learn to prepare business returns for sole proprietors, partnerships, S-corps, and C-corps. 20 hours, 25 lessons.',
    price: 29900, // $299.00 in cents
    courseId: 'business-returns',
  },
  {
    name: 'Tax Software Mastery',
    description:
      'Master professional tax software, data entry shortcuts, and e-filing procedures. 10 hours, 15 lessons.',
    price: 14900, // $149.00 in cents
    courseId: 'tax-software-mastery',
  },
  {
    name: 'Refund Advance Products',
    description:
      'Learn to offer and process refund advances, maximizing revenue while helping clients. 4 hours, 8 lessons.',
    price: 9900, // $99.00 in cents
    courseId: 'refund-advances',
  },
  {
    name: 'Client Service Excellence',
    description:
      'Build a successful tax practice with excellent client service, marketing, and retention strategies. 6 hours, 10 lessons.',
    price: 7900, // $79.00 in cents
    courseId: 'client-service',
  },
];

const TRAINING_BUNDLES = [
  {
    name: 'Complete Professional Bundle',
    description:
      'All 7 courses - Everything you need to start a tax business. Includes: Tax Prep Fundamentals, IRS Ethics, Advanced Returns, Business Returns, Software Mastery, Refund Advances, Client Service. Save $275!',
    price: 79900, // $799.00 in cents
    courseId: 'bundle-complete',
  },
  {
    name: 'Starter Bundle',
    description:
      'Perfect for beginners - Get started preparing taxes. Includes: Tax Prep Fundamentals, IRS Ethics, Software Mastery. Save $198!',
    price: 29900, // $299.00 in cents
    courseId: 'bundle-starter',
  },
  {
    name: 'Advanced Bundle',
    description:
      'For experienced preparers wanting to level up. Includes: Advanced Returns, Business Returns, Refund Advances, Client Service. Save $198!',
    price: 49900, // $499.00 in cents
    courseId: 'bundle-advanced',
  },
];

async function createStripeProducts() {
  console.log('🚀 Creating Stripe products for SupersonicFastCash Training...\n');

  const results = [];

  // Create individual courses
  console.log('📚 Creating individual courses...\n');
  for (const course of TRAINING_PRODUCTS) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: course.name,
        description: course.description,
        metadata: {
          courseId: course.courseId,
          type: 'training_course',
        },
      });

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: course.price,
        currency: 'usd',
        metadata: {
          courseId: course.courseId,
        },
      });

      console.log(`✅ Created: ${course.name}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID: ${price.id}`);
      console.log(`   Amount: $${(course.price / 100).toFixed(2)}\n`);

      results.push({
        courseId: course.courseId,
        name: course.name,
        productId: product.id,
        priceId: price.id,
        amount: course.price / 100,
      });
    } catch (error) {
      console.error(`❌ Error creating ${course.name}:`, error.message);
    }
  }

  // Create bundles
  console.log('\n📦 Creating training bundles...\n');
  for (const bundle of TRAINING_BUNDLES) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: bundle.name,
        description: bundle.description,
        metadata: {
          courseId: bundle.courseId,
          type: 'training_bundle',
        },
      });

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: bundle.price,
        currency: 'usd',
        metadata: {
          courseId: bundle.courseId,
        },
      });

      console.log(`✅ Created: ${bundle.name}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID: ${price.id}`);
      console.log(`   Amount: $${(bundle.price / 100).toFixed(2)}\n`);

      results.push({
        courseId: bundle.courseId,
        name: bundle.name,
        productId: product.id,
        priceId: price.id,
        amount: bundle.price / 100,
      });
    } catch (error) {
      console.error(`❌ Error creating ${bundle.name}:`, error.message);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 SUMMARY - Copy these Price IDs to your code:');
  console.log('='.repeat(80) + '\n');

  console.log('Update the relevant pricing page in your app:\n');

  results.forEach((result) => {
    console.log(`  ${result.courseId}:`);
    console.log(`    stripePriceId: '${result.priceId}',\n`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ All products created successfully!');
  console.log('='.repeat(80) + '\n');

  // Save to file for reference
  const outputPath = './stripe-products-output.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`📄 Full details saved to: ${outputPath}\n`);
}

// Run the script
createStripeProducts()
  .then(() => {
    console.log('✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
