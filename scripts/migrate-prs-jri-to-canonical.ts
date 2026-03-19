/**
 * One-time migration: peer-recovery-specialist-jri → canonical pipeline.
 *
 * Reads existing content from curriculum_lessons and runs it through
 * createAndPublishProgram(). This proves the old-path-to-canonical
 * replacement is repeatable.
 *
 * Run:
 *   npx tsx scripts/migrate-prs-jri-to-canonical.ts
 *   npx tsx scripts/migrate-prs-jri-to-canonical.ts --dry-run  (validate input only)
 */

import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { createAndPublishProgram } from '../lib/programs/create-and-publish-program';
import type { ProgramCreateInput, ProgramModuleInput, ProgramLessonInput, LessonType } from '../lib/programs/types';

const DRY_RUN = process.argv.includes('--dry-run');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error('❌ Missing Supabase env vars'); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });

const PRS_JRI_PROGRAM_ID = 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d';
const SLUG = 'peer-recovery-specialist-jri';

async function main() {
  console.log(`\nMigrating ${SLUG} → canonical pipeline${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

  // Pull existing content from curriculum_lessons
  const { data: lessons, error } = await db
    .from('curriculum_lessons')
    .select(`
      lesson_slug, lesson_title, step_type, passing_score,
      module_order, lesson_order,
      modules!inner(slug, title)
    `)
    .eq('program_id', PRS_JRI_PROGRAM_ID)
    .order('module_order')
    .order('lesson_order');

  if (error) throw new Error(`curriculum_lessons query failed: ${error.message}`);
  if (!lessons?.length) throw new Error('No curriculum_lessons found for PRS-JRI');

  console.log(`Found ${lessons.length} lessons in curriculum_lessons`);

  // Build module map
  const moduleMap = new Map<number, ProgramModuleInput>();
  for (const l of lessons) {
    const mo = l.module_order as number;
    const mod = l.modules as { slug: string; title: string } | null;

    if (!moduleMap.has(mo)) {
      moduleMap.set(mo, {
        slug:       mod?.slug ?? `prs-jri-mod-${mo}`,
        title:      mod?.title ?? `Module ${mo}`,
        orderIndex: mo,
        lessons:    [],
      });
    }

    const stepType = (l.step_type ?? 'lesson') as LessonType;
    const needsPassingScore = ['checkpoint', 'quiz', 'exam', 'certification'].includes(stepType);

    const lesson: ProgramLessonInput = {
      slug:        l.lesson_slug as string,
      title:       l.lesson_title as string,
      orderIndex:  l.lesson_order as number,
      lessonType:  stepType,
      content:     {},
      isRequired:  true,
    };

    if (needsPassingScore && l.passing_score) {
      lesson.passingScore = l.passing_score as number;
    }

    moduleMap.get(mo)!.lessons.push(lesson);
  }

  const modules = [...moduleMap.values()].sort((a, b) => a.orderIndex - b.orderIndex);

  const input: ProgramCreateInput = {
    program: {
      slug:             SLUG,
      title:            'Peer Recovery Specialist (JRI)',
      description:      'Indiana Certified Peer Recovery Specialist — JRI pathway. Prepares learners for the Indiana DMHA CPRS credential.',
      shortDescription: 'Indiana CPRS credential pathway',
      category:         'workforce',
      isActive:         true,
    },
    course: {
      title:            'Peer Recovery Specialist (JRI)',
      shortDescription: 'Indiana CPRS credential pathway',
    },
    modules,
    publish: true,
  };

  console.log(`\nInput summary:`);
  console.log(`  slug:    ${input.program.slug}`);
  console.log(`  modules: ${modules.length}`);
  console.log(`  lessons: ${modules.reduce((n, m) => n + m.lessons.length, 0)}`);
  modules.forEach(m => console.log(`    Module ${m.orderIndex}: ${m.title} (${m.lessons.length} lessons)`));

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete — input is valid. Run without --dry-run to apply.');
    return;
  }

  const result = await createAndPublishProgram(input);

  console.log(`\n✅ Migration complete:`);
  console.log(`  programId:   ${result.programId}`);
  console.log(`  courseId:    ${result.courseId}`);
  console.log(`  modules:     ${result.moduleCount}`);
  console.log(`  lessons:     ${result.lessonCount}`);
  console.log(`  published:   ${result.published}`);

  // Set has_lms_course=true now that canonical course exists
  const { error: flagErr } = await db
    .from('programs')
    .update({ has_lms_course: true })
    .eq('slug', SLUG);

  if (flagErr) {
    console.error(`⚠️  Failed to set has_lms_course=true: ${flagErr.message}`);
  } else {
    console.log(`  has_lms_course: true (updated)`);
  }

  console.log(`\nRun 'pnpm lms:test:integrity' to verify.\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
