// scripts/check-db-ready.ts
// Quick health-check to confirm migrations + seeds ran

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) {
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  // Check programs table
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('id, slug, title')
    .limit(5);

  if (programsError) {
  } else {
    console.table(programs);
  }

  // Check courses table
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, slug, title')
    .limit(5);

  if (coursesError) {
  } else {
    console.table(courses);
  }

  // Check products table
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, price')
    .limit(5);

  if (productsError) {
  } else {
    console.table(products);
  }

  // Summary
  const errors = [programsError, coursesError, productsError].filter(Boolean);

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  process.exit(1);
});
