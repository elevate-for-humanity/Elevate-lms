/**
 * lib/curriculum/lqs-validator.ts
 *
 * Lesson Quality Standard (LQS) validator for BlueprintLessonRef objects.
 *
 * Enforces the gold-lesson standard derived from Lesson 26 (Lineup & Edging).
 * Runs at seeder time — failures are hard errors that block seeding.
 *
 * Standard requires all seven categories to pass:
 *   1. Instructional completeness
 *   2. Decision logic (IF/THEN)
 *   3. Safety & compliance
 *   4. Failure modes
 *   5. Visual logic
 *   6. Assessment quality
 *   7. Content depth (300 word minimum)
 */

import type { BlueprintLessonRef } from './blueprints/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LQSCategory =
  | 'instructional_completeness'
  | 'decision_logic'
  | 'safety_compliance'
  | 'failure_modes'
  | 'visual_logic'
  | 'assessment_quality'
  | 'content_depth';

export type LQSViolation = {
  category: LQSCategory;
  rule: string;
  detail: string;
};

export type LQSResult = {
  passed: boolean;
  slug: string;
  violations: LQSViolation[];
  wordCount: number;
  questionCount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum visible word count after stripping HTML tags */
const MIN_WORD_COUNT = 300;

/** Minimum quiz questions for skill/checkpoint lessons */
const MIN_QUESTIONS = 3;

/**
 * Lesson types that must pass the full LQS.
 * Exam and certification lessons use a different standard.
 */
const LQS_REQUIRED_TYPES = ['lesson', 'skill', 'checkpoint', 'lab', 'assignment'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function containsAny(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase();
  return phrases.some(p => lower.includes(p.toLowerCase()));
}

function inferLessonType(slug: string): string {
  if (slug.endsWith('-checkpoint')) return 'checkpoint';
  if (slug.endsWith('-lab')) return 'lab';
  if (slug.endsWith('-exam')) return 'exam';
  if (slug.endsWith('-assignment')) return 'assignment';
  if (slug.endsWith('-certification')) return 'certification';
  return 'lesson';
}

// ─── Category validators ──────────────────────────────────────────────────────

function checkInstructionalCompleteness(
  lesson: BlueprintLessonRef,
  body: string,
  violations: LQSViolation[],
) {
  if (!lesson.objective || lesson.objective.trim().length < 20) {
    violations.push({
      category: 'instructional_completeness',
      rule: 'objective_required',
      detail: 'Lesson must have an objective of at least 20 characters describing what the learner will be able to do.',
    });
  }

  // Tools section — required for skill/lab lessons
  const type = inferLessonType(lesson.slug);
  if (['lesson', 'skill', 'lab'].includes(type)) {
    if (!containsAny(body, ['tools', 'equipment', 'materials', 'supplies', 'implements'])) {
      violations.push({
        category: 'instructional_completeness',
        rule: 'tools_required',
        detail: 'Skill lessons must list required tools, equipment, or materials.',
      });
    }
  }

  // Step-by-step execution — required for skill/lab lessons
  if (['lesson', 'skill', 'lab'].includes(type)) {
    const hasSteps = /<ol[\s>]/i.test(lesson.content ?? '') || containsAny(body, ['step 1', 'step-by-step', 'step by step', 'execution', 'procedure']);
    if (!hasSteps) {
      violations.push({
        category: 'instructional_completeness',
        rule: 'steps_required',
        detail: 'Skill lessons must include step-by-step execution instructions.',
      });
    }
  }
}

function checkDecisionLogic(
  lesson: BlueprintLessonRef,
  body: string,
  violations: LQSViolation[],
) {
  const type = inferLessonType(lesson.slug);
  if (!['lesson', 'skill', 'lab'].includes(type)) return;

  const hasIfThen = containsAny(body, ['if the client', 'if client', 'if hair', 'if skin', 'if the hair', 'depending on', 'for coarse', 'for fine', 'for curly', 'for straight', 'hair type', 'skin type', 'growth pattern']);
  if (!hasIfThen) {
    violations.push({
      category: 'decision_logic',
      rule: 'if_then_required',
      detail: 'Skill lessons must include at least one IF/THEN decision block covering hair type, skin condition, or client variation.',
    });
  }
}

function checkSafetyCompliance(
  lesson: BlueprintLessonRef,
  body: string,
  violations: LQSViolation[],
) {
  const type = inferLessonType(lesson.slug);
  if (!['lesson', 'skill', 'lab'].includes(type)) return;

  const hasSanitation = containsAny(body, ['disinfect', 'sanit', 'clean', 'steriliz', 'infection control', 'ppe', 'gloves', 'neck strip', 'drape', 'cape']);
  if (!hasSanitation) {
    violations.push({
      category: 'safety_compliance',
      rule: 'sanitation_required',
      detail: 'Skill lessons must reference sanitation, disinfection, or infection control procedures.',
    });
  }

  const hasContraindication = containsAny(body, ['contraindic', 'do not', 'avoid', 'never', 'not use', 'not apply', 'not perform', 'stop if', 'caution', 'warning', 'acne', 'open skin', 'irritat', 'keloid', 'abrasion']);
  if (!hasContraindication) {
    violations.push({
      category: 'safety_compliance',
      rule: 'contraindications_required',
      detail: 'Skill lessons must include at least one contraindication, caution, or "do not" safety rule.',
    });
  }
}

function checkFailureModes(
  lesson: BlueprintLessonRef,
  body: string,
  violations: LQSViolation[],
) {
  const type = inferLessonType(lesson.slug);
  if (!['lesson', 'skill', 'lab'].includes(type)) return;

  const hasFailure = containsAny(body, ['failure', 'mistake', 'error', 'goes wrong', 'incorrect', 'recovery', 'recover', 'cause:', 'cause —', 'what causes', 'common mistake', 'avoid', 'problem', 'fix', 'correction', 'correct it']);
  if (!hasFailure) {
    violations.push({
      category: 'failure_modes',
      rule: 'failure_modes_required',
      detail: 'Skill lessons must describe at least one failure mode with its cause and recovery.',
    });
  }
}

function checkVisualLogic(
  lesson: BlueprintLessonRef,
  body: string,
  violations: LQSViolation[],
) {
  const type = inferLessonType(lesson.slug);
  if (!['lesson', 'skill', 'lab'].includes(type)) return;

  const hasVisual = containsAny(body, ['correct looks', 'looks like', 'should look', 'visual', 'angle', 'position', 'appearance', 'what correct', 'what incorrect', 'incorrect looks', 'you should see', 'result should']);
  if (!hasVisual) {
    violations.push({
      category: 'visual_logic',
      rule: 'visual_logic_required',
      detail: 'Skill lessons must describe what correct execution looks like versus incorrect, including angles, positioning, or visual cues.',
    });
  }
}

function checkAssessmentQuality(
  lesson: BlueprintLessonRef,
  violations: LQSViolation[],
) {
  const type = inferLessonType(lesson.slug);
  // Checkpoints and exams have their own question requirements
  if (['exam', 'certification'].includes(type)) return;

  const questions = lesson.quizQuestions ?? [];

  if (questions.length < MIN_QUESTIONS) {
    violations.push({
      category: 'assessment_quality',
      rule: 'min_questions',
      detail: `Skill lessons require at least ${MIN_QUESTIONS} quiz questions. Found ${questions.length}.`,
    });
    return; // No point checking quality with no questions
  }

  // Check for judgment-based questions (not pure recall)
  // Judgment questions contain scenario language or decision prompts
  const judgmentPhrases = ['what should', 'what is the best', 'what would', 'which adjustment', 'how should', 'what is the correct', 'what is the most', 'a client has', 'you notice', 'you finish', 'during', 'after'];
  const judgmentCount = questions.filter(q =>
    containsAny(q.question, judgmentPhrases)
  ).length;

  if (judgmentCount < 2) {
    violations.push({
      category: 'assessment_quality',
      rule: 'judgment_questions_required',
      detail: `At least 2 of ${questions.length} questions must be judgment/scenario-based (not pure recall). Found ${judgmentCount}.`,
    });
  }

  // Check that all questions have explanations
  const missingExplanations = questions.filter(q => !q.explanation || q.explanation.trim().length < 20);
  if (missingExplanations.length > 0) {
    violations.push({
      category: 'assessment_quality',
      rule: 'explanations_required',
      detail: `All questions must have an explanation of at least 20 characters. ${missingExplanations.length} question(s) missing explanations.`,
    });
  }
}

function checkContentDepth(
  lesson: BlueprintLessonRef,
  body: string,
  wordCount: number,
  violations: LQSViolation[],
) {
  if (wordCount < MIN_WORD_COUNT) {
    violations.push({
      category: 'content_depth',
      rule: 'min_word_count',
      detail: `Lesson content must be at least ${MIN_WORD_COUNT} words. Found ${wordCount}.`,
    });
  }
}

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Validates a single BlueprintLessonRef against the LQS.
 * Returns a result with all violations — caller decides whether to throw.
 */
export function validateLessonQuality(lesson: BlueprintLessonRef): LQSResult {
  const type = inferLessonType(lesson.slug);
  const violations: LQSViolation[] = [];

  // Exam and certification lessons skip the full LQS
  if (!LQS_REQUIRED_TYPES.includes(type)) {
    return { passed: true, slug: lesson.slug, violations: [], wordCount: 0, questionCount: 0 };
  }

  const content = lesson.content ?? '';
  const body = stripHtml(content);
  const wordCount = countWords(body);
  const questionCount = (lesson.quizQuestions ?? []).length;

  checkInstructionalCompleteness(lesson, body, violations);
  checkDecisionLogic(lesson, body, violations);
  checkSafetyCompliance(lesson, body, violations);
  checkFailureModes(lesson, body, violations);
  checkVisualLogic(lesson, body, violations);
  checkAssessmentQuality(lesson, violations);
  checkContentDepth(lesson, body, wordCount, violations);

  return {
    passed: violations.length === 0,
    slug: lesson.slug,
    violations,
    wordCount,
    questionCount,
  };
}

/**
 * Validates all lessons in a blueprint module array.
 * Returns all results — caller decides whether to throw on any failure.
 */
export function validateBlueprintLessons(
  lessons: BlueprintLessonRef[],
): LQSResult[] {
  return lessons.map(validateLessonQuality);
}

/**
 * Throws a formatted error if any lesson fails LQS.
 * Use this as a hard gate in the seeder.
 */
export function assertBlueprintLessonQuality(
  lessons: BlueprintLessonRef[],
  context = 'Blueprint',
): void {
  const results = validateBlueprintLessons(lessons);
  const failures = results.filter(r => !r.passed);

  if (failures.length === 0) return;

  const lines: string[] = [
    `\n${context}: ${failures.length} lesson(s) failed LQS validation.\n`,
  ];

  for (const f of failures) {
    lines.push(`  ❌ ${f.slug} (${f.wordCount} words, ${f.questionCount} questions)`);
    for (const v of f.violations) {
      lines.push(`     [${v.category}] ${v.rule}: ${v.detail}`);
    }
  }

  lines.push('\nFix all violations before seeding. These are hard errors.\n');
  throw new Error(lines.join('\n'));
}
