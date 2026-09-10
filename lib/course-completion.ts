import 'server-only';

/**
 * Canonical course-completion evaluator.
 *
 * Read-only authority for every course-completion gate. Mutation belongs to the
 * authenticated LMS completion route; certificate creation belongs to the
 * canonical certificate issuer. Program completion calls this evaluator so a
 * program cannot complete before a required course satisfies every gate.
 */
import { requireAdminClient } from '@/lib/supabase/admin';
import { getCourseRequirements } from '@/lib/courses/completion-requirements';

export interface CourseCompletionStatus {
  isComplete: boolean;
  internalLessonsComplete: boolean;
  externalModulesComplete: boolean;
  quizzesPassed: boolean;
  seatTimeSatisfied: boolean;
  examSatisfied: boolean;
  totalInternalLessons: number;
  completedInternalLessons: number;
  totalExternalModules: number;
  completedExternalModules: number;
  totalQuizzes: number;
  passedQuizzes: number;
  failedQuizTitles: string[];
  recordedSeatTimeHours: number;
  requiredSeatTimeHours: number | null;
  examSession: {
    id: string;
    provider: string;
    result: string | null;
    score: number | null;
    proctor_id: string | null;
    completed_at: string | null;
  } | null;
  missingRequirements: string[];
}

export async function checkCourseCompletion(
  userId: string,
  courseId: string,
): Promise<CourseCompletionStatus> {
  const db = await requireAdminClient();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,slug,title')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) throw courseError;
  if (!course) throw new Error('Course not found');

  const requirements = getCourseRequirements(course.slug || '');
  const [internal, external, assessments, seatTime, exam] = await Promise.all([
    checkInternalLessons(userId, courseId),
    checkExternalModules(userId, courseId),
    checkRequiredAssessments(userId, courseId),
    checkSeatTime(userId, courseId, requirements.minimumSeatTimeHours),
    checkRequiredExam(userId, course.slug || '', requirements.examRequirement),
  ]);

  const missingRequirements: string[] = [];
  if (!internal.complete) {
    missingRequirements.push(`${Math.max(0, internal.total - internal.completed)} required lesson(s) remaining`);
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
  if (!seatTime.satisfied && seatTime.requiredHours) {
    missingRequirements.push(
      `Minimum seat time not met: ${seatTime.recordedHours} of ${seatTime.requiredHours} hour(s) recorded`,
    );
  }
  if (!exam.satisfied && requirements.examRequirement) {
    missingRequirements.push(
      `Proctored ${requirements.examRequirement.examName} exam has not been verified as passed`,
    );
  }

  return {
    isComplete:
      internal.complete &&
      external.complete &&
      assessments.allPassed &&
      seatTime.satisfied &&
      exam.satisfied,
    internalLessonsComplete: internal.complete,
    externalModulesComplete: external.complete,
    quizzesPassed: assessments.allPassed,
    seatTimeSatisfied: seatTime.satisfied,
    examSatisfied: exam.satisfied,
    totalInternalLessons: internal.total,
    completedInternalLessons: internal.completed,
    totalExternalModules: external.total,
    completedExternalModules: external.completed,
    totalQuizzes: assessments.total,
    passedQuizzes: assessments.passed,
    failedQuizTitles: assessments.failedTitles,
    recordedSeatTimeHours: seatTime.recordedHours,
    requiredSeatTimeHours: seatTime.requiredHours,
    examSession: exam.session,
    missingRequirements,
  };
}

async function checkInternalLessons(userId: string, courseId: string) {
  const db = await requireAdminClient();
  const [{ data: lessons, error: lessonError }, { data: progress, error: progressError }] =
    await Promise.all([
      db
        .from('course_lessons')
        .select('id')
        .eq('course_id', courseId)
        .eq('is_required', true)
        .eq('is_published', true),
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
    .eq('is_published', true)
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

async function checkSeatTime(
  userId: string,
  courseId: string,
  requiredHours: number | null,
): Promise<{ satisfied: boolean; recordedHours: number; recordedSeconds: number; requiredHours: number | null }> {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('lesson_progress')
    .select('time_spent_seconds')
    .eq('user_id', userId)
    .eq('course_id', courseId);
  if (error) throw error;

  const recordedSeconds = (data ?? []).reduce(
    (sum, row) => sum + Math.max(0, Number(row.time_spent_seconds) || 0),
    0,
  );
  const recordedHours = Math.round((recordedSeconds / 3600) * 10) / 10;
  return {
    satisfied: requiredHours == null || recordedHours >= requiredHours,
    recordedHours,
    recordedSeconds,
    requiredHours,
  };
}

async function checkRequiredExam(
  userId: string,
  courseSlug: string,
  requirement: ReturnType<typeof getCourseRequirements>['examRequirement'],
): Promise<{
  satisfied: boolean;
  session: CourseCompletionStatus['examSession'];
}> {
  if (!requirement) return { satisfied: true, session: null };

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('exam_sessions')
    .select('id,provider,result,score,proctor_id,completed_at')
    .eq('student_id', userId)
    .eq('program_slug', courseSlug)
    .eq('provider', requirement.provider)
    .eq('result', requirement.requiredResult)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  return { satisfied: Boolean(data), session: data ?? null };
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
