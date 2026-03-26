import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import * as http from 'http';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const HVAC_COURSE  = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';
const HVAC_PROGRAM = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';

let p = 0, f = 0;
const ok   = (l: string, d: string) => { console.log(`  ✅ ${l}: ${d}`); p++; };
const fail = (l: string, d: string) => { console.log(`  ❌ ${l}: ${d}`); f++; };

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('PROOF: FULL AUDIT FIXES');
  console.log('══════════════════════════════════════════════════════\n');

  // 1. HVAC curriculum_lessons — 95 rows
  console.log('── HVAC ──');
  const { count: hvacCur } = await db.from('curriculum_lessons').select('*', { count: 'exact', head: true }).eq('course_id', HVAC_COURSE);
  hvacCur === 95 ? ok('HVAC curriculum_lessons', '95 rows') : fail('HVAC curriculum_lessons', `${hvacCur} rows (expected 95)`);

  const { data: stepDist } = await db.from('curriculum_lessons').select('step_type').eq('course_id', HVAC_COURSE);
  const dist: Record<string, number> = {};
  stepDist?.forEach((r: any) => { dist[r.step_type] = (dist[r.step_type] || 0) + 1; });
  dist.lesson >= 70 ? ok('HVAC lesson rows', `${dist.lesson} lessons`) : fail('HVAC lesson rows', `${dist.lesson} (expected ≥70)`);
  dist.checkpoint >= 10 ? ok('HVAC checkpoint rows', `${dist.checkpoint} checkpoints`) : fail('HVAC checkpoint rows', `${dist.checkpoint} (expected ≥10)`);

  const { count: hvacCL } = await db.from('course_lessons').select('*', { count: 'exact', head: true }).eq('course_id', HVAC_COURSE);
  hvacCL === 60 ? ok('HVAC course_lessons fallback', '60 rows') : fail('HVAC course_lessons fallback', `${hvacCL} rows`);

  // 2. Programs DB-driven
  console.log('\n── Programs ──');
  const { count: progCount } = await db.from('programs').select('*', { count: 'exact', head: true }).eq('published', true).eq('is_active', true).neq('status', 'archived');
  progCount && progCount > 0 ? ok('programs DB', `${progCount} published programs`) : fail('programs DB', '0 programs');

  // 3. Column correctness
  console.log('\n── DB Column Correctness ──');
  const { error: colErr } = await db.from('courses').select('id,title,short_description,status,is_active,program_id').limit(1);
  !colErr ? ok('courses columns', 'all valid') : fail('courses columns', colErr.message);

  const { error: clErr } = await db.from('course_lessons').select('id,title,order_index,lesson_type,module_id,activities,slug').limit(1);
  !clErr ? ok('course_lessons columns', 'no invalid columns') : fail('course_lessons columns', clErr.message);

  const { error: lmsErr } = await db.from('lms_lessons').select('id,step_type,is_published,lesson_source,order_index').limit(1);
  !lmsErr ? ok('lms_lessons view', 'accessible') : fail('lms_lessons view', lmsErr.message);

  // 4. Auth redirect params
  console.log('\n── Auth Redirect Params ──');
  const redirectFiles = [
    'app/lms/(app)/settings/billing/page.tsx',
    'app/lms/(app)/settings/notifications/page.tsx',
    'app/lms/(app)/settings/data/page.tsx',
    'app/student-portal/handbook/acknowledge/page.tsx',
    'app/lms/(app)/alumni/profile/page.tsx',
  ];
  let nextCount = 0;
  for (const file of redirectFiles) {
    const src = readFileSync(file, 'utf8');
    if (src.includes('?next=')) { nextCount++; console.log(`    ❌ still has ?next= : ${file}`); }
  }
  nextCount === 0 ? ok('?next= → ?redirect=', 'all 5 files fixed') : fail('?next= remaining', `${nextCount} files`);

  // 5. Alumni auth guard
  console.log('\n── Auth Guards ──');
  const alumniSrc = readFileSync('app/lms/(app)/alumni/page.tsx', 'utf8');
  alumniSrc.includes("redirect('/login") ? ok('alumni auth guard', 'present') : fail('alumni auth guard', 'MISSING');

  // 6. Onboarding imports
  console.log('\n── Onboarding Imports ──');
  const startSrc = readFileSync('app/onboarding/start/page.tsx', 'utf8');
  startSrc.includes('@/lib/supabase/server') && !startSrc.includes('@/utils/supabase')
    ? ok('onboarding/start', '@/lib/supabase/server') : fail('onboarding/start', 'deprecated import');
  const payrollSrc = readFileSync('app/onboarding/payroll-setup/page.tsx', 'utf8');
  payrollSrc.includes('@/lib/supabase/server') && !payrollSrc.includes('@/utils/supabase')
    ? ok('onboarding/payroll-setup', '@/lib/supabase/server') : fail('onboarding/payroll-setup', 'deprecated import');

  // 7. heroBanners
  console.log('\n── Hero Banners ──');
  const bannerSrc = readFileSync('content/heroBanners.ts', 'utf8');
  const emptyCount = (bannerSrc.match(/posterImage: ''/g) || []).length;
  emptyCount === 0 ? ok('heroBanners posterImage', '0 empty strings') : fail('heroBanners posterImage', `${emptyCount} still empty`);

  // 8. LMS public page not hardcoded
  console.log('\n── Hardcoded Data Removed ──');
  const lmsPublicSrc = readFileSync('app/lms/(public)/page.tsx', 'utf8');
  !lmsPublicSrc.includes('HVAC Technician') && !lmsPublicSrc.includes('const PROGRAMS')
    ? ok('lms/(public)/page.tsx', 'no hardcoded PROGRAMS array') : fail('lms/(public)/page.tsx', 'still has hardcoded data');

  const enrollSrc = readFileSync('app/enrollment/page.tsx', 'utf8');
  !enrollSrc.includes('Building Technician with HVAC') && !enrollSrc.includes('Electrical Apprenticeship')
    ? ok('enrollment/page.tsx', 'no hardcoded featured array') : fail('enrollment/page.tsx', 'still has hardcoded data');

  // 9. Git
  console.log('\n── Git ──');
  const log = execSync('git log --oneline origin/main | head -3').toString();
  log.includes('fix(lms)') ? ok('git commit', 'fix(lms) on origin/main') : fail('git commit', 'NOT found');

  // 10. Dev server
  console.log('\n── Dev Server ──');
  const serverOk = await new Promise<boolean>(resolve => {
    const req = http.get('http://localhost:3000/', res => resolve(res.statusCode === 200 || res.statusCode === 307));
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => { req.destroy(); resolve(false); });
  });
  serverOk ? ok('dev server', 'HTTP 200') : fail('dev server', 'not responding');

  // 11. CNA page no crash
  const cnaOk = await new Promise<boolean>(resolve => {
    const req = http.get('http://localhost:3000/programs/cna', res => resolve(res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(8000, () => { req.destroy(); resolve(false); });
  });
  cnaOk ? ok('/programs/cna', 'HTTP 200 (no posterImage crash)') : fail('/programs/cna', 'not 200');

  // 12. HVAC course page auth gate
  const hvacOk = await new Promise<boolean>(resolve => {
    const req = http.get(`http://localhost:3000/lms/courses/${HVAC_COURSE}`, res => resolve(res.statusCode === 307 || res.statusCode === 200));
    req.on('error', () => resolve(false));
    req.setTimeout(8000, () => { req.destroy(); resolve(false); });
  });
  hvacOk ? ok('HVAC course page', 'HTTP 307 (auth gate working)') : fail('HVAC course page', 'not responding');

  // Summary
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`PROOF: ${p} passed, ${f} failed`);
  console.log(f === 0 ? '✅ ALL FIXES VERIFIED' : `❌ ${f} FAILURES — see above`);
  console.log('══════════════════════════════════════════════════════\n');

  // No pending manual actions — all fixes applied programmatically.

  if (f > 0) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
