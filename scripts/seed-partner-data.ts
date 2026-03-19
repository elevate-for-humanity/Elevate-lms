/**
 * scripts/seed-partner-data.ts
 *
 * Persists the static partner course catalog into the DB.
 *
 * Usage:
 *   npx tsx scripts/seed-partner-data.ts           # dry run
 *   npx tsx scripts/seed-partner-data.ts --apply   # write to DB
 *
 * Requires migration 20260503000001_partner_scorm_schema_fixes.sql applied first.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { seedPartnerCourses } from '../lib/partners/seed-partner-courses';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  console.log(`\nPartner Course Seed — mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  const result = await seedPartnerCourses(supabase, APPLY);

  if (APPLY) {
    console.log(`\n--- Seed Summary ---`);
    console.log(`Providers upserted: ${result.providersUpserted}`);
    console.log(`Courses upserted:   ${result.coursesUpserted}`);
    if (result.errors.length > 0) {
      console.error(`\nErrors (${result.errors.length}):`);
      result.errors.forEach(e => console.error('  ' + e));
      process.exit(1);
    }
    console.log('\nDone.');
  }
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
