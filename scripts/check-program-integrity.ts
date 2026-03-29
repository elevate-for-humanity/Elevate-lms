/**
 * scripts/check-program-integrity.ts
 *
 * Checks every published program for missing required relations.
 * Exits with code 1 if any program is incomplete.
 *
 * Usage:
 *   pnpm tsx scripts/check-program-integrity.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Check = { label: string; table: string };

const REQUIRED: Check[] = [
  { label: 'media',   table: 'program_media'   },
  { label: 'CTAs',    table: 'program_ctas'    },
  { label: 'tracks',  table: 'program_tracks'  },
  { label: 'modules', table: 'program_modules' },
];

async function main() {
  const { data: programs, error } = await db
    .from('programs')
    .select('id, slug, title')
    .eq('published', true)
    .order('title');

  if (error) { console.error('Failed to fetch programs:', error.message); process.exit(1); }
  if (!programs?.length) { console.log('No published programs found.'); return; }

  console.log(`Checking ${programs.length} published program(s)...\n`);

  let failures = 0;

  for (const program of programs) {
    const missing: string[] = [];

    for (const check of REQUIRED) {
      const { count, error: cErr } = await db
        .from(check.table)
        .select('id', { count: 'exact', head: true })
        .eq('program_id', program.id);

      if (cErr) { missing.push(`${check.label} (query error)`); continue; }
      if ((count ?? 0) === 0) missing.push(check.label);
    }

    if (missing.length > 0) {
      console.log(`❌ ${program.slug} — missing: ${missing.join(', ')}`);
      failures++;
    } else {
      console.log(`✅ ${program.slug}`);
    }
  }

  console.log(`\n${failures === 0 ? '✅ All programs complete.' : `❌ ${failures} program(s) incomplete.`}`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
