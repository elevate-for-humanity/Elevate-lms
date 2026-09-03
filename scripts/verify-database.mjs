#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

console.log('🔍 Verifying Database Status\n');
console.log('='.repeat(60));

// Check programs
const { data: programs, count: programCount } = await supabase
  .from('programs')
  .select('*', { count: 'exact' });

console.log(`\n✅ Programs: ${programCount} total\n`);

if (programs && programs.length > 0) {
  // Group by category
  const byCategory = programs.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  console.log('Programs by category:');
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, cnt]) => {
      console.log(`   ${cat}: ${cnt}`);
    });

  console.log('\nSample programs:');
  programs.slice(0, 5).forEach((p) => {
    console.log(`   - ${p.title} (${p.category})`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('✅ Database verification complete\n');
