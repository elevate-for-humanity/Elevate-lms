import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenvConfig({ path: join(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const failures: string[] = [];

  // Orphan check — course_modules with no parent course
  const { data: allModules } = await db.from('course_modules').select('id, course_id');
  const { data: allCourses } = await db.from('courses').select('id');
  const courseIds = new Set((allCourses ?? []).map(c => c.id));
  const orphanModules = (allModules ?? []).filter(m => !courseIds.has(m.course_id));
  if (orphanModules.length > 0) {
    failures.push(`Found ${orphanModules.length} orphan course_modules rows`);
  }

  // Orphan check — course_lessons with no parent module
  const { data: allLessons } = await db.from('course_lessons').select('id, module_id');
  const moduleIds = new Set((allModules ?? []).map(m => m.id));
  const orphanLessons = (allLessons ?? []).filter(l => !l.module_id || !moduleIds.has(l.module_id));
  if (orphanLessons.length > 0) {
    failures.push(`Found ${orphanLessons.length} orphan course_lessons rows`);
  }

  // Per-program structural check — only programs with has_lms_course=true
  // are owned by the canonical pipeline. Legacy programs without a course
  // row are a separate migration concern and are not checked here.
  const { data: publishedPrograms, error: pubErr } = await db
    .from('programs')
    .select('slug, title')
    .eq('published', true)
    .eq('has_lms_course', true);

  if (pubErr) throw new Error(pubErr.message);

  for (const program of publishedPrograms ?? []) {
    const { data: course } = await db
      .from('courses')
      .select('id, slug, status')
      .eq('slug', program.slug)
      .maybeSingle();

    if (!course) {
      failures.push(`${program.slug}: published program has no matching course`);
      continue;
    }

    if (course.status !== 'published') {
      failures.push(`${program.slug}: program is published but course.status = '${course.status}'`);
    }

    const { data: modules } = await db
      .from('course_modules')
      .select('id, title, order_index')
      .eq('course_id', course.id)
      .order('order_index');

    if (!modules?.length) {
      failures.push(`${program.slug}: published program has zero modules`);
      continue;
    }

    for (const mod of modules) {
      const { data: lessons } = await db
        .from('course_lessons')
        .select('id, order_index')
        .eq('module_id', mod.id);

      if (!lessons?.length) {
        failures.push(`${program.slug} / ${mod.title}: module has zero lessons`);
      }
    }
  }

  if (failures.length) {
    console.error('\nLMS INTEGRITY FAILURES:\n');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log(`LMS integrity check passed. ${publishedPrograms?.length ?? 0} published programs verified.`);
}

main().catch(err => { console.error(err); process.exit(1); });
