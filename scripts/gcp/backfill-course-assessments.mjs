/**
 * Backfill the guaranteed course-level assessment lesson for existing courses.
 *
 * Reuses the same logic the builder now runs on completion, so a course is only
 * touched when it has no graded assessment lesson and at least 5 authored
 * questions to aggregate. Dry-run by default; pass --apply to write.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/gcp/backfill-course-assessments.mjs
 *   ... node scripts/gcp/backfill-course-assessments.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { ensureCourseAssessmentLesson } from '../../lib/ultimate-course-builder/release/course-assessment-lesson.mjs';

const apply = process.argv.includes('--apply');
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

const db = createClient(url, key, { auth: { persistSession: false } });

const { data: courses, error } = await db
  .from('courses')
  .select('id,title,status,is_active')
  .order('title');
if (error) throw error;

const results = [];
for (const course of courses ?? []) {
  const { data: lessons, error: lessonError } = await db
    .from('course_lessons')
    .select('id,lesson_type,order_index,is_published,quiz_questions,content_json')
    .eq('course_id', course.id);
  if (lessonError) throw lessonError;
  const rows = lessons ?? [];
  if (!rows.length) {
    results.push({ course: course.title, outcome: 'no lessons' });
    continue;
  }
  if (!apply) {
    const published = rows.filter((l) => l.is_published);
    const graded = published.filter((l) =>
      ['quiz', 'exam', 'final_exam', 'checkpoint'].includes(String(l.lesson_type)));
    results.push({
      course: course.title,
      outcome: graded.length ? 'already graded' : `would assess (${published.length} published lessons)`,
    });
    continue;
  }
  try {
    const outcome = await ensureCourseAssessmentLesson(db, {
      courseId: course.id,
      courseTitle: course.title,
    });
    results.push({ course: course.title, outcome: JSON.stringify(outcome) });
  } catch (cause) {
    results.push({ course: course.title, outcome: 'ERROR: ' + (cause?.message ?? String(cause)) });
  }
}

for (const row of results) console.log(String(row.outcome).padEnd(46), row.course);
console.log(`\n${apply ? 'Applied' : 'Dry run'}: ${results.length} courses.`);
