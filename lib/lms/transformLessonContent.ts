/**
 * Converts the canonical course_lessons.content JSON blob into production-ready
 * reading HTML and QuizPlayer-compatible question arrays.
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

interface AssessmentQuestion {
  question: string;
  choices: { a: string; b: string; c: string; d: string };
  correct: 'a' | 'b' | 'c' | 'd';
  rationale: string;
}

interface LessonContentBlob {
  html?: string;
  learning_points?: string[];
  scenario?: string;
  assessment_question?: AssessmentQuestion;
  compliance_notice?: string;
  exam_eligibility?: string[];
  pass_threshold?: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toQuizQuestion(aq: AssessmentQuestion, id: string): QuizQuestion {
  const order: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
  const options = order.map((key) => aq.choices[key]);
  const correctIndex = order.indexOf(aq.correct);
  return {
    id,
    question: aq.question,
    options,
    correct_index: correctIndex >= 0 ? correctIndex : 0,
    explanation: aq.rationale,
  };
}

function expandToQuizArray(aq: AssessmentQuestion, lessonSlug: string): QuizQuestion[] {
  return [toQuizQuestion(aq, `${lessonSlug}-q1`)];
}

/**
 * Preserve the full generated HTML while adding structured key concepts and
 * scenario sections used by the common LMS lesson experience. Sanitization is
 * still performed by the rendering layer before insertion into the DOM.
 */
function buildHtml(blob: LessonContentBlob): string {
  const richHtml = blob.html?.trim() ?? '';
  const points = (blob.learning_points ?? []).filter((point) => point?.trim());
  const scenario = blob.scenario?.trim() ?? '';
  const notice = blob.compliance_notice?.trim() ?? '';

  const richContentHtml = richHtml
    ? `<section class="lesson-reading">${richHtml}</section>`
    : '';

  const pointsHtml =
    points.length > 0
      ? `<section class="lesson-key-concepts">
        <h2>Key Concepts</h2>
        <ul>
          ${points.map((point) => `<li>${escapeHtml(point)}</li>`).join('\n          ')}
        </ul>
      </section>`
      : '';

  const scenarioHtml = scenario
    ? `<section class="lesson-scenario">
        <h2>Application Scenario</h2>
        <p>${escapeHtml(scenario)}</p>
      </section>`
    : '';

  const noticeHtml = notice
    ? `<aside class="lesson-compliance-notice">
        <p><strong>Compliance Notice:</strong> ${escapeHtml(notice)}</p>
      </aside>`
    : '';

  return `<div class="lesson-content">\n${richContentHtml}\n${pointsHtml}\n${scenarioHtml}\n${noticeHtml}\n</div>`;
}

export function transformLessonContent(
  raw: string | Record<string, unknown> | null | undefined,
  lessonSlug = 'lesson',
): TransformedLesson {
  if (!raw) return { html: '', quizQuestions: [] };

  if (typeof raw === 'string' && raw.trimStart().startsWith('<')) {
    return { html: raw, quizQuestions: [] };
  }

  let blob: LessonContentBlob;
  try {
    blob = typeof raw === 'string' ? JSON.parse(raw) : (raw as LessonContentBlob);
  } catch {
    return { html: typeof raw === 'string' ? raw : '', quizQuestions: [] };
  }

  if (
    !blob.html &&
    !blob.learning_points &&
    !blob.scenario &&
    !blob.assessment_question
  ) {
    return { html: typeof raw === 'string' ? raw : '', quizQuestions: [] };
  }

  const html = buildHtml(blob);
  const quizQuestions = blob.assessment_question
    ? expandToQuizArray(blob.assessment_question, lessonSlug)
    : [];

  return { html, quizQuestions };
}

export function isAiJsonBlob(content: string | null | undefined): boolean {
  if (!content) return false;
  const trimmed = content.trimStart();
  if (trimmed.startsWith('<')) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      ('html' in parsed ||
        'learning_points' in parsed ||
        'scenario' in parsed ||
        'assessment_question' in parsed)
    );
  } catch {
    return false;
  }
}
