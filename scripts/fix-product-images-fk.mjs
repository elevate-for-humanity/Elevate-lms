/**
 * Check and report on product_images foreign-key status.
 * Requires NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

async function checkAndReport() {
  console.log('Checking product_images foreign key relationship...\n');

  const response = await fetch(
    `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/products?select=name,product_images(id)&limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    },
  );

  let data;
  try {
    data = await response.json();
  } catch {
    console.error(`Supabase returned non-JSON response (HTTP ${response.status}).`);
    return false;
  }

  if (response.ok) {
    console.log('Foreign key relationship is working.');
    return true;
  }

  if (data?.code === 'PGRST200') {
    console.error('Foreign key relationship is not available through PostgREST.');
    console.error('Review the product_images/product_variants foreign keys in a supervised database change.');
    return false;
  }

  console.error(`Unexpected Supabase error (HTTP ${response.status}): ${data?.code || 'unknown'}`);
  return false;
}

checkAndReport()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((err) => {
    console.error('Foreign-key audit failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
