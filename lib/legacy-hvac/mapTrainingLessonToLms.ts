/**
 * mapTrainingLessonToLms
 *
 * Shape adapter: converts a training_lessons row (legacy source) into the
 * lms_lessons view shape expected by the lesson page and renderer.
 *
 * Used only when lms_lessons returns lesson_source = 'training'. Once all
 * HVAC lessons are served from curriculum_lessons (lesson_source = 'curriculum'),
 * this adapter is dead code.
 *
 * RETIREMENT: Delete this file in the same PR that removes case 'legacy_hvac'
 * from LessonContentRenderer.tsx. Do not delete before pnpm verify:hvac-legacy passes.
 *
 * Target: 2027-Q1
 */

export interface TrainingLessonRow {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  lesson_number: number | null;
  module_id: string | null;
  quiz_questions: unknown[] | null;
  passing_score: number | null;
  lesson_type: string | null;
  slug: string | null;
}

export interface LmsLessonShape {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  video_file: string | null;
  lesson_type: string;
  lesson_source: 'training';
  quiz_questions: unknown[] | null;
  passing_score: number | null;
  slug: string | null;
  module_id: string | null;
}

export function mapTrainingLessonToLms(row: TrainingLessonRow): LmsLessonShape {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    video_url: row.video_url,
    video_file: null, // training_lessons has no video_file column
    lesson_type: row.lesson_type ?? 'lesson',
    lesson_source: 'training',
    quiz_questions: row.quiz_questions,
    passing_score: row.passing_score,
    slug: row.slug,
    module_id: row.module_id,
  };
}
