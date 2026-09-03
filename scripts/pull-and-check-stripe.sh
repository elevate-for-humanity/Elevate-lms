#!/bin/bash

echo "🔐 Pull Keys from Vercel & Check Stripe Products"
echo "================================================="
echo ""

# Step 1: Pull from Vercel
echo "📥 Pulling environment variables from Vercel..."
npm run env:pull

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to pull from Vercel"
    echo ""
    echo "💡 Try manually:"
    echo "   vercel login"
    echo "   vercel link"
    echo "   vercel env pull .env.local --yes"
    exit 1
fi

echo ""
echo "✅ Environment variables pulled successfully"
echo ""

# Step 2: Verify keys
echo "🔍 Verifying keys..."
echo ""

if grep -q "STRIPE_SECRET_KEY=sk_" .env.local; then
    echo "✅ Stripe Secret Key found"
else
    echo "❌ Stripe Secret Key not found or invalid"
fi

if grep -q "AFFIRM_PRIVATE_KEY=" .env.local; then
    echo "✅ Affirm Private Key found"
else
    echo "❌ Affirm Private Key not found"
fi

echo ""

# Step 3: Check Stripe products
echo "📦 Checking Stripe products..."
echo ""

export $(cat .env.local | grep -v '^#' | xargs)

node << 'EOF'
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
  try {
    const products = await stripe.products.list({ limit: 100 });
    
    const programProducts = products.data.filter(p => 
      p.name.toLowerCase().includes('barber') || 
      p.name.toLowerCase().includes('dsp') || 
      p.name.toLowerCase().includes('hvac') ||
      p.name.toLowerCase().includes('cpr') ||
      p.name.toLowerCase().includes('emergency') ||
      p.name.toLowerCase().includes('esthetician') ||
      p.name.toLowerCase().includes('recovery') ||
      p.name.toLowerCase().includes('tax') ||
      p.name.toLowerCase().includes('business')
    );
    
    console.log('Found', programProducts.length, 'program products in Stripe');
    console.log('');
    
    if (programProducts.length === 0) {
      console.log('⚠️  No program products found');
      console.log('');
      console.log('📝 Create products at: https://dashboard.stripe.com/products');
      console.log('');
      console.log('See STRIPE_SETUP_EXACT_STEPS.md for instructions');
    } else {
      console.log('📋 Existing Products:');
      console.log('='.repeat(60));
      
      for (const product of programProducts) {
        const prices = await stripe.prices.list({ product: product.id, limit: 1 });
        const price = prices.data[0];
        
        console.log('');
        console.log('✅', product.name);
        console.log('   Product ID:', product.id);
        if (price) {
          console.log('   Price ID:', price.id);
          console.log('   Amount: $' + (price.unit_amount / 100).toFixed(2));
        }
      }
      
      console.log('');
      console.log('='.repeat(60));
      console.log('');
      console.log('📋 Add these to .env.local:');
      console.log('');
      
      for (const product of programProducts) {
        const prices = await stripe.prices.list({ product: product.id, limit: 1 });
        if (prices.data[0]) {
          let envName = 'STRIPE_PRICE_';
          if (product.name.includes('Barber')) envName += 'BARBER';
          else if (product.name.includes('DSP')) envName += 'DSP';
          else if (product.name.includes('HVAC')) envName += 'HVAC';
          else if (product.name.includes('CPR')) envName += 'CPR';
          else if (product.name.includes('Emergency')) envName += 'EHST';
          else if (product.name.includes('Esthetician')) envName += 'ESTH';
          else if (product.name.includes('Recovery')) envName += 'PRC';
          else if (product.name.includes('Tax')) envName += 'TAX';
          else if (product.name.includes('Business')) envName += 'BIZ';
          
          console.log(envName + '=' + prices.data[0].id);
        }
      }
      
      console.log('');
      console.log('💡 Copy these to .env.local and Vercel');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
EOF

echo ""
echo "================================================="
echo "✅ Done!"
echo "================================================="
