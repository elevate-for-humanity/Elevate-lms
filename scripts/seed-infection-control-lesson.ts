/**
 * Seeds barber-lesson-4 (Infection Control & Safety) into course_lessons.
 *
 * Writes: title, content, video_url, quiz_questions, passing_score,
 *         learning_objectives, competency_checks, instructor_notes,
 *         practical_required
 *
 * Safe to re-run — uses upsert on slug + course_id.
 *
 * Usage:
 *   pnpm tsx --env-file=.env.local scripts/seed-infection-control-lesson.ts
 */

import { createClient } from '@supabase/supabase-js';
import { barberApprenticeshipBlueprint } from '../lib/curriculum/blueprints/barber-apprenticeship';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const BARBER_COURSE_ID = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const TARGET_SLUG = 'barber-lesson-4';

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase env vars not set.'); process.exit(1);
  }

  // Pull lesson definition from blueprint
  const mod1 = barberApprenticeshipBlueprint.modules[0];
  const lesson = mod1.lessons.find((l: any) => l.slug === TARGET_SLUG);
  if (!lesson) { console.error(`${TARGET_SLUG} not found in blueprint`); process.exit(1); }

  console.log(`\nSeeding ${TARGET_SLUG}: "${lesson.title}"`);
  console.log(`  video:              ${lesson.videoFile}`);
  console.log(`  learning_objectives: ${(lesson as any).learningObjectives?.length}`);
  console.log(`  competency_checks:   ${(lesson as any).competencyChecks?.length}`);
  console.log(`  quiz_questions:      ${lesson.quizQuestions?.length}`);

  // Fetch existing row to get its id
  const { data: existing, error: fetchErr } = await db
    .from('course_lessons')
    .select('id, slug')
    .eq('course_id', BARBER_COURSE_ID)
    .eq('slug', TARGET_SLUG)
    .single();

  if (fetchErr && fetchErr.code !== 'PGRST116') {
    console.error('Fetch error:', fetchErr.message); process.exit(1);
  }

  if (!existing) {
    console.error(`Row for ${TARGET_SLUG} not found in course_lessons. Run the full blueprint seeder first.`);
    process.exit(1);
  }

  const { error: updateErr } = await db
    .from('course_lessons')
    .update({
      title:               lesson.title,
      content:             lesson.content ?? null,
      video_url:           lesson.videoFile ?? null,
      quiz_questions:      lesson.quizQuestions ?? null,
      passing_score:       lesson.passingScore ?? 70,
      learning_objectives: (lesson as any).learningObjectives ?? null,
      competency_checks:   (lesson as any).competencyChecks ?? null,
      instructor_notes:    (lesson as any).instructorNotes ?? null,
      practical_required:  !!(lesson as any).competencyChecks?.some((c: any) => c.requiresInstructorSignoff),
      updated_at:          new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (updateErr) {
    console.error('Update error:', updateErr.message);
    console.error('Hint: run migration 20260621000001_course_lessons_competency_columns.sql in Supabase Dashboard first.');
    process.exit(1);
  }

  console.log(`\n✅ ${TARGET_SLUG} updated successfully.`);
  console.log(`   practical_required = true (3 competency checks require instructor sign-off)`);

  // Verify
  const { data: row } = await db
    .from('course_lessons')
    .select('title, video_url, passing_score, practical_required, learning_objectives, competency_checks')
    .eq('id', existing.id)
    .single();

  console.log('\nVerification:');
  console.log(`  title:             ${row?.title}`);
  console.log(`  video_url:         ${row?.video_url}`);
  console.log(`  passing_score:     ${row?.passing_score}`);
  console.log(`  practical_required:${row?.practical_required}`);
  console.log(`  objectives in DB:  ${Array.isArray(row?.learning_objectives) ? row.learning_objectives.length : 'null'}`);
  console.log(`  checks in DB:      ${Array.isArray(row?.competency_checks) ? row.competency_checks.length : 'null'}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
