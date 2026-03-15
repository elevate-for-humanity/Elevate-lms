/**
 * lib/curriculum/validator.ts
 *
 * Runtime validator for LessonContract objects before they enter the publish
 * pipeline. Enforces the lesson-contract.schema.json rules plus scoring gates.
 *
 * Usage:
 *   import { validateLesson, validateBatch } from '@/lib/curriculum/validator';
 *   const result = validateLesson(lesson);
 *   if (!result.passed) throw new Error(result.errors.join('; '));
 */

import type { LessonContract, LessonValidationResult } from './types';

// ─── Scoring constants ────────────────────────────────────────────────────────

/** Minimum completeness score to pass (0–1) */
const MIN_COMPLETENESS = 0.7;

/** Minimum competency fidelity score to pass (0–1) */
const MIN_COMPETENCY_FIDELITY = 0.6;

/** Minimum exam relevance score to pass (0–1) */
const MIN_EXAM_RELEVANCE = 0.5;

/** Max competencies per lesson before stuffing penalty applies */
const MAX_COMPETENCIES = 3;

/** Minimum script_text length (characters) */
const MIN_SCRIPT_LENGTH = 300;

/** Minimum summary_text length (characters) */
const MIN_SUMMARY_LENGTH = 50;

// ─── Completeness scoring ─────────────────────────────────────────────────────

/**
 * Scores how complete a lesson is structurally.
 * Does not evaluate content quality — only presence and length.
 */
export function scoreInstructionalCompleteness(lesson: LessonContract): number {
  let score = 0;
  const checks = 6;

  if (lesson.script_text && lesson.script_text.length >= MIN_SCRIPT_LENGTH) score++;
  if (lesson.summary_text && lesson.summary_text.length >= MIN_SUMMARY_LENGTH) score++;
  if (lesson.reflection_prompt && lesson.reflection_prompt.length >= 20) score++;
  if (lesson.key_terms && lesson.key_terms.length >= 1) score++;
  if (lesson.competency_keys && lesson.competency_keys.length >= 1) score++;
  if (lesson.duration_minutes && lesson.duration_minutes >= 5) score++;

  return score / checks;
}

// ─── Competency fidelity scoring ──────────────────────────────────────────────

/**
 * Scores how well the lesson content supports its claimed competency_keys.
 *
 * Phrase-cluster approach: a competency is considered covered only if
 * 2+ terms from its key phrase set appear within a 50-word window in
 * script_text. Single keyword mentions do not count.
 *
 * Stuffing penalty: if the lesson claims more than MAX_COMPETENCIES,
 * the score is reduced proportionally.
 */
export function scoreCompetencyFidelity(
  lesson: LessonContract,
  competencyPhraseMap: Record<string, string[]>
): number {
  const claimed = lesson.competency_keys ?? [];
  if (claimed.length === 0) return 0;

  const text = (lesson.script_text ?? '').toLowerCase();
  const words = text.split(/\s+/);
  const WINDOW = 50;

  let covered = 0;

  for (const key of claimed) {
    const phrases = (competencyPhraseMap[key] ?? []).map(p => p.toLowerCase());
    if (phrases.length === 0) {
      // No phrase map entry — give partial credit if key appears in text
      if (text.includes(key.toLowerCase())) covered += 0.5;
      continue;
    }

    // Sliding window: count phrase hits within each window
    let windowHits = 0;
    for (let i = 0; i < words.length - WINDOW; i++) {
      const window = words.slice(i, i + WINDOW).join(' ');
      const hits = phrases.filter(p => window.includes(p)).length;
      if (hits >= 2) { windowHits = hits; break; }
    }

    if (windowHits >= 2) covered++;
    else if (phrases.some(p => text.includes(p))) covered += 0.3; // partial
  }

  let rawScore = covered / claimed.length;

  // Stuffing penalty: reduce score proportionally when over limit
  if (claimed.length > MAX_COMPETENCIES) {
    const penalty = MAX_COMPETENCIES / claimed.length;
    rawScore *= penalty;
  }

  return Math.min(1, rawScore);
}

// ─── Exam relevance scoring ───────────────────────────────────────────────────

/**
 * Scores whether the lesson teaches distinctions that exam questions test.
 *
 * Exam questions often test the ability to distinguish between two similar
 * concepts (e.g. peer support vs. therapy). A lesson that only defines one
 * side of a distinction fails exam relevance even if it mentions both terms.
 *
 * distractor_pairs: pairs of concepts where the lesson must address both sides.
 */
export function scoreExamRelevance(
  lesson: LessonContract,
  distractorPairs: Array<[string, string]>
): number {
  if (distractorPairs.length === 0) return 1; // no pairs to check — full credit

  const text = (lesson.script_text ?? '').toLowerCase();
  let passed = 0;

  for (const [a, b] of distractorPairs) {
    const hasA = text.includes(a.toLowerCase());
    const hasB = text.includes(b.toLowerCase());
    // Both sides must appear for the distinction to be taught
    if (hasA && hasB) passed++;
    else if (hasA || hasB) passed += 0.3; // partial — one side only
  }

  return passed / distractorPairs.length;
}

// ─── Main validator ───────────────────────────────────────────────────────────

/**
 * Validates a single LessonContract.
 *
 * competencyPhraseMap and distractorPairs are optional — if not provided,
 * fidelity and relevance scores are skipped (structural validation only).
 */
export function validateLesson(
  lesson: LessonContract,
  options: {
    competencyPhraseMap?: Record<string, string[]>;
    distractorPairs?: Array<[string, string]>;
  } = {}
): LessonValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── Required field checks ──────────────────────────────────────────────────
  if (!lesson.lesson_slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lesson.lesson_slug)) {
    errors.push('lesson_slug must be lowercase kebab-case');
  }
  if (!lesson.lesson_title || lesson.lesson_title.length < 5) {
    errors.push('lesson_title must be at least 5 characters');
  }
  if (!lesson.script_text || lesson.script_text.length < MIN_SCRIPT_LENGTH) {
    errors.push(`script_text must be at least ${MIN_SCRIPT_LENGTH} characters (got ${lesson.script_text?.length ?? 0})`);
  }
  if (!lesson.summary_text || lesson.summary_text.length < MIN_SUMMARY_LENGTH) {
    errors.push(`summary_text must be at least ${MIN_SUMMARY_LENGTH} characters`);
  }
  if (!lesson.reflection_prompt || lesson.reflection_prompt.length < 20) {
    errors.push('reflection_prompt must be at least 20 characters');
  }
  if (!lesson.competency_keys || lesson.competency_keys.length === 0) {
    errors.push('competency_keys must have at least 1 entry');
  }
  if (lesson.competency_keys && lesson.competency_keys.length > MAX_COMPETENCIES) {
    warnings.push(`competency_keys has ${lesson.competency_keys.length} entries — stuffing penalty will apply (max ${MAX_COMPETENCIES})`);
  }
  if (!lesson.key_terms || lesson.key_terms.length === 0) {
    warnings.push('key_terms is empty — glossary will be blank for this lesson');
  }
  if (!lesson.duration_minutes || lesson.duration_minutes < 5) {
    errors.push('duration_minutes must be at least 5');
  }

  // ── Scoring ────────────────────────────────────────────────────────────────
  const completeness = scoreInstructionalCompleteness(lesson);

  const competencyFidelity = options.competencyPhraseMap
    ? scoreCompetencyFidelity(lesson, options.competencyPhraseMap)
    : -1; // -1 = not evaluated

  const examRelevance = options.distractorPairs
    ? scoreExamRelevance(lesson, options.distractorPairs)
    : -1; // -1 = not evaluated

  if (completeness < MIN_COMPLETENESS) {
    errors.push(`Completeness score ${completeness.toFixed(2)} below minimum ${MIN_COMPLETENESS}`);
  }
  if (competencyFidelity >= 0 && competencyFidelity < MIN_COMPETENCY_FIDELITY) {
    errors.push(`Competency fidelity score ${competencyFidelity.toFixed(2)} below minimum ${MIN_COMPETENCY_FIDELITY}`);
  }
  if (examRelevance >= 0 && examRelevance < MIN_EXAM_RELEVANCE) {
    warnings.push(`Exam relevance score ${examRelevance.toFixed(2)} below minimum ${MIN_EXAM_RELEVANCE}`);
  }

  return {
    lessonSlug: lesson.lesson_slug,
    lessonTitle: lesson.lesson_title,
    passed: errors.length === 0,
    errors,
    warnings,
    scores: {
      completeness,
      competencyFidelity: competencyFidelity >= 0 ? competencyFidelity : 0,
      examRelevance: examRelevance >= 0 ? examRelevance : 0,
    },
  };
}

/**
 * Validates a batch of lessons. Returns per-lesson results and a summary.
 */
export function validateBatch(
  lessons: LessonContract[],
  options: {
    competencyPhraseMap?: Record<string, string[]>;
    distractorPairs?: Array<[string, string]>;
  } = {}
): {
  results: LessonValidationResult[];
  passCount: number;
  failCount: number;
  passRate: number;
  allPassed: boolean;
} {
  const results = lessons.map(l => validateLesson(l, options));
  const passCount = results.filter(r => r.passed).length;
  const failCount = results.length - passCount;

  return {
    results,
    passCount,
    failCount,
    passRate: lessons.length > 0 ? passCount / lessons.length : 0,
    allPassed: failCount === 0,
  };
}
