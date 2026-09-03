/**
 * Publish Prestige Elevation barber RTI in LMS catalog (courses row + thumbnail).
 *
 *   pnpm tsx scripts/publish-barber-lms.ts
 */
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: false });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';
import { publishBarberCourseCatalog } from '../lib/barber/ensure-lms-enrollment';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }
  const db = createClient(url, key);
  await publishBarberCourseCatalog(db);
  console.log('✅ Barber course published in LMS (Prestige Elevation™ + workbook cover thumbnail)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
