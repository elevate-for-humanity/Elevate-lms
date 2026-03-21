#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cuxzzpsyufcewtmicszk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMigrations() {
  console.log('Checking migration status...\n');
  
  const { count, error: countError } = await supabase
    .from('_migrations')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.log('❌ Migration tracking table:', countError.message);
    console.log('\nThis means:');
    console.log('  - Migrations have NOT been run on this database');
    console.log('  - OR the _migrations table does not exist');
    return;
  }
  
  console.log('✅ Total migrations executed:', count);
  
  const { data, error } = await supabase
    .from('_migrations')
    .select('filename')
    .order('executed_at', { ascending: false })
    .limit(10);
  
  if (!error && data) {
    console.log('\nLast 10 migrations applied:');
    data.forEach(m => console.log('  -', m.filename));
  }
  
  // Check for duplicate migrations
  const { data: allMigrations } = await supabase
    .from('_migrations')
    .select('filename');
  
  if (allMigrations) {
    const filenames = allMigrations.map(m => m.filename);
    const duplicates = filenames.filter((item, index) => filenames.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  Duplicate migrations found:', duplicates.length);
      duplicates.forEach(d => console.log('  -', d));
    } else {
      console.log('\n✅ No duplicate migrations');
    }
  }
}

checkMigrations();
