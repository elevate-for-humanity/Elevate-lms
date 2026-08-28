/**
 * Canonical assessment generation and persistence.
 *
 * assessment_questions is canonical; course_lessons.quiz_questions is a
 * backwards-compatible projection for the legacy quiz player.
 *
 * IMPORTANT: persistence paths never publish placeholder questions. Runtime
 * hydration must generate original, schema-validated questions through the
 * configured AI provider or fail closed.
 */

import type { SupabaseClient } from '@/lib/supabase';
import type { QuizQuestion } from './schema';
import { logger } from '@/lib/logger';
import { aiChat } from '@/lib/ai/ai-service';
import { hydrateProcessEnv } from '@/lib/secrets';
import { z } from 'zod';

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
  domainDistribution?: Record<string, number>;
  allDomainKeys?: string[];
};

export type AssessmentGeneratorResult = {
  lessonId: string;
  questions: GeneratedQuestion[];
  writtenToDb: number;
  errors: string[];
};

const AIQuestionSchema = z.object({
  questionType: z.enum(['multiple_choice', 'true_false']),
  prompt: z.string().min(20).max(1000),
  choices: z.array(z.string().min(1).max(500)).max(4).optional(),
  correctAnswer: z.union([z.number().int().min(0).max(3), z.boolean()]),
  explanation: z.string().min(10).max(1200),
  competencyKey: z.string().min(1).nullable().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  domainKey: z.string().min(1).nullable().optional(),
});

const AIQuestionSetSchema = z.object({
  questions: z.array(AIQuestionSchema),
});

type AIQuestion = z.infer<typeof AIQuestionSchema>;

function normalizeAIQuestion(
  raw: AIQuestion,
  index: number,
  idPrefix: string,
  fallbackDomain?: string,
  fallbackCompetency?: string,
): GeneratedQuestion {
  if (raw.questionType === 'multiple_choice') {
    if (!raw.choices || raw.choices.length !== 4 || typeof raw.correctAnswer !== 'number') {
      throw new Error(`AI assessment question ${index + 1} has an invalid multiple-choice contract`);
    }
  }
  if (raw.questionType === 'true_false' && typeof raw.correctAnswer !== 'boolean') {
    throw new Error(`AI assessment question ${index + 1} has an invalid true/false contract`);
  }

  return {
    id: `${idPrefix}-${index + 1}`,
    questionType: raw.questionType,
    prompt: raw.prompt.trim(),
    choices: raw.questionType === 'true_false' ? ['True', 'False'] : raw.choices,
    correctAnswer: raw.correctAnswer,
    explanation: raw.explanation.trim(),
    competencyKey: raw.competencyKey ?? fallbackCompetency,
    difficulty: raw.difficulty,
    domainKey: raw.domainKey ?? fallbackDomain,
    sortOrder: index,
    isPlaceholder: false,
  };
}

async function requestQuestionBatch(input: {
  count: number;
  context: string;
  domainKey?: string;
  competencyKeys?: string[];
  idPrefix: string;
}): Promise<GeneratedQuestion[]> {
  await hydrateProcessEnv();
  const competencyText = input.competencyKeys?.length
    ? `Competencies to cover: ${input.competencyKeys.join(', ')}.`
    : 'Cover the stated domain comprehensively.';

  const response = await aiChat({
    temperature: 0.25,
    maxTokens: 5000,
    messages: [
      {
        role: 'system',
        content:
          'You are a workforce education assessment designer. Create original assessment questions only. Do not copy, reproduce, paraphrase closely, or claim to reproduce any proprietary certification exam question. Questions must test applied understanding, use plain professional language, avoid trick wording, and have exactly one defensible answer. Return JSON only.',
      },
      {
        role: 'user',
        content: [
          `Create exactly ${input.count} original assessment questions for: ${input.context}.`,
          input.domainKey ? `Domain key: ${input.domainKey}.` : '',
          competencyText,
          'Use approximately 80% multiple_choice and 20% true_false.',
          'For every multiple_choice question provide exactly four plausible choices and correctAnswer as the zero-based index 0-3.',
          'For every true_false question provide correctAnswer as a boolean.',
          'Include a concise explanation for why the answer is correct.',
          'Use a balanced mix of easy, medium, and hard questions, with scenario-based stems represented as multiple-choice questions.',
          'Return this exact top-level shape: {"questions":[{"questionType":"multiple_choice|true_false","prompt":"...","choices":["..."],"correctAnswer":0,"explanation":"...","competencyKey":null,"difficulty":"easy|medium|hard","domainKey":null}]}',
        ].filter(Boolean).join('\n'),
      },
    ],
  });

  const raw = response.content;
  if (!raw) throw new Error('Assessment AI returned an empty response');

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    throw new Error('Assessment AI returned invalid JSON');
  }

  const parsed = AIQuestionSetSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error(`Assessment AI failed schema validation: ${parsed.error.issues[0]?.message ?? 'unknown validation error'}`);
  }
  if (parsed.data.questions.length !== input.count) {
    throw new Error(`Assessment AI returned ${parsed.data.questions.length} questions; expected exactly ${input.count}`);
  }

  return parsed.data.questions.map((question, index) => normalizeAIQuestion(
    question,
    index,
    input.idPrefix,
    input.domainKey,
    input.competencyKeys?.[index % Math.max(1, input.competencyKeys?.length ?? 1)],
  ));
}

/**
 * Deprecated deterministic placeholder builder retained only for non-publishing
 * compatibility/tests. Production persistence paths do not call this function.
 */
export function generateModuleQuiz(spec: ModuleQuizSpec): GeneratedQuestion[] {
  const count = Math.min(Math.max(spec.questionCount ?? 10, 8), 15);
  return Array.from({ length: count }, (_, index) => ({
    id: `placeholder-module-${index + 1}`,
    questionType: 'multiple_choice' as const,
    prompt: `[Placeholder question ${index + 1} — ${spec.moduleTitle}]`,
    choices: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0,
    explanation: 'Placeholder only. Runtime persistence must replace this with a real AI-generated question.',
    competencyKey: spec.competencyKeys?.[index % Math.max(1, spec.competencyKeys?.length ?? 1)],
    difficulty: 'medium' as const,
    domainKey: spec.domainKey,
    sortOrder: index,
    isPlaceholder: true,
  }));
}

/** Deprecated compatibility helper; production persistence does not call it. */
export function generateFinalExam(spec: FinalExamSpec): GeneratedQuestion[] {
  const count = Math.min(Math.max(spec.questionCount, 50), 75);
  return Array.from({ length: count }, (_, index) => ({
    id: `placeholder-final-${index + 1}`,
    questionType: 'multiple_choice' as const,
    prompt: `[Placeholder final-exam question ${index + 1} — ${spec.courseTitle}]`,
    choices: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0,
    explanation: 'Placeholder only. Runtime persistence must replace this with a real AI-generated question.',
    difficulty: 'medium' as const,
    sortOrder: index,
    isPlaceholder: true,
  }));
}

function toLegacyQuizQuestion(question: GeneratedQuestion): QuizQuestion | null {
  if (question.questionType !== 'multiple_choice' && question.questionType !== 'true_false') return null;
  const options = question.choices ?? ['True', 'False'];
  let correctAnswer: string | string[] | undefined;

  if (typeof question.correctAnswer === 'number') {
    correctAnswer = options[question.correctAnswer] ?? options[0] ?? '';
  } else if (typeof question.correctAnswer === 'boolean') {
    correctAnswer = question.correctAnswer ? 'True' : 'False';
  } else if (typeof question.correctAnswer === 'string') {
    correctAnswer = question.correctAnswer;
  }

  return {
    id: question.id,
    prompt: question.prompt,
    type: question.questionType,
    options,
    correctAnswer,
    explanation: question.explanation,
    domainKey: question.domainKey,
    competencyKeys: question.competencyKey ? [question.competencyKey] : undefined,
  };
}

export async function persistAssessmentQuestions(
  db: SupabaseClient,
  lessonId: string,
  questions: GeneratedQuestion[],
  opts: { replaceExisting?: boolean } = {},
): Promise<AssessmentGeneratorResult> {
  const errors: string[] = [];

  if (!questions.length) {
    return { lessonId, questions, writtenToDb: 0, errors: ['No assessment questions were generated'] };
  }
  if (questions.some((question) => question.isPlaceholder || /\[Placeholder/i.test(question.prompt))) {
    return { lessonId, questions, writtenToDb: 0, errors: ['Placeholder assessment questions cannot be persisted'] };
  }

  if (opts.replaceExisting) {
    const { error } = await db.from('assessment_questions').delete().eq('lesson_id', lessonId);
    if (error) return { lessonId, questions, writtenToDb: 0, errors: [`Failed to clear existing questions: ${error.message}`] };
  }

  const rows = questions.map((question) => ({
    lesson_id: lessonId,
    question_type: question.questionType,
    prompt: question.prompt,
    choices: question.choices ? JSON.stringify(question.choices) : null,
    correct_answer: question.correctAnswer !== undefined ? JSON.stringify(question.correctAnswer) : null,
    explanation: question.explanation ?? null,
    competency_key: question.competencyKey ?? null,
    difficulty: question.difficulty,
    domain_key: question.domainKey ?? null,
    sort_order: question.sortOrder,
  }));

  const { error: insertError } = await db.from('assessment_questions').insert(rows);
  if (insertError) {
    return { lessonId, questions, writtenToDb: 0, errors: [`Failed to insert questions: ${insertError.message}`] };
  }

  const quizQuestionsJsonb = questions
    .map(toLegacyQuizQuestion)
    .filter((question): question is QuizQuestion => question !== null);

  const { error: updateError } = await db
    .from('course_lessons')
    .update({ quiz_questions: quizQuestionsJsonb })
    .eq('id', lessonId);
  if (updateError) {
    logger.warn('[assessment-generator] Failed to sync legacy quiz_questions projection', {
      lessonId,
      error: updateError.message,
    });
  }

  return { lessonId, questions, writtenToDb: rows.length, errors };
}

export async function generateAndPersistModuleQuiz(
  db: SupabaseClient,
  spec: ModuleQuizSpec,
): Promise<AssessmentGeneratorResult> {
  const count = Math.min(Math.max(spec.questionCount ?? 10, 8), 15);
  const questions = await requestQuestionBatch({
    count,
    context: spec.moduleTitle,
    domainKey: spec.domainKey,
    competencyKeys: spec.competencyKeys,
    idPrefix: `module-${spec.lessonId}`,
  });
  return persistAssessmentQuestions(db, spec.lessonId, questions, { replaceExisting: true });
}

export async function generateAndPersistFinalExam(
  db: SupabaseClient,
  spec: FinalExamSpec,
): Promise<AssessmentGeneratorResult> {
  const count = Math.min(Math.max(spec.questionCount, 50), 75);
  const distributions = spec.domainDistribution && Object.keys(spec.domainDistribution).length
    ? Object.entries(spec.domainDistribution)
    : spec.allDomainKeys?.length
      ? spec.allDomainKeys.map((key) => [key, 100 / spec.allDomainKeys!.length] as [string, number])
      : [['general', 100] as [string, number]];

  const questions: GeneratedQuestion[] = [];
  for (let domainIndex = 0; domainIndex < distributions.length; domainIndex++) {
    const [domainKey, percentage] = distributions[domainIndex];
    const remaining = count - questions.length;
    const domainCount = domainIndex === distributions.length - 1
      ? remaining
      : Math.min(remaining, Math.max(1, Math.round(count * (percentage / 100))));
    if (domainCount <= 0) continue;

    const batch = await requestQuestionBatch({
      count: domainCount,
      context: `${spec.courseTitle} final exam`,
      domainKey,
      idPrefix: `final-${spec.lessonId}-${domainKey}`,
    });
    questions.push(...batch);
  }

  const normalized = questions.slice(0, count).map((question, sortOrder) => ({ ...question, sortOrder }));
  if (normalized.length !== count) {
    return { lessonId: spec.lessonId, questions: normalized, writtenToDb: 0, errors: [`Generated ${normalized.length} final-exam questions; expected ${count}`] };
  }
  return persistAssessmentQuestions(db, spec.lessonId, normalized, { replaceExisting: true });
}
