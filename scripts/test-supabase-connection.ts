// scripts/test-supabase-connection.ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  process.exit(1);
}

const supabase = createClient(url, anon);

async function main() {
  // Test programs table
  const { data: programs, error } = await supabase
    .from('programs')
    .select('id, slug, title')
    .limit(5);

  if (error) {
  } else {
    console.table(programs);
  }

  // Test courses table
  const { data: courses, error: courseErr } = await supabase
    .from('courses')
    .select('id, slug, title')
    .limit(5);

  if (courseErr) {
  } else {
    console.table(courses);
  }

  // Test products table
  const { data: products, error: productErr } = await supabase
    .from('products')
    .select('id, title, price')
    .limit(5);

  if (productErr) {
  } else {
    console.table(products);
  }
}

main().catch((e) => {
  process.exit(1);
});
