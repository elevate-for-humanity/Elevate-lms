/**
 * Checks every published program for required related records.
 * CI and explicit strict mode fail closed on missing config, zero published programs,
 * or incomplete program relations.
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { promises as fs } from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const STRICT = process.env.STRICT_PROGRAM_INTEGRITY === 'true' || process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REPORT_PATH = path.resolve(process.cwd(), 'audit-packet/program-integrity-report.json');

if (!url || !serviceKey) {
  console.error('Program integrity configuration missing: Supabase URL and service-role key are required.');
  process.exit(1);
}

const db = createClient(url, serviceKey);
const REQUIRED = [
  { label: 'media', table: 'program_media' },
  { label: 'CTAs', table: 'program_ctas' },
  { label: 'tracks', table: 'program_tracks' },
  { label: 'modules', table: 'program_modules' },
] as const;

async function main() {
  const { data: programs, error } = await db.from('programs').select('id, slug, title').eq('published', true).order('title');
  if (error) throw new Error(`Failed to fetch programs: ${error.message}`);
  if (!programs?.length) {
    console.error('No published programs found; integrity coverage is invalid.');
    process.exit(1);
  }

  const membership = new Map<string, Set<string>>();
  for (const check of REQUIRED) {
    const { data: rows, error: rowsError } = await db.from(check.table).select('program_id');
    if (rowsError) throw new Error(`Failed to load ${check.table}: ${rowsError.message}`);
    membership.set(check.label, new Set((rows ?? []).map((row: { program_id: string }) => row.program_id)));
  }

  const items = [] as Array<{slug:string;title:string;missing:string[]}>;
  for (const program of programs) {
    const missing = REQUIRED.filter((check) => !(membership.get(check.label)?.has(program.id) ?? false)).map((check) => check.label);
    if (missing.length) {
      console.log(`❌ ${program.slug} — missing: ${missing.join(', ')}`);
      items.push({ slug: program.slug, title: program.title ?? '', missing });
    } else console.log(`✅ ${program.slug}`);
  }

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, JSON.stringify({generatedAt:new Date().toISOString(),strict:STRICT,scannedPrograms:programs.length,incompletePrograms:items.length,items}, null, 2) + '\n');
  console.log(`Checked ${programs.length} published program(s); ${items.length} incomplete.`);
  if (items.length && STRICT) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
