/**
 * scripts/apply-barber-content.ts
 *
 * Writes all barber course content from seed files + sidecars to course_lessons.
 * Single source of truth: scripts/course-builder/seeds/ + seeds/content/<slug>.json
 *
 * Writes per lesson:
 *   content        → course_lessons.content
 *   quiz_questions → course_lessons.quiz_questions (JSONB)
 *   passing_score  → course_lessons.passing_score
 *   activities     → course_lessons.activities { flashcards, procedures }
 *
 * Usage:
 *   pnpm tsx scripts/apply-barber-content.ts
 *   pnpm tsx scripts/apply-barber-content.ts --dry-run
 *   pnpm tsx scripts/apply-barber-content.ts --slug barber-lesson-3
 */

import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { barberCourse } from './course-builder/seeds/barber-course.seed';

const COURSE_ID   = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
const DRY_RUN     = process.argv.includes('--dry-run');
const SLUG_FILTER = (() => {
  const i = process.argv.indexOf('--slug');
  return i !== -1 ? process.argv[i + 1] : null;
})();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyLesson(slug: string, payload: Record<string, unknown>): Promise<'ok' | 'skip' | 'error'> {
  if (SLUG_FILTER && slug !== SLUG_FILTER) return 'skip';
  const fields = Object.keys(payload).filter(k => k !== 'updated_at').join(', ');
  process.stdout.write(`  ${slug.padEnd(48)} [${fields}] ... `);
  if (DRY_RUN) { console.log('dry-run'); return 'ok'; }
  const { error } = await supabase
    .from('course_lessons')
    .update(payload)
    .eq('course_id', COURSE_ID)
    .eq('slug', slug);
  if (error) { console.log(`ERROR: ${error.message}`); return 'error'; }
  console.log('OK');
  return 'ok';
}

async function main() {
  let updated = 0, skipped = 0, errors = 0;

  for (const mod of barberCourse.modules) {
    console.log(`\n── ${mod.title}`);

    for (const lesson of mod.lessons) {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (lesson.content)              payload.content       = lesson.content;
      if (lesson.quiz?.questions?.length) {
        payload.quiz_questions = lesson.quiz.questions.map(q => ({
          question:    q.prompt,
          options:     q.choices,
          correct:     q.answerIndex,
          explanation: q.rationale,
        }));
        payload.passing_score = lesson.quiz.passingScore ?? 70;
      }

      // Build activities: flashcards + procedures
      const activities: Record<string, unknown> = {};
      if (lesson.flashcards?.length)  activities.flashcards  = lesson.flashcards;
      if (lesson.procedures?.length)  activities.procedures  = lesson.procedures;
      if (Object.keys(activities).length) payload.activities = activities;

      if (Object.keys(payload).length === 1) { skipped++; continue; }

      const result = await applyLesson(lesson.slug, payload);
      if (result === 'ok')    updated++;
      if (result === 'skip')  skipped++;
      if (result === 'error') errors++;
    }

    // Checkpoint
    if (mod.checkpoint) {
      const cp = mod.checkpoint;
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (cp.questions?.length) {
        payload.quiz_questions = cp.questions.map(q => ({
          question:    q.prompt,
          options:     q.choices,
          correct:     q.answerIndex,
          explanation: q.rationale,
        }));
        payload.passing_score = cp.passingScore ?? 70;
      }

      if (Object.keys(payload).length === 1) { skipped++; continue; }

      const result = await applyLesson(cp.slug, payload);
      if (result === 'ok')    updated++;
      if (result === 'skip')  skipped++;
      if (result === 'error') errors++;
    }
  }

  console.log(`\n── Summary: updated=${updated}  skipped=${skipped}  errors=${errors}`);
  if (errors > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
