/**
 * lib/lms/transformLessonContent.ts
 *
 * Converts the AI-generated JSON blob stored in course_lessons.content into:
 *   - html: sanitizable HTML string for the reading tab
 *   - quizQuestions: QuizPlayer-compatible question array
 *
 * Called at WRITE TIME in the generate-and-publish-course route so the DB
 * stores production-ready content, not raw JSON. Also used as a render-time
 * fallback for any lessons written before this transformer existed.
 *
 * Input shape (from course-outline-schema.ts):
 *   {
 *     learning_points: string[]          // 3–5 items, each ≥10 chars
 *     scenario: string                   // ≥40 chars, real workplace situation
 *     assessment_question: {
 *       question: string
 *       choices: { a: string; b: string; c: string; d: string }
 *       correct: 'a' | 'b' | 'c' | 'd'
 *       rationale: string
 *     }
 *     compliance_status?: string
 *     compliance_notice?: string
 *     exam_eligibility?: string[]
 *     pass_threshold?: number
 *   }
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface TransformedLesson {
  html: string;
  quizQuestions: QuizQuestion[];
}

// ── internal types matching the AI schema ─────────────────────────────────────

interface AssessmentQuestion {
  question: string;
  choices: { a: string; b: string; c: string; d: string };
  correct: 'a' | 'b' | 'c' | 'd';
  rationale: string;
}

interface LessonContentBlob {
  learning_points?: string[];
  scenario?: string;
  assessment_question?: AssessmentQuestion;
  compliance_notice?: string;
  exam_eligibility?: string[];
  pass_threshold?: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts a single AssessmentQuestion into a QuizPlayer-compatible object.
 * The choices object {a,b,c,d} becomes an ordered options array; correct_index
 * is the 0-based position of the correct letter.
 */
function toQuizQuestion(aq: AssessmentQuestion, id: string): QuizQuestion {
  const ORDER: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
  const options = ORDER.map(k => aq.choices[k]);
  const correct_index = ORDER.indexOf(aq.correct);
  return {
    id,
    question: aq.question,
    options,
    correct_index: correct_index >= 0 ? correct_index : 0,
    explanation: aq.rationale,
  };
}

/**
 * Expands a single assessment_question into a full quiz array.
 *
 * The AI currently generates one question per lesson. QuizPlayer requires ≥1
 * question to render. We store the single question as a proper quiz array so
 * the player works immediately. When the AI pipeline is upgraded to generate
 * multiple questions per lesson, this function can be removed — the route will
 * pass the full array directly.
 */
function expandToQuizArray(aq: AssessmentQuestion, lessonSlug: string): QuizQuestion[] {
  return [toQuizQuestion(aq, `${lessonSlug}-q1`)];
}

/**
 * Builds the HTML reading content from learning_points + scenario.
 * Output is safe to pass through sanitizeRichHtml before rendering.
 */
function buildHtml(blob: LessonContentBlob): string {
  const points = (blob.learning_points ?? []).filter(p => p?.trim());
  const scenario = blob.scenario?.trim() ?? '';
  const notice = blob.compliance_notice?.trim() ?? '';

  const pointsHtml = points.length > 0
    ? `<section class="lesson-key-concepts">
        <h2>Key Concepts</h2>
        <ul>
          ${points.map(p => `<li>${escapeHtml(p)}</li>`).join('\n          ')}
        </ul>
      </section>`
    : '';

  const scenarioHtml = scenario
    ? `<section class="lesson-scenario">
        <h2>Workplace Scenario</h2>
        <p>${escapeHtml(scenario)}</p>
      </section>`
    : '';

  const noticeHtml = notice
    ? `<aside class="lesson-compliance-notice">
        <p><strong>Compliance Notice:</strong> ${escapeHtml(notice)}</p>
      </aside>`
    : '';

  return `<div class="lesson-content">\n${pointsHtml}\n${scenarioHtml}\n${noticeHtml}\n</div>`;
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Transforms raw lesson content (string JSON or parsed object) into
 * production-ready HTML and quiz questions.
 *
 * Returns { html: '', quizQuestions: [] } on any parse failure so callers
 * never crash — they just render an empty lesson rather than raw JSON.
 */
export function transformLessonContent(
  raw: string | Record<string, unknown> | null | undefined,
  lessonSlug = 'lesson',
): TransformedLesson {
  if (!raw) return { html: '', quizQuestions: [] };

  // If it's already plain HTML (starts with '<'), pass it through unchanged.
  if (typeof raw === 'string' && raw.trimStart().startsWith('<')) {
    return { html: raw, quizQuestions: [] };
  }

  let blob: LessonContentBlob;
  try {
    blob = typeof raw === 'string' ? JSON.parse(raw) : (raw as LessonContentBlob);
  } catch {
    // Unparseable — return the raw string as-is so at least something renders.
    return { html: typeof raw === 'string' ? raw : '', quizQuestions: [] };
  }

  // Not an AI-generated blob (no learning_points or scenario) — pass through.
  if (!blob.learning_points && !blob.scenario && !blob.assessment_question) {
    return { html: typeof raw === 'string' ? raw : '', quizQuestions: [] };
  }

  const html = buildHtml(blob);
  const quizQuestions = blob.assessment_question
    ? expandToQuizArray(blob.assessment_question, lessonSlug)
    : [];

  return { html, quizQuestions };
}

/**
 * Returns true if the content string is an AI-generated JSON blob that needs
 * transformation before rendering. Used by the lesson page to decide whether
 * to call transformLessonContent or render directly.
 */
export function isAiJsonBlob(content: string | null | undefined): boolean {
  if (!content) return false;
  const trimmed = content.trimStart();
  if (trimmed.startsWith('<')) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      ('learning_points' in parsed || 'scenario' in parsed || 'assessment_question' in parsed)
    );
  } catch {
    return false;
  }
}
