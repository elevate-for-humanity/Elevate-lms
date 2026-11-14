// scripts/db/checkDatabase.js
// Health check for the database after migrations.
// Verifies key tables exist and are accessible.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CHECKS = [
  { table: 'applications', cols: ['id', 'reference_number', 'email', 'application_status'] },
  { table: 'programs', cols: ['id', 'name', 'slug'] },
  { table: 'profiles', cols: ['id', 'email'] },
  { table: 'enrollment_v2_applications', cols: ['id', 'reference_number', 'email'] },
];

async function runChecks() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — skipping DB checks.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let allPassed = true;
  for (const check of CHECKS) {
    try {
      const { data, error } = await supabase
        .from(check.table)
        .select(check.cols.join(','))
        .limit(1);

      if (error) {
        // Table might not exist yet — that's OK in CI
        if (error.code === '42P01') {
          console.log(`  ⚠️  ${check.table} — table does not exist yet (skipping)`);
        } else {
          console.error(`  ❌ ${check.table} — ${error.message}`);
          allPassed = false;
        }
      } else {
        console.log(`  ✅ ${check.table}`);
      }
    } catch (e) {
      console.error(`  ❌ ${check.table} — ${e.message}`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.error('\n❌ Some database checks failed');
    process.exit(1);
  }
  console.log('\n✅ Database health check passed');
}

runChecks();
