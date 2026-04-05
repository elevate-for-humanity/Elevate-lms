import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('/workspaces/Elevate-lms/.env.local', 'utf8');
const getEnv = (key: string) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1].trim() ?? null;

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')!;
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(url, key);

// Check hyphenated table names (invalid in postgres without quotes)
const HYPHENATED = [
  'apprentice-uploads','audit-archive','course-content','course-videos',
  'credential-uploads','enrollment-documents','partner-documents',
  'program-holder-documents','scorm-packages','shop-onboarding',
  'tax-documents'
];

// Check row counts on critical tables
const CRITICAL = [
  'profiles','programs','courses','course_lessons','curriculum_lessons',
  'training_courses','training_lessons','program_enrollments','applications',
  'certificates','lms_lessons'
];

async function run() {
  console.log('\n=== HYPHENATED TABLE NAMES (invalid without quotes) ===');
  for (const t of HYPHENATED) {
    const { error } = await db.from(t as any).select('id').limit(1);
    const status = !error ? 'EXISTS' : error.code === '42P01' ? 'MISSING' : 'ERROR: ' + error.message;
    console.log(`  ${status.padEnd(10)} ${t}`);
  }

  console.log('\n=== CRITICAL TABLE ROW COUNTS ===');
  for (const t of CRITICAL) {
    const { count, error } = await db.from(t as any).select('*', { count: 'exact', head: true });
    if (error) console.log(`  ERROR      ${t}: ${error.message}`);
    else console.log(`  ${String(count).padStart(6)} rows  ${t}`);
  }

  console.log('\n=== MISSING TABLES REFERENCED IN CODE ===');
  const missing = ['student_interventions','at_risk_students'];
  for (const t of missing) {
    const refs = await import('child_process').then(cp => 
      cp.execSync(`grep -rn "${t}" /workspaces/Elevate-lms/app --include="*.tsx" --include="*.ts" | wc -l`).toString().trim()
    );
    console.log(`  ${t}: ${refs} code references — table does not exist in DB`);
  }
}

run().catch(console.error);
