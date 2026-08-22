import 'server-only';

/**
 * Canonical course-completion evaluator.
 *
 * This module is deliberately read-only. Mutation/issuance authority lives in
 * the authenticated LMS completion routes and the canonical certificate issuer.
 * Keeping evaluation separate prevents a second course-completion writer from
 * silently bypassing seat-time, exam, audit, or enrollment gates.
 */
import { requireAdminClient } from '@/lib/supabase/admin';

export interface CourseCompletionStatus {
  isComplete: boolean;
  internalLessonsComplete: boolean;
  externalModulesComplete: boolean;
  quizzesPassed: boolean;
  totalInternalLessons: number;
  completedInternalLessons: number;
  totalExternalModules: number;
  completedExternalModules: number;
  totalQuizzes: number;
  passedQuizzes: number;
  failedQuizTitles: string[];
  missingRequirements: string[];
}

export async function checkCourseCompletion(
  userId: string,
  courseId: string,
): Promise<CourseCompletionStatus> {
  const [internal, external, assessments] = await Promise.all([
    checkInternalLessons(userId, courseId),
    checkExternalModules(userId, courseId),
    checkRequiredAssessments(userId, courseId),
  ]);

  const missingRequirements: string[] = [];
  if (!internal.complete) {
    missingRequirements.push(`${Math.max(0, internal.total - internal.completed)} lesson(s) remaining`);
  }
  if (!external.complete) {
    missingRequirements.push(
      ...external.missingModules.map(
        (module) => `External module: ${module.title} (${module.partner_name})`,
      ),
    );
  }
  if (!assessments.allPassed) {
    missingRequirements.push(
      `${assessments.failedTitles.length} required assessment(s) not yet passed: ${assessments.failedTitles.join(', ')}`,
    );
  }

  return {
    isComplete: internal.complete && external.complete && assessments.allPassed,
    internalLessonsComplete: internal.complete,
    externalModulesComplete: external.complete,
    quizzesPassed: assessments.allPassed,
    totalInternalLessons: internal.total,
    completedInternalLessons: internal.completed,
    totalExternalModules: external.total,
    completedExternalModules: external.completed,
    totalQuizzes: assessments.total,
    passedQuizzes: assessments.passed,
    failedQuizTitles: assessments.failedTitles,
    missingRequirements,
  };
}

async function checkInternalLessons(userId: string, courseId: string) {
  const db = await requireAdminClient();
  const [{ data: lessons, error: lessonError }, { data: progress, error: progressError }] =
    await Promise.all([
      db.from('course_lessons').select('id').eq('course_id', courseId).eq('is_required', true),
      db
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true),
    ]);

  if (lessonError) throw lessonError;
  if (progressError) throw progressError;

  const lessonIds = new Set((lessons ?? []).map((lesson) => lesson.id));
  const completed = new Set(
    (progress ?? []).map((row) => row.lesson_id).filter((id) => lessonIds.has(id)),
  ).size;
  const total = lessonIds.size;

  return { complete: total > 0 && completed >= total, total, completed };
}

async function checkExternalModules(userId: string, courseId: string) {
  const db = await requireAdminClient();
  const { data: requiredModules, error } = await db
    .from('external_partner_modules')
    .select('id,title,partner_name')
    .eq('course_id', courseId)
    .eq('is_required', true);
  if (error) throw error;

  if (!requiredModules?.length) {
    return {
      complete: true,
      total: 0,
      completed: 0,
      missingModules: [] as Array<{ id: string; title: string; partner_name: string }>,
    };
  }

  const { data: progress, error: progressError } = await db
    .from('external_partner_progress')
    .select('module_id,status')
    .eq('user_id', userId)
    .in('module_id', requiredModules.map((module) => module.id))
    .eq('status', 'approved');
  if (progressError) throw progressError;

  const completedIds = new Set((progress ?? []).map((row) => row.module_id));
  const missingModules = requiredModules.filter((module) => !completedIds.has(module.id));
  return {
    complete: missingModules.length === 0,
    total: requiredModules.length,
    completed: completedIds.size,
    missingModules,
  };
}

async function checkRequiredAssessments(userId: string, courseId: string) {
  const db = await requireAdminClient();
  const { data: lessons, error } = await db
    .from('course_lessons')
    .select('id,title,lesson_type,passing_score')
    .eq('course_id', courseId)
    .eq('is_required', true)
    .in('lesson_type', ['quiz', 'checkpoint', 'exam']);
  if (error) throw error;

  if (!lessons?.length) {
    return { allPassed: true, total: 0, passed: 0, failedTitles: [] as string[] };
  }

  const { data: scores, error: scoreError } = await db
    .from('checkpoint_scores')
    .select('lesson_id,passed,score,passing_score')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .in('lesson_id', lessons.map((lesson) => lesson.id))
    .eq('passed', true);
  if (scoreError) throw scoreError;

  const passedIds = new Set((scores ?? []).map((score) => score.lesson_id));
  const failedTitles = lessons
    .filter((lesson) => !passedIds.has(lesson.id))
    .map((lesson) => lesson.title);

  return {
    allPassed: failedTitles.length === 0,
    total: lessons.length,
    passed: lessons.length - failedTitles.length,
    failedTitles,
  };
}

export async function getCourseProgress(userId: string, courseId: string) {
  const status = await checkCourseCompletion(userId, courseId);
  const internalPercentage = status.totalInternalLessons
    ? (status.completedInternalLessons / status.totalInternalLessons) * 100
    : 0;
  const externalPercentage = status.totalExternalModules
    ? (status.completedExternalModules / status.totalExternalModules) * 100
    : 100;
  return {
    overallPercentage: Math.round((internalPercentage + externalPercentage) / 2),
    internalPercentage: Math.round(internalPercentage),
    externalPercentage: Math.round(externalPercentage),
    status,
  };
}
