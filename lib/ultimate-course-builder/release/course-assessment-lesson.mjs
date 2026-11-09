/**
 * Every course must carry at least one gradable assessment lesson so learners
 * are automatically graded. The builder authors assessment questions per
 * competency (stored on each published lesson as experience.knowledgeChecks);
 * this aggregates them into one canonical course-level quiz lesson.
 *
 * Idempotent and non-destructive: the lesson is upserted on (course_id, slug)
 * and its quiz_questions/passing_score are refreshed from the current published
 * lessons. It never publishes a course or fabricates answers.
 */

const QUIZ_SLUG = 'course-assessment';
const QUIZ_TITLE_SUFFIX = 'Final Assessment';
// Rendered by the learner QuizPlayer (quiz/checkpoint/final_exam) and accepted
// as the last final assessment by the owner-approved new-course contract.
const ASSESSMENT_LESSON_TYPE = 'final_exam';
const ASSESSMENT_TYPES = new Set(['quiz', 'exam', 'final_exam', 'checkpoint']);
const DEFAULT_PASSING_SCORE = 70;
const MAX_QUESTIONS = 20;
const MIN_QUESTIONS = 5;

/** Coerce one authored knowledgeCheck into the QuizPlayer question shape. */
export function toQuizQuestion(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const question = String(raw.question ?? raw.prompt ?? '').trim();
  const options = Array.isArray(raw.options)
    ? raw.options
    : Array.isArray(raw.choices)
      ? raw.choices
      : [];
  const clean = options.map((o) => String(o ?? '').trim()).filter(Boolean);
  if (!question || clean.length < 2) return null;
  const correct =
    Number.isInteger(raw.correct) ? raw.correct
      : Number.isInteger(raw.correctAnswer) ? raw.correctAnswer
        : null;
  if (correct === null || correct < 0 || correct >= clean.length) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `q-${index}`,
    question,
    options: clean,
    correctAnswer: correct,
    ...(typeof raw.explanation === 'string' && raw.explanation
      ? { explanation: raw.explanation }
      : {}),
  };
}

/** Collect the authored assessment questions from published lesson rows. */
export function collectCourseQuestions(lessons) {
  const seen = new Set();
  const out = [];
  for (const lesson of lessons ?? []) {
    const checks = lesson?.content_json?.experience?.knowledgeChecks;
    if (!Array.isArray(checks)) continue;
    for (const raw of checks) {
      const question = toQuizQuestion(raw, out.length + 1);
      if (!question) continue;
      // De-duplicate on the authored id, then on the question text.
      const key = question.id || question.question;
      const textKey = question.question.toLowerCase();
      if (seen.has(key) || seen.has(textKey)) continue;
      seen.add(key);
      seen.add(textKey);
      out.push(question);
      if (out.length >= MAX_QUESTIONS) return out;
    }
  }
  return out;
}

export function assessmentLessonSlug() {
  return QUIZ_SLUG;
}

export function assessmentLessonTitle(courseTitle) {
  return `${courseTitle} — ${QUIZ_TITLE_SUFFIX}`;
}

/**
 * Ensure the course has a gradable assessment lesson. Returns
 * {created, updated, questionCount} or {skipped, reason}.
 */
export async function ensureCourseAssessmentLesson(db, { courseId, courseTitle }) {
  const { data: published, error } = await db
    .from('course_lessons')
    .select('id,order_index,content_json,lesson_type,quiz_questions')
    .eq('course_id', courseId)
    .eq('is_published', true);
  if (error) throw error;
  // Never disturb a course that already carries a graded assessment lesson.
  // Appending a quiz after an existing final exam would violate the
  // final-exam-must-be-last contract.
  const graded = (published ?? []).filter((l) => ASSESSMENT_TYPES.has(String(l.lesson_type)));
  if (graded.length) {
    return { skipped: true, reason: 'graded assessment already present', questionCount: 0 };
  }
  const contentLessons = (published ?? []).filter(
    (l) => !ASSESSMENT_TYPES.has(String(l.lesson_type)),
  );
  const questions = collectCourseQuestions(contentLessons);
  if (questions.length < MIN_QUESTIONS) {
    return { skipped: true, reason: 'insufficient authored assessment questions', questionCount: questions.length };
  }
  const maxOrder = Math.max(0, ...(published ?? []).map((l) => l.order_index ?? 0));
  const { data: existing, error: findError } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('slug', QUIZ_SLUG)
    .maybeSingle();
  if (findError) throw findError;
  const row = {
    course_id: courseId,
    slug: QUIZ_SLUG,
    title: assessmentLessonTitle(courseTitle),
    lesson_type: ASSESSMENT_LESSON_TYPE,
    status: 'published',
    is_published: true,
    approved: true,
    is_required: true,
    generation_status: 'completed',
    order_index: maxOrder + 1,
    quiz_questions: questions,
    passing_score: DEFAULT_PASSING_SCORE,
  };
  const { error: writeError } = await db
    .from('course_lessons')
    .upsert(row, { onConflict: 'course_id,slug' });
  if (writeError) throw writeError;
  return { created: !existing, updated: Boolean(existing), questionCount: questions.length };
}
