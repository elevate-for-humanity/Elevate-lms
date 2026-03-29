/**
 * scripts/backfill-hvac-durations.ts
 *
 * Backfills duration_minutes on curriculum_lessons and course_lessons
 * for the HVAC program. Uses step_type to assign realistic durations.
 *
 * Usage: pnpm tsx scripts/backfill-hvac-durations.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PROGRAM_ID = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';
const COURSE_ID  = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';

// Realistic durations by step_type (minutes)
const DURATION_BY_TYPE: Record<string, number> = {
  lesson:      35,
  checkpoint:  20,
  quiz:        20,
  lab:         50,
  exam:        60,
  orientation: 20,
};

async function main() {
  // 1. Get all curriculum_lessons for HVAC
  const { data: clLessons, error: clErr } = await db
    .from('curriculum_lessons')
    .select('id, lesson_slug, step_type, lesson_order')
    .eq('program_id', PROGRAM_ID)
    .order('lesson_order');

  if (clErr) { console.error(clErr.message); process.exit(1); }

  let clUpdated = 0;
  for (const l of clLessons!) {
    const mins = DURATION_BY_TYPE[l.step_type ?? 'lesson'] ?? 35;
    const { error } = await db.from('curriculum_lessons')
      .update({ duration_minutes: mins }).eq('id', l.id);
    if (error) { console.error(`cl failed ${l.lesson_slug}:`, error.message); process.exit(1); }
    clUpdated++;
  }
  console.log(`✅ curriculum_lessons updated: ${clUpdated}`);

  // 2. Get all course_lessons for HVAC
  const { data: courseLessons, error: courseErr } = await db
    .from('course_lessons')
    .select('id, slug, lesson_type')
    .eq('course_id', COURSE_ID);

  if (courseErr) { console.error(courseErr.message); process.exit(1); }

  let courseUpdated = 0;
  for (const l of courseLessons!) {
    const mins = DURATION_BY_TYPE[l.lesson_type ?? 'lesson'] ?? 35;
    const { error } = await db.from('course_lessons')
      .update({ duration_minutes: mins }).eq('id', l.id);
    if (error) { console.error(`course_lessons failed ${l.slug}:`, error.message); process.exit(1); }
    courseUpdated++;
  }
  console.log(`✅ course_lessons updated: ${courseUpdated}`);

  // Summary
  const totalMins = clLessons!.reduce((sum, l) =>
    sum + (DURATION_BY_TYPE[l.step_type ?? 'lesson'] ?? 35), 0);
  console.log(`\nTotal program duration: ${Math.floor(totalMins/60)}h ${totalMins%60}m (${totalMins} minutes)`);
  console.log('✅ Duration backfill complete.');
}

main().catch(e => { console.error(e); process.exit(1); });
