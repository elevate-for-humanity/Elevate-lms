// lib/course-completion.ts
// Course completion logic including external partner modules

import { createClient } from '@supabase/supabase-js';
import { setAuditContext } from '@/lib/audit-context';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key);
}

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

/**
 * Check if student has completed all requirements for a course
 * including internal lessons and external partner modules
 */
export async function checkCourseCompletion(
  userId: string,
  courseId: string
): Promise<CourseCompletionStatus> {
  const status: CourseCompletionStatus = {
    isComplete: false,
    internalLessonsComplete: false,
    externalModulesComplete: false,
    quizzesPassed: false,
    totalInternalLessons: 0,
    completedInternalLessons: 0,
    totalExternalModules: 0,
    completedExternalModules: 0,
    totalQuizzes: 0,
    passedQuizzes: 0,
    failedQuizTitles: [],
    missingRequirements: [],
  };

  // Check internal lessons
  const internalStatus = await checkInternalLessons(userId, courseId);
  status.internalLessonsComplete = internalStatus.complete;
  status.totalInternalLessons = internalStatus.total;
  status.completedInternalLessons = internalStatus.completed;
  if (!internalStatus.complete) {
    status.missingRequirements.push(
      `${internalStatus.total - internalStatus.completed} internal lesson(s) remaining`
    );
  }

  // Check external modules
  const externalStatus = await checkExternalModules(userId, courseId);
  status.externalModulesComplete = externalStatus.complete;
  status.totalExternalModules = externalStatus.total;
  status.completedExternalModules = externalStatus.completed;
  if (!externalStatus.complete) {
    status.missingRequirements.push(
      ...externalStatus.missingModules.map(
        (m) => `External module: ${m.title} (${m.partner_name})`
      )
    );
  }

  // Check quiz pass requirements (score >= 70% on all quiz-type lessons)
  const quizStatus = await checkQuizzesPassed(userId, courseId);
  status.quizzesPassed = quizStatus.allPassed;
  status.totalQuizzes = quizStatus.total;
  status.passedQuizzes = quizStatus.passed;
  status.failedQuizTitles = quizStatus.failedTitles;
  if (!quizStatus.allPassed && quizStatus.total > 0) {
    status.missingRequirements.push(
      `${quizStatus.failedTitles.length} quiz(zes) not yet passed: ${quizStatus.failedTitles.join(', ')}`
    );
  }

  // Course is complete only if ALL three gates pass
  status.isComplete =
    status.internalLessonsComplete &&
    status.externalModulesComplete &&
    status.quizzesPassed;

  return status;
}

async function checkInternalLessons(
  userId: string,
  courseId: string
): Promise<{ complete: boolean; total: number; completed: number }> {
  const supabase = getSupabaseAdmin();
  // Count total lessons in course
  const { count: totalLessons } = await supabase
    .from('training_lessons')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  // Count completed lessons
  const { count: completedLessons } = await supabase
    .from('lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('completed', true)
    .in(
      'lesson_id',
      supabase.from('training_lessons').select('id').eq('course_id', courseId)
    );

  return {
    complete: (completedLessons || 0) >= (totalLessons || 0),
    total: totalLessons || 0,
    completed: completedLessons || 0,
  };
}

async function checkExternalModules(
  userId: string,
  courseId: string
): Promise<{
  complete: boolean;
  total: number;
  completed: number;
  missingModules: any[];
}> {
  const supabase = getSupabaseAdmin();
  // Get all required external modules for this course
  const { data: requiredModules } = await supabase
    .from('external_partner_modules')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_required', true);

  if (!requiredModules || requiredModules.length === 0) {
    return {
      complete: true,
      total: 0,
      completed: 0,
      missingModules: [],
    };
  }

  // Get student's progress for these modules
  const { data: progress } = await supabase
    .from('external_partner_progress')
    .select('module_id, status')
    .eq('user_id', userId)
    .in(
      'module_id',
      requiredModules.map((m) => m.id)
    )
    .eq('status', 'approved');

  const completedModuleIds = new Set((progress || []).map((p) => p.module_id));

  const missingModules = requiredModules.filter(
    (m) => !completedModuleIds.has(m.id)
  );

  return {
    complete: missingModules.length === 0,
    total: requiredModules.length,
    completed: completedModuleIds.size,
    missingModules,
  };
}

async function checkQuizzesPassed(
  userId: string,
  courseId: string
): Promise<{
  allPassed: boolean;
  total: number;
  passed: number;
  failedTitles: string[];
}> {
  const supabase = getSupabaseAdmin();

  // Get all quiz-type lessons for this course
  const { data: quizLessons } = await supabase
    .from('training_lessons')
    .select('id, title')
    .eq('course_id', courseId)
    .eq('type', 'quiz');

  if (!quizLessons || quizLessons.length === 0) {
    return { allPassed: true, total: 0, passed: 0, failedTitles: [] };
  }

  const failedTitles: string[] = [];
  let passed = 0;

  for (const quiz of quizLessons) {
    // Check for any passing attempt (score >= 70)
    const { data: bestAttempt } = await supabase
      .from('quiz_attempts')
      .select('score, passed')
      .eq('user_uuid', userId)
      .eq('quiz_id', quiz.id)
      .eq('passed', true)
      .limit(1)
      .maybeSingle();

    if (bestAttempt) {
      passed++;
    } else {
      failedTitles.push(quiz.title);
    }
  }

  return {
    allPassed: failedTitles.length === 0,
    total: quizLessons.length,
    passed,
    failedTitles,
  };
}

/**
 * Mark course as complete for student
 * Only succeeds if all requirements are met
 */
export async function completeCourse(
  userId: string,
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  const status = await checkCourseCompletion(userId, courseId);

  if (!status.isComplete) {
    return {
      success: false,
      error: `Course requirements not met: ${status.missingRequirements.join(', ')}`,
    };
  }

  const supabase = getSupabaseAdmin();
  await setAuditContext(supabase, { actorUserId: userId, systemActor: 'course_completion' });

  // Update enrollment status
  const { error } = await supabase
    .from('program_enrollments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) {
    return {
      success: false,
      error: 'Operation failed',
    };
  }

  // Generate certificate (if applicable)
  await generateCourseCertificate(userId, courseId);

  return { success: true };
}

async function generateCourseCertificate(
  userId: string,
  courseId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  // Get course details
  const { data: course } = await supabase
    .from('training_courses')
    .select('title')
    .eq('id', courseId)
    .single();

  // Get student details
  const { data: student } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  if (!course || !student) return;

  // Get all external modules for credential stack
  const { data: externalModules } = await supabase
    .from('external_partner_modules')
    .select('title, partner_name')
    .eq('course_id', courseId)
    .eq('is_required', true);

  // Issue certificate through the canonical gated service
  const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
  await issueCertificate({
    supabase,
    studentId: userId,
    courseId,
    studentName: student.full_name || student.email || 'Student',
    courseTitle: course.title,
    // No competencyEvidence passed — this path is for non-exam courses.
    // Courses requiring proctored exams must use /api/lms/progress/complete.
  });
}

function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EFH-${timestamp}-${random}`;
}

/**
 * Get course progress including external modules
 */
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<{
  overallPercentage: number;
  internalPercentage: number;
  externalPercentage: number;
  status: CourseCompletionStatus;
}> {
  const status = await checkCourseCompletion(userId, courseId);

  const internalPercentage =
    status.totalInternalLessons > 0
      ? (status.completedInternalLessons / status.totalInternalLessons) * 100
      : 100;

  const externalPercentage =
    status.totalExternalModules > 0
      ? (status.completedExternalModules / status.totalExternalModules) * 100
      : 100;

  // Weight internal and external equally
  const overallPercentage = (internalPercentage + externalPercentage) / 2;

  return {
    overallPercentage: Math.round(overallPercentage),
    internalPercentage: Math.round(internalPercentage),
    externalPercentage: Math.round(externalPercentage),
    status,
  };
}
