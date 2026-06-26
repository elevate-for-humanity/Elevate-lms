/**
 * Script to check and report on product_images foreign key status
 * Run: node scripts/fix-product-images-fk.mjs
 */

const SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eHp6cHN5dWZjZXd0bWljc3prIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE2MTA0NywiZXhwIjoyMDczNzM3MDQ3fQ.5JRYvJPzFzsVaZQkbZDLcohP7dq8LWQEFeFdVByyihE';

async function checkAndReport() {
  console.log('🔧 Checking product_images foreign key relationship...\n');

  // Check if relationship works
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/products?select=name,product_images(id)&limit=1`,
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Foreign key relationship is WORKING');
    console.log('   Products can now join with product_images');
    return true;
  } else if (data.code === 'PGRST200') {
    console.log('❌ Foreign key relationship is BROKEN');
    console.log('   Error:', data.message);
    console.log('\n📝 Please run this SQL in Supabase SQL Editor:\n');
    console.log(`
-- Fix product_images foreign key
ALTER TABLE public.product_images 
ADD CONSTRAINT fk_product_images_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Fix product_variants foreign key  
ALTER TABLE public.product_variants 
ADD CONSTRAINT fk_product_variants_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
    `);
    return false;
  } else {
    console.log('❌ Unexpected error:', data);
    return false;
  }
}

checkAndReport()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
