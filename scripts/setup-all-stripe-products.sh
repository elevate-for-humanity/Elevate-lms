#!/bin/bash

echo "🎯 Setup All Stripe Products"
echo "============================="
echo ""

# Step 1: Pull environment variables from Vercel
echo "📥 Step 1: Pulling environment variables from Vercel..."
echo ""

if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔑 Please login to Vercel:"
    vercel login
fi

# Pull environment variables
echo "Pulling environment variables..."
vercel env pull .env.local --yes

if [ $? -eq 0 ]; then
    echo "✅ Environment variables pulled successfully"
else
    echo "❌ Failed to pull environment variables"
    exit 1
fi

echo ""
echo "📋 Step 2: Checking existing Stripe products..."
echo ""

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check Stripe products
node -e "
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkProducts() {
  try {
    console.log('Checking Stripe products...');
    const products = await stripe.products.list({ limit: 100 });
    
    console.log('');
    console.log('📦 Existing Products:');
    console.log('='.repeat(50));
    
    const programProducts = products.data.filter(p => 
      p.name.includes('Barber') || 
      p.name.includes('DSP') || 
      p.name.includes('HVAC') ||
      p.name.includes('CPR') ||
      p.name.includes('Emergency') ||
      p.name.includes('Esthetician') ||
      p.name.includes('Recovery') ||
      p.name.includes('Tax') ||
      p.name.includes('Business')
    );
    
    if (programProducts.length === 0) {
      console.log('No program products found yet.');
      console.log('');
      console.log('📝 Next: Create products in Stripe Dashboard');
      console.log('   https://dashboard.stripe.com/products');
    } else {
      for (const product of programProducts) {
        console.log('');
        console.log('Product:', product.name);
        console.log('  ID:', product.id);
        
        const prices = await stripe.prices.list({ product: product.id });
        if (prices.data.length > 0) {
          console.log('  Price ID:', prices.data[0].id);
          console.log('  Amount: $' + (prices.data[0].unit_amount / 100));
        }
      }
      
      console.log('');
      console.log('='.repeat(50));
      console.log('');
      console.log('✅ Found', programProducts.length, 'program products');
      console.log('');
      console.log('📋 Copy these Price IDs to .env.local:');
      console.log('');
      
      for (const product of programProducts) {
        const prices = await stripe.prices.list({ product: product.id });
        if (prices.data.length > 0) {
          const envName = product.name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
          console.log('STRIPE_PRICE_' + envName + '=' + prices.data[0].id);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('💡 Make sure STRIPE_SECRET_KEY is set correctly');
  }
}

checkProducts();
"

echo ""
echo "============================="
echo "📝 Next Steps:"
echo "============================="
echo ""
echo "1. Go to: https://dashboard.stripe.com/products"
echo "2. Create products for any missing programs"
echo "3. Copy the Price IDs shown above"
echo "4. Add them to .env.local"
echo "5. Run: npm run update-stripe-products"
echo ""
