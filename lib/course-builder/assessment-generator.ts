/**
 * lib/course-builder/assessment-generator.ts
 *
 * Generates assessment question banks for module quizzes and final exams.
 *
 * Supports:
 *   - multiple_choice  — 4-option MC with explanation
 *   - true_false       — binary with explanation
 *   - short_answer     — open-ended prompt (instructor-graded)
 *   - scenario         — applied situation question
 *
 * Rules (spec §9):
 *   - Module quizzes: 8–15 questions, passing score 70
 *   - Final exam: 50–75 questions, passing score 80
 *   - Domain-balanced final exam: questions distributed per domainDistribution
 *   - Placeholder questions are generated when no content is available;
 *     the hydrator replaces them with real content
 *
 * The generator writes to assessment_questions table (first-class storage).
 * It also writes quiz_questions jsonb on course_lessons for backward compat
 * with the existing quiz player.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { QuizQuestion } from './schema';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'scenario';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type GeneratedQuestion = {
  id: string;
  questionType: QuestionType;
  prompt: string;
  choices?: string[];
  correctAnswer?: number | boolean | string;
  explanation?: string;
  competencyKey?: string;
  difficulty: Difficulty;
  domainKey?: string;
  sortOrder: number;
  /** True when this is a placeholder pending hydration */
  isPlaceholder: boolean;
};

export type ModuleQuizSpec = {
  lessonId: string;
  lessonSlug: string;
  moduleTitle: string;
  domainKey?: string;
  competencyKeys?: string[];
  questionCount?: number;
  passingScore?: number;
};

export type FinalExamSpec = {
  lessonId: string;
  lessonSlug: string;
  courseTitle: string;
  questionCount: number;
  passingScore: number;
  /** Domain key → percentage (must sum to 100) */
  domainDistribution?: Record<string, number>;
  allDomainKeys?: string[];
};

export type AssessmentGeneratorResult = {
  lessonId: string;
  questions: GeneratedQuestion[];
  writtenToDb: number;
  errors: string[];
};

// ─── Question builders ────────────────────────────────────────────────────────

function buildMCPlaceholder(
  index: number,
  context: string,
  domainKey?: string,
  competencyKey?: string,
  difficulty: Difficulty = 'medium',
): GeneratedQuestion {
  return {
    id: `placeholder-mc-${index}`,
    questionType: 'multiple_choice',
    prompt: `[Placeholder MC question ${index + 1} — ${context}]`,
    choices: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0,
    explanation: 'Replace this placeholder with a real question via the content hydrator.',
    competencyKey,
    difficulty,
    domainKey,
    sortOrder: index,
    isPlaceholder: true,
  };
}

function buildTFPlaceholder(
  index: number,
  context: string,
  domainKey?: string,
  difficulty: Difficulty = 'easy',
): GeneratedQuestion {
  return {
    id: `placeholder-tf-${index}`,
    questionType: 'true_false',
    prompt: `[Placeholder T/F question ${index + 1} — ${context}]`,
    choices: ['True', 'False'],
    correctAnswer: true,
    explanation: 'Replace this placeholder with a real question via the content hydrator.',
    difficulty,
    domainKey,
    sortOrder: index,
    isPlaceholder: true,
  };
}

function buildScenarioPlaceholder(
  index: number,
  context: string,
  domainKey?: string,
  competencyKey?: string,
): GeneratedQuestion {
  return {
    id: `placeholder-scenario-${index}`,
    questionType: 'scenario',
    prompt: `[Placeholder scenario question ${index + 1} — ${context}. Describe a situation and ask the learner to identify the correct response.]`,
    choices: ['Response A', 'Response B', 'Response C', 'Response D'],
    correctAnswer: 0,
    explanation: 'Replace this placeholder with a real scenario via the content hydrator.',
    competencyKey,
    difficulty: 'hard',
    domainKey,
    sortOrder: index,
    isPlaceholder: true,
  };
}

// ─── Module quiz generator ────────────────────────────────────────────────────

/**
 * Generates a module quiz question bank.
 * Mix: 60% MC, 20% T/F, 20% scenario (rounded to whole questions).
 */
export function generateModuleQuiz(spec: ModuleQuizSpec): GeneratedQuestion[] {
  const count = Math.min(Math.max(spec.questionCount ?? 10, 8), 15);
  const context = spec.moduleTitle;
  const domain = spec.domainKey;
  const compKey = spec.competencyKeys?.[0];

  const mcCount = Math.round(count * 0.6);
  const tfCount = Math.round(count * 0.2);
  const scenarioCount = count - mcCount - tfCount;

  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < mcCount; i++) {
    questions.push(buildMCPlaceholder(i, context, domain, compKey, i < 2 ? 'easy' : 'medium'));
  }
  for (let i = 0; i < tfCount; i++) {
    questions.push(buildTFPlaceholder(mcCount + i, context, domain));
  }
  for (let i = 0; i < scenarioCount; i++) {
    questions.push(buildScenarioPlaceholder(mcCount + tfCount + i, context, domain, compKey));
  }

  return questions.map((q, idx) => ({ ...q, sortOrder: idx }));
}

// ─── Final exam generator ─────────────────────────────────────────────────────

/**
 * Generates a domain-balanced final exam question bank.
 * When domainDistribution is provided, questions are allocated proportionally.
 * Without distribution, questions are spread evenly across all domains.
 */
export function generateFinalExam(spec: FinalExamSpec): GeneratedQuestion[] {
  const count = Math.min(Math.max(spec.questionCount, 50), 75);
  const questions: GeneratedQuestion[] = [];

  if (spec.domainDistribution && Object.keys(spec.domainDistribution).length > 0) {
    // Domain-balanced generation
    let sortOrder = 0;
    for (const [domainKey, pct] of Object.entries(spec.domainDistribution)) {
      const domainCount = Math.round((pct / 100) * count);
      const mcCount = Math.round(domainCount * 0.6);
      const tfCount = Math.round(domainCount * 0.2);
      const scenarioCount = domainCount - mcCount - tfCount;

      for (let i = 0; i < mcCount; i++) {
        questions.push({ ...buildMCPlaceholder(sortOrder, `${spec.courseTitle} — ${domainKey}`, domainKey, undefined, 'medium'), sortOrder });
        sortOrder++;
      }
      for (let i = 0; i < tfCount; i++) {
        questions.push({ ...buildTFPlaceholder(sortOrder, `${spec.courseTitle} — ${domainKey}`, domainKey), sortOrder });
        sortOrder++;
      }
      for (let i = 0; i < scenarioCount; i++) {
        questions.push({ ...buildScenarioPlaceholder(sortOrder, `${spec.courseTitle} — ${domainKey}`, domainKey), sortOrder });
        sortOrder++;
      }
    }
  } else {
    // Flat generation — no domain distribution
    const mcCount = Math.round(count * 0.6);
    const tfCount = Math.round(count * 0.15);
    const scenarioCount = count - mcCount - tfCount;

    for (let i = 0; i < mcCount; i++) {
      questions.push(buildMCPlaceholder(i, spec.courseTitle, undefined, undefined, i < 10 ? 'easy' : i < 30 ? 'medium' : 'hard'));
    }
    for (let i = 0; i < tfCount; i++) {
      questions.push(buildTFPlaceholder(mcCount + i, spec.courseTitle));
    }
    for (let i = 0; i < scenarioCount; i++) {
      questions.push(buildScenarioPlaceholder(mcCount + tfCount + i, spec.courseTitle));
    }
  }

  return questions.map((q, idx) => ({ ...q, sortOrder: idx }));
}

// ─── DB write ─────────────────────────────────────────────────────────────────

/**
 * Writes generated questions to assessment_questions table.
 * Also updates course_lessons.quiz_questions jsonb for backward compat.
 */
export async function persistAssessmentQuestions(
  db: SupabaseClient,
  lessonId: string,
  questions: GeneratedQuestion[],
  opts: { replaceExisting?: boolean } = {},
): Promise<AssessmentGeneratorResult> {
  const errors: string[] = [];

  if (opts.replaceExisting) {
    const { error: delErr } = await db
      .from('assessment_questions')
      .delete()
      .eq('lesson_id', lessonId);
    if (delErr) {
      errors.push(`Failed to clear existing questions: ${delErr.message}`);
      return { lessonId, questions, writtenToDb: 0, errors };
    }
  }

  const rows = questions.map(q => ({
    lesson_id:      lessonId,
    question_type:  q.questionType,
    prompt:         q.prompt,
    choices:        q.choices ? JSON.stringify(q.choices) : null,
    correct_answer: q.correctAnswer !== undefined ? JSON.stringify(q.correctAnswer) : null,
    explanation:    q.explanation ?? null,
    competency_key: q.competencyKey ?? null,
    difficulty:     q.difficulty,
    domain_key:     q.domainKey ?? null,
    sort_order:     q.sortOrder,
  }));

  const { error: insertErr } = await db
    .from('assessment_questions')
    .insert(rows);

  if (insertErr) {
    errors.push(`Failed to insert questions: ${insertErr.message}`);
    return { lessonId, questions, writtenToDb: 0, errors };
  }

  // Also write quiz_questions jsonb on course_lessons for backward compat
  const quizQuestionsJsonb: QuizQuestion[] = questions
    .filter(q => q.questionType === 'multiple_choice' || q.questionType === 'true_false')
    .map((q, idx) => ({
      id: q.id,
      question: q.prompt,
      options: q.choices ?? ['True', 'False'],
      correctAnswer: typeof q.correctAnswer === 'number'
        ? q.correctAnswer
        : q.correctAnswer === true ? 0 : 1,
      explanation: q.explanation,
    }));

  const { error: updateErr } = await db
    .from('course_lessons')
    .update({ quiz_questions: quizQuestionsJsonb })
    .eq('id', lessonId);

  if (updateErr) {
    logger.warn('[assessment-generator] Failed to sync quiz_questions jsonb', {
      lessonId,
      error: updateErr.message,
    });
    // Non-fatal — assessment_questions is the source of truth
  }

  return { lessonId, questions, writtenToDb: rows.length, errors };
}

// ─── Convenience: generate + persist ─────────────────────────────────────────

export async function generateAndPersistModuleQuiz(
  db: SupabaseClient,
  spec: ModuleQuizSpec,
): Promise<AssessmentGeneratorResult> {
  const questions = generateModuleQuiz(spec);
  return persistAssessmentQuestions(db, spec.lessonId, questions, { replaceExisting: true });
}

export async function generateAndPersistFinalExam(
  db: SupabaseClient,
  spec: FinalExamSpec,
): Promise<AssessmentGeneratorResult> {
  const questions = generateFinalExam(spec);
  return persistAssessmentQuestions(db, spec.lessonId, questions, { replaceExisting: true });
}
