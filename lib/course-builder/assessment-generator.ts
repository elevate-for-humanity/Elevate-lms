/**
 * Assessment question generation and persistence.
 * assessment_questions is canonical; course_lessons.quiz_questions is a
 * backwards-compatible projection for the legacy quiz player.
 */

import type { SupabaseClient } from '@/lib/supabase';
import type { QuizQuestion } from './schema';
import { logger } from '@/lib/logger';

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

function buildQuestion(
  id: string,
  questionType: QuestionType,
  prompt: string,
  sortOrder: number,
  options: {
    choices?: string[];
    correctAnswer?: number | boolean | string;
    explanation?: string;
    competencyKey?: string;
    difficulty?: Difficulty;
    domainKey?: string;
  } = {},
): GeneratedQuestion {
  return {
    id,
    questionType,
    prompt,
    choices: options.choices,
    correctAnswer: options.correctAnswer,
    explanation: options.explanation,
    competencyKey: options.competencyKey,
    difficulty: options.difficulty ?? 'medium',
    domainKey: options.domainKey,
    sortOrder,
    isPlaceholder: true,
  };
}

function buildPlaceholder(
  index: number,
  type: QuestionType,
  context: string,
  domainKey?: string,
  competencyKey?: string,
): GeneratedQuestion {
  const prefix = type === 'true_false' ? 'T/F' : type === 'scenario' ? 'scenario' : 'MC';
  const choices = type === 'true_false'
    ? ['True', 'False']
    : type === 'short_answer'
      ? undefined
      : ['Option A', 'Option B', 'Option C', 'Option D'];
  const correctAnswer = type === 'true_false' ? true : type === 'short_answer' ? '' : 0;
  return buildQuestion(
    `placeholder-${type}-${index}`,
    type,
    `[Placeholder ${prefix} question ${index + 1} — ${context}]`,
    index,
    {
      choices,
      correctAnswer,
      explanation: 'Replace this placeholder with a real question before publishing.',
      competencyKey,
      difficulty: type === 'scenario' ? 'hard' : type === 'true_false' ? 'easy' : 'medium',
      domainKey,
    },
  );
}

export function generateModuleQuiz(spec: ModuleQuizSpec): GeneratedQuestion[] {
  const count = Math.min(Math.max(spec.questionCount ?? 10, 8), 15);
  const mcCount = Math.round(count * 0.6);
  const tfCount = Math.round(count * 0.2);
  const scenarioCount = count - mcCount - tfCount;
  const result: GeneratedQuestion[] = [];
  let index = 0;

  for (let i = 0; i < mcCount; i++, index++) {
    result.push(buildPlaceholder(index, 'multiple_choice', spec.moduleTitle, spec.domainKey, spec.competencyKeys?.[0]));
  }
  for (let i = 0; i < tfCount; i++, index++) {
    result.push(buildPlaceholder(index, 'true_false', spec.moduleTitle, spec.domainKey));
  }
  for (let i = 0; i < scenarioCount; i++, index++) {
    result.push(buildPlaceholder(index, 'scenario', spec.moduleTitle, spec.domainKey, spec.competencyKeys?.[0]));
  }
  return result;
}

export function generateFinalExam(spec: FinalExamSpec): GeneratedQuestion[] {
  const count = Math.min(Math.max(spec.questionCount, 50), 75);
  const result: GeneratedQuestion[] = [];
  let index = 0;

  const distributions = spec.domainDistribution && Object.keys(spec.domainDistribution).length
    ? Object.entries(spec.domainDistribution)
    : (spec.allDomainKeys?.length
        ? spec.allDomainKeys.map((key) => [key, 100 / spec.allDomainKeys!.length] as [string, number])
        : [['general', 100] as [string, number]]);

  for (let domainIndex = 0; domainIndex < distributions.length; domainIndex++) {
    const [domainKey, percentage] = distributions[domainIndex];
    const remaining = count - result.length;
    const domainCount = domainIndex === distributions.length - 1
      ? remaining
      : Math.min(remaining, Math.round(count * (percentage / 100)));
    const mcCount = Math.round(domainCount * 0.6);
    const tfCount = Math.round(domainCount * 0.2);
    const scenarioCount = Math.max(0, domainCount - mcCount - tfCount);

    for (let i = 0; i < mcCount; i++, index++) {
      result.push(buildPlaceholder(index, 'multiple_choice', `${spec.courseTitle} — ${domainKey}`, domainKey));
    }
    for (let i = 0; i < tfCount; i++, index++) {
      result.push(buildPlaceholder(index, 'true_false', `${spec.courseTitle} — ${domainKey}`, domainKey));
    }
    for (let i = 0; i < scenarioCount; i++, index++) {
      result.push(buildPlaceholder(index, 'scenario', `${spec.courseTitle} — ${domainKey}`, domainKey));
    }
  }

  while (result.length < count) {
    result.push(buildPlaceholder(result.length, 'multiple_choice', spec.courseTitle));
  }
  return result.slice(0, count).map((question, sortOrder) => ({ ...question, sortOrder }));
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
  return persistAssessmentQuestions(db, spec.lessonId, generateModuleQuiz(spec), { replaceExisting: true });
}

export async function generateAndPersistFinalExam(
  db: SupabaseClient,
  spec: FinalExamSpec,
): Promise<AssessmentGeneratorResult> {
  return persistAssessmentQuestions(db, spec.lessonId, generateFinalExam(spec), { replaceExisting: true });
}
