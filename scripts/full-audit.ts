import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const env = readFileSync('/workspaces/Elevate-lms/.env.local', 'utf8');
const getEnv = (key: string) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1].trim() ?? null;
const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')!;
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(url, key);

// ── 1. Get every table name referenced in code ──────────────────────────────
const fromMatches = execSync(
  `grep -roh "\\.from('[^']*')" /workspaces/Elevate-lms/app /workspaces/Elevate-lms/lib /workspaces/Elevate-lms/components --include="*.ts" --include="*.tsx" 2>/dev/null`,
  { maxBuffer: 20 * 1024 * 1024 }
).toString();

const codeTables = [...new Set(
  [...fromMatches.matchAll(/\.from\('([^']+)'\)/g)].map(m => m[1])
)].sort();

// ── 2. Get every table that actually exists in DB ───────────────────────────
const { data: dbTablesRaw } = await db
  .from('information_schema.tables' as any)
  .select('table_name')
  .eq('table_schema', 'public')
  .eq('table_type', 'BASE TABLE');

const { data: dbViewsRaw } = await db
  .from('information_schema.tables' as any)
  .select('table_name')
  .eq('table_schema', 'public')
  .eq('table_type', 'VIEW');

const dbTables = new Set([
  ...(dbTablesRaw ?? []).map((r: any) => r.table_name),
  ...(dbViewsRaw ?? []).map((r: any) => r.table_name),
]);

// ── 3. Check each code table against DB ────────────────────────────────────
const missing: string[] = [];
const hyphenated: string[] = [];
const exists: string[] = [];

for (const t of codeTables) {
  if (t.includes('-')) {
    hyphenated.push(t);
  } else if (dbTables.has(t)) {
    exists.push(t);
  } else {
    missing.push(t);
  }
}

// ── 4. Get row counts for critical tables ──────────────────────────────────
const CRITICAL = [
  'profiles','programs','courses','course_lessons','curriculum_lessons',
  'training_courses','training_lessons','program_enrollments','applications',
  'certificates','lms_lessons','course_modules','modules','payments',
  'shop_products','orders','licenses','tenants','apprenticeship_programs',
  'exam_bookings','testing_slots','grants','wioa_applications',
  'barber_payments','tax_clients','franchise_offices','video_generation_jobs',
  'generated_images','tts_audio_files','onboarding_progress','checkpoint_scores',
  'step_submissions','lesson_progress','quiz_attempts','user_lesson_attempts',
];

const counts: Record<string, number> = {};
for (const t of CRITICAL) {
  const { count } = await db.from(t as any).select('*', { count: 'exact', head: true });
  counts[t] = count ?? 0;
}

// ── 5. Check API routes for missing auth ───────────────────────────────────
const noAuthRoutes = execSync(
  `grep -rL "requireAdmin\\|apiAuthGuard\\|apiRequireAdmin\\|requireRole\\|requireAuth\\|getUser" /workspaces/Elevate-lms/app/api --include="route.ts" 2>/dev/null | head -30`,
  { maxBuffer: 5 * 1024 * 1024 }
).toString().trim().split('\n').filter(Boolean);

// ── 6. Check for env vars referenced but missing ───────────────────────────
const envVarsInCode = execSync(
  `grep -roh "process\\.env\\.[A-Z_]*" /workspaces/Elevate-lms/app /workspaces/Elevate-lms/lib --include="*.ts" --include="*.tsx" 2>/dev/null`,
  { maxBuffer: 10 * 1024 * 1024 }
).toString();

const referencedEnvVars = [...new Set(
  [...envVarsInCode.matchAll(/process\.env\.([A-Z_]+)/g)].map(m => m[1])
)].sort();

const envLocal = readFileSync('/workspaces/Elevate-lms/.env.local', 'utf8');
const missingEnvVars = referencedEnvVars.filter(v => !envLocal.includes(v));

// ── OUTPUT ──────────────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════════════════════');
console.log('  FULL PLATFORM AUDIT');
console.log('════════════════════════════════════════════════════════');

console.log(`\n📊 TABLES IN CODE:     ${codeTables.length}`);
console.log(`✅ EXIST IN DB:        ${exists.length}`);
console.log(`❌ MISSING FROM DB:    ${missing.length}`);
console.log(`⚠️  HYPHENATED (broken): ${hyphenated.length}`);

console.log('\n─── ❌ MISSING TABLES (in code, not in DB) ───');
missing.forEach(t => {
  const refs = execSync(`grep -r "${t}" /workspaces/Elevate-lms/app --include="*.tsx" --include="*.ts" -l 2>/dev/null | wc -l`).toString().trim();
  console.log(`  ${t.padEnd(45)} ${refs} files`);
});

console.log('\n─── ⚠️  HYPHENATED TABLE NAMES (always fail) ───');
hyphenated.forEach(t => {
  const refs = execSync(`grep -r "${t}" /workspaces/Elevate-lms/app --include="*.tsx" --include="*.ts" -l 2>/dev/null | wc -l`).toString().trim();
  console.log(`  ${t.padEnd(45)} ${refs} files`);
});

console.log('\n─── 📊 CRITICAL TABLE ROW COUNTS ───');
for (const [t, count] of Object.entries(counts)) {
  const flag = count === 0 ? ' ← EMPTY' : '';
  console.log(`  ${String(count).padStart(6)}  ${t}${flag}`);
}

console.log('\n─── 🔓 API ROUTES WITH NO AUTH (first 30) ───');
noAuthRoutes.slice(0, 30).forEach(r => {
  console.log('  ' + r.replace('/workspaces/Elevate-lms/', ''));
});
console.log(`  ... total: ${noAuthRoutes.length} routes`);

console.log('\n─── 🔑 ENV VARS REFERENCED BUT MISSING FROM .env.local ───');
if (missingEnvVars.length === 0) {
  console.log('  All referenced env vars are present');
} else {
  missingEnvVars.forEach(v => console.log('  ' + v));
}

console.log('\n════════════════════════════════════════════════════════\n');
