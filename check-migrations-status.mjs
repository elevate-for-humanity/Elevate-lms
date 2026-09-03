#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function checkMigrations() {
  console.info('Checking migration status...\n');

  const { count, error: countError } = await supabase
    .from('_migrations')
    .select('filename', { count: 'exact' })
    .limit(1);

  if (countError) {
    console.info('❌ Migration tracking table:', countError.message);
    console.info('\nThis means:');
    console.info('  - Migrations have NOT been run on this database');
    console.info('  - OR the _migrations table does not exist');
    return;
  }

  if (count == null) {
    console.info('⚠️  Could not determine migration count from _migrations (count is null).');
    console.info('   Verify PostgREST count settings and table visibility for service role.');
  } else {
    console.info('✅ Total migrations executed:', count);
  }

  const { data, error } = await supabase
    .from('_migrations')
    .select('filename')
    .order('executed_at', { ascending: false })
    .limit(10);

  if (!error && data) {
    console.info('\nLast 10 migrations applied:');
    data.forEach((m) => console.info('  -', m.filename));
  }

  // Check for duplicate migrations
  const { data: allMigrations } = await supabase.from('_migrations').select('filename');

  if (allMigrations) {
    const filenames = allMigrations.map((m) => m.filename);
    const duplicates = filenames.filter((item, index) => filenames.indexOf(item) !== index);

    if (duplicates.length > 0) {
      console.info('\n⚠️  Duplicate migrations found:', duplicates.length);
      duplicates.forEach((d) => console.info('  -', d));
    } else {
      console.info('\n✅ No duplicate migrations');
    }
  }
}

checkMigrations();
